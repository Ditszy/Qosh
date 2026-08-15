import { createFeatureSelector, createSelector } from '@ngrx/store';

import { statisticsFeatureKey, type StatisticsState } from './statistics.reducer';

export const selectStatisticsState = createFeatureSelector<StatisticsState>(statisticsFeatureKey);

export const selectGlobalPlayerRankingsState = createSelector(
  selectStatisticsState,
  (state) => state.globalRankings,
);
