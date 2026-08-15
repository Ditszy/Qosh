import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs';

import type { MatchEvent, MatchReadBundle } from '../match.models';
import { LiveMatchActions, selectLiveMatchView } from '../store';

type MatchPanel = 'events' | 'boxScore' | 'report';

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

  protected orderedEvents(events: MatchEvent[]): MatchEvent[] {
    return [...events].sort((a, b) => {
      const occurredDiff = Date.parse(b.occurredAt) - Date.parse(a.occurredAt);

      return occurredDiff || Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }

  protected selectPanel(panel: MatchPanel): void {
    this.selectedPanel = panel;
  }
}
