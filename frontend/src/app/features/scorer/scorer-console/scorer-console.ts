import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { finalize, switchMap } from 'rxjs';

import { ScorerMatchApiService } from '../scorer-match-api.service';
import { MatchesApiService } from '../../public/live-match/matches-api.service';
import type { MatchEventType } from '../../public/live-match/match.models';
import {
  ScorerActions,
  selectAssignedMatches,
  selectAssignedMatchesLoading,
  selectScorerError,
  selectSelectedMatchBundle,
} from '../store';

type ClockAction = 'start' | 'pause' | 'resume' | 'end';
type EventButton = { label: string; title: string; type: MatchEventType };
type ClockDisplay = {
  minutes: string;
  seconds: string;
};

const PLAYER_EVENT_BUTTONS: EventButton[] = [
  { label: '+1P', title: 'Jedan poen pogodak', type: 'ONE_POINT_MADE' },
  { label: '-1P', title: 'Jedan poen promašaj', type: 'ONE_POINT_MISSED' },
  { label: '+2P', title: 'Dva poena pogodak', type: 'TWO_POINT_MADE' },
  { label: '-2P', title: 'Dva poena promašaj', type: 'TWO_POINT_MISSED' },
  { label: '+FT', title: 'Slobodno bacanje pogodak', type: 'FREE_THROW_MADE' },
  { label: '-FT', title: 'Slobodno bacanje promašaj', type: 'FREE_THROW_MISSED' },
  { label: 'Skok', title: 'Skok', type: 'REBOUND' },
  { label: 'Asist', title: 'Asistencija', type: 'ASSIST' },
  { label: 'Ukr', title: 'Ukradena lopta', type: 'STEAL' },
  { label: 'Blok', title: 'Blokada', type: 'BLOCK' },
  { label: 'Izg', title: 'Izgubljena lopta', type: 'TURNOVER' },
  { label: 'Faul', title: 'Lična greška', type: 'FOUL' },
];

@Component({
  selector: 'app-scorer-console',
  imports: [FormsModule, RouterLink],
  templateUrl: './scorer-console.html',
  styleUrl: './scorer-console.scss',
})
export class ScorerConsole implements OnInit, OnDestroy {
  private readonly scorerApi = inject(ScorerMatchApiService);
  private readonly matchesApi = inject(MatchesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private clockIntervalId: number | null = null;

  protected readonly playerEventButtons = PLAYER_EVENT_BUTTONS;
  protected readonly assignedMatches = this.store.selectSignal(selectAssignedMatches);
  protected readonly assignedMatchesLoading = this.store.selectSignal(selectAssignedMatchesLoading);
  protected readonly isConsoleRoute = signal(false);
  protected readonly matchId = signal('');
  protected readonly matchBundle = this.store.selectSignal(selectSelectedMatchBundle);
  protected readonly clockAdjustmentSeconds = signal(1);
  protected readonly pendingAction = signal('');
  protected readonly commandError = signal('');
  protected readonly storeError = this.store.selectSignal(selectScorerError);
  protected readonly errorMessage = computed(() => this.commandError() || this.storeError());
  protected readonly successMessage = signal('');
  protected readonly clockTick = signal(Date.now());
  protected readonly canAdjustClock = computed(() => !!this.matchId().trim() && this.clockAdjustmentSeconds() > 0 && !this.pendingAction());
  protected readonly match = computed(() => this.matchBundle()?.match ?? null);
  protected readonly displayedRemainingSeconds = computed(() => {
    const match = this.match();

    if (!match) {
      return 600;
    }

    if (match.clockStatus !== 'RUNNING' || !match.clockLastStartedAt) {
      return Math.max(0, match.clockRemainingSeconds);
    }

    const elapsedSeconds = Math.floor((this.clockTick() - Date.parse(match.clockLastStartedAt)) / 1000);

    return Math.max(0, match.clockRemainingSeconds - elapsedSeconds);
  });
  protected readonly clockDisplay = computed<ClockDisplay>(() => {
    const remainingSeconds = this.displayedRemainingSeconds();
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  });
  protected readonly clockStatusLabel = computed(() => {
    if (this.match()?.clockStatus === 'RUNNING' && this.displayedRemainingSeconds() === 0) {
      return 'Sat završen';
    }

    switch (this.match()?.clockStatus) {
      case 'RUNNING':
        return 'Sat teče';
      case 'PAUSED':
        return 'Pauza';
      case 'ENDED':
        return 'Sat završen';
      default:
        return 'Nije počelo';
    }
  });
  protected readonly showStartClock = computed(() => {
    const match = this.match();

    return !match || match.clockStatus === 'NOT_STARTED';
  });
  protected readonly canStartClock = computed(() => !!this.matchId().trim() && this.showStartClock() && !this.pendingAction());
  protected readonly canFinalizeMatch = computed(() => {
    const match = this.match();

    return (
      !!match?.teamAId &&
      !!match.teamBId &&
      match.status === 'LIVE' &&
      match.teamAScore !== match.teamBScore &&
      !this.pendingAction()
    );
  });
  protected readonly teamStats = computed(() => this.matchBundle()?.statistics.teams ?? []);
  protected readonly canRecordPlayerEvents = computed(() => this.match()?.status !== 'FINAL' && !this.pendingAction());
  protected readonly liveMatchLink = computed(() => {
    const id = this.matchId().trim();

    return id ? ['/matches', id, 'live'] : null;
  });

  ngOnInit(): void {
    const routeMatchId = this.route.snapshot.paramMap.get('matchId')?.trim() ?? '';

    this.isConsoleRoute.set(!!routeMatchId);
    if (routeMatchId) {
      this.matchId.set(routeMatchId);
      this.loadMatch();
    } else {
      this.loadAssignedMatches();
    }

    this.clockIntervalId = window.setInterval(() => this.clockTick.set(Date.now()), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId !== null) {
      window.clearInterval(this.clockIntervalId);
    }
  }

  protected loadAssignedMatches(): void {
    if (this.assignedMatchesLoading()) {
      return;
    }

    this.commandError.set('');
    this.store.dispatch(ScorerActions.loadAssignedMatches());
  }

  protected updateClockAdjustmentSeconds(value: string | number): void {
    const seconds = Math.max(1, Math.trunc(Number(value) || 0));

    this.clockAdjustmentSeconds.set(seconds);
  }

  protected loadMatch(): void {
    const id = this.matchId().trim();

    if (!id || this.pendingAction()) {
      return;
    }

    this.commandError.set('');
    this.successMessage.set('');
    this.store.dispatch(ScorerActions.loadMatch({ matchId: id }));
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

    this.commandError.set('');
    this.successMessage.set('');
    this.pendingAction.set(action);
    request$.pipe(finalize(() => this.pendingAction.set(''))).subscribe({
      next: (match) => {
        this.store.dispatch(ScorerActions.matchUpdated({ match }));
      },
      error: () => this.commandError.set('Kontrola sata nije uspela. Proveri ID meča i dodelu zapisničara.'),
    });
  }

  protected adjustClock(direction: -1 | 1): void {
    const matchId = this.matchId().trim();
    const secondsDelta = this.clockAdjustmentSeconds() * direction;

    if (!matchId || !secondsDelta || this.pendingAction()) {
      return;
    }

    this.commandError.set('');
    this.successMessage.set('');
    this.pendingAction.set('adjust');
    this.scorerApi
      .adjustClock(matchId, { secondsDelta })
      .pipe(switchMap(() => this.matchesApi.getMatchReadBundle(matchId)))
      .pipe(finalize(() => this.pendingAction.set('')))
      .subscribe({
        next: (bundle) => {
          this.store.dispatch(ScorerActions.loadMatchSucceeded({ matchId, bundle }));
          this.successMessage.set(`Sat pomeren za ${secondsDelta}s`);
        },
        error: () => this.commandError.set('Pomeranje sata nije uspelo. Proveri ID meča i status sata.'),
      });
  }

  protected finalizeMatch(): void {
    const matchId = this.matchId().trim();

    if (!matchId || !this.canFinalizeMatch()) {
      return;
    }

    if (!window.confirm('Finalizovati meč? Ovo zatvara utakmicu i upisuje pobednika.')) {
      return;
    }

    this.commandError.set('');
    this.successMessage.set('');
    this.pendingAction.set('finalize');
    this.scorerApi
      .finalizeMatch(matchId)
      .pipe(switchMap(() => this.matchesApi.getMatchReadBundle(matchId)))
      .pipe(finalize(() => this.pendingAction.set('')))
      .subscribe({
        next: (bundle) => {
          const winner = bundle.match.winnerTeam?.name ?? 'Pobednik';

          this.store.dispatch(ScorerActions.loadMatchSucceeded({ matchId, bundle }));
          this.successMessage.set(`Meč završen. ${winner} ide dalje.`);
        },
        error: () => this.commandError.set('Zatvaranje meča nije uspelo. Proveri rezultat, timove i status meča.'),
      });
  }

  protected recordPlayerEvent(teamId: string, playerId: string, type: MatchEventType): void {
    this.saveEvent(teamId, playerId, type);
  }

  private saveEvent(teamId: string, playerId: string | null, type: MatchEventType): void {
    const matchId = this.matchId().trim();

    if (!matchId || !teamId || !this.canRecordPlayerEvents()) {
      return;
    }

    this.commandError.set('');
    this.successMessage.set('');
    this.pendingAction.set('event');
    this.scorerApi
      .recordEvent(matchId, {
        type,
        teamId,
        ...(playerId ? { playerId } : {}),
      })
      .pipe(finalize(() => this.pendingAction.set('')))
      .subscribe({
        next: (event) => {
          this.store.dispatch(ScorerActions.eventRecorded({ event }));
          this.successMessage.set(`Događaj sačuvan: ${type}`);
        },
        error: () => this.commandError.set('Unos događaja nije uspeo. Proveri ID meča, tim, igrača i status meča.'),
      });
  }
}
