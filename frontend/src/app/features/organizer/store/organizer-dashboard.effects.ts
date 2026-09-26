import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, forkJoin, map, of, switchMap } from 'rxjs';

import { AuthService } from '../../../core/auth/auth';
import { TournamentsApiService } from '../../public/tournaments/tournaments-api.service';
import { OrganizerTournamentsApiService } from '../organizer-tournaments-api.service';
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

export const createOrganizerTournament = createEffect(
  (actions$ = inject(Actions), organizerApi = inject(OrganizerTournamentsApiService)) =>
    actions$.pipe(
      ofType(OrganizerDashboardActions.createTournament),
      exhaustMap(({ value }) =>
        organizerApi.createTournament(value).pipe(
          map((tournament) => OrganizerDashboardActions.createTournamentSucceeded({ tournament })),
          catchError(() => of(OrganizerDashboardActions.commandFailed({
            errorMessage: 'Turnir nije kreiran. Proveri podatke.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

export const updateOrganizerTournament = createEffect(
  (actions$ = inject(Actions), organizerApi = inject(OrganizerTournamentsApiService)) =>
    actions$.pipe(
      ofType(OrganizerDashboardActions.updateTournament),
      exhaustMap(({ id, value }) =>
        organizerApi.updateTournament(id, value).pipe(
          map((tournament) => OrganizerDashboardActions.updateTournamentSucceeded({ tournament })),
          catchError(() => of(OrganizerDashboardActions.commandFailed({
            errorMessage: 'Izmena turnira nije sačuvana.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

export const setOrganizerSignupStatus = createEffect(
  (actions$ = inject(Actions), organizerApi = inject(OrganizerTournamentsApiService)) =>
    actions$.pipe(
      ofType(OrganizerDashboardActions.setSignupStatus),
      exhaustMap(({ id, action }) => {
        const request$ = action === 'open' ? organizerApi.openSignups(id) : organizerApi.lockSignups(id);

        return request$.pipe(
          map((tournament) => OrganizerDashboardActions.setSignupStatusSucceeded({ tournament })),
          catchError(() => of(OrganizerDashboardActions.commandFailed({
            errorMessage: 'Promena statusa nije uspela.',
          }))),
        );
      }),
    ),
  { functional: true },
);

export const generateOrganizerBracket = createEffect(
  (actions$ = inject(Actions), organizerApi = inject(OrganizerTournamentsApiService)) =>
    actions$.pipe(
      ofType(OrganizerDashboardActions.generateBracket),
      exhaustMap(({ id }) =>
        organizerApi.generateBracket(id).pipe(
          map((matches) => OrganizerDashboardActions.generateBracketSucceeded({ matches })),
          catchError(() => of(OrganizerDashboardActions.commandFailed({
            errorMessage: 'Žreb nije generisan. Proveri broj timova.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

export const startOrganizerTournament = createEffect(
  (actions$ = inject(Actions), organizerApi = inject(OrganizerTournamentsApiService)) =>
    actions$.pipe(
      ofType(OrganizerDashboardActions.startTournament),
      exhaustMap(({ id }) =>
        organizerApi.startTournament(id).pipe(
          map((tournament) => OrganizerDashboardActions.startTournamentSucceeded({ tournament })),
          catchError(() => of(OrganizerDashboardActions.commandFailed({
            errorMessage: 'Turnir nije pokrenut. Prvo generiši žreb.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

export const cancelOrganizerTournament = createEffect(
  (actions$ = inject(Actions), organizerApi = inject(OrganizerTournamentsApiService)) =>
    actions$.pipe(
      ofType(OrganizerDashboardActions.cancelTournament),
      exhaustMap(({ id }) =>
        organizerApi.cancelTournament(id).pipe(
          map((tournament) => OrganizerDashboardActions.cancelTournamentSucceeded({ tournament })),
          catchError(() => of(OrganizerDashboardActions.commandFailed({
            errorMessage: 'Turnir nije otkazan.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

export const scheduleOrganizerMatch = createEffect(
  (actions$ = inject(Actions), organizerApi = inject(OrganizerTournamentsApiService)) =>
    actions$.pipe(
      ofType(OrganizerDashboardActions.scheduleMatch),
      exhaustMap(({ id, value }) =>
        organizerApi.scheduleMatch(id, value).pipe(
          map((match) => OrganizerDashboardActions.scheduleMatchSucceeded({ match })),
          catchError(() => of(OrganizerDashboardActions.commandFailed({
            errorMessage: 'Termin nije sačuvan.',
          }))),
        ),
      ),
    ),
  { functional: true },
);
