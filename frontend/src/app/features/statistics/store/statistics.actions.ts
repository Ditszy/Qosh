import { createActionGroup, props } from '@ngrx/store';

import type {
  NormalizedPlayerStatisticsFilters,
  PlayerStatisticsPage,
  PlayerStatisticLeader,
  PlayerStatisticsFilters,
} from '../statistics.models';

export const StatisticsActions = createActionGroup({
  source: 'Statistics',
  events: {
    'Global Ranking Filters Changed': props<{ filters: PlayerStatisticsFilters }>(),
    'Load Global Rankings Succeeded': props<{
      filters: NormalizedPlayerStatisticsFilters;
      page: PlayerStatisticsPage;
    }>(),
    'Load Global Rankings Failed': props<{ filters: NormalizedPlayerStatisticsFilters; error: string }>(),
    'Load Global Leaders': props<{ filters?: PlayerStatisticsFilters }>(),
    'Load Global Leaders Succeeded': props<{ leaders: PlayerStatisticLeader[] }>(),
    'Load Global Leaders Failed': props<{ error: string }>(),
  },
});
