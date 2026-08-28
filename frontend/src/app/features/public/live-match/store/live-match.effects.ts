import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, EMPTY, map, of, startWith, switchMap } from 'rxjs';

import { MatchesApiService } from '../matches-api.service';
import { LiveMatchActions } from './live-match.actions';

export const loadLiveMatch = createEffect(
  (actions$ = inject(Actions), matchesApi = inject(MatchesApiService)) =>
    actions$.pipe(
      ofType(LiveMatchActions.load),
      switchMap(({ matchId }) =>
        matchesApi.getMatchReadBundle(matchId).pipe(
          switchMap((bundle) =>
            matchesApi.watchLiveMatch(matchId).pipe(
              map((message) => LiveMatchActions.liveMessageReceived({ matchId, message, receivedAt: Date.now() })),
              startWith(LiveMatchActions.loadSucceeded({ matchId, bundle })),
              catchError(() => EMPTY),
            ),
          ),
          catchError(() => of(LiveMatchActions.loadFailed({ matchId }))),
        ),
      ),
    ),
  { functional: true },
);
