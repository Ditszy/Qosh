import { createReducer, on } from '@ngrx/store';

import type {
  NormalizedPlayerStatisticsFilters,
  PlayerRankingsState,
  PlayerStatisticsFilters,
} from '../statistics.models';
import { defaultPlayerStatisticsFilters } from '../statistics.models';
import { StatisticsActions } from './statistics.actions';

export const statisticsFeatureKey = 'statistics';

export type StatisticsState = {
  globalRankings: PlayerRankingsState;
};

export const initialStatisticsState: StatisticsState = {
  globalRankings: {
    filters: defaultPlayerStatisticsFilters,
    rankings: [],
    leaders: [],
    loading: false,
    error: null,
  },
};

export const normalizePlayerStatisticsFilters = (
  filters: PlayerStatisticsFilters,
): NormalizedPlayerStatisticsFilters => {
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
};

export const filtersEqual = (
  previous: NormalizedPlayerStatisticsFilters,
  current: NormalizedPlayerStatisticsFilters,
): boolean =>
  previous.tournamentId === current.tournamentId &&
  previous.teamId === current.teamId &&
  previous.search === current.search &&
  previous.minGamesPlayed === current.minGamesPlayed &&
  previous.sortBy === current.sortBy &&
  previous.sortDirection === current.sortDirection;

export const statisticsReducer = createReducer(
  initialStatisticsState,
  on(StatisticsActions.globalRankingFiltersChanged, (state, { filters }) => ({
    ...state,
    globalRankings: {
      filters: normalizePlayerStatisticsFilters(filters),
      rankings: [],
      leaders: [],
      loading: true,
      error: null,
    },
  })),
  on(StatisticsActions.loadGlobalRankingsSucceeded, (state, { filters, rankings, leaders }) => ({
    ...state,
    globalRankings: {
      filters,
      rankings,
      leaders,
      loading: false,
      error: null,
    },
  })),
  on(StatisticsActions.loadGlobalRankingsFailed, (state, { filters, error }) => ({
    ...state,
    globalRankings: {
      filters,
      rankings: [],
      leaders: [],
      loading: false,
      error,
    },
  })),
);
