import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

import { PlayerRankingsService } from '../player-rankings.service';
import type {
  PlayerRankingsState,
  PlayerStatistic,
  PlayerStatisticLeader,
  PlayerStatisticsFilters,
  PlayerStatisticSort,
} from '../statistics.models';

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
  imports: [AsyncPipe, RouterLink],
  templateUrl: './rankings.html',
  styleUrl: './rankings.scss',
})
export class Rankings {
  private readonly playerRankings = inject(PlayerRankingsService);
  private readonly filtersSubject = new BehaviorSubject<PlayerStatisticsFilters>({ sortBy: 'points' });

  protected currentSortBy: RankingCategorySort = 'points';
  protected currentSearch = '';
  protected currentMinGamesPlayed: number | undefined;
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
    this.updateFilters({ sortBy: category.sortBy });
  }

  protected searchPlayers(event: Event): void {
    const search = (event.target as HTMLInputElement).value;
    this.currentSearch = search;
    this.updateFilters({ search });
  }

  protected setMinimumGames(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const minGamesPlayed = value === '' ? undefined : Number(value);
    this.currentMinGamesPlayed = minGamesPlayed;
    this.updateFilters({ minGamesPlayed });
  }

  protected metricValue(player: PlayerStatistic, sortBy: RankingCategorySort): string {
    const value = player[sortBy];

    if (value === null) {
      return '-';
    }

    return sortBy.endsWith('Percentage') ? `${value}%` : String(value);
  }

  protected leaderFor(leaders: PlayerStatisticLeader[], sortBy: RankingCategorySort): PlayerStatisticLeader | null {
    return leaders.find((leader) => leader.category === sortBy) ?? null;
  }

  private updateFilters(filters: PlayerStatisticsFilters): void {
    this.filtersSubject.next({
      ...this.filtersSubject.value,
      ...filters,
    });
  }
}
