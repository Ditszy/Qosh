import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs';

import { LiveMatchBoxScore } from '../live-match-box-score/live-match-box-score';
import { LiveMatchScoreboard } from '../live-match-scoreboard/live-match-scoreboard';
import { LiveMatchTabs, type LiveMatchPanel } from '../live-match-tabs/live-match-tabs';
import type { MatchEvent, MatchEventType } from '../match.models';
import { LiveMatchActions, selectLiveMatchView } from '../store';

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
  imports: [AsyncPipe, DatePipe, LiveMatchBoxScore, LiveMatchScoreboard, LiveMatchTabs],
  templateUrl: './live-match.html',
  styleUrl: './live-match.scss',
})
export class LiveMatch {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly activePanel = 'events' as LiveMatchPanel;
  protected selectedPanel: LiveMatchPanel = this.activePanel;
  protected readonly state$ = this.store.select(selectLiveMatchView);

  constructor() {
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      filter((id): id is string => Boolean(id)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((matchId) => this.store.dispatch(LiveMatchActions.load({ matchId })));
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

  protected orderedEvents(events: MatchEvent[]): MatchEvent[] {
    return [...events].sort((a, b) => {
      const occurredDiff = Date.parse(b.occurredAt) - Date.parse(a.occurredAt);

      return occurredDiff || Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }

  protected selectPanel(panel: LiveMatchPanel): void {
    this.selectedPanel = panel;
  }
}
