import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, EMPTY, exhaustMap, forkJoin, map, of, switchMap, zip } from 'rxjs';

import { AuthService } from '../../../core/auth/auth';
import { NotificationsActions } from '../../notifications';
import { TournamentsApiService } from '../../public/tournaments/tournaments-api.service';
import { TeamsApiService, type TeamDetail } from '../teams-api.service';
import { PlayerTeamsActions } from './player-teams.actions';

export const loadMyTeamPage = createEffect(
  (
    actions$ = inject(Actions),
    teamsApi = inject(TeamsApiService),
    tournamentsApi = inject(TournamentsApiService),
  ) =>
    actions$.pipe(
      ofType(PlayerTeamsActions.loadPage),
      switchMap(() =>
        zip(
          teamsApi.listMyTeams().pipe(
            switchMap((teams) => hydrateTeams(teams, tournamentsApi)),
          ),
          teamsApi.listMyPendingInvites(),
        ).pipe(
          map(([teams, invites]) => PlayerTeamsActions.loadPageSucceeded({ teams, invites })),
          catchError(() => of(PlayerTeamsActions.loadPageFailed())),
        ),
      ),
    ),
  { functional: true },
);

export const reloadMyInvites = createEffect(
  (actions$ = inject(Actions), teamsApi = inject(TeamsApiService)) =>
    actions$.pipe(
      ofType(PlayerTeamsActions.reloadInvites),
      switchMap(() =>
        teamsApi.listMyPendingInvites().pipe(
          map((invites) => PlayerTeamsActions.reloadInvitesSucceeded({ invites })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  { functional: true },
);

export const reloadInvitesOnNotification = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(NotificationsActions.notificationReceived),
      switchMap(({ notification }) => notification.type === 'TEAM_INVITE' ? of(PlayerTeamsActions.reloadInvites()) : EMPTY),
    ),
  { functional: true },
);

export const watchMyTeams = createEffect(
  (actions$ = inject(Actions), teamsApi = inject(TeamsApiService), authService = inject(AuthService)) =>
    actions$.pipe(
      ofType(PlayerTeamsActions.watchMyTeams),
      exhaustMap(() =>
        teamsApi.watchMyTeams().pipe(
          map((message) =>
            PlayerTeamsActions.liveMessageReceived({ message, currentUserId: authService.currentUser()?.id ?? null }),
          ),
          catchError(() => EMPTY),
        ),
      ),
    ),
  { functional: true },
);

function hydrateTeams(teams: TeamDetail[], tournamentsApi: TournamentsApiService) {
  if (teams.length === 0) {
    return of([]);
  }

  return forkJoin(teams.map((team) => hydrateTeam(team, tournamentsApi)));
}

function hydrateTeam(team: TeamDetail, tournamentsApi: TournamentsApiService) {
  if (team.tournament) {
    return of(team);
  }

  return tournamentsApi.getTournament(team.tournamentId).pipe(
    map((tournament) => ({ ...team, tournament })),
    catchError(() => of(team)),
  );
}
