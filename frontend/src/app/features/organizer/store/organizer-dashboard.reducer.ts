import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, type EntityState } from '@ngrx/entity';

import type { Tournament, TournamentMatch, TournamentTeamDetail } from '../../public/tournaments/tournament.models';
import { OrganizerDashboardActions } from './organizer-dashboard.actions';

export const organizerDashboardFeatureKey = 'organizerDashboard';

export type OrganizerTournamentWithMatches = Tournament & {
  matches: TournamentMatch[];
  teams: TournamentTeamDetail[];
};

export type OrganizerDashboardViewState =
  | { status: 'loading' }
  | { status: 'loaded'; tournaments: OrganizerTournamentWithMatches[] }
  | { status: 'error' };

export type OrganizerDashboardState = {
  tournaments: EntityState<Tournament>;
  matches: EntityState<TournamentMatch>;
  teams: EntityState<TournamentTeamDetail>;
  status: OrganizerDashboardViewState['status'];
  pendingAction: string;
  errorMessage: string;
};

export const organizerTournamentAdapter = createEntityAdapter<Tournament>({
  sortComparer: (first, second) =>
    new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime()
    || first.name.localeCompare(second.name),
});

export const organizerMatchAdapter = createEntityAdapter<TournamentMatch>({
  sortComparer: (first, second) =>
    first.round - second.round
    || first.bracketPosition - second.bracketPosition,
});

export const organizerTeamAdapter = createEntityAdapter<TournamentTeamDetail>({
  sortComparer: (first, second) => first.name.localeCompare(second.name),
});

export const initialOrganizerDashboardState: OrganizerDashboardState = {
  tournaments: organizerTournamentAdapter.getInitialState(),
  matches: organizerMatchAdapter.getInitialState(),
  teams: organizerTeamAdapter.getInitialState(),
  status: 'loading',
  pendingAction: '',
  errorMessage: '',
};

export const organizerDashboardReducer = createReducer(
  initialOrganizerDashboardState,
  on(OrganizerDashboardActions.load, (state) => ({
    ...state,
    status: 'loading',
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.loadSucceeded, (state, { tournaments }) => ({
    ...state,
    tournaments: organizerTournamentAdapter.setAll(tournaments.map(toTournament), state.tournaments),
    matches: organizerMatchAdapter.setAll(tournaments.flatMap((tournament) => tournament.matches), state.matches),
    teams: organizerTeamAdapter.setAll(tournaments.flatMap((tournament) => tournament.teams), state.teams),
    status: 'loaded',
    pendingAction: '',
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.loadFailed, (state) => ({
    ...state,
    status: 'error',
    pendingAction: '',
    errorMessage: 'Turniri trenutno nisu dostupni.',
  })),
  on(OrganizerDashboardActions.createTournament, (state) => ({
    ...state,
    pendingAction: 'create',
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.createTournamentSucceeded, (state, { tournament }) => ({
    ...state,
    tournaments: organizerTournamentAdapter.upsertOne(tournament, state.tournaments),
    pendingAction: '',
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.updateTournament, (state, { id }) => ({
    ...state,
    pendingAction: `update:${id}`,
    errorMessage: '',
  })),
  on(
    OrganizerDashboardActions.updateTournamentSucceeded,
    OrganizerDashboardActions.setSignupStatusSucceeded,
    OrganizerDashboardActions.startTournamentSucceeded,
    OrganizerDashboardActions.cancelTournamentSucceeded,
    (state, { tournament }) => ({
      ...state,
      tournaments: organizerTournamentAdapter.upsertOne(tournament, state.tournaments),
      pendingAction: '',
      errorMessage: '',
    }),
  ),
  on(OrganizerDashboardActions.setSignupStatus, (state, { id, action }) => ({
    ...state,
    pendingAction: `${action}:${id}`,
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.generateBracket, (state, { id }) => ({
    ...state,
    pendingAction: `bracket:${id}`,
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.generateBracketSucceeded, (state, { matches }) => ({
    ...state,
    matches: organizerMatchAdapter.upsertMany(matches, state.matches),
    pendingAction: '',
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.startTournament, (state, { id }) => ({
    ...state,
    pendingAction: `start:${id}`,
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.cancelTournament, (state, { id }) => ({
    ...state,
    pendingAction: `cancel:${id}`,
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.scheduleMatch, (state, { id }) => ({
    ...state,
    pendingAction: `schedule:${id}`,
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.scheduleMatchSucceeded, (state, { match }) => ({
    ...state,
    matches: organizerMatchAdapter.upsertOne(match, state.matches),
    pendingAction: '',
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.commandFailed, (state, { errorMessage }) => ({
    ...state,
    pendingAction: '',
    errorMessage,
  })),
);

function toTournament(tournamentWithMatches: OrganizerTournamentWithMatches): Tournament {
  const { matches, teams, ...tournament } = tournamentWithMatches;

  return tournament;
}
