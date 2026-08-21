import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, EMPTY, forkJoin, map, of, startWith, switchMap } from 'rxjs';

import { TeamsApiService } from '../../../player/teams-api.service';
import { StatisticsApiService } from '../../../statistics/statistics-api.service';
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

export const loadTournamentDetail = createEffect(
  (
    actions$ = inject(Actions),
    tournamentsApi = inject(TournamentsApiService),
    teamsApi = inject(TeamsApiService),
    statisticsApi = inject(StatisticsApiService),
  ) =>
    actions$.pipe(
      ofType(TournamentsActions.loadDetail),
      switchMap(({ tournamentId }) =>
        forkJoin({
          tournament: tournamentsApi.getTournament(tournamentId),
          teams: teamsApi.listTournamentTeams(tournamentId),
          matches: tournamentsApi.listTournamentMatches(tournamentId),
          awards: statisticsApi.getTournamentAwards(tournamentId),
        }).pipe(
          switchMap(({ tournament, teams, matches, awards }) =>
            tournamentsApi.watchTournamentLive(tournamentId).pipe(
              map((message) => TournamentsActions.detailLiveMessageReceived({ tournamentId, message })),
              startWith(TournamentsActions.loadDetailSucceeded({ tournamentId, tournament, teams, matches, awards })),
              catchError(() => EMPTY),
            ),
          ),
          catchError(() => of(TournamentsActions.loadDetailFailed({ tournamentId }))),
        ),
      ),
    ),
  { functional: true },
);
