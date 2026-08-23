import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';

import { MatchesApiService } from '../../public/live-match/matches-api.service';
import { RefereeReportsApiService } from '../referee-reports-api.service';
import { RefereeActions } from './referee.actions';

export const loadAssignedMatches = createEffect(
  (actions$ = inject(Actions), refereeApi = inject(RefereeReportsApiService)) =>
    actions$.pipe(
      ofType(RefereeActions.loadAssignedMatches),
      switchMap(() =>
        refereeApi.listAssignedMatches().pipe(
          map((matches) => RefereeActions.loadAssignedMatchesSucceeded({ matches })),
          catchError(() =>
            of(RefereeActions.loadAssignedMatchesFailed({ error: 'Dodeljeni mečevi trenutno nisu dostupni.' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const loadSelectedMatch = createEffect(
  (actions$ = inject(Actions), matchesApi = inject(MatchesApiService)) =>
    actions$.pipe(
      ofType(RefereeActions.loadSelectedMatch),
      switchMap(({ matchId }) =>
        matchesApi.getMatch(matchId).pipe(
          map((match) => RefereeActions.loadSelectedMatchSucceeded({ matchId, match })),
          catchError(() => of(RefereeActions.loadSelectedMatchFailed({ matchId, error: 'Meč nije pronađen.' }))),
        ),
      ),
    ),
  { functional: true },
);

export const loadExistingReport = createEffect(
  (actions$ = inject(Actions), refereeApi = inject(RefereeReportsApiService)) =>
    actions$.pipe(
      ofType(RefereeActions.loadExistingReport),
      switchMap(({ matchId }) =>
        refereeApi.getReport(matchId).pipe(
          map((report) => RefereeActions.loadExistingReportSucceeded({ matchId, report })),
          catchError(() => of(RefereeActions.loadExistingReportMissing({ matchId }))),
        ),
      ),
    ),
  { functional: true },
);

export const submitReport = createEffect(
  (actions$ = inject(Actions), refereeApi = inject(RefereeReportsApiService)) =>
    actions$.pipe(
      ofType(RefereeActions.submitReport),
      exhaustMap(({ matchId, notes }) =>
        refereeApi.createReport(matchId, { notes }).pipe(
          switchMap(() =>
            refereeApi.getReport(matchId).pipe(
              map((report) => RefereeActions.submitReportSucceeded({ matchId, report })),
            ),
          ),
          catchError(() =>
            of(RefereeActions.submitReportFailed({
              matchId,
              error: 'Izveštaj nije sačuvan. Proveri da li je meč finalan.',
            })),
          ),
        ),
      ),
    ),
  { functional: true },
);
