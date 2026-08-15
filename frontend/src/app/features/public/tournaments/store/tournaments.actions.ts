import { createActionGroup, props } from '@ngrx/store';

import type { PaginatedTournaments, TournamentListQuery } from '../tournament.models';

export const TournamentsActions = createActionGroup({
  source: 'Tournaments',
  events: {
    'Load List': props<{ query: TournamentListQuery }>(),
    'Load List Succeeded': props<{ query: TournamentListQuery; page: PaginatedTournaments }>(),
    'Load List Failed': props<{ query: TournamentListQuery }>(),
  },
});
