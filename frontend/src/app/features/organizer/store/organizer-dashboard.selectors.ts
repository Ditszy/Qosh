import { createFeatureSelector, createSelector } from '@ngrx/store';

import {
  organizerDashboardFeatureKey,
  organizerMatchAdapter,
  organizerTeamAdapter,
  organizerTournamentAdapter,
  type OrganizerDashboardState,
} from './organizer-dashboard.reducer';

export const selectOrganizerDashboardState =
  createFeatureSelector<OrganizerDashboardState>(organizerDashboardFeatureKey);

const tournamentSelectors = organizerTournamentAdapter.getSelectors();
const matchSelectors = organizerMatchAdapter.getSelectors();
const teamSelectors = organizerTeamAdapter.getSelectors();

export const selectOrganizerDashboardStatus = createSelector(
  selectOrganizerDashboardState,
  (state) => state.status,
);

export const selectOrganizerDashboardPendingAction = createSelector(
  selectOrganizerDashboardState,
  (state) => state.pendingAction,
);

export const selectOrganizerDashboardErrorMessage = createSelector(
  selectOrganizerDashboardState,
  (state) => state.errorMessage,
);

export const selectOrganizerTournaments = createSelector(
  selectOrganizerDashboardState,
  (state) => tournamentSelectors.selectAll(state.tournaments),
);

export const selectOrganizerMatches = createSelector(
  selectOrganizerDashboardState,
  (state) => matchSelectors.selectAll(state.matches),
);

export const selectOrganizerTeams = createSelector(
  selectOrganizerDashboardState,
  (state) => teamSelectors.selectAll(state.teams),
);

export const selectOrganizerDashboardView = createSelector(
  selectOrganizerDashboardStatus,
  selectOrganizerTournaments,
  selectOrganizerMatches,
  selectOrganizerTeams,
  (status, tournaments, matches, teams) => {
    if (status === 'loading') {
      return { status } as const;
    }

    if (status === 'error') {
      return { status } as const;
    }

    return {
      status,
      tournaments: tournaments
        .filter((tournament) => tournament.status !== 'COMPLETED' && tournament.status !== 'CANCELLED')
        .map((tournament) => ({
          ...tournament,
          matches: matches.filter((match) => match.tournamentId === tournament.id),
          teams: teams.filter((team) => team.tournamentId === tournament.id),
        })),
    } as const;
  },
);

export const selectOrganizerDashboardLoaded = createSelector(
  selectOrganizerDashboardState,
  (state) => state.status === 'loaded',
);
