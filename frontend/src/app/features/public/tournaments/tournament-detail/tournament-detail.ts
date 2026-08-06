import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, filter, finalize, forkJoin, map, Observable, of, startWith, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth';
import { TeamsApiService } from '../../../player/teams-api.service';
import type { Tournament, TournamentMatch, TournamentStatus } from '../tournament.models';
import { TournamentsApiService } from '../tournaments-api.service';

type TournamentDetailState =
  | { status: 'loading' }
  | { status: 'loaded'; tournament: Tournament; matches: TournamentMatch[] }
  | { status: 'error' };

const statusLabels: Record<TournamentStatus, string> = {
  DRAFT: 'U pripremi',
  SIGNUPS_OPEN: 'Prijave otvorene',
  SIGNUPS_LOCKED: 'Prijave zakljucane',
  IN_PROGRESS: 'U toku',
  COMPLETED: 'Zavrsen',
  CANCELLED: 'Otkazan',
};

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

  private readonly tournamentId$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id): id is string => Boolean(id)),
    distinctUntilChanged(),
  );

  protected readonly state$: Observable<TournamentDetailState> = this.tournamentId$.pipe(
    switchMap((id) =>
      forkJoin({
        tournament: this.tournamentsApi.getTournament(id),
        matches: this.tournamentsApi.listTournamentMatches(id),
      }).pipe(
        map(({ tournament, matches }) => ({ status: 'loaded', tournament, matches }) satisfies TournamentDetailState),
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
        next: () => {
          this.teamNameInput.set('');
          this.signupOpen.set(false);
          this.signupFeedback.set('Tim je prijavljen.');
        },
        error: () => this.signupFeedback.set('Prijava tima nije uspela.'),
      });
  }

  protected teamName(team: TournamentMatch['teamA']): string {
    return team?.name ?? 'TBD';
  }
}
