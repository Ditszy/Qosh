import { createFeatureSelector, createSelector } from '@ngrx/store';

import { tournamentsFeatureKey, type TournamentsState } from './tournaments.reducer';

export const selectTournamentsState = createFeatureSelector<TournamentsState>(tournamentsFeatureKey);

export const selectTournamentListView = createSelector(
  selectTournamentsState,
  (state) => state.listView,
);
