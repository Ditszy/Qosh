import { createFeatureSelector, createSelector } from '@ngrx/store';

import { liveMatchFeatureKey, type LiveMatchState } from './live-match.reducer';

export const selectLiveMatchState = createFeatureSelector<LiveMatchState>(liveMatchFeatureKey);

export const selectLiveMatchView = createSelector(
  selectLiveMatchState,
  (state) => state.view,
);
