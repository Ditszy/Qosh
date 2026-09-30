import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, forkJoin, map, of, switchMap, EMPTY } from 'rxjs';

import { TeamsApiService } from '../../player/teams-api.service';
import { TournamentsApiService } from '../../public/tournaments/tournaments-api.service';
import { OrganizerTournamentsApiService } from '../organizer-tournaments-api.service';
import { OrganizerDashboardActions } from './organizer-dashboard.actions';

export const loadOrganizerDashboard = createEffect(
  (actions$ = inject(Actions), organizerApi = inject(OrganizerTournamentsApiService)) =>
    actions$.pipe(
      ofType(OrganizerDashboardActions.load),
      switchMap(() =>
        forkJoin({
          page: organizerApi.listManagedTournaments({ page: 1, pageSize: 12, view: 'active' }),
          commandCenter: organizerApi.getCommandCenter(4),
        }).pipe(
          map(({ page, commandCenter }) => OrganizerDashboardActions.loadSucceeded({ page, commandCenter })),
          catchError(() => of(OrganizerDashboardActions.loadFailed())),
        ),
      ),
    ),
  { functional: true },
);

export const loadOrganizerCommandCenter = createEffect(
  (actions$ = inject(Actions), organizerApi = inject(OrganizerTournamentsApiService)) =>
    actions$.pipe(
      ofType(OrganizerDashboardActions.loadCommandCenter),
      switchMap(() => organizerApi.getCommandCenter(4).pipe(
        map((commandCenter) => OrganizerDashboardActions.loadCommandCenterSucceeded({ commandCenter })),
        catchError(() => of(OrganizerDashboardActions.loadCommandCenterFailed())),
      )),
    ),
  { functional: true },
);

export const loadOrganizerPage = createEffect(
  (actions$ = inject(Actions), organizerApi = inject(OrganizerTournamentsApiService)) =>
    actions$.pipe(
      ofType(OrganizerDashboardActions.loadPage),
      switchMap(({ page, view = 'active' }) => organizerApi.listManagedTournaments({
        page,
        pageSize: 12,
        view,
      }).pipe(
        map((result) => OrganizerDashboardActions.loadPageSucceeded({ page: result })),
        catchError(() => of(OrganizerDashboardActions.loadPageFailed())),
      )),
    ),
  { functional: true },
);

export const loadOrganizerTournamentDetails = createEffect(
  (
    actions$ = inject(Actions),
    tournamentsApi = inject(TournamentsApiService),
    teamsApi = inject(TeamsApiService),
  ) =>
    actions$.pipe(
      ofType(OrganizerDashboardActions.loadTournamentDetails),
      switchMap(({ tournamentId }) =>
        forkJoin({
          matches: tournamentsApi.listTournamentMatches(tournamentId),
          teams: teamsApi.listTournamentTeams(tournamentId),
        }).pipe(
          map(({ matches, teams }) => OrganizerDashboardActions.loadTournamentDetailsSucceeded({
            tournamentId,
            matches,
            teams,
          })),
          catchError(() => of(OrganizerDashboardActions.loadTournamentDetailsFailed({ tournamentId }))),
        ),
      ),
    ),
  { functional: true },
);

export const refreshOrganizerCommandCenter = createEffect(
  (actions$ = inject(Actions), organizerApi = inject(OrganizerTournamentsApiService)) =>
    actions$.pipe(
      ofType(
        OrganizerDashboardActions.createTournamentSucceeded,
        OrganizerDashboardActions.updateTournamentSucceeded,
        OrganizerDashboardActions.setSignupStatusSucceeded,
        OrganizerDashboardActions.generateBracketSucceeded,
        OrganizerDashboardActions.startTournamentSucceeded,
        OrganizerDashboardActions.cancelTournamentSucceeded,
        OrganizerDashboardActions.scheduleMatchSucceeded,
      ),
      switchMap(() => organizerApi.getCommandCenter(4).pipe(
        map((commandCenter) => OrganizerDashboardActions.loadCommandCenterSucceeded({ commandCenter })),
        catchError(() => EMPTY),
      )),
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
          map((matches) => OrganizerDashboardActions.generateBracketSucceeded({ tournamentId: id, matches })),
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
