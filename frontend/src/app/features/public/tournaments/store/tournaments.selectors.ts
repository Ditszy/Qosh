import { createFeatureSelector, createSelector } from '@ngrx/store';

import { tournamentsFeatureKey, type TournamentsState } from './tournaments.reducer';

export const selectTournamentsState = createFeatureSelector<TournamentsState>(tournamentsFeatureKey);

export const selectTournamentListView = createSelector(
  selectTournamentsState,
  (state) => state.listView,
);

export const selectTournamentDetailView = createSelector(
  selectTournamentsState,
  (state) => state.detailView,
);

export const selectTournamentDetailRecaps = createSelector(
  selectTournamentDetailView,
  (view) => (view.status === 'loaded' ? view.recapsByMatchId : {}),
);
