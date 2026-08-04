import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, filter, map, of, startWith, switchMap } from 'rxjs';

import { StatisticsApiService } from '../statistics-api.service';
import type { PlayerProfile as PlayerProfileModel } from '../statistics.models';

type PlayerProfileState =
  | { status: 'loading' }
  | { status: 'loaded'; profile: PlayerProfileModel }
  | { status: 'error' };

@Component({
  selector: 'app-player-profile',
  imports: [AsyncPipe, DatePipe],
  templateUrl: './player-profile.html',
  styleUrl: './player-profile.scss',
})
export class PlayerProfile {
  private readonly route = inject(ActivatedRoute);
  private readonly statisticsApi = inject(StatisticsApiService);

  protected readonly state$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id): id is string => Boolean(id)),
    switchMap((id) =>
      this.statisticsApi.getPlayerProfile(id).pipe(
        map((profile) => ({ status: 'loaded', profile }) satisfies PlayerProfileState),
        startWith({ status: 'loading' } satisfies PlayerProfileState),
        catchError(() => of({ status: 'error' } satisfies PlayerProfileState)),
      ),
    ),
  );

  protected percentageValue(value: number | null): string {
    return value === null ? '-' : `${value}%`;
  }
}
