import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith } from 'rxjs';

import type { Tournament, TournamentStatus } from '../tournament.models';
import { TournamentsApiService } from '../tournaments-api.service';

type TournamentListState =
  | { status: 'loading' }
  | { status: 'loaded'; tournaments: Tournament[] }
  | { status: 'error' };

type TournamentSort = 'startsAtAsc' | 'startsAtDesc' | 'nameAsc';

const statusLabels: Record<TournamentStatus, string> = {
  DRAFT: 'U pripremi',
  SIGNUPS_OPEN: 'Prijave otvorene',
  SIGNUPS_LOCKED: 'Prijave zaključane',
  IN_PROGRESS: 'U toku',
  COMPLETED: 'Završen',
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
  protected readonly sortMode = signal<TournamentSort>('startsAtAsc');

  protected readonly state$: Observable<TournamentListState> = this.tournamentsApi.listTournaments().pipe(
    map((tournaments) => ({ status: 'loaded', tournaments }) satisfies TournamentListState),
    startWith({ status: 'loading' } satisfies TournamentListState),
    catchError(() => of({ status: 'error' } satisfies TournamentListState)),
  );

  protected statusLabel(status: TournamentStatus): string {
    return statusLabels[status];
  }

  protected sortedTournaments(tournaments: Tournament[]): Tournament[] {
    const sorted = [...tournaments];

    if (this.sortMode() === 'nameAsc') {
      return sorted.sort((first, second) => first.name.localeCompare(second.name));
    }

    return sorted.sort((first, second) => {
      const firstTime = new Date(first.startsAt).getTime();
      const secondTime = new Date(second.startsAt).getTime();

      return this.sortMode() === 'startsAtDesc' ? secondTime - firstTime : firstTime - secondTime;
    });
  }

  protected setSortMode(value: string): void {
    this.sortMode.set(value as TournamentSort);
  }
}
