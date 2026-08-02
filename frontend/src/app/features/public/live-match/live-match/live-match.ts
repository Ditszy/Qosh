import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, filter, map, of, scan, startWith, switchMap } from 'rxjs';

import type { MatchLiveStreamMessage, MatchReadBundle } from '../match.models';
import { MatchesApiService } from '../matches-api.service';

type LiveMatchState =
  | { status: 'loading' }
  | { status: 'loaded'; bundle: MatchReadBundle }
  | { status: 'error' };

@Component({
  selector: 'app-live-match',
  imports: [AsyncPipe],
  templateUrl: './live-match.html',
  styleUrl: './live-match.scss',
})
export class LiveMatch {
  private readonly route = inject(ActivatedRoute);
  private readonly matchesApi = inject(MatchesApiService);

  protected readonly state$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id): id is string => Boolean(id)),
    switchMap((id) =>
      this.matchesApi.getMatchReadBundle(id).pipe(
        switchMap((bundle) =>
          this.matchesApi.watchLiveMatch(id).pipe(
            scan((current, message) => mergeLiveBundle(current, message), bundle),
            startWith(bundle),
          ),
        ),
        map((bundle) => ({ status: 'loaded', bundle }) satisfies LiveMatchState),
        startWith({ status: 'loading' } satisfies LiveMatchState),
        catchError(() => of({ status: 'error' } satisfies LiveMatchState)),
      ),
    ),
  );

  protected teamName(team: MatchReadBundle['match']['teamA']): string {
    return team?.name ?? 'TBD';
  }
}

function mergeLiveBundle(bundle: MatchReadBundle, message: MatchLiveStreamMessage): MatchReadBundle {
  switch (message.type) {
    case 'match.snapshot':
      return {
        ...bundle,
        match: message.data.match,
        events: message.data.events,
      };
    case 'match.clock':
      return {
        ...bundle,
        match: {
          ...bundle.match,
          status: message.data.status,
          clockStatus: message.data.clockStatus,
          clockDurationSeconds: message.data.clockDurationSeconds,
          clockRemainingSeconds: message.data.clockRemainingSeconds,
          clockLastStartedAt: message.data.clockLastStartedAt,
          updatedAt: message.data.updatedAt,
        },
      };
    case 'match.score':
      return {
        ...bundle,
        match: {
          ...bundle.match,
          teamAScore: message.data.teamAScore,
          teamBScore: message.data.teamBScore,
          updatedAt: message.data.updatedAt,
        },
      };
    case 'match.event.created':
      return {
        ...bundle,
        events: [message.data.event, ...bundle.events],
      };
    case 'match.finalized':
      return {
        ...mergeLiveBundle(bundle, { ...message, type: 'match.score' }),
        match: {
          ...bundle.match,
          status: message.data.status,
          winnerTeamId: message.data.winnerTeamId,
          clockStatus: message.data.clockStatus,
          clockRemainingSeconds: message.data.clockRemainingSeconds,
          clockLastStartedAt: message.data.clockLastStartedAt,
          teamAScore: message.data.teamAScore,
          teamBScore: message.data.teamBScore,
          updatedAt: message.data.updatedAt,
        },
      };
    default:
      return bundle;
  }
}
