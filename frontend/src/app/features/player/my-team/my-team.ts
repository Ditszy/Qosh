import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, map, of, startWith } from 'rxjs';

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

  protected readonly state$ = this.teamsApi.listMyPendingInvites().pipe(
    map((invites) => ({ status: 'loaded', invites }) satisfies MyTeamState),
    startWith({ status: 'loading' } satisfies MyTeamState),
    catchError(() => of({ status: 'error' } satisfies MyTeamState)),
  );

  protected teamLabel(invite: TeamInvite): string {
    return invite.team ? `${invite.team.name} / ${invite.team.tournament.name}` : 'Poziv za tim';
  }
}
