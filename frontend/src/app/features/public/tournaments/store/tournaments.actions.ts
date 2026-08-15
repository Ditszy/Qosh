import { createActionGroup, props } from '@ngrx/store';

import type {
  PaginatedTournaments,
  Tournament,
  TournamentListQuery,
  TournamentLiveMessage,
  TournamentMatch,
  TournamentTeamDetail,
} from '../tournament.models';

export const TournamentsActions = createActionGroup({
  source: 'Tournaments',
  events: {
    'Load List': props<{ query: TournamentListQuery }>(),
    'Load List Succeeded': props<{ query: TournamentListQuery; page: PaginatedTournaments }>(),
    'Load List Failed': props<{ query: TournamentListQuery }>(),
    'Load Detail': props<{ tournamentId: string }>(),
    'Load Detail Succeeded': props<{
      tournamentId: string;
      tournament: Tournament;
      teams: TournamentTeamDetail[];
      matches: TournamentMatch[];
    }>(),
    'Load Detail Failed': props<{ tournamentId: string }>(),
    'Detail Live Message Received': props<{ tournamentId: string; message: TournamentLiveMessage }>(),
  },
});
