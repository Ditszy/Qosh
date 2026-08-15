import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

import { TournamentsApiService } from '../tournaments-api.service';
import { TournamentsActions } from './tournaments.actions';

export const loadTournamentList = createEffect(
  (actions$ = inject(Actions), tournamentsApi = inject(TournamentsApiService)) =>
    actions$.pipe(
      ofType(TournamentsActions.loadList),
      switchMap(({ query }) =>
        tournamentsApi.listTournaments(query).pipe(
          map((page) => TournamentsActions.loadListSucceeded({ query, page })),
          catchError(() => of(TournamentsActions.loadListFailed({ query }))),
        ),
      ),
    ),
  { functional: true },
);
