import { createReducer, on } from '@ngrx/store';

import type { TeamDetail, TeamInvite } from '../teams-api.service';
import { PlayerTeamsActions } from './player-teams.actions';

export const playerTeamsFeatureKey = 'playerTeams';
const inactiveTournamentStatuses = new Set(['COMPLETED', 'CANCELLED']);

export type MyTeamViewState =
  | { status: 'loading' }
  | { status: 'loaded'; teams: TeamDetail[]; invites: TeamInvite[] }
  | { status: 'error' };

export type PlayerTeamsState = {
  view: MyTeamViewState;
};

export const initialPlayerTeamsState: PlayerTeamsState = {
  view: { status: 'loading' },
};

export const playerTeamsReducer = createReducer(
  initialPlayerTeamsState,
  on(PlayerTeamsActions.loadPage, (state) => ({
    ...state,
    view: { status: 'loading' },
  })),
  on(PlayerTeamsActions.loadPageSucceeded, (state, { teams, invites }) => ({
    ...state,
    view: { status: 'loaded', teams, invites },
  })),
  on(PlayerTeamsActions.loadPageFailed, (state) => ({
    ...state,
    view: { status: 'error' },
  })),
  on(PlayerTeamsActions.reloadInvitesSucceeded, (state, { invites }) =>
    state.view.status === 'loaded' ? { ...state, view: { ...state.view, invites } } : state,
  ),
  on(PlayerTeamsActions.teamUpserted, (state, { team }) => upsertTeam(state, team)),
  on(PlayerTeamsActions.teamRemoved, (state, { teamId }) => removeTeam(state, teamId)),
  on(PlayerTeamsActions.inviteRemoved, (state, { inviteId }) =>
    state.view.status === 'loaded'
      ? { ...state, view: { ...state.view, invites: state.view.invites.filter((invite) => invite.id !== inviteId) } }
      : state,
  ),
  on(PlayerTeamsActions.liveMessageReceived, (state, { message, currentUserId }) => {
    if (message.type === 'team.removed') {
      return removeTeam(state, message.data.teamId);
    }

    if (!currentUserId || !message.data.team.members.some((member) => member.userId === currentUserId)) {
      return removeTeam(state, message.data.team.id);
    }

    return upsertTeam(state, message.data.team);
  }),
);

function upsertTeam(state: PlayerTeamsState, team: TeamDetail): PlayerTeamsState {
  if (state.view.status !== 'loaded') {
    return state;
  }

  const existingTeam = state.view.teams.find((currentTeam) => currentTeam.id === team.id);
  const nextTeam = { ...team, tournament: team.tournament ?? existingTeam?.tournament };

  if (nextTeam.tournament && inactiveTournamentStatuses.has(nextTeam.tournament.status)) {
    return removeTeam(state, nextTeam.id);
  }

  const teams = existingTeam
    ? state.view.teams.map((currentTeam) => currentTeam.id === team.id ? nextTeam : currentTeam)
    : [...state.view.teams, nextTeam];

  return { ...state, view: { ...state.view, teams } };
}

function removeTeam(state: PlayerTeamsState, teamId: string): PlayerTeamsState {
  return state.view.status === 'loaded'
    ? { ...state, view: { ...state.view, teams: state.view.teams.filter((team) => team.id !== teamId) } }
    : state;
}
