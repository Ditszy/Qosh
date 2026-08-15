import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';

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
        combineLatest({
          rankings: statisticsApi.listPlayerStatistics(filters),
          leaders: statisticsApi.listPlayerStatisticLeaders(filters),
        }).pipe(
          map(({ rankings, leaders }) =>
            StatisticsActions.loadGlobalRankingsSucceeded({ filters, rankings, leaders }),
          ),
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
