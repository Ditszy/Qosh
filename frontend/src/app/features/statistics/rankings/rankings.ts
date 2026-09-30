import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { selectGlobalPlayerRankingsState, StatisticsActions } from '../store';
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
export class Rankings implements OnInit {
  private readonly store = inject(Store);

  protected currentSortBy: RankingCategorySort = 'points';
  protected currentSearch = '';
  protected currentMinGamesPlayed: number | undefined;
  protected currentPage = 1;
  protected readonly categories: RankingCategory[] = [
    { label: 'PTS', sortBy: 'points' },
    { label: 'REB', sortBy: 'rebounds' },
    { label: 'AST', sortBy: 'assists' },
    { label: 'STL', sortBy: 'steals' },
    { label: '1P%', sortBy: 'onePointPercentage' },
    { label: '2P%', sortBy: 'twoPointPercentage' },
    { label: 'FT%', sortBy: 'freeThrowPercentage' },
  ];

  protected readonly state$: Observable<PlayerRankingsState> = this.store.select(selectGlobalPlayerRankingsState);

  ngOnInit(): void {
    this.store.dispatch(StatisticsActions.loadGlobalLeaders({}));
    this.dispatchFilters();
  }

  protected selectCategory(category: RankingCategory): void {
    this.currentSortBy = category.sortBy;
    this.currentPage = 1;
    this.dispatchFilters();
  }

  protected searchPlayers(event: Event): void {
    const search = (event.target as HTMLInputElement).value;
    this.currentSearch = search;
    this.currentPage = 1;
    this.dispatchFilters();
  }

  protected setMinimumGames(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const minGamesPlayed = value === '' ? undefined : Number(value);
    this.currentMinGamesPlayed = minGamesPlayed;
    this.currentPage = 1;
    this.dispatchFilters();
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

  protected goToPage(page: number, totalPages: number): void {
    if (page < 1 || page > totalPages) {
      return;
    }

    this.currentPage = page;
    this.dispatchFilters();
  }

  private dispatchFilters(): void {
    const filters: PlayerStatisticsFilters = {
      search: this.currentSearch,
      minGamesPlayed: this.currentMinGamesPlayed,
      page: this.currentPage,
      pageSize: 25,
      sortBy: this.currentSortBy,
    };

    this.store.dispatch(StatisticsActions.globalRankingFiltersChanged({ filters }));
  }
}
