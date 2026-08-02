import { inject, Injectable } from '@angular/core';
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

import {
  defaultPlayerStatisticsFilters,
  NormalizedPlayerStatisticsFilters,
  PlayerRankingsState,
  PlayerStatisticsFilters,
} from './statistics.models';
import { StatisticsApiService } from './statistics-api.service';

@Injectable({
  providedIn: 'root',
})
export class PlayerRankingsService {
  private readonly statisticsApi = inject(StatisticsApiService);

  watchGlobalRankings(filters$: Observable<PlayerStatisticsFilters>): Observable<PlayerRankingsState> {
    return filters$.pipe(
      map((filters) => this.normalizeFilters(filters)), //clean filter
      debounceTime(250), //wait 250ms before request
      distinctUntilChanged((previous, current) => this.filtersEqual(previous, current)), //skip duplicates
      switchMap((filters) => this.loadGlobalRankings(filters)),
      shareReplay({ bufferSize: 1, refCount: true }), //share with latest subscribers
    );
  }

  watchTournamentRankings(
    tournamentId$: Observable<string>,
    filters$: Observable<PlayerStatisticsFilters>,
  ): Observable<PlayerRankingsState> {
    return combineLatest([tournamentId$, filters$]).pipe(
      map(([tournamentId, filters]) => ({
        tournamentId,
        filters: this.normalizeFilters({
          ...filters,
          tournamentId,
        }),
      })),
      debounceTime(250),
      distinctUntilChanged(
        (previous, current) =>
          previous.tournamentId === current.tournamentId && this.filtersEqual(previous.filters, current.filters),
      ),
      switchMap(({ tournamentId, filters }) => this.loadTournamentRankings(tournamentId, filters)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  private loadGlobalRankings(filters: NormalizedPlayerStatisticsFilters): Observable<PlayerRankingsState> {
    return combineLatest({
      rankings: this.statisticsApi.listPlayerStatistics(filters),
      leaders: this.statisticsApi.listPlayerStatisticLeaders(filters),
    }).pipe(
      map(({ rankings, leaders }) => this.loadedState(filters, rankings, leaders)),
      startWith(this.loadingState(filters)),
      catchError((error) => of(this.errorState(filters, error))),
    );
  }

  private loadTournamentRankings(
    tournamentId: string,
    filters: NormalizedPlayerStatisticsFilters,
  ): Observable<PlayerRankingsState> {
    return combineLatest({
      rankings: this.statisticsApi.listTournamentPlayerStatistics(tournamentId, filters),
      leaders: this.statisticsApi.listTournamentPlayerStatisticLeaders(tournamentId, filters),
    }).pipe(
      map(({ rankings, leaders }) => this.loadedState(filters, rankings, leaders)),
      startWith(this.loadingState(filters)),
      catchError((error) => of(this.errorState(filters, error))),
    );
  }

  private normalizeFilters(filters: PlayerStatisticsFilters): NormalizedPlayerStatisticsFilters {
    const search = filters.search?.trim();
    const minGamesPlayed = filters.minGamesPlayed === undefined ? undefined : Math.max(0, filters.minGamesPlayed);

    return {
      ...defaultPlayerStatisticsFilters,
      ...filters,
      search: search || undefined,
      minGamesPlayed,
      sortBy: filters.sortBy ?? defaultPlayerStatisticsFilters.sortBy,
      sortDirection: filters.sortDirection ?? defaultPlayerStatisticsFilters.sortDirection,
    };
  }

  private filtersEqual(
    previous: NormalizedPlayerStatisticsFilters,
    current: NormalizedPlayerStatisticsFilters,
  ): boolean {
    return (
      previous.tournamentId === current.tournamentId &&
      previous.teamId === current.teamId &&
      previous.search === current.search &&
      previous.minGamesPlayed === current.minGamesPlayed &&
      previous.sortBy === current.sortBy &&
      previous.sortDirection === current.sortDirection
    );
  }

  private loadingState(filters: NormalizedPlayerStatisticsFilters): PlayerRankingsState {
    return {
      filters,
      rankings: [],
      leaders: [],
      loading: true,
      error: null,
    };
  }

  private loadedState(
    filters: NormalizedPlayerStatisticsFilters,
    rankings: PlayerRankingsState['rankings'],
    leaders: PlayerRankingsState['leaders'],
  ): PlayerRankingsState {
    return {
      filters,
      rankings,
      leaders,
      loading: false,
      error: null,
    };
  }

  private errorState(filters: NormalizedPlayerStatisticsFilters, error: unknown): PlayerRankingsState {
    return {
      filters,
      rankings: [],
      leaders: [],
      loading: false,
      error: error instanceof Error ? error.message : 'Unable to load player rankings.',
    };
  }
}
