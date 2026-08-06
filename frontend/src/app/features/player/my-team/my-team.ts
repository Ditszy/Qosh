import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, map, of, startWith, Subject, switchMap } from 'rxjs';

import { TeamsApiService, type TeamInvite } from '../teams-api.service';

type MyTeamState =
  | { status: 'loading' }
  | { status: 'loaded'; invites: TeamInvite[] }
  | { status: 'error' };

@Component({
  selector: 'app-my-team',
  imports: [AsyncPipe, DatePipe],
  templateUrl: './my-team.html',
  styleUrl: './my-team.scss',
})
export class MyTeam {
  private readonly teamsApi = inject(TeamsApiService);
  private readonly reloadInvites$ = new Subject<void>();
  protected readonly actionError = signal<string | null>(null);

  protected readonly state$ = this.reloadInvites$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.teamsApi.listMyPendingInvites().pipe(
        map((invites) => ({ status: 'loaded', invites }) satisfies MyTeamState),
        startWith({ status: 'loading' } satisfies MyTeamState),
        catchError(() => of({ status: 'error' } satisfies MyTeamState)),
      ),
    ),
  );

  protected teamLabel(invite: TeamInvite): string {
    return invite.team ? `${invite.team.name} / ${invite.team.tournament.name}` : 'Poziv za tim';
  }

  protected acceptInvite(inviteId: string): void {
    this.actionError.set(null);
    this.teamsApi.acceptInvite(inviteId).subscribe({
      next: () => this.reloadInvites$.next(),
      error: () => this.actionError.set('Prihvatanje poziva nije uspelo.'),
    });
  }

  protected declineInvite(inviteId: string): void {
    this.actionError.set(null);
    this.teamsApi.declineInvite(inviteId).subscribe({
      next: () => this.reloadInvites$.next(),
      error: () => this.actionError.set('Odbijanje poziva nije uspelo.'),
    });
  }
}
