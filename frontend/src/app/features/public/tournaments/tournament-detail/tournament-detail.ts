import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, filter, finalize, forkJoin, map, merge, Observable, of, scan, startWith, Subject, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth';
import { TeamsApiService } from '../../../player/teams-api.service';
import type {
  Tournament,
  TournamentLiveMessage,
  TournamentMatch,
  TournamentStatus,
  TournamentTeamDetail,
} from '../tournament.models';
import { TournamentsApiService } from '../tournaments-api.service';

type TournamentDetailState =
  | { status: 'loading' }
  | { status: 'loaded'; tournament: Tournament; teams: TournamentTeamDetail[]; matches: TournamentMatch[] }
  | { status: 'error' };

type TournamentDetailLoadedState = Extract<TournamentDetailState, { status: 'loaded' }>;
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
  private readonly tournamentsApi = inject(TournamentsApiService);
  private readonly teamsApi = inject(TeamsApiService);
  protected readonly currentUser = this.authService.currentUser;
  protected readonly signupOpen = signal(false);
  protected readonly teamNameInput = signal('');
  protected readonly signupSubmitting = signal(false);
  protected readonly signupFeedback = signal<string | null>(null);
  protected readonly selectedTeam = signal<TournamentTeamDetail | null>(null);
  private readonly localLiveMessages$ = new Subject<TournamentLiveMessage>();

  private readonly tournamentId$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id): id is string => Boolean(id)),
    distinctUntilChanged(),
  );

  protected readonly state$: Observable<TournamentDetailState> = this.tournamentId$.pipe(
    switchMap((id) =>
      forkJoin({
        tournament: this.tournamentsApi.getTournament(id),
        teams: this.teamsApi.listTournamentTeams(id),
        matches: this.tournamentsApi.listTournamentMatches(id),
      }).pipe(
        switchMap(({ tournament, teams, matches }) => {
          const loadedState = { status: 'loaded', tournament, teams, matches } satisfies TournamentDetailState;

          return merge(this.tournamentsApi.watchTournamentLive(id), this.localLiveMessages$).pipe(
            scan((state, message) => this.applyLiveMessage(state, message), loadedState),
            startWith(loadedState),
            catchError(() => of(loadedState)),
          );
        }),
        startWith({ status: 'loading' } satisfies TournamentDetailState),
        catchError(() => of({ status: 'error' } satisfies TournamentDetailState)),
      ),
    ),
  );

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
          this.localLiveMessages$.next({ type: 'tournament.team.created', data: { team } });
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

  private bracketMatchY(round: number, bracketPosition: number): number {
    const roundSpan = 2 ** (round - 1);
    const slotIndex = (bracketPosition - 1) * roundSpan + ((roundSpan - 1) / 2);

    return bracketHeaderHeight + (slotIndex * bracketSlotStep);
  }

  private bracketBranchOffset(round: number): number {
    return (2 ** (round - 1) * bracketSlotStep) / 2;
  }

  protected openTeam(team: TournamentTeamDetail): void {
    this.selectedTeam.set(team);
  }

  protected closeTeam(): void {
    this.selectedTeam.set(null);
  }

  private applyLiveMessage(
    state: TournamentDetailLoadedState,
    message: TournamentLiveMessage,
  ): TournamentDetailLoadedState {
    if (message.type === 'tournament.status.changed') {
      return {
        ...state,
        tournament: {
          ...message.data.tournament,
          organizer: message.data.tournament.organizer ?? state.tournament.organizer,
        },
      };
    }

    if (message.type === 'tournament.bracket.generated') {
      return { ...state, matches: message.data.matches };
    }

    if (message.type === 'tournament.match.scheduled') {
      return { ...state, matches: this.replaceMatch(state.matches, message.data.match) };
    }

    if (message.type === 'tournament.team.created' || message.type === 'tournament.roster.updated') {
      return { ...state, teams: this.replaceTeam(state.teams, message.data.team) };
    }

    return state;
  }

  private replaceTeam(
    teams: TournamentTeamDetail[],
    updatedTeam: TournamentTeamDetail,
  ): TournamentTeamDetail[] {
    if (this.selectedTeam()?.id === updatedTeam.id) {
      this.selectedTeam.set(updatedTeam);
    }

    const hasTeam = teams.some((team) => team.id === updatedTeam.id);
    const nextTeams = hasTeam
      ? teams.map((team) => (team.id === updatedTeam.id ? updatedTeam : team))
      : [...teams, updatedTeam];

    return nextTeams.sort((first, second) => first.name.localeCompare(second.name));
  }

  private replaceMatch(matches: TournamentMatch[], updatedMatch: TournamentMatch): TournamentMatch[] {
    const hasMatch = matches.some((match) => match.id === updatedMatch.id);
    const nextMatches = hasMatch
      ? matches.map((match) => (match.id === updatedMatch.id ? updatedMatch : match))
      : [...matches, updatedMatch];

    return nextMatches
      .sort((first, second) => first.round - second.round || first.bracketPosition - second.bracketPosition);
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
