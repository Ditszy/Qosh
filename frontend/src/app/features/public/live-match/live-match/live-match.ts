import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, filter, map, of, scan, startWith, switchMap } from 'rxjs';

import type { MatchEvent, MatchEventType, MatchLiveStreamMessage, MatchReadBundle } from '../match.models';
import type { MatchStatistics, StatisticLine, StatisticTotals } from '../../../statistics';
import { MatchesApiService } from '../matches-api.service';

type LiveMatchState =
  | { status: 'loading' }
  | { status: 'loaded'; bundle: MatchReadBundle }
  | { status: 'error' };
type MatchPanel = 'events' | 'boxScore' | 'report';

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

@Component({
  selector: 'app-live-match',
  imports: [AsyncPipe, DatePipe, RouterLink],
  templateUrl: './live-match.html',
  styleUrl: './live-match.scss',
})
export class LiveMatch {
  private readonly route = inject(ActivatedRoute);
  private readonly matchesApi = inject(MatchesApiService);

  protected readonly activePanel = 'events' as MatchPanel;
  protected selectedPanel: MatchPanel = this.activePanel;
  protected readonly state$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id): id is string => Boolean(id)),
    switchMap((id) =>
      this.matchesApi.getMatchReadBundle(id).pipe(
        switchMap((bundle) =>
          this.matchesApi.watchLiveMatch(id).pipe(
            scan((current, message) => mergeLiveBundle(current, message), bundle),
            startWith(bundle),
          ),
        ),
        map((bundle) => ({ status: 'loaded', bundle }) satisfies LiveMatchState),
        startWith({ status: 'loading' } satisfies LiveMatchState),
        catchError(() => of({ status: 'error' } satisfies LiveMatchState)),
      ),
    ),
  );

  protected teamName(team: MatchReadBundle['match']['teamA']): string {
    return team?.name ?? 'TBD';
  }

  protected clockTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  protected eventClockTime(seconds: number | null): string {
    return seconds === null ? '--:--' : this.clockTime(seconds);
  }

  protected selectPanel(panel: MatchPanel): void {
    this.selectedPanel = panel;
  }
}

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
