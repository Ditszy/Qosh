import { createFeatureSelector, createSelector } from '@ngrx/store';

import {
  organizerDashboardFeatureKey,
  type OrganizerDashboardState,
  type OrganizerTournamentWithMatches,
} from './organizer-dashboard.reducer';

export const selectOrganizerDashboardState =
  createFeatureSelector<OrganizerDashboardState>(organizerDashboardFeatureKey);

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

export const selectOrganizerDashboardView = createSelector(
  selectOrganizerDashboardState,
  (state): ReturnType<typeof toDashboardView> => toDashboardView(state),
);

export const selectOrganizerDashboardLoaded = createSelector(
  selectOrganizerDashboardState,
  (state) => state.status === 'loaded',
);

function toDashboardView(state: OrganizerDashboardState) {
  if (state.status === 'loading') {
    return { status: state.status, commandCenter: state.commandCenter } as const;
  }

  if (state.status === 'error') {
    return { status: state.status, commandCenter: state.commandCenter } as const;
  }

  const summaries = [...(state.page?.items ?? [])];

  if (
    state.selectedTournamentSummary
    && !summaries.some((tournament) => tournament.id === state.selectedTournamentSummary?.id)
  ) {
    summaries.push(state.selectedTournamentSummary);
  }

  const tournaments: OrganizerTournamentWithMatches[] = summaries.map((tournament) => ({
    ...tournament,
    matches: state.selectedTournamentId === tournament.id ? state.selectedMatches : [],
    teams: state.selectedTournamentId === tournament.id ? state.selectedTeams : [],
    detailsLoaded: state.selectedTournamentId === tournament.id && state.selectedDetailsStatus === 'loaded',
  }));

  return {
    status: state.status,
    commandCenter: state.commandCenter,
    page: state.page,
    tournaments,
  } as const;
}
