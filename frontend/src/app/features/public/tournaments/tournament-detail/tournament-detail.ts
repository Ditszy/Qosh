import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, filter, finalize, map } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth';
import { TeamsApiService } from '../../../player/teams-api.service';
import { TournamentAwardsBoard } from '../tournament-awards-board/tournament-awards-board';
import { TournamentBracket } from '../tournament-bracket/tournament-bracket';
import type {
  Tournament,
  TournamentMatch,
  TournamentStatus,
  TournamentTeamDetail,
} from '../tournament.models';
import { selectTournamentDetailView, TournamentsActions } from '../store';

const statusLabels: Record<TournamentStatus, string> = {
  DRAFT: 'U pripremi',
  SIGNUPS_OPEN: 'Prijave otvorene',
  SIGNUPS_LOCKED: 'Prijave zaključane',
  IN_PROGRESS: 'U toku',
  COMPLETED: 'Završen',
  CANCELLED: 'Otkazan',
};

@Component({
  selector: 'app-tournament-detail',
  imports: [AsyncPipe, DatePipe, FormsModule, RouterLink, TournamentAwardsBoard, TournamentBracket],
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
  protected readonly teamRemovalFeedback = signal<string | null>(null);
  protected readonly removingTeamIds = signal<Record<string, boolean>>({});
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

  protected canRemoveTeams(tournament: Tournament, matches: TournamentMatch[]): boolean {
    const currentUser = this.currentUser();
    const canManageTournament = currentUser?.role === 'ADMIN'
      || (currentUser?.role === 'ORGANIZER' && currentUser.id === tournament.organizerId);
    const beforeStart = ['DRAFT', 'SIGNUPS_OPEN', 'SIGNUPS_LOCKED'].includes(tournament.status);

    return Boolean(canManageTournament && beforeStart && matches.length === 0);
  }

  protected isRemovingTeam(teamId: string): boolean {
    return Boolean(this.removingTeamIds()[teamId]);
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

  protected removeTeamFromTournament(team: TournamentTeamDetail, tournament: Tournament): void {
    if (!confirm(`Ukloniti tim "${team.name}" sa turnira?`)) {
      return;
    }

    this.teamRemovalFeedback.set(null);
    this.removingTeamIds.update((ids) => ({ ...ids, [team.id]: true }));
    this.teamsApi.disbandTeam(team.id).pipe(
      finalize(() => this.removingTeamIds.update((ids) => ({ ...ids, [team.id]: false }))),
    ).subscribe({
      next: () => {
        this.teamRemovalFeedback.set('Tim je uklonjen sa turnira.');
        if (this.selectedTeamId() === team.id) {
          this.closeTeam();
        }
        this.store.dispatch(TournamentsActions.detailLiveMessageReceived({
          tournamentId: tournament.id,
          message: { type: 'tournament.team.removed', data: { teamId: team.id } },
        }));
      },
      error: () => this.teamRemovalFeedback.set('Uklanjanje tima nije uspelo.'),
    });
  }

  protected openTeam(team: TournamentTeamDetail): void {
    this.selectedTeamId.set(team.id);
  }

  protected closeTeam(): void {
    this.selectedTeamId.set(null);
  }
}
