import { createReducer, on } from '@ngrx/store';

import type { Tournament, TournamentMatch, TournamentTeamDetail } from '../../public/tournaments/tournament.models';
import type {
  ManagedTournamentPage,
  ManagedTournamentSummary,
  OrganizerCommandCenterData,
} from '../organizer-tournaments-api.service';
import { OrganizerDashboardActions } from './organizer-dashboard.actions';

export const organizerDashboardFeatureKey = 'organizerDashboard';

export type OrganizerTournamentWithMatches = ManagedTournamentSummary & {
  matches: TournamentMatch[];
  teams: TournamentTeamDetail[];
  detailsLoaded: boolean;
};

export type OrganizerDashboardViewState =
  | { status: 'loading'; commandCenter: OrganizerCommandCenterData | null }
  | { status: 'loaded'; commandCenter: OrganizerCommandCenterData | null; tournaments: OrganizerTournamentWithMatches[] }
  | { status: 'error'; commandCenter: OrganizerCommandCenterData | null };

export type OrganizerDashboardState = {
  page: ManagedTournamentPage | null;
  pageQuery: { page: number; pageSize: number; view: 'active' | 'history' };
  commandCenter: OrganizerCommandCenterData | null;
  commandCenterStatus: 'idle' | 'loading' | 'loaded' | 'error';
  selectedTournamentId: string | null;
  selectedTournamentSummary: ManagedTournamentSummary | null;
  selectedMatches: TournamentMatch[];
  selectedTeams: TournamentTeamDetail[];
  selectedDetailsStatus: 'idle' | 'loading' | 'loaded' | 'error';
  status: 'loading' | 'loaded' | 'error';
  pendingAction: string;
  errorMessage: string;
};

const defaultPageQuery: OrganizerDashboardState['pageQuery'] = { page: 1, pageSize: 12, view: 'active' };

export const initialOrganizerDashboardState: OrganizerDashboardState = {
  page: null,
  pageQuery: defaultPageQuery,
  commandCenter: null,
  commandCenterStatus: 'idle',
  selectedTournamentId: null,
  selectedTournamentSummary: null,
  selectedMatches: [],
  selectedTeams: [],
  selectedDetailsStatus: 'idle',
  status: 'loading',
  pendingAction: '',
  errorMessage: '',
};

export const organizerDashboardReducer = createReducer(
  initialOrganizerDashboardState,
  on(OrganizerDashboardActions.load, (state) => ({
    ...state,
    status: 'loading',
    commandCenterStatus: 'loading',
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.loadSucceeded, (state, { page, commandCenter }) => ({
    ...state,
    page,
    commandCenter,
    pageQuery: { page: page.page, pageSize: page.pageSize, view: state.pageQuery.view },
    commandCenterStatus: 'loaded',
    selectedTournamentId: null,
    selectedTournamentSummary: null,
    selectedMatches: [],
    selectedTeams: [],
    selectedDetailsStatus: 'idle',
    status: 'loaded',
    pendingAction: '',
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.loadFailed, (state) => ({
    ...state,
    status: 'error',
    commandCenterStatus: 'error',
    pendingAction: '',
    errorMessage: 'Turniri trenutno nisu dostupni.',
  })),
  on(OrganizerDashboardActions.loadPage, (state, { page, view }) => ({
    ...state,
    pageQuery: { page, pageSize: state.pageQuery.pageSize, view: view ?? state.pageQuery.view },
    status: 'loading',
    selectedTournamentId: null,
    selectedTournamentSummary: null,
    selectedMatches: [],
    selectedTeams: [],
    selectedDetailsStatus: 'idle',
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.loadPageSucceeded, (state, { page }) => ({
    ...state,
    page,
    pageQuery: { ...state.pageQuery, page: page.page, pageSize: page.pageSize },
    status: 'loaded',
  })),
  on(OrganizerDashboardActions.loadPageFailed, (state) => ({
    ...state,
    status: 'error',
    errorMessage: 'Turniri trenutno nisu dostupni.',
  })),
  on(OrganizerDashboardActions.loadCommandCenter, (state) => ({ ...state, commandCenterStatus: 'loading' })),
  on(OrganizerDashboardActions.loadCommandCenterSucceeded, (state, { commandCenter }) => ({
    ...state,
    commandCenter,
    commandCenterStatus: 'loaded',
  })),
  on(OrganizerDashboardActions.loadCommandCenterFailed, (state) => ({ ...state, commandCenterStatus: 'error' })),
  on(OrganizerDashboardActions.loadTournamentDetails, (state, { tournamentId, tournament }) => ({
    ...state,
    selectedTournamentId: tournamentId,
    selectedTournamentSummary: tournament ?? findSummary(state.page, tournamentId) ?? state.selectedTournamentSummary,
    selectedMatches: [],
    selectedTeams: [],
    selectedDetailsStatus: 'loading',
  })),
  on(OrganizerDashboardActions.loadTournamentDetailsSucceeded, (state, { tournamentId, matches, teams }) => ({
    ...state,
    selectedTournamentId: tournamentId,
    selectedMatches: matches,
    selectedTeams: teams,
    selectedDetailsStatus: 'loaded',
  })),
  on(OrganizerDashboardActions.loadTournamentDetailsFailed, (state) => ({
    ...state,
    selectedDetailsStatus: 'error',
    errorMessage: 'Detalji turnira trenutno nisu dostupni.',
  })),
  on(OrganizerDashboardActions.createTournament, (state) => ({ ...state, pendingAction: 'create', errorMessage: '' })),
  on(OrganizerDashboardActions.createTournamentSucceeded, (state, { tournament }) => ({
    ...state,
    page: state.page ? addCreatedTournament(state.page, toManagedSummary(tournament)) : state.page,
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
      page: updateTournamentSummary(state.page, toManagedSummary(tournament), state.pageQuery.view),
      selectedTournamentSummary: state.selectedTournamentId === tournament.id
        ? isSummaryInView(tournament, state.pageQuery.view)
          ? mergeSummary(state.selectedTournamentSummary, toManagedSummary(tournament))
          : null
        : state.selectedTournamentSummary,
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
  on(OrganizerDashboardActions.generateBracketSucceeded, (state, { tournamentId, matches }) => ({
    ...state,
    page: updateMatchCount(state.page, tournamentId, matches.length),
    selectedMatches: state.selectedTournamentId === tournamentId ? matches : state.selectedMatches,
    selectedDetailsStatus: state.selectedTournamentId === tournamentId ? 'loaded' : state.selectedDetailsStatus,
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
    selectedMatches: state.selectedMatches.map((item) => item.id === match.id ? match : item),
    pendingAction: '',
    errorMessage: '',
  })),
  on(OrganizerDashboardActions.commandFailed, (state, { errorMessage }) => ({
    ...state,
    pendingAction: '',
    errorMessage,
  })),
);

function toManagedSummary(tournament: Tournament): ManagedTournamentSummary {
  return {
    ...tournament,
    teamCount: 0,
    matchCount: 0,
    scheduledMatchCount: 0,
    liveMatchCount: 0,
    finalMatchCount: 0,
    unscheduledActiveMatchCount: 0,
    missingOfficialsActiveMatchCount: 0,
  };
}

function addCreatedTournament(page: ManagedTournamentPage, tournament: ManagedTournamentSummary): ManagedTournamentPage {
  if (tournament.status === 'COMPLETED' || tournament.status === 'CANCELLED' || page.page !== 1) {
    return page;
  }

  return {
    ...page,
    items: [tournament, ...page.items].slice(0, page.pageSize),
    total: page.total + 1,
    totalPages: Math.max(1, Math.ceil((page.total + 1) / page.pageSize)),
  };
}

function updateTournamentSummary(
  page: ManagedTournamentPage | null,
  tournament: ManagedTournamentSummary,
  view: OrganizerDashboardState['pageQuery']['view'],
): ManagedTournamentPage | null {
  if (!page) {
    return page;
  }

  const shouldShow = isSummaryInView(tournament, view);
  const exists = page.items.some((item) => item.id === tournament.id);

  if (!shouldShow) {
    return exists
      ? { ...page, items: page.items.filter((item) => item.id !== tournament.id), total: Math.max(0, page.total - 1) }
      : page;
  }

  return exists
    ? { ...page, items: page.items.map((item) => item.id === tournament.id ? mergeSummary(item, tournament) : item) }
    : page;
}

function isSummaryInView(
  tournament: Pick<ManagedTournamentSummary, 'status'>,
  view: OrganizerDashboardState['pageQuery']['view'],
): boolean {
  return view === 'active'
    ? tournament.status !== 'COMPLETED' && tournament.status !== 'CANCELLED'
    : tournament.status === 'COMPLETED' || tournament.status === 'CANCELLED';
}

function updateMatchCount(page: ManagedTournamentPage | null, tournamentId: string, matchCount: number): ManagedTournamentPage | null {
  return page
    ? { ...page, items: page.items.map((item) => item.id === tournamentId ? { ...item, matchCount } : item) }
    : page;
}

function findSummary(page: ManagedTournamentPage | null, tournamentId: string): ManagedTournamentSummary | null {
  return page?.items.find((item) => item.id === tournamentId) ?? null;
}

function mergeSummary(current: ManagedTournamentSummary | null, next: ManagedTournamentSummary): ManagedTournamentSummary {
  if (!current) {
    return next;
  }

  return {
    ...current,
    ...next,
    teamCount: next.teamCount || current.teamCount,
    matchCount: next.matchCount || current.matchCount,
    scheduledMatchCount: next.scheduledMatchCount || current.scheduledMatchCount,
    liveMatchCount: next.liveMatchCount || current.liveMatchCount,
    finalMatchCount: next.finalMatchCount || current.finalMatchCount,
    unscheduledActiveMatchCount: next.unscheduledActiveMatchCount || current.unscheduledActiveMatchCount,
    missingOfficialsActiveMatchCount: next.missingOfficialsActiveMatchCount || current.missingOfficialsActiveMatchCount,
  };
}
