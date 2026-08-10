import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

import { StatisticsApiService } from './statistics-api.service';
import type { PlayerProfileSearchState, PublicUser } from './statistics.models';

@Injectable({
  providedIn: 'root',
})
export class PlayerProfileSearchService {
  private readonly statisticsApi = inject(StatisticsApiService);

  watch(query$: Observable<string>): Observable<PlayerProfileSearchState> {
    return query$.pipe(
      map((query) => query.trim()),
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((query) => (query.length < 2 ? of(this.emptyState(query)) : this.search(query))),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  private search(query: string): Observable<PlayerProfileSearchState> {
    return this.statisticsApi.searchPlayerProfiles(query).pipe(
      map((results) => this.loadedState(query, results)),
      startWith(this.loadingState(query)),
      catchError(() => of({ ...this.emptyState(query), error: 'Nije moguce pretraziti igrace.' })),
    );
  }

  private emptyState(query: string): PlayerProfileSearchState {
    return { query, results: [], loading: false, error: null };
  }

  private loadingState(query: string): PlayerProfileSearchState {
    return { query, results: [], loading: true, error: null };
  }

  private loadedState(query: string, results: PublicUser[]): PlayerProfileSearchState {
    return { query, results, loading: false, error: null };
  }
}
