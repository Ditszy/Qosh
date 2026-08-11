import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { ScorerMatchApiService } from '../scorer-match-api.service';
import { MatchesApiService } from '../../public/live-match/matches-api.service';
import type { MatchDetail, MatchEventType, MatchReadBundle } from '../../public/live-match/match.models';

type ClockAction = 'start' | 'pause' | 'resume' | 'end';
type EventButton = { label: string; type: MatchEventType };

const MATCH_EVENT_TYPES: MatchEventType[] = ['ONE_POINT_MADE', 'ONE_POINT_MISSED', 'TWO_POINT_MADE', 'TWO_POINT_MISSED', 'FREE_THROW_MADE', 'FREE_THROW_MISSED', 'REBOUND', 'ASSIST', 'STEAL', 'BLOCK', 'TURNOVER', 'FOUL'];
const PLAYER_EVENT_BUTTONS: EventButton[] = [
  { label: '1PM', type: 'ONE_POINT_MADE' },
  { label: '1PX', type: 'ONE_POINT_MISSED' },
  { label: '2PM', type: 'TWO_POINT_MADE' },
  { label: '2PX', type: 'TWO_POINT_MISSED' },
  { label: 'FTM', type: 'FREE_THROW_MADE' },
  { label: 'FTX', type: 'FREE_THROW_MISSED' },
  { label: 'REB', type: 'REBOUND' },
  { label: 'AST', type: 'ASSIST' },
  { label: 'STL', type: 'STEAL' },
  { label: 'BLK', type: 'BLOCK' },
  { label: 'TO', type: 'TURNOVER' },
  { label: 'FOUL', type: 'FOUL' },
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

  protected readonly eventTypes = MATCH_EVENT_TYPES;
  protected readonly playerEventButtons = PLAYER_EVENT_BUTTONS;
  protected readonly assignedMatches = signal<MatchDetail[]>([]);
  protected readonly assignedMatchesLoading = signal(false);
  protected readonly matchId = signal('');
  protected readonly matchBundle = signal<MatchReadBundle | null>(null);
  protected readonly eventType = signal<MatchEventType>('ONE_POINT_MADE');
  protected readonly eventTeamId = signal('');
  protected readonly eventPlayerId = signal('');
  protected readonly clockAdjustmentSeconds = signal(1);
  protected readonly pendingAction = signal('');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly canRecordEvent = computed(() => !!this.matchId().trim() && !!this.eventTeamId().trim() && !this.pendingAction());
  protected readonly canAdjustClock = computed(() => !!this.matchId().trim() && this.clockAdjustmentSeconds() > 0 && !this.pendingAction());
  protected readonly match = computed(() => this.matchBundle()?.match ?? null);
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
  protected readonly selectedPlayers = computed(() => {
    return this.teamStats().find((team) => team.team.id === this.eventTeamId())?.players ?? [];
  });
  protected readonly liveMatchLink = computed(() => {
    const id = this.matchId().trim();

    return id ? ['/matches', id, 'live'] : null;
  });

  ngOnInit(): void {
    this.loadAssignedMatches();
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

  protected openAssignedMatch(match: MatchDetail): void {
    this.matchId.set(match.id);
    this.loadMatch();
  }

  protected updateMatchId(value: string): void {
    this.matchId.set(value);
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
        next: (bundle) => {
          const firstTeam = bundle.statistics.teams[0];

          this.matchBundle.set(bundle);
          this.eventTeamId.set(firstTeam?.team.id ?? '');
          this.eventPlayerId.set(firstTeam?.players[0]?.player.id ?? '');
        },
        error: () => this.errorMessage.set('Ucitavanje meca nije uspelo. Proveri ID meca.'),
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
        error: () => this.errorMessage.set('Pomeranje sata nije uspelo. Proveri ID meca i status sata.'),
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

  protected recordEvent(): void {
    this.saveEvent(this.eventTeamId().trim(), this.eventPlayerId().trim() || null, this.eventType());
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
