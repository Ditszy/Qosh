import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, forkJoin, map, of, startWith, Subject, switchMap } from 'rxjs';

import { AuthService } from '../../../core/auth/auth';
import { TeamsApiService, type TeamDetail, type TeamInvite, type TeamMember } from '../teams-api.service';

type MyTeamState =
  | { status: 'loading' }
  | { status: 'loaded'; teams: TeamDetail[]; invites: TeamInvite[] }
  | { status: 'error' };

@Component({
  selector: 'app-my-team',
  imports: [AsyncPipe, DatePipe],
  templateUrl: './my-team.html',
  styleUrl: './my-team.scss',
})
export class MyTeam {
  private readonly authService = inject(AuthService);
  private readonly teamsApi = inject(TeamsApiService);
  private readonly reload$ = new Subject<void>();
  protected readonly currentUser = this.authService.currentUser;
  protected readonly actionError = signal<string | null>(null);

  protected readonly state$ = this.reload$.pipe(
    startWith(undefined),
    switchMap(() =>
      forkJoin({
        teams: this.teamsApi.listMyTeams(),
        invites: this.teamsApi.listMyPendingInvites(),
      }).pipe(
        map(({ teams, invites }) => ({ status: 'loaded', teams, invites }) satisfies MyTeamState),
        startWith({ status: 'loading' } satisfies MyTeamState),
        catchError(() => of({ status: 'error' } satisfies MyTeamState)),
      ),
    ),
  );

  protected teamLabel(invite: TeamInvite): string {
    return invite.team ? `${invite.team.name} / ${invite.team.tournament.name}` : 'Poziv za tim';
  }

  protected memberLabel(member: TeamMember): string {
    return `${member.user.firstName} ${member.user.lastName} (${member.role})`;
  }

  protected canRemoveMember(team: TeamDetail, member: TeamMember): boolean {
    const currentUserId = this.currentUser()?.id;
    const isCaptain = team.members.some((teamMember) => {
      return teamMember.userId === currentUserId && teamMember.role === 'CAPTAIN';
    });

    return isCaptain && member.role !== 'CAPTAIN';
  }

  protected removeMember(teamId: string, memberId: string): void {
    this.actionError.set(null);
    this.teamsApi.removeMember(teamId, memberId).subscribe({
      next: () => this.reload$.next(),
      error: () => this.actionError.set('Uklanjanje igraca nije uspelo.'),
    });
  }

  protected acceptInvite(inviteId: string): void {
    this.actionError.set(null);
    this.teamsApi.acceptInvite(inviteId).subscribe({
      next: () => this.reload$.next(),
      error: () => this.actionError.set('Prihvatanje poziva nije uspelo.'),
    });
  }

  protected declineInvite(inviteId: string): void {
    this.actionError.set(null);
    this.teamsApi.declineInvite(inviteId).subscribe({
      next: () => this.reload$.next(),
      error: () => this.actionError.set('Odbijanje poziva nije uspelo.'),
    });
  }
}
