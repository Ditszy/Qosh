import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { PlayerRankingsService } from '../player-rankings.service';
import type { PlayerRankingsState, PlayerStatistic, PlayerStatisticsFilters, PlayerStatisticSort } from '../statistics.models';

type RankingCategorySort = Extract<
  PlayerStatisticSort,
  'points' | 'rebounds' | 'assists' | 'steals' | 'onePointPercentage' | 'twoPointPercentage' | 'freeThrowPercentage'
>;

type RankingCategory = {
  label: string;
  sortBy: RankingCategorySort;
};

@Component({
  selector: 'app-rankings',
  imports: [AsyncPipe],
  templateUrl: './rankings.html',
  styleUrl: './rankings.scss',
})
export class Rankings {
  private readonly playerRankings = inject(PlayerRankingsService);
  private readonly filtersSubject = new BehaviorSubject<PlayerStatisticsFilters>({ sortBy: 'points' });

  protected currentSortBy: RankingCategorySort = 'points';
  protected readonly categories: RankingCategory[] = [
    { label: 'PTS', sortBy: 'points' },
    { label: 'REB', sortBy: 'rebounds' },
    { label: 'AST', sortBy: 'assists' },
    { label: 'STL', sortBy: 'steals' },
    { label: '1P%', sortBy: 'onePointPercentage' },
    { label: '2P%', sortBy: 'twoPointPercentage' },
    { label: 'FT%', sortBy: 'freeThrowPercentage' },
  ];

  protected readonly state$: Observable<PlayerRankingsState> = this.playerRankings.watchGlobalRankings(
    this.filtersSubject.asObservable(),
  );

  protected selectCategory(category: RankingCategory): void {
    this.currentSortBy = category.sortBy;
    this.filtersSubject.next({ sortBy: category.sortBy });
  }

  protected metricValue(player: PlayerStatistic, sortBy: RankingCategorySort): string {
    const value = player[sortBy];

    if (value === null) {
      return '-';
    }

    return sortBy.endsWith('Percentage') ? `${value}%` : String(value);
  }
}
