import { Component, computed, input, output } from '@angular/core';

import type { MatchEvent, MatchEventType } from '../../public/live-match/match.models';

@Component({
  selector: 'app-scorer-correction-panel',
  imports: [],
  templateUrl: './scorer-correction-panel.html',
  styleUrl: './scorer-correction-panel.scss',
})
export class ScorerCorrectionPanel {
  readonly events = input<MatchEvent[]>([]);
  readonly canUndo = input(false);
  readonly undoRequested = output<MatchEvent>();

  protected readonly recentEvents = computed(() =>
    [...this.events()]
      .sort((first, second) => Date.parse(second.occurredAt) - Date.parse(first.occurredAt))
      .slice(0, 8),
  );

  protected undoEvent(event: MatchEvent): void {
    this.undoRequested.emit(event);
  }

  protected eventTypeLabel(type: MatchEventType): string {
    return EVENT_TYPE_LABELS[type];
  }

  protected eventClockLabel(event: MatchEvent): string {
    const remainingSeconds = event.clockRemainingSeconds;

    if (remainingSeconds === null) {
      return '--:--';
    }

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

const EVENT_TYPE_LABELS: Record<MatchEventType, string> = {
  ONE_POINT_MADE: '1P pogodak',
  ONE_POINT_MISSED: '1P promašaj',
  TWO_POINT_MADE: '2P pogodak',
  TWO_POINT_MISSED: '2P promašaj',
  FREE_THROW_MADE: 'SB pogodak',
  FREE_THROW_MISSED: 'SB promašaj',
  REBOUND: 'Skok',
  ASSIST: 'Asistencija',
  STEAL: 'Ukradena lopta',
  BLOCK: 'Blokada',
  TURNOVER: 'Izgubljena lopta',
  FOUL: 'Faul',
};
