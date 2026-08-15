import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, filter, finalize, map } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth';
import { TeamsApiService } from '../../../player/teams-api.service';
import type {
  Tournament,
  TournamentMatch,
  TournamentStatus,
  TournamentTeamDetail,
} from '../tournament.models';
import { selectTournamentDetailView, TournamentsActions } from '../store';

type BracketRound = { round: number; matches: TournamentMatch[] };
type BracketLayout = {
  rounds: Array<{ round: number; x: number; matches: Array<{ match: TournamentMatch; y: number }> }>;
  connectors: string[];
  width: number;
  height: number;
};

const statusLabels: Record<TournamentStatus, string> = {
  DRAFT: 'U pripremi',
  SIGNUPS_OPEN: 'Prijave otvorene',
  SIGNUPS_LOCKED: 'Prijave zaključane',
  IN_PROGRESS: 'U toku',
  COMPLETED: 'Završen',
  CANCELLED: 'Otkazan',
};
const bracketCardHeight = 110;
const bracketCardWidth = 240;
const bracketFirstRoundGap = 56;
const bracketColumnGap = 40;
const bracketHeaderHeight = 28;
const bracketSlotStep = bracketCardHeight + bracketFirstRoundGap;

@Component({
  selector: 'app-tournament-detail',
  imports: [AsyncPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './tournament-detail.html',
  styleUrl: './tournament-detail.scss',
})
export class TournamentDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly teamsApi = inject(TeamsApiService);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly signupOpen = signal(false);
  protected readonly teamNameInput = signal('');
  protected readonly signupSubmitting = signal(false);
  protected readonly signupFeedback = signal<string | null>(null);
  protected readonly selectedTeamId = signal<string | null>(null);
  protected readonly detailView = this.store.selectSignal(selectTournamentDetailView);
  protected readonly selectedTeam = computed(() => {
    const state = this.detailView();
    const selectedTeamId = this.selectedTeamId();

    return state.status === 'loaded' && selectedTeamId
      ? state.teams.find((team) => team.id === selectedTeamId) ?? null
      : null;
  });
  protected readonly state$ = this.store.select(selectTournamentDetailView);

  constructor() {
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      filter((id): id is string => Boolean(id)),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((tournamentId) => {
      this.selectedTeamId.set(null);
      this.store.dispatch(TournamentsActions.loadDetail({ tournamentId }));
    });
  }

  protected statusLabel(status: TournamentStatus): string {
    return statusLabels[status];
  }

  protected canRegisterTeam(tournament: Tournament): boolean {
    return tournament.status === 'SIGNUPS_OPEN' && this.currentUser()?.role === 'PLAYER';
  }

  protected openSignupForm(): void {
    this.signupOpen.set(true);
    this.signupFeedback.set(null);
  }

  protected submitTeamSignup(tournament: Tournament): void {
    const name = this.teamNameInput().trim();

    if (!name) {
      this.signupFeedback.set('Unesi naziv tima.');
      return;
    }

    if (this.signupSubmitting()) {
      return;
    }

    this.signupSubmitting.set(true);
    this.signupFeedback.set(null);

    this.teamsApi
      .createTeam({ name, tournamentId: tournament.id })
      .pipe(finalize(() => this.signupSubmitting.set(false)))
      .subscribe({
        next: (team) => {
          this.teamNameInput.set('');
          this.signupOpen.set(false);
          this.signupFeedback.set('Tim je prijavljen.');
          this.store.dispatch(TournamentsActions.detailLiveMessageReceived({
            tournamentId: tournament.id,
            message: { type: 'tournament.team.created', data: { team } },
          }));
        },
        error: () => this.signupFeedback.set('Prijava tima nije uspela.'),
      });
  }

  protected teamName(team: TournamentMatch['teamA']): string {
    return team?.name ?? 'TBD';
  }

  protected bracketRounds(matches: TournamentMatch[]): BracketRound[] {
    const rounds = new Map<number, TournamentMatch[]>();

    for (const match of matches) {
      rounds.set(match.round, [...(rounds.get(match.round) ?? []), match]);
    }

    return [...rounds.entries()]
      .sort(([firstRound], [secondRound]) => firstRound - secondRound)
      .map(([round, roundMatches]) => ({
        round,
        matches: roundMatches.sort((first, second) => first.bracketPosition - second.bracketPosition),
      }));
  }

  protected bracketLayout(matches: TournamentMatch[]): BracketLayout {
    const rounds = this.bracketRounds(matches).map(({ round, matches: roundMatches }) => ({
      round,
      x: (round - 1) * (bracketCardWidth + bracketColumnGap),
      matches: roundMatches.map((match) => ({
        match,
        y: this.bracketMatchY(round, match.bracketPosition),
      })),
    }));
    const cards = new Map<string, { x: number; y: number }>();

    for (const round of rounds) {
      for (const card of round.matches) {
        cards.set(`${round.round}:${card.match.bracketPosition}`, { x: round.x, y: card.y });
      }
    }

    for (const round of rounds) {
      for (const card of round.matches) {
        const target = card.match.nextRound && card.match.nextBracketPosition
          ? cards.get(`${card.match.nextRound}:${card.match.nextBracketPosition}`)
          : null;

        if (!target || !card.match.nextMatchSlot) {
          continue;
        }

        const direction = card.match.nextMatchSlot === 'TEAM_A' ? -1 : 1;
        card.y = target.y + (bracketCardHeight / 2) + (direction * this.bracketBranchOffset(card.match.round)) - (bracketCardHeight / 2);
      }
    }

    cards.clear();
    for (const round of rounds) {
      for (const card of round.matches) {
        cards.set(`${round.round}:${card.match.bracketPosition}`, { x: round.x, y: card.y });
      }
    }

    const connectors = matches
      .map((match) => this.bracketConnector(match, cards))
      .filter((path): path is string => Boolean(path));
    const width = Math.max(...rounds.map((round) => round.x + bracketCardWidth), bracketCardWidth);
    const height = Math.max(
      ...rounds.flatMap((round) => round.matches.map((card) => card.y + bracketCardHeight)),
      bracketCardHeight,
    );

    return { rounds, connectors, width, height };
  }

  protected openTeam(team: TournamentTeamDetail): void {
    this.selectedTeamId.set(team.id);
  }

  protected closeTeam(): void {
    this.selectedTeamId.set(null);
  }

  private bracketMatchY(round: number, bracketPosition: number): number {
    const roundSpan = 2 ** (round - 1);
    const slotIndex = (bracketPosition - 1) * roundSpan + ((roundSpan - 1) / 2);

    return bracketHeaderHeight + (slotIndex * bracketSlotStep);
  }

  private bracketBranchOffset(round: number): number {
    return (2 ** (round - 1) * bracketSlotStep) / 2;
  }

  private bracketConnector(match: TournamentMatch, cards: Map<string, { x: number; y: number }>): string | null {
    if (!match.nextRound || !match.nextBracketPosition) {
      return null;
    }

    const source = cards.get(`${match.round}:${match.bracketPosition}`);
    const target = cards.get(`${match.nextRound}:${match.nextBracketPosition}`);

    if (!source || !target) {
      return null;
    }

    const startX = source.x + bracketCardWidth;
    const startY = source.y + bracketCardHeight / 2;
    const endX = target.x;
    const endY = target.y + bracketCardHeight / 2;
    const middleX = startX + (endX - startX) / 2;

    return `M ${startX} ${startY} H ${middleX} V ${endY} H ${endX}`;
  }
}
