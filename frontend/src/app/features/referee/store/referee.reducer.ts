import { createReducer, on } from '@ngrx/store';

import type { MatchDetail } from '../../public/live-match/match.models';
import type { RefereeAssignedMatch, RefereeReportDetail } from '../referee-reports-api.service';
import { RefereeActions } from './referee.actions';

export const refereeFeatureKey = 'referee';

export type RefereeState = {
  assignedMatches: RefereeAssignedMatch[];
  assignedMatchesLoading: boolean;
  selectedMatchId: string | null;
  selectedMatch: MatchDetail | null;
  selectedMatchLoading: boolean;
  loadedReport: RefereeReportDetail | null;
  reportLoading: boolean;
  reportSubmitting: boolean;
  error: string;
};

export const initialRefereeState: RefereeState = {
  assignedMatches: [],
  assignedMatchesLoading: false,
  selectedMatchId: null,
  selectedMatch: null,
  selectedMatchLoading: false,
  loadedReport: null,
  reportLoading: false,
  reportSubmitting: false,
  error: '',
};

export const refereeReducer = createReducer(
  initialRefereeState,
  on(RefereeActions.loadAssignedMatches, (state) => ({
    ...state,
    assignedMatchesLoading: true,
    error: '',
  })),
  on(RefereeActions.loadAssignedMatchesSucceeded, (state, { matches }) => ({
    ...state,
    assignedMatches: matches.filter((match) => !match.hasReport),
    assignedMatchesLoading: false,
    error: '',
  })),
  on(RefereeActions.loadAssignedMatchesFailed, (state, { error }) => ({
    ...state,
    assignedMatchesLoading: false,
    error,
  })),
  on(RefereeActions.loadSelectedMatch, (state, { matchId }) => ({
    ...state,
    selectedMatchId: matchId,
    selectedMatch: null,
    selectedMatchLoading: true,
    loadedReport: null,
    error: '',
  })),
  on(RefereeActions.loadSelectedMatchSucceeded, (state, { matchId, match }) => ({
    ...state,
    selectedMatchId: matchId,
    selectedMatch: match,
    selectedMatchLoading: false,
    error: '',
  })),
  on(RefereeActions.loadSelectedMatchFailed, (state, { matchId, error }) => ({
    ...state,
    selectedMatchId: matchId,
    selectedMatchLoading: false,
    error,
  })),
  on(RefereeActions.loadExistingReport, (state, { matchId }) => ({
    ...state,
    selectedMatchId: matchId,
    reportLoading: true,
  })),
  on(RefereeActions.loadExistingReportSucceeded, (state, { matchId, report }) => ({
    ...state,
    selectedMatchId: matchId,
    loadedReport: report,
    reportLoading: false,
  })),
  on(RefereeActions.loadExistingReportMissing, (state, { matchId }) => ({
    ...state,
    selectedMatchId: matchId,
    loadedReport: null,
    reportLoading: false,
  })),
  on(RefereeActions.submitReport, (state, { matchId }) => ({
    ...state,
    selectedMatchId: matchId,
    reportSubmitting: true,
    error: '',
  })),
  on(RefereeActions.submitReportSucceeded, (state, { matchId, report }) => ({
    ...state,
    assignedMatches: state.assignedMatches.filter((match) => match.id !== matchId),
    selectedMatchId: matchId,
    loadedReport: report,
    reportSubmitting: false,
    error: '',
  })),
  on(RefereeActions.submitReportFailed, (state, { error }) => ({
    ...state,
    reportSubmitting: false,
    error,
  })),
);
