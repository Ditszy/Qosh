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
    page: null,
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
  const page = filters.page === undefined ? defaultPlayerStatisticsFilters.page : Math.max(1, filters.page);
  const pageSize = filters.pageSize === undefined
    ? defaultPlayerStatisticsFilters.pageSize
    : Math.min(100, Math.max(1, filters.pageSize));

  return {
    ...defaultPlayerStatisticsFilters,
    ...filters,
    search: search || undefined,
    minGamesPlayed,
    page,
    pageSize,
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
  previous.page === current.page &&
  previous.pageSize === current.pageSize &&
  previous.sortBy === current.sortBy &&
  previous.sortDirection === current.sortDirection;

export const statisticsReducer = createReducer(
  initialStatisticsState,
  on(StatisticsActions.globalRankingFiltersChanged, (state, { filters }) => ({
    ...state,
    globalRankings: {
      ...state.globalRankings,
      filters: normalizePlayerStatisticsFilters(filters),
      page: null,
      loading: true,
      error: null,
    },
  })),
  on(StatisticsActions.loadGlobalRankingsSucceeded, (state, { filters, page }) => ({
    ...state,
    globalRankings: {
      ...state.globalRankings,
      filters,
      page,
      loading: false,
      error: null,
    },
  })),
  on(StatisticsActions.loadGlobalRankingsFailed, (state, { filters, error }) => ({
    ...state,
    globalRankings: {
      ...state.globalRankings,
      filters,
      page: null,
      loading: false,
      error,
    },
  })),
  on(StatisticsActions.loadGlobalLeadersSucceeded, (state, { leaders }) => ({
    ...state,
    globalRankings: {
      ...state.globalRankings,
      leaders,
    },
  })),
  on(StatisticsActions.loadGlobalLeadersFailed, (state) => state),
);
