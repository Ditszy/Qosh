import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

import { MatchesApiService } from '../../public/live-match/matches-api.service';
import { ScorerMatchApiService } from '../scorer-match-api.service';
import { ScorerActions } from './scorer.actions';

export const loadAssignedMatches = createEffect(
  (actions$ = inject(Actions), scorerApi = inject(ScorerMatchApiService)) =>
    actions$.pipe(
      ofType(ScorerActions.loadAssignedMatches),
      switchMap(() =>
        scorerApi.listAssignedMatches().pipe(
          map((matches) => ScorerActions.loadAssignedMatchesSucceeded({ matches })),
          catchError(() =>
            of(ScorerActions.loadAssignedMatchesFailed({ error: 'Dodeljeni mečevi trenutno nisu dostupni.' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const loadMatch = createEffect(
  (actions$ = inject(Actions), matchesApi = inject(MatchesApiService)) =>
    actions$.pipe(
      ofType(ScorerActions.loadMatch),
      switchMap(({ matchId }) =>
        matchesApi.getMatchReadBundle(matchId).pipe(
          map((bundle) => ScorerActions.loadMatchSucceeded({ matchId, bundle })),
          catchError(() =>
            of(ScorerActions.loadMatchFailed({ matchId, error: 'Učitavanje meča nije uspelo. Proveri ID meča.' })),
          ),
        ),
      ),
    ),
  { functional: true },
);
