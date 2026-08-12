import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import type { MatchDetail, MatchLiveCenter as MatchLiveCenterData } from '../../live-match/match.models';
import { MatchesApiService } from '../../live-match/matches-api.service';

type LiveCenterState =
  | { status: 'loading' }
  | { status: 'loaded'; data: MatchLiveCenterData }
  | { status: 'error' };

@Component({
  selector: 'app-live-center',
  imports: [AsyncPipe, DatePipe, RouterLink],
  templateUrl: './live-center.html',
  styleUrl: './live-center.scss',
})
export class LiveCenter {
  private readonly matchesApi = inject(MatchesApiService);
  private readonly reload$ = new Subject<void>();

  protected readonly state$: Observable<LiveCenterState> = this.reload$.pipe(
    startWith(void 0),
    switchMap(() =>
      this.matchesApi.getLiveCenter().pipe(
        map((data) => ({ status: 'loaded', data }) satisfies LiveCenterState),
        startWith({ status: 'loading' } satisfies LiveCenterState),
        catchError(() => of({ status: 'error' } satisfies LiveCenterState)),
      ),
    ),
  );

  protected readonly emptyTeam = 'TBD';

  protected refresh(): void {
    this.reload$.next();
  }

  protected teamName(match: MatchDetail, slot: 'A' | 'B'): string {
    return (slot === 'A' ? match.teamA?.name : match.teamB?.name) ?? this.emptyTeam;
  }

  protected clockLabel(match: MatchDetail): string {
    const minutes = Math.floor(match.clockRemainingSeconds / 60);
    const seconds = match.clockRemainingSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
}
