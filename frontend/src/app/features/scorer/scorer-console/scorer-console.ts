import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ScorerMatchApiService } from '../scorer-match-api.service';
import type { MatchEventType } from '../../public/live-match/match.models';

type ClockAction = 'start' | 'pause' | 'resume' | 'end';

const MATCH_EVENT_TYPES: MatchEventType[] = ['ONE_POINT_MADE', 'ONE_POINT_MISSED', 'TWO_POINT_MADE', 'TWO_POINT_MISSED', 'FREE_THROW_MADE', 'FREE_THROW_MISSED', 'REBOUND', 'ASSIST', 'STEAL', 'BLOCK', 'TURNOVER', 'FOUL'];

@Component({
  selector: 'app-scorer-console',
  imports: [FormsModule, RouterLink],
  templateUrl: './scorer-console.html',
  styleUrl: './scorer-console.scss',
})
export class ScorerConsole {
  private readonly scorerApi = inject(ScorerMatchApiService);

  protected readonly eventTypes = MATCH_EVENT_TYPES;
  protected readonly matchId = signal('');
  protected readonly eventType = signal<MatchEventType>('ONE_POINT_MADE');
  protected readonly eventTeamId = signal('');
  protected readonly eventPlayerId = signal('');
  protected readonly pendingAction = signal('');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly canRecordEvent = computed(() => !!this.matchId().trim() && !!this.eventTeamId().trim() && !this.pendingAction());
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

  protected recordEvent(): void {
    const matchId = this.matchId().trim();
    const teamId = this.eventTeamId().trim();
    const playerId = this.eventPlayerId().trim();

    if (!matchId || !teamId || this.pendingAction()) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.pendingAction.set('event');
    this.scorerApi
      .recordEvent(matchId, {
        type: this.eventType(),
        teamId,
        ...(playerId ? { playerId } : {}),
      })
      .pipe(finalize(() => this.pendingAction.set('')))
      .subscribe({
        next: (event) => this.successMessage.set(`Dogadjaj sacuvan: ${event.type}`),
        error: () => this.errorMessage.set('Unos dogadjaja nije uspeo. Proveri ID meca, tim, igraca i status meca.'),
      });
  }
}
