import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { catchError, distinctUntilChanged, EMPTY, finalize, forkJoin, map, Observable, of, Subscription, switchMap } from 'rxjs';

import { AuthService } from '../../../core/auth/auth';
import { NotificationsActions, selectAllNotifications } from '../../notifications';
import { TeamsApiService, type TeamDetail, type TeamInvite, type TeamMember } from '../teams-api.service';
import type { PublicUser, TournamentLiveMessage } from '../../public/tournaments/tournament.models';
import { TournamentsApiService } from '../../public/tournaments/tournaments-api.service';

type MyTeamState =
  | { status: 'loading' }
  | { status: 'loaded'; teams: TeamDetail[]; invites: TeamInvite[] }
  | { status: 'error' };

@Component({
  selector: 'app-my-team',
  imports: [DatePipe, FormsModule],
  templateUrl: './my-team.html',
  styleUrl: './my-team.scss',
})
export class MyTeam {
  private readonly authService = inject(AuthService);
  private readonly store = inject(Store);
  private readonly teamsApi = inject(TeamsApiService);
  private readonly tournamentsApi = inject(TournamentsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly liveSubscriptions = new Map<string, Subscription>();
  private readonly notificationSubscription = this.store.select(selectAllNotifications).pipe(
    map((notifications) => notifications.find((notification) => notification.type === 'TEAM_INVITE')?.id ?? null),
    distinctUntilChanged(),
  ).subscribe((notificationId) => {
    if (notificationId) {
      this.reloadPendingInvites();
    }
  });
  protected readonly currentUser = this.authService.currentUser;
  protected readonly actionError = signal<string | null>(null);
  protected readonly invitePlayerIds = signal<Record<string, string>>({});
  protected readonly inviteSearches = signal<Record<string, string>>({});
  protected readonly inviteSearchResults = signal<Record<string, PublicUser[]>>({});
  protected readonly disbandingTeamIds = signal<Record<string, boolean>>({});
  protected readonly state = signal<MyTeamState>({ status: 'loading' });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.notificationSubscription.unsubscribe();
      this.clearLiveSubscriptions();
    });
    this.store.dispatch(NotificationsActions.watchMine());
    this.loadPage();
  }

  private loadPage(): void {
    this.state.set({ status: 'loading' });
    forkJoin({
      teams: this.listMyTeamsWithTournaments(),
      invites: this.teamsApi.listMyPendingInvites(),
    }).subscribe({
      next: ({ teams, invites }) => {
        this.state.set({ status: 'loaded', teams, invites });
        this.syncLiveSubscriptions(teams);
      },
      error: () => this.state.set({ status: 'error' }),
    });
  }

  private listMyTeamsWithTournaments(): Observable<TeamDetail[]> {
    return this.teamsApi.listMyTeams().pipe(
      switchMap((teams) => {
        if (teams.length === 0) {
          return of([]);
        }

        return forkJoin(teams.map((team) => this.withTournament(team)));
      }),
    );
  }

  private withTournament(team: TeamDetail): Observable<TeamDetail> {
    if (team.tournament) {
      return of(team);
    }

    return this.tournamentsApi.getTournament(team.tournamentId).pipe(
      map((tournament) => ({ ...team, tournament })),
      catchError(() => of(team)),
    );
  }

  protected teamLabel(invite: TeamInvite): string {
    return invite.team ? `${invite.team.name} / ${invite.team.tournament.name}` : 'Poziv za tim';
  }

  private reloadPendingInvites(): void {
    this.teamsApi.listMyPendingInvites().subscribe({
      next: (invites) => {
        const state = this.state();

        if (state.status === 'loaded') {
          this.state.set({ ...state, invites });
        }
      },
    });
  }

  protected memberLabel(member: TeamMember): string {
    return `${member.user.firstName} ${member.user.lastName} (${member.role})`;
  }

  protected isCaptain(team: TeamDetail): boolean {
    const currentUserId = this.currentUser()?.id;
    return team.members.some((teamMember) => {
      return teamMember.userId === currentUserId && teamMember.role === 'CAPTAIN';
    });
  }

  protected canRemoveMember(team: TeamDetail, member: TeamMember): boolean {
    return this.isCaptain(team) && member.role !== 'CAPTAIN';
  }

  protected canDisbandTeam(team: TeamDetail): boolean {
    return this.isCaptain(team) && team.tournament?.status === 'SIGNUPS_OPEN';
  }

  protected isDisbanding(teamId: string): boolean {
    return Boolean(this.disbandingTeamIds()[teamId]);
  }

  protected invitePlayerId(teamId: string): string {
    return this.invitePlayerIds()[teamId] ?? '';
  }

  protected setInvitePlayerId(teamId: string, value: string): void {
    this.invitePlayerIds.update((values) => ({ ...values, [teamId]: value }));
  }

  protected inviteSearch(teamId: string): string {
    return this.inviteSearches()[teamId] ?? '';
  }

  protected searchResults(teamId: string): PublicUser[] {
    return this.inviteSearchResults()[teamId] ?? [];
  }

  protected setInviteSearch(teamId: string, value: string): void {
    this.inviteSearches.update((values) => ({ ...values, [teamId]: value }));
    this.setInvitePlayerId(teamId, '');

    if (value.trim().length < 2) {
      this.inviteSearchResults.update((results) => ({ ...results, [teamId]: [] }));
      return;
    }

    this.teamsApi.searchPlayers(value).subscribe({
      next: (players) => this.inviteSearchResults.update((results) => ({ ...results, [teamId]: players })),
      error: () => this.inviteSearchResults.update((results) => ({ ...results, [teamId]: [] })),
    });
  }

  protected selectInvitePlayer(teamId: string, player: PublicUser): void {
    this.setInvitePlayerId(teamId, player.id);
    this.inviteSearches.update((values) => ({ ...values, [teamId]: player.username }));
    this.inviteSearchResults.update((results) => ({ ...results, [teamId]: [] }));
  }

  protected sendInvite(teamId: string): void {
    const invitedUserId = this.invitePlayerId(teamId).trim();

    if (!invitedUserId) {
      this.actionError.set('Izaberi igrača.');
      return;
    }

    this.actionError.set(null);
    this.teamsApi.sendInvite(teamId, { invitedUserId }).subscribe({
      next: () => {
        this.setInvitePlayerId(teamId, '');
        this.inviteSearches.update((values) => ({ ...values, [teamId]: '' }));
      },
      error: () => this.actionError.set('Slanje poziva nije uspelo.'),
    });
  }

  protected removeMember(teamId: string, memberId: string): void {
    this.actionError.set(null);
    this.teamsApi.removeMember(teamId, memberId).subscribe({
      next: (team) => this.replaceTeam(team),
      error: () => this.actionError.set('Uklanjanje igrača nije uspelo.'),
    });
  }

  protected transferCaptain(teamId: string, memberId: string): void {
    this.actionError.set(null);
    this.teamsApi.transferCaptain(teamId, memberId).subscribe({
      next: (team) => this.replaceTeam(team),
      error: () => this.actionError.set('Promena kapitena nije uspela.'),
    });
  }

  protected disbandTeam(team: TeamDetail): void {
    if (!this.canDisbandTeam(team) || !confirm(`Raspustiti tim "${team.name}"?`)) {
      return;
    }

    this.actionError.set(null);
    this.disbandingTeamIds.update((ids) => ({ ...ids, [team.id]: true }));
    this.teamsApi.disbandTeam(team.id).pipe(
      finalize(() => this.disbandingTeamIds.update((ids) => ({ ...ids, [team.id]: false }))),
    ).subscribe({
      next: () => this.removeTeam(team.id),
      error: () => this.actionError.set('Raspustanje tima nije uspelo.'),
    });
  }

  protected acceptInvite(inviteId: string): void {
    this.actionError.set(null);
    this.teamsApi.acceptInvite(inviteId).subscribe({
      next: (team) => {
        this.removeInvite(inviteId);
        this.withTournament(team).subscribe((hydratedTeam) => this.replaceTeam(hydratedTeam));
      },
      error: () => this.actionError.set('Prihvatanje poziva nije uspelo.'),
    });
  }

  protected declineInvite(inviteId: string): void {
    this.actionError.set(null);
    this.teamsApi.declineInvite(inviteId).subscribe({
      next: () => this.removeInvite(inviteId),
      error: () => this.actionError.set('Odbijanje poziva nije uspelo.'),
    });
  }

  private replaceTeam(team: TeamDetail): void {
    const state = this.state();

    if (state.status !== 'loaded') {
      return;
    }

    const teams = state.teams.some((currentTeam) => currentTeam.id === team.id)
      ? state.teams.map((currentTeam) => currentTeam.id === team.id ? team : currentTeam)
      : [...state.teams, team];
    this.state.set({ ...state, teams });
    this.syncLiveSubscriptions(teams);
  }

  private removeInvite(inviteId: string): void {
    const state = this.state();

    if (state.status === 'loaded') {
      this.state.set({ ...state, invites: state.invites.filter((invite) => invite.id !== inviteId) });
    }
  }

  private removeTeam(teamId: string): void {
    const state = this.state();

    if (state.status === 'loaded') {
      const teams = state.teams.filter((team) => team.id !== teamId);
      this.state.set({ ...state, teams });
      this.syncLiveSubscriptions(teams);
    }
  }

  private syncLiveSubscriptions(teams: TeamDetail[]): void {
    const tournamentIds = new Set(teams.map((team) => team.tournamentId));

    for (const [tournamentId, subscription] of this.liveSubscriptions) {
      if (!tournamentIds.has(tournamentId)) {
        subscription.unsubscribe();
        this.liveSubscriptions.delete(tournamentId);
      }
    }

    for (const tournamentId of tournamentIds) {
      if (!this.liveSubscriptions.has(tournamentId)) {
        const subscription = this.tournamentsApi.watchTournamentLive(tournamentId).pipe(
          catchError(() => EMPTY),
        ).subscribe((message) => this.applyLiveMessage(message));
        this.liveSubscriptions.set(tournamentId, subscription);
      }
    }
  }

  private applyLiveMessage(message: TournamentLiveMessage): void {
    if (message.type === 'tournament.team.removed') {
      this.removeTeam(message.data.teamId);
      return;
    }

    if (message.type === 'tournament.roster.updated') {
      const currentUserId = this.currentUser()?.id;
      const team = message.data.team;

      if (!currentUserId || !team.members.some((member) => member.userId === currentUserId)) {
        this.removeTeam(team.id);
        return;
      }

      this.replaceTeam({ ...team, tournament: this.findTeam(team.id)?.tournament });
      return;
    }

    if (message.type === 'tournament.status.changed') {
      this.updateTournamentStatus(message.data.tournament);
    }
  }

  private findTeam(teamId: string): TeamDetail | null {
    const state = this.state();

    return state.status === 'loaded' ? state.teams.find((team) => team.id === teamId) ?? null : null;
  }

  private updateTournamentStatus(tournament: TeamDetail['tournament']): void {
    const state = this.state();

    if (state.status !== 'loaded' || !tournament) {
      return;
    }

    this.state.set({
      ...state,
      teams: state.teams.map((team) =>
        team.tournamentId === tournament.id ? { ...team, tournament } : team,
      ),
    });
  }

  private clearLiveSubscriptions(): void {
    for (const subscription of this.liveSubscriptions.values()) {
      subscription.unsubscribe();
    }

    this.liveSubscriptions.clear();
  }
}
