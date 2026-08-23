import { createFeatureSelector, createSelector } from '@ngrx/store';

import { refereeFeatureKey, type RefereeState } from './referee.reducer';

export const selectRefereeState = createFeatureSelector<RefereeState>(refereeFeatureKey);

export const selectRefereeAssignedMatches = createSelector(selectRefereeState, (state) => state.assignedMatches);
export const selectRefereeAssignedMatchesLoading = createSelector(
  selectRefereeState,
  (state) => state.assignedMatchesLoading,
);
export const selectRefereeSelectedMatch = createSelector(selectRefereeState, (state) => state.selectedMatch);
export const selectRefereeSelectedMatchLoading = createSelector(
  selectRefereeState,
  (state) => state.selectedMatchLoading,
);
export const selectRefereeLoadedReport = createSelector(selectRefereeState, (state) => state.loadedReport);
export const selectRefereeReportLoading = createSelector(selectRefereeState, (state) => state.reportLoading);
export const selectRefereeReportSubmitting = createSelector(selectRefereeState, (state) => state.reportSubmitting);
export const selectRefereeError = createSelector(selectRefereeState, (state) => state.error);
