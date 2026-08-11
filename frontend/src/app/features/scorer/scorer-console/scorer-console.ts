import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { ScorerMatchApiService } from '../scorer-match-api.service';
import { MatchesApiService } from '../../public/live-match/matches-api.service';
import type { MatchDetail, MatchEventType, MatchReadBundle } from '../../public/live-match/match.models';

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
export class ScorerConsole implements OnInit {
  private readonly scorerApi = inject(ScorerMatchApiService);
  private readonly matchesApi = inject(MatchesApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly playerEventButtons = PLAYER_EVENT_BUTTONS;
  protected readonly assignedMatches = signal<MatchDetail[]>([]);
  protected readonly assignedMatchesLoading = signal(false);
  protected readonly isConsoleRoute = signal(false);
  protected readonly matchId = signal('');
  protected readonly matchBundle = signal<MatchReadBundle | null>(null);
  protected readonly clockAdjustmentSeconds = signal(1);
  protected readonly pendingAction = signal('');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly canAdjustClock = computed(() => !!this.matchId().trim() && this.clockAdjustmentSeconds() > 0 && !this.pendingAction());
  protected readonly match = computed(() => this.matchBundle()?.match ?? null);
  protected readonly clockDisplay = computed<ClockDisplay>(() => {
    const remainingSeconds = Math.max(0, this.match()?.clockRemainingSeconds ?? 600);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  });
  protected readonly clockStatusLabel = computed(() => {
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
  }

  protected loadAssignedMatches(): void {
    if (this.assignedMatchesLoading()) {
      return;
    }

    this.assignedMatchesLoading.set(true);
    this.scorerApi
      .listAssignedMatches()
      .pipe(finalize(() => this.assignedMatchesLoading.set(false)))
      .subscribe({
        next: (matches) => this.assignedMatches.set(matches),
        error: () => this.errorMessage.set('Dodeljeni mečevi trenutno nisu dostupni.'),
      });
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

    this.errorMessage.set('');
    this.successMessage.set('');
    this.pendingAction.set('load');
    this.matchesApi
      .getMatchReadBundle(id)
      .pipe(finalize(() => this.pendingAction.set('')))
      .subscribe({
        next: (bundle) => this.matchBundle.set(bundle),
        error: () => this.errorMessage.set('Učitavanje meča nije uspelo. Proveri ID meča.'),
      });
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
      next: (match) => {
        this.replaceLoadedMatch(match);
        this.successMessage.set(`Sat: ${match.clockStatus}, preostalo ${match.clockRemainingSeconds}s`);
      },
      error: () => this.errorMessage.set('Kontrola sata nije uspela. Proveri ID meča i dodelu zapisničara.'),
    });
  }

  protected adjustClock(direction: -1 | 1): void {
    const matchId = this.matchId().trim();
    const secondsDelta = this.clockAdjustmentSeconds() * direction;

    if (!matchId || !secondsDelta || this.pendingAction()) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.pendingAction.set('adjust');
    this.scorerApi
      .adjustClock(matchId, { secondsDelta })
      .pipe(switchMap(() => this.matchesApi.getMatchReadBundle(matchId)))
      .pipe(finalize(() => this.pendingAction.set('')))
      .subscribe({
        next: (bundle) => {
          this.matchBundle.set(bundle);
          this.successMessage.set(`Sat pomeren za ${secondsDelta}s`);
        },
        error: () => this.errorMessage.set('Pomeranje sata nije uspelo. Proveri ID meča i status sata.'),
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

    this.errorMessage.set('');
    this.successMessage.set('');
    this.pendingAction.set('finalize');
    this.scorerApi
      .finalizeMatch(matchId)
      .pipe(switchMap(() => this.matchesApi.getMatchReadBundle(matchId)))
      .pipe(finalize(() => this.pendingAction.set('')))
      .subscribe({
        next: (bundle) => {
          const winner = bundle.match.winnerTeam?.name ?? 'Pobednik';

          this.matchBundle.set(bundle);
          this.successMessage.set(`Meč završen. ${winner} ide dalje.`);
        },
        error: () => this.errorMessage.set('Zatvaranje meča nije uspelo. Proveri rezultat, timove i status meča.'),
      });
  }

  protected recordPlayerEvent(teamId: string, playerId: string, type: MatchEventType): void {
    this.saveEvent(teamId, playerId, type);
  }

  private saveEvent(teamId: string, playerId: string | null, type: MatchEventType): void {
    const matchId = this.matchId().trim();

    if (!matchId || !teamId || this.pendingAction()) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.pendingAction.set('event');
    this.scorerApi
      .recordEvent(matchId, {
        type,
        teamId,
        ...(playerId ? { playerId } : {}),
      })
      .pipe(switchMap(() => this.matchesApi.getMatchReadBundle(matchId)))
      .pipe(finalize(() => this.pendingAction.set('')))
      .subscribe({
        next: (bundle) => {
          this.matchBundle.set(bundle);
          this.successMessage.set(`Događaj sačuvan: ${type}`);
        },
        error: () => this.errorMessage.set('Unos događaja nije uspeo. Proveri ID meča, tim, igrača i status meča.'),
      });
  }

  private replaceLoadedMatch(match: MatchDetail): void {
    const bundle = this.matchBundle();

    if (bundle) {
      this.matchBundle.set({ ...bundle, match });
    }
  }
}
