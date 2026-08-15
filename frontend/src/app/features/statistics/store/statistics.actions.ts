import { createActionGroup, props } from '@ngrx/store';

import type {
  NormalizedPlayerStatisticsFilters,
  PlayerStatistic,
  PlayerStatisticLeader,
  PlayerStatisticsFilters,
} from '../statistics.models';

export const StatisticsActions = createActionGroup({
  source: 'Statistics',
  events: {
    'Global Ranking Filters Changed': props<{ filters: PlayerStatisticsFilters }>(),
    'Load Global Rankings Succeeded': props<{
      filters: NormalizedPlayerStatisticsFilters;
      rankings: PlayerStatistic[];
      leaders: PlayerStatisticLeader[];
    }>(),
    'Load Global Rankings Failed': props<{ filters: NormalizedPlayerStatisticsFilters; error: string }>(),
  },
});
