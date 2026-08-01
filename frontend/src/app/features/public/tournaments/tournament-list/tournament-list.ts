import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith } from 'rxjs';

import type { Tournament, TournamentStatus } from '../tournament.models';
import { TournamentsApiService } from '../tournaments-api.service';

type TournamentListState =
  | { status: 'loading' }
  | { status: 'loaded'; tournaments: Tournament[] }
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
  selector: 'app-tournament-list',
  imports: [AsyncPipe, DatePipe, RouterLink],
  templateUrl: './tournament-list.html',
  styleUrl: './tournament-list.scss',
})
export class TournamentList {
  private readonly tournamentsApi = inject(TournamentsApiService);

  protected readonly state$: Observable<TournamentListState> = this.tournamentsApi.listTournaments().pipe(
    map((tournaments) => ({ status: 'loaded', tournaments }) satisfies TournamentListState),
    startWith({ status: 'loading' } satisfies TournamentListState),
    catchError(() => of({ status: 'error' } satisfies TournamentListState)),
  );

  protected statusLabel(status: TournamentStatus): string {
    return statusLabels[status];
  }
}
