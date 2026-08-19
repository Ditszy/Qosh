import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import type { MatchLiveCenter as MatchLiveCenterData } from '../../live-match/match.models';
import { MatchCard } from '../../live-match/match-card/match-card';
import { MatchesApiService } from '../../live-match/matches-api.service';

type LiveCenterState =
  | { status: 'loading' }
  | { status: 'loaded'; data: MatchLiveCenterData }
  | { status: 'error' };

@Component({
  selector: 'app-live-center',
  imports: [AsyncPipe, MatchCard],
  templateUrl: './live-center.html',
  styleUrl: './live-center.scss',
})
export class LiveCenter {
  private readonly matchesApi = inject(MatchesApiService);
  private readonly router = inject(Router);
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

  protected refresh(): void {
    this.reload$.next();
  }

  protected openMatch(matchId: string): void {
    void this.router.navigate(['/matches', matchId, 'live']);
  }
}
