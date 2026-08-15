import { createFeatureSelector, createSelector } from '@ngrx/store';

import { scorerFeatureKey, type ScorerState } from './scorer.reducer';

export const selectScorerState = createFeatureSelector<ScorerState>(scorerFeatureKey);

export const selectAssignedMatches = createSelector(selectScorerState, (state) => state.assignedMatches);
export const selectAssignedMatchesLoading = createSelector(
  selectScorerState,
  (state) => state.assignedMatchesLoading,
);
export const selectSelectedMatchBundle = createSelector(selectScorerState, (state) => state.selectedBundle);
export const selectSelectedMatchLoading = createSelector(selectScorerState, (state) => state.selectedMatchLoading);
export const selectScorerError = createSelector(selectScorerState, (state) => state.error);
