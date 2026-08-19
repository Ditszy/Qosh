import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

import type { MatchDetail } from '../match.models';

export type MatchCardVariant = 'live' | 'scheduled';

@Component({
  selector: 'app-match-card',
  imports: [DatePipe],
  templateUrl: './match-card.html',
  styleUrl: './match-card.scss',
})
export class MatchCard {
  readonly match = input.required<MatchDetail>();
  readonly variant = input<MatchCardVariant>('scheduled');
  readonly matchSelected = output<string>();

  protected readonly statusLabel = computed(() => (this.variant() === 'live' ? 'Live' : 'Zakazano'));
  protected readonly isLive = computed(() => this.variant() === 'live');
  protected readonly teamAName = computed(() => this.match().teamA?.name ?? 'TBD');
  protected readonly teamBName = computed(() => this.match().teamB?.name ?? 'TBD');
  protected readonly clockLabel = computed(() => {
    const remainingSeconds = this.match().clockRemainingSeconds;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  });

  protected openMatch(event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    this.matchSelected.emit(this.match().id);
  }
}
