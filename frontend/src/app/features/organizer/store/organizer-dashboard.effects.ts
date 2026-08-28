import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { AuthService } from '../../../core/auth/auth';
import { TournamentsApiService } from '../../public/tournaments/tournaments-api.service';
import { OrganizerDashboardActions } from './organizer-dashboard.actions';

export const loadOrganizerDashboard = createEffect(
  (actions$ = inject(Actions), tournamentsApi = inject(TournamentsApiService), auth = inject(AuthService)) =>
    actions$.pipe(
      ofType(OrganizerDashboardActions.load),
      switchMap(() =>
        tournamentsApi.listTournaments({ pageSize: 50 }).pipe(
          switchMap((page) => {
            const user = auth.currentUser();
            const owned = user?.role === 'ADMIN'
              ? page.items
              : page.items.filter((item) => item.organizerId === user?.id);
            const active = owned.filter((item) => item.status !== 'COMPLETED' && item.status !== 'CANCELLED');

            if (active.length === 0) {
              return of(OrganizerDashboardActions.loadSucceeded({ tournaments: [] }));
            }

            return forkJoin(
              active.map((tournament) =>
                forkJoin({
                  matches: tournamentsApi.listTournamentMatches(tournament.id),
                  teams: tournamentsApi.listTournamentTeams(tournament.id),
                }).pipe(
                  map(({ matches, teams }) => ({ ...tournament, matches, teams })),
                ),
              ),
            ).pipe(
              map((tournaments) => OrganizerDashboardActions.loadSucceeded({ tournaments })),
            );
          }),
          catchError(() => of(OrganizerDashboardActions.loadFailed())),
        ),
      ),
    ),
  { functional: true },
);
