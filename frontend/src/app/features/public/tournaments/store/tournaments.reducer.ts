import { createReducer, on } from '@ngrx/store';

import type { PaginatedTournaments, TournamentListQuery } from '../tournament.models';
import { TournamentsActions } from './tournaments.actions';

export const tournamentsFeatureKey = 'tournaments';

export type TournamentListViewState =
  | { status: 'loading' }
  | { status: 'loaded'; page: PaginatedTournaments }
  | { status: 'error' };

export type TournamentsState = {
  listQuery: TournamentListQuery;
  listView: TournamentListViewState;
};

export const initialTournamentsState: TournamentsState = {
  listQuery: { page: 1, pageSize: 9, sortBy: 'startsAt', sortDirection: 'asc' },
  listView: { status: 'loading' },
};

export const tournamentsReducer = createReducer(
  initialTournamentsState,
  on(TournamentsActions.loadList, (state, { query }) => ({
    ...state,
    listQuery: query,
    listView: { status: 'loading' },
  })),
  on(TournamentsActions.loadListSucceeded, (state, { query, page }) => ({
    ...state,
    listQuery: query,
    listView: { status: 'loaded', page },
  })),
  on(TournamentsActions.loadListFailed, (state, { query }) => ({
    ...state,
    listQuery: query,
    listView: { status: 'error' },
  })),
);
