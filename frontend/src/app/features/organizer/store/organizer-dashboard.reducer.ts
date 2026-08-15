import { createReducer, on } from '@ngrx/store';

import type { Tournament, TournamentMatch } from '../../public/tournaments/tournament.models';
import { OrganizerDashboardActions } from './organizer-dashboard.actions';

export const organizerDashboardFeatureKey = 'organizerDashboard';

export type OrganizerTournamentWithMatches = Tournament & {
  matches: TournamentMatch[];
};

export type OrganizerDashboardViewState =
  | { status: 'loading' }
  | { status: 'loaded'; tournaments: OrganizerTournamentWithMatches[] }
  | { status: 'error' };

export type OrganizerDashboardState = {
  view: OrganizerDashboardViewState;
};

export const initialOrganizerDashboardState: OrganizerDashboardState = {
  view: { status: 'loading' },
};

export const organizerDashboardReducer = createReducer(
  initialOrganizerDashboardState,
  on(OrganizerDashboardActions.load, (state) => ({
    ...state,
    view: { status: 'loading' },
  })),
  on(OrganizerDashboardActions.loadSucceeded, (state, { tournaments }) => ({
    ...state,
    view: { status: 'loaded', tournaments },
  })),
  on(OrganizerDashboardActions.loadFailed, (state) => ({
    ...state,
    view: { status: 'error' },
  })),
);
