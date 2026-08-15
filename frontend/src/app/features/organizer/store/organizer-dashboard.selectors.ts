import { createFeatureSelector, createSelector } from '@ngrx/store';

import { organizerDashboardFeatureKey, type OrganizerDashboardState } from './organizer-dashboard.reducer';

export const selectOrganizerDashboardState =
  createFeatureSelector<OrganizerDashboardState>(organizerDashboardFeatureKey);

export const selectOrganizerDashboardView = createSelector(
  selectOrganizerDashboardState,
  (state) => state.view,
);
