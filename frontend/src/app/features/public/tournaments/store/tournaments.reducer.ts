import { createReducer, on } from '@ngrx/store';

import type {
  PaginatedTournaments,
  Tournament,
  TournamentListQuery,
  TournamentLiveMessage,
  TournamentMatch,
  TournamentTeamDetail,
} from '../tournament.models';
import { TournamentsActions } from './tournaments.actions';

export const tournamentsFeatureKey = 'tournaments';

export type TournamentListViewState =
  | { status: 'loading' }
  | { status: 'loaded'; page: PaginatedTournaments }
  | { status: 'error' };

export type TournamentDetailViewState =
  | { status: 'loading' }
  | { status: 'loaded'; tournament: Tournament; teams: TournamentTeamDetail[]; matches: TournamentMatch[] }
  | { status: 'error' };

export type TournamentsState = {
  listQuery: TournamentListQuery;
  listView: TournamentListViewState;
  selectedTournamentId: string | null;
  detailView: TournamentDetailViewState;
};

export const initialTournamentsState: TournamentsState = {
  listQuery: { page: 1, pageSize: 9, sortBy: 'startsAt', sortDirection: 'asc' },
  listView: { status: 'loading' },
  selectedTournamentId: null,
  detailView: { status: 'loading' },
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
  on(TournamentsActions.loadDetail, (state, { tournamentId }) => ({
    ...state,
    selectedTournamentId: tournamentId,
    detailView: { status: 'loading' },
  })),
  on(TournamentsActions.loadDetailSucceeded, (state, { tournamentId, tournament, teams, matches }) => ({
    ...state,
    selectedTournamentId: tournamentId,
    detailView: { status: 'loaded', tournament, teams, matches },
  })),
  on(TournamentsActions.loadDetailFailed, (state, { tournamentId }) => ({
    ...state,
    selectedTournamentId: tournamentId,
    detailView: { status: 'error' },
  })),
  on(TournamentsActions.detailLiveMessageReceived, (state, { tournamentId, message }) => {
    if (state.selectedTournamentId !== tournamentId || state.detailView.status !== 'loaded') {
      return state;
    }

    return {
      ...state,
      detailView: applyLiveMessage(state.detailView, message),
    };
  }),
);

function applyLiveMessage(
  state: Extract<TournamentDetailViewState, { status: 'loaded' }>,
  message: TournamentLiveMessage,
): Extract<TournamentDetailViewState, { status: 'loaded' }> {
  if (message.type === 'tournament.status.changed') {
    return {
      ...state,
      tournament: {
        ...message.data.tournament,
        organizer: message.data.tournament.organizer ?? state.tournament.organizer,
      },
    };
  }

  if (message.type === 'tournament.bracket.generated') {
    return { ...state, matches: message.data.matches };
  }

  if (message.type === 'tournament.match.scheduled') {
    return { ...state, matches: replaceMatch(state.matches, message.data.match) };
  }

  if (message.type === 'tournament.team.created' || message.type === 'tournament.roster.updated') {
    return { ...state, teams: replaceTeam(state.teams, message.data.team) };
  }

  if (message.type === 'tournament.team.removed') {
    return { ...state, teams: state.teams.filter((team) => team.id !== message.data.teamId) };
  }

  return state;
}

function replaceTeam(
  teams: TournamentTeamDetail[],
  updatedTeam: TournamentTeamDetail,
): TournamentTeamDetail[] {
  const hasTeam = teams.some((team) => team.id === updatedTeam.id);
  const nextTeams = hasTeam
    ? teams.map((team) => (team.id === updatedTeam.id ? updatedTeam : team))
    : [...teams, updatedTeam];

  return nextTeams.sort((first, second) => first.name.localeCompare(second.name));
}

function replaceMatch(matches: TournamentMatch[], updatedMatch: TournamentMatch): TournamentMatch[] {
  const hasMatch = matches.some((match) => match.id === updatedMatch.id);
  const nextMatches = hasMatch
    ? matches.map((match) => (match.id === updatedMatch.id ? updatedMatch : match))
    : [...matches, updatedMatch];

  return nextMatches
    .sort((first, second) => first.round - second.round || first.bracketPosition - second.bracketPosition);
}
