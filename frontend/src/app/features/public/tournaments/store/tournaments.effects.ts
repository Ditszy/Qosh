import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, EMPTY, forkJoin, map, of, startWith, switchMap } from 'rxjs';

import { TeamsApiService } from '../../../player/teams-api.service';
import { MatchesApiService } from '../../live-match/matches-api.service';
import { StatisticsApiService } from '../../../statistics/statistics-api.service';
import { TournamentsApiService } from '../tournaments-api.service';
import type { MatchRecapsByMatchId } from '../../live-match/match.models';
import type { TournamentMatch } from '../tournament.models';
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
    matchesApi = inject(MatchesApiService),
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
            loadFinalMatchRecaps(matches, matchesApi).pipe(
              switchMap((recapsByMatchId) =>
                tournamentsApi.watchTournamentLive(tournamentId).pipe(
                  map((message) => TournamentsActions.detailLiveMessageReceived({ tournamentId, message })),
                  startWith(TournamentsActions.loadDetailSucceeded({
                    tournamentId,
                    tournament,
                    teams,
                    matches,
                    awards,
                    recapsByMatchId,
                  })),
                  catchError(() => EMPTY),
                ),
              ),
            ),
          ),
          catchError(() => of(TournamentsActions.loadDetailFailed({ tournamentId }))),
        ),
      ),
    ),
  { functional: true },
);

function loadFinalMatchRecaps(
  matches: TournamentMatch[],
  matchesApi: MatchesApiService,
) {
  const finalMatches = matches.filter((match) => match.status === 'FINAL');

  if (finalMatches.length === 0) {
    return of({} as MatchRecapsByMatchId);
  }

  return forkJoin(
    finalMatches.map((match) => matchesApi.getMatchRecap(match.id)),
  ).pipe(
    map((recaps) => Object.fromEntries(recaps.map((recap) => [recap.match.id, recap])) as MatchRecapsByMatchId),
    catchError(() => of({} as MatchRecapsByMatchId)),
  );
}
