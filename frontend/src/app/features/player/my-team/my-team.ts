import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../../core/auth/auth';
import { TeamsApiService, type TeamDetail, type TeamInvite, type TeamMember } from '../teams-api.service';
import type { PublicUser } from '../../public/tournaments/tournament.models';

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
  private readonly teamsApi = inject(TeamsApiService);
  protected readonly currentUser = this.authService.currentUser;
  protected readonly actionError = signal<string | null>(null);
  protected readonly invitePlayerIds = signal<Record<string, string>>({});
  protected readonly inviteSearches = signal<Record<string, string>>({});
  protected readonly inviteSearchResults = signal<Record<string, PublicUser[]>>({});
  protected readonly state = signal<MyTeamState>({ status: 'loading' });

  constructor() {
    this.loadPage();
  }

  private loadPage(): void {
    this.state.set({ status: 'loading' });
    forkJoin({
      teams: this.teamsApi.listMyTeams(),
      invites: this.teamsApi.listMyPendingInvites(),
    }).subscribe({
      next: ({ teams, invites }) => this.state.set({ status: 'loaded', teams, invites }),
      error: () => this.state.set({ status: 'error' }),
    });
  }

  protected teamLabel(invite: TeamInvite): string {
    return invite.team ? `${invite.team.name} / ${invite.team.tournament.name}` : 'Poziv za tim';
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

  protected acceptInvite(inviteId: string): void {
    this.actionError.set(null);
    this.teamsApi.acceptInvite(inviteId).subscribe({
      next: (team) => {
        this.removeInvite(inviteId);
        this.replaceTeam(team);
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
  }

  private removeInvite(inviteId: string): void {
    const state = this.state();

    if (state.status === 'loaded') {
      this.state.set({ ...state, invites: state.invites.filter((invite) => invite.id !== inviteId) });
    }
  }
}
