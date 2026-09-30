import { createActionGroup, props } from '@ngrx/store';

import type { MatchDetail, MatchEvent, MatchEventUndoResult, MatchReadBundle } from '../../public/live-match/match.models';
import type { ScorerAssignedMatchPage } from '../scorer-match-api.service';

export const ScorerActions = createActionGroup({
  source: 'Scorer',
  events: {
    'Load Assigned Matches': props<{ page?: number }>(),
    'Load Assigned Matches Succeeded': props<{ page: ScorerAssignedMatchPage }>(),
    'Load Assigned Matches Failed': props<{ error: string }>(),
    'Load Match': props<{ matchId: string }>(),
    'Load Match Succeeded': props<{ matchId: string; bundle: MatchReadBundle }>(),
    'Load Match Failed': props<{ matchId: string; error: string }>(),
    'Match Updated': props<{ match: MatchDetail }>(),
    'Event Recorded': props<{ event: MatchEvent }>(),
    'Event Undone': props<{ result: MatchEventUndoResult }>(),
  },
});
