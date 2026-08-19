import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

import type { Tournament, TournamentStatus } from '../tournament.models';

const statusLabels: Record<TournamentStatus, string> = {
  DRAFT: 'U pripremi',
  SIGNUPS_OPEN: 'Prijave otvorene',
  SIGNUPS_LOCKED: 'Prijave zakljucane',
  IN_PROGRESS: 'U toku',
  COMPLETED: 'Zavrsen',
  CANCELLED: 'Otkazan',
};

@Component({
  selector: 'app-tournament-card',
  imports: [DatePipe],
  templateUrl: './tournament-card.html',
  styleUrl: './tournament-card.scss',
})
export class TournamentCard {
  readonly tournament = input.required<Tournament>();
  readonly viewRequested = output<string>();

  protected readonly statusLabel = computed(() => statusLabels[this.tournament().status]);

  protected openTournament(event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    this.viewRequested.emit(this.tournament().id);
  }
}
