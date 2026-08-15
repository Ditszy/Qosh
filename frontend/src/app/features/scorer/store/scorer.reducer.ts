import { createReducer, on } from '@ngrx/store';

import type { MatchDetail, MatchEvent, MatchEventType, MatchReadBundle } from '../../public/live-match/match.models';
import type { MatchStatistics, StatisticLine, StatisticTotals } from '../../statistics';
import { ScorerActions } from './scorer.actions';

export const scorerFeatureKey = 'scorer';

export type ScorerState = {
  assignedMatches: MatchDetail[];
  assignedMatchesLoading: boolean;
  selectedMatchId: string | null;
  selectedBundle: MatchReadBundle | null;
  selectedMatchLoading: boolean;
  error: string;
};

const statCounters: (keyof StatisticTotals)[] = [
  'points',
  'onePointMade',
  'onePointAttempted',
  'twoPointMade',
  'twoPointAttempted',
  'freeThrowMade',
  'freeThrowAttempted',
  'rebounds',
  'assists',
  'steals',
  'blocks',
  'turnovers',
  'fouls',
];

const eventDeltas: Record<MatchEventType, Partial<StatisticTotals>> = {
  ONE_POINT_MADE: { points: 1, onePointMade: 1, onePointAttempted: 1 },
  ONE_POINT_MISSED: { onePointAttempted: 1 },
  TWO_POINT_MADE: { points: 2, twoPointMade: 1, twoPointAttempted: 1 },
  TWO_POINT_MISSED: { twoPointAttempted: 1 },
  FREE_THROW_MADE: { points: 1, freeThrowMade: 1, freeThrowAttempted: 1 },
  FREE_THROW_MISSED: { freeThrowAttempted: 1 },
  REBOUND: { rebounds: 1 },
  ASSIST: { assists: 1 },
  STEAL: { steals: 1 },
  BLOCK: { blocks: 1 },
  TURNOVER: { turnovers: 1 },
  FOUL: { fouls: 1 },
};

export const initialScorerState: ScorerState = {
  assignedMatches: [],
  assignedMatchesLoading: false,
  selectedMatchId: null,
  selectedBundle: null,
  selectedMatchLoading: false,
  error: '',
};

export const scorerReducer = createReducer(
  initialScorerState,
  on(ScorerActions.loadAssignedMatches, (state) => ({
    ...state,
    assignedMatchesLoading: true,
    error: '',
  })),
  on(ScorerActions.loadAssignedMatchesSucceeded, (state, { matches }) => ({
    ...state,
    assignedMatches: matches,
    assignedMatchesLoading: false,
    error: '',
  })),
  on(ScorerActions.loadAssignedMatchesFailed, (state, { error }) => ({
    ...state,
    assignedMatchesLoading: false,
    error,
  })),
  on(ScorerActions.loadMatch, (state, { matchId }) => ({
    ...state,
    selectedMatchId: matchId,
    selectedBundle: null,
    selectedMatchLoading: true,
    error: '',
  })),
  on(ScorerActions.loadMatchSucceeded, (state, { matchId, bundle }) => ({
    ...state,
    selectedMatchId: matchId,
    selectedBundle: bundle,
    selectedMatchLoading: false,
    error: '',
  })),
  on(ScorerActions.loadMatchFailed, (state, { matchId, error }) => ({
    ...state,
    selectedMatchId: matchId,
    selectedMatchLoading: false,
    error,
  })),
  on(ScorerActions.matchUpdated, (state, { match }) => {
    if (!state.selectedBundle || state.selectedBundle.match.id !== match.id) {
      return state;
    }

    return {
      ...state,
      selectedBundle: { ...state.selectedBundle, match },
    };
  }),
  on(ScorerActions.eventRecorded, (state, { event }) => {
    if (!state.selectedBundle || state.selectedBundle.match.id !== event.matchId) {
      return state;
    }

    return {
      ...state,
      selectedBundle: {
        ...state.selectedBundle,
        match: applyScore(state.selectedBundle.match, event),
        events: [event, ...state.selectedBundle.events],
        statistics: applyEventToStatistics(state.selectedBundle.statistics, event),
      },
    };
  }),
);

function applyScore(match: MatchDetail, event: MatchEvent): MatchDetail {
  const points = eventDeltas[event.type].points ?? 0;

  if (!points) {
    return match;
  }

  return event.teamId === match.teamAId
    ? { ...match, teamAScore: match.teamAScore + points }
    : { ...match, teamBScore: match.teamBScore + points };
}

function applyEventToStatistics(statistics: MatchStatistics, event: MatchEvent): MatchStatistics {
  if (!event.playerId) {
    return statistics;
  }

  const delta = statDeltaForEvent(event.type);

  return {
    ...statistics,
    teams: statistics.teams.map((team) => {
      if (team.team.id !== event.teamId || !team.players.some((stat) => stat.player.id === event.playerId)) {
        return team;
      }

      return {
        ...team,
        players: team.players.map((stat) => stat.player.id === event.playerId ? addDeltaToLine(stat, delta) : stat),
        totals: addDeltaToLine(team.totals, delta),
      };
    }),
  };
}

function addDeltaToLine<T extends StatisticLine>(line: T, delta: StatisticTotals): T {
  const totals = Object.fromEntries(
    statCounters.map((field) => [field, line[field] + delta[field]]),
  ) as StatisticTotals;

  return {
    ...line,
    ...totals,
    onePointPercentage: percentage(totals.onePointMade, totals.onePointAttempted),
    twoPointPercentage: percentage(totals.twoPointMade, totals.twoPointAttempted),
    freeThrowPercentage: percentage(totals.freeThrowMade, totals.freeThrowAttempted),
  };
}

function percentage(made: number, attempted: number): number | null {
  return attempted === 0 ? null : Number(((made / attempted) * 100).toFixed(1));
}

function statDeltaForEvent(type: MatchEventType): StatisticTotals {
  return Object.fromEntries(
    statCounters.map((field) => [field, eventDeltas[type][field] ?? 0]),
  ) as StatisticTotals;
}
