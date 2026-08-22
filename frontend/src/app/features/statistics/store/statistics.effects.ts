import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';

import { StatisticsApiService } from '../statistics-api.service';
import { StatisticsActions } from './statistics.actions';
import { filtersEqual, normalizePlayerStatisticsFilters } from './statistics.reducer';

export const loadGlobalRankings = createEffect(
  (actions$ = inject(Actions), statisticsApi = inject(StatisticsApiService)) =>
    actions$.pipe(
      ofType(StatisticsActions.globalRankingFiltersChanged),
      map(({ filters }) => normalizePlayerStatisticsFilters(filters)),
      debounceTime(250),
      distinctUntilChanged(filtersEqual),
      switchMap((filters) =>
        statisticsApi.listPlayerStatistics(filters).pipe(
          map((rankings) => StatisticsActions.loadGlobalRankingsSucceeded({ filters, rankings })),
          catchError((error: unknown) =>
            of(
              StatisticsActions.loadGlobalRankingsFailed({
                filters,
                error: error instanceof Error ? error.message : 'Unable to load player rankings.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const loadGlobalLeaders = createEffect(
  (actions$ = inject(Actions), statisticsApi = inject(StatisticsApiService)) =>
    actions$.pipe(
      ofType(StatisticsActions.loadGlobalLeaders),
      switchMap(({ filters }) =>
        statisticsApi.listPlayerStatisticLeaders(filters).pipe(
          map((leaders) => StatisticsActions.loadGlobalLeadersSucceeded({ leaders })),
          catchError((error: unknown) =>
            of(
              StatisticsActions.loadGlobalLeadersFailed({
                error: error instanceof Error ? error.message : 'Unable to load player leaders.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);
