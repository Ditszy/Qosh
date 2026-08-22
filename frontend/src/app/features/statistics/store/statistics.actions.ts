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
    }>(),
    'Load Global Rankings Failed': props<{ filters: NormalizedPlayerStatisticsFilters; error: string }>(),
    'Load Global Leaders': props<{ filters?: PlayerStatisticsFilters }>(),
    'Load Global Leaders Succeeded': props<{ leaders: PlayerStatisticLeader[] }>(),
    'Load Global Leaders Failed': props<{ error: string }>(),
  },
});
