import { createReducer, on } from '@ngrx/store';

import type { MatchEvent, MatchEventType, MatchLiveStreamMessage, MatchReadBundle } from '../match.models';
import type { MatchStatistics, StatisticLine, StatisticTotals } from '../../../statistics';
import { LiveMatchActions } from './live-match.actions';

export const liveMatchFeatureKey = 'liveMatch';

export type LiveMatchViewState =
  | { status: 'loading' }
  | { status: 'loaded'; bundle: MatchReadBundle }
  | { status: 'error' };

export type LiveMatchState = {
  selectedMatchId: string | null;
  view: LiveMatchViewState;
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

export const initialLiveMatchState: LiveMatchState = {
  selectedMatchId: null,
  view: { status: 'loading' },
};

export const liveMatchReducer = createReducer(
  initialLiveMatchState,
  on(LiveMatchActions.load, (state, { matchId }) => ({
    ...state,
    selectedMatchId: matchId,
    view: { status: 'loading' },
  })),
  on(LiveMatchActions.loadSucceeded, (state, { matchId, bundle }) => ({
    ...state,
    selectedMatchId: matchId,
    view: { status: 'loaded', bundle },
  })),
  on(LiveMatchActions.loadFailed, (state, { matchId }) => ({
    ...state,
    selectedMatchId: matchId,
    view: { status: 'error' },
  })),
  on(LiveMatchActions.liveMessageReceived, (state, { matchId, message }) => {
    if (state.selectedMatchId !== matchId || state.view.status !== 'loaded') {
      return state;
    }

    return {
      ...state,
      view: {
        status: 'loaded',
        bundle: mergeLiveBundle(state.view.bundle, message),
      },
    };
  }),
);

function mergeLiveBundle(bundle: MatchReadBundle, message: MatchLiveStreamMessage): MatchReadBundle {
  switch (message.type) {
    case 'match.snapshot':
      return {
        ...bundle,
        match: message.data.match,
        events: message.data.events,
      };
    case 'match.clock':
      return {
        ...bundle,
        match: {
          ...bundle.match,
          status: message.data.status,
          clockStatus: message.data.clockStatus,
          clockDurationSeconds: message.data.clockDurationSeconds,
          clockRemainingSeconds: message.data.clockRemainingSeconds,
          clockLastStartedAt: message.data.clockLastStartedAt,
          updatedAt: message.data.updatedAt,
        },
      };
    case 'match.score':
      return {
        ...bundle,
        match: {
          ...bundle.match,
          teamAScore: message.data.teamAScore,
          teamBScore: message.data.teamBScore,
          updatedAt: message.data.updatedAt,
        },
      };
    case 'match.event.created':
      return {
        ...bundle,
        events: [message.data.event, ...bundle.events],
        statistics: applyEventToStatistics(bundle.statistics, message.data.event),
      };
    case 'match.report.created':
      return {
        ...bundle,
        refereeReport: message.data.report,
      };
    case 'match.finalized':
      return {
        ...mergeLiveBundle(bundle, { ...message, type: 'match.score' }),
        match: {
          ...bundle.match,
          status: message.data.status,
          winnerTeamId: message.data.winnerTeamId,
          clockStatus: message.data.clockStatus,
          clockRemainingSeconds: message.data.clockRemainingSeconds,
          clockLastStartedAt: message.data.clockLastStartedAt,
          teamAScore: message.data.teamAScore,
          teamBScore: message.data.teamBScore,
          updatedAt: message.data.updatedAt,
        },
      };
    default:
      return bundle;
  }
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
