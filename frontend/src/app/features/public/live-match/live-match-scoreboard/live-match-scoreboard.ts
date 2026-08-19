import { Component, computed, input } from '@angular/core';

import type { MatchDetail } from '../match.models';
import type { MatchClockStatus, MatchStatus } from '../../tournaments/tournament.models';

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

@Component({
  selector: 'app-live-match-scoreboard',
  imports: [],
  templateUrl: './live-match-scoreboard.html',
  styleUrl: './live-match-scoreboard.scss',
})
export class LiveMatchScoreboard {
  readonly match = input.required<MatchDetail>();

  protected readonly teamAName = computed(() => this.match().teamA?.name ?? 'TBD');
  protected readonly teamBName = computed(() => this.match().teamB?.name ?? 'TBD');
  protected readonly matchStatusLabel = computed(() => matchStatusLabels[this.match().status]);
  protected readonly clockStatusLabel = computed(() => matchClockStatusLabels[this.match().clockStatus]);
  protected readonly clockTime = computed(() => {
    const seconds = this.match().clockRemainingSeconds;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  });
}
