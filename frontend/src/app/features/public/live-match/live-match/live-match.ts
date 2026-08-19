import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs';

import type { MatchEvent, MatchEventType, MatchReadBundle } from '../match.models';
import type { MatchClockStatus, MatchStatus } from '../../tournaments/tournament.models';
import { LiveMatchActions, selectLiveMatchView } from '../store';

type MatchPanel = 'events' | 'boxScore' | 'report';
type BoxScoreSummary = {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  fouls: number;
};

const matchStatusLabels: Record<MatchStatus, string> = {
  SCHEDULED: 'Zakazan',
  LIVE: 'U toku',
  FINAL: 'Završen',
};
const matchClockStatusLabels: Record<MatchClockStatus, string> = {
  NOT_STARTED: 'Nije počeo',
  RUNNING: 'U toku',
  PAUSED: 'Pauza',
  ENDED: 'Završeno',
};
const matchEventTypeLabels: Record<MatchEventType, string> = {
  ONE_POINT_MADE: 'Pogođen jedan poen',
  ONE_POINT_MISSED: 'Promašen jedan poen',
  TWO_POINT_MADE: 'Pogođena dvojka',
  TWO_POINT_MISSED: 'Promašena dvojka',
  FREE_THROW_MADE: 'Pogođeno slobodno bacanje',
  FREE_THROW_MISSED: 'Promašeno slobodno bacanje',
  REBOUND: 'Skok',
  ASSIST: 'Asistencija',
  STEAL: 'Ukradena lopta',
  BLOCK: 'Blokada',
  TURNOVER: 'Izgubljena lopta',
  FOUL: 'Faul',
};

@Component({
  selector: 'app-live-match',
  imports: [AsyncPipe, DatePipe, RouterLink],
  templateUrl: './live-match.html',
  styleUrl: './live-match.scss',
})
export class LiveMatch {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly activePanel = 'events' as MatchPanel;
  protected selectedPanel: MatchPanel = this.activePanel;
  protected readonly state$ = this.store.select(selectLiveMatchView);

  constructor() {
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      filter((id): id is string => Boolean(id)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((matchId) => this.store.dispatch(LiveMatchActions.load({ matchId })));
  }

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

  protected eventTypeLabel(type: MatchEventType): string {
    return matchEventTypeLabels[type];
  }

  protected matchStatusLabel(status: MatchStatus): string {
    return matchStatusLabels[status];
  }

  protected clockStatusLabel(status: MatchClockStatus): string {
    return matchClockStatusLabels[status];
  }

  protected orderedEvents(events: MatchEvent[]): MatchEvent[] {
    return [...events].sort((a, b) => {
      const occurredDiff = Date.parse(b.occurredAt) - Date.parse(a.occurredAt);

      return occurredDiff || Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }

  protected boxScoreSummary(statistics: MatchReadBundle['statistics']): BoxScoreSummary {
    return statistics.teams.reduce<BoxScoreSummary>(
      (summary, team) => ({
        points: summary.points + team.totals.points,
        rebounds: summary.rebounds + team.totals.rebounds,
        assists: summary.assists + team.totals.assists,
        steals: summary.steals + team.totals.steals,
        fouls: summary.fouls + team.totals.fouls,
      }),
      { points: 0, rebounds: 0, assists: 0, steals: 0, fouls: 0 },
    );
  }

  protected selectPanel(panel: MatchPanel): void {
    this.selectedPanel = panel;
  }
}
