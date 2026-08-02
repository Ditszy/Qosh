import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, filter, map, of, startWith, switchMap } from 'rxjs';

import type { MatchReadBundle } from '../match.models';
import { MatchesApiService } from '../matches-api.service';

type LiveMatchState =
  | { status: 'loading' }
  | { status: 'loaded'; bundle: MatchReadBundle }
  | { status: 'error' };

@Component({
  selector: 'app-live-match',
  imports: [AsyncPipe],
  templateUrl: './live-match.html',
  styleUrl: './live-match.scss',
})
export class LiveMatch {
  private readonly route = inject(ActivatedRoute);
  private readonly matchesApi = inject(MatchesApiService);

  protected readonly state$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id): id is string => Boolean(id)),
    switchMap((id) =>
      this.matchesApi.getMatchReadBundle(id).pipe(
        map((bundle) => ({ status: 'loaded', bundle }) satisfies LiveMatchState),
        startWith({ status: 'loading' } satisfies LiveMatchState),
        catchError(() => of({ status: 'error' } satisfies LiveMatchState)),
      ),
    ),
  );

  protected teamName(team: MatchReadBundle['match']['teamA']): string {
    return team?.name ?? 'TBD';
  }
}
