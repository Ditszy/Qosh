import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/auth';
import { NotificationsActions } from '../../notifications';
import type { PublicUser } from '../../public/tournaments/tournament.models';
import { PlayerTeamsActions, selectMyTeamView } from '../store';
import { TeamsApiService, type TeamDetail, type TeamInvite, type TeamMember } from '../teams-api.service';

type MyTeamSection = 'teams' | 'invites';

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

  protected readonly currentUser = this.authService.currentUser;
  protected readonly actionError = signal<string | null>(null);
  protected readonly invitePlayerIds = signal<Record<string, string>>({});
  protected readonly inviteSearches = signal<Record<string, string>>({});
  protected readonly inviteSearchResults = signal<Record<string, PublicUser[]>>({});
  protected readonly disbandingTeamIds = signal<Record<string, boolean>>({});
  protected readonly leavingTeamIds = signal<Record<string, boolean>>({});
  protected readonly selectedSection = signal<MyTeamSection>('teams');
  protected readonly selectedTeamId = signal<string | null>(null);
  protected readonly state = this.store.selectSignal(selectMyTeamView);

  constructor() {
    this.store.dispatch(NotificationsActions.watchMine());
    this.store.dispatch(PlayerTeamsActions.watchMyTeams());
    this.store.dispatch(PlayerTeamsActions.loadPage());
  }

  protected teamLabel(invite: TeamInvite): string {
    return invite.team ? `${invite.team.name} / ${invite.team.tournament.name}` : 'Poziv za tim';
  }

  protected memberLabel(member: TeamMember): string {
    return `${member.user.firstName} ${member.user.lastName} (${member.role})`;
  }

  protected tournamentLabel(team: TeamDetail): string {
    return team.tournament?.name ?? 'Turnir nije učitan';
  }

  protected isSelectedTeam(teamId: string): boolean {
    return this.selectedTeamId() === teamId;
  }

  protected toggleTeam(teamId: string): void {
    this.selectedTeamId.update((selectedTeamId) => selectedTeamId === teamId ? null : teamId);
  }

  protected showSection(section: MyTeamSection): void {
    this.selectedSection.set(section);
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

  protected canLeaveTeam(team: TeamDetail): boolean {
    return !this.isCaptain(team) && team.tournament?.status === 'SIGNUPS_OPEN';
  }

  protected isDisbanding(teamId: string): boolean {
    return Boolean(this.disbandingTeamIds()[teamId]);
  }

  protected isLeaving(teamId: string): boolean {
    return Boolean(this.leavingTeamIds()[teamId]);
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
      next: (team) => this.store.dispatch(PlayerTeamsActions.teamUpserted({ team })),
      error: () => this.actionError.set('Uklanjanje igrača nije uspelo.'),
    });
  }

  protected transferCaptain(teamId: string, memberId: string): void {
    this.actionError.set(null);
    this.teamsApi.transferCaptain(teamId, memberId).subscribe({
      next: (team) => this.store.dispatch(PlayerTeamsActions.teamUpserted({ team })),
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
      next: () => this.store.dispatch(PlayerTeamsActions.teamRemoved({ teamId: team.id })),
      error: () => this.actionError.set('Raspuštanje tima nije uspelo.'),
    });
  }

  protected leaveTeam(team: TeamDetail): void {
    if (!this.canLeaveTeam(team) || !confirm(`Napustiti tim "${team.name}"?`)) {
      return;
    }

    this.actionError.set(null);
    this.leavingTeamIds.update((ids) => ({ ...ids, [team.id]: true }));
    this.teamsApi.leaveTeam(team.id).pipe(
      finalize(() => this.leavingTeamIds.update((ids) => ({ ...ids, [team.id]: false }))),
    ).subscribe({
      next: () => this.store.dispatch(PlayerTeamsActions.teamRemoved({ teamId: team.id })),
      error: () => this.actionError.set('Napuštanje tima nije uspelo.'),
    });
  }

  protected acceptInvite(inviteId: string): void {
    this.actionError.set(null);
    this.teamsApi.acceptInvite(inviteId).subscribe({
      next: () => {
        this.store.dispatch(PlayerTeamsActions.inviteRemoved({ inviteId }));
        this.store.dispatch(PlayerTeamsActions.loadPage());
      },
      error: () => this.actionError.set('Prihvatanje poziva nije uspelo.'),
    });
  }

  protected declineInvite(inviteId: string): void {
    this.actionError.set(null);
    this.teamsApi.declineInvite(inviteId).subscribe({
      next: () => this.store.dispatch(PlayerTeamsActions.inviteRemoved({ inviteId })),
      error: () => this.actionError.set('Odbijanje poziva nije uspelo.'),
    });
  }
}
