import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ScorerMatchApiService } from '../scorer-match-api.service';

type ClockAction = 'start' | 'pause' | 'resume' | 'end';

@Component({
  selector: 'app-scorer-console',
  imports: [FormsModule, RouterLink],
  templateUrl: './scorer-console.html',
  styleUrl: './scorer-console.scss',
})
export class ScorerConsole {
  private readonly scorerApi = inject(ScorerMatchApiService);

  protected readonly matchId = signal('');
  protected readonly pendingAction = signal('');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly liveMatchLink = computed(() => {
    const id = this.matchId().trim();

    return id ? ['/matches', id, 'live'] : null;
  });

  protected updateMatchId(value: string): void {
    this.matchId.set(value);
  }

  protected controlClock(action: ClockAction): void {
    const id = this.matchId().trim();

    if (!id || this.pendingAction()) {
      return;
    }

    const request$ =
      action === 'start'
        ? this.scorerApi.startClock(id)
        : action === 'pause'
          ? this.scorerApi.pauseClock(id)
          : action === 'resume'
            ? this.scorerApi.resumeClock(id)
            : this.scorerApi.endClock(id);

    this.errorMessage.set('');
    this.successMessage.set('');
    this.pendingAction.set(action);
    request$.pipe(finalize(() => this.pendingAction.set(''))).subscribe({
      next: (match) => this.successMessage.set(`Sat: ${match.clockStatus}, preostalo ${match.clockRemainingSeconds}s`),
      error: () => this.errorMessage.set('Kontrola sata nije uspela. Proveri ID meča i dodelu zapisničara.'),
    });
  }
}
