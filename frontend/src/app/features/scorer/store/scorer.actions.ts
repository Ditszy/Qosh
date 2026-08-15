import { createActionGroup, emptyProps, props } from '@ngrx/store';

import type { MatchDetail, MatchEvent, MatchReadBundle } from '../../public/live-match/match.models';

export const ScorerActions = createActionGroup({
  source: 'Scorer',
  events: {
    'Load Assigned Matches': emptyProps(),
    'Load Assigned Matches Succeeded': props<{ matches: MatchDetail[] }>(),
    'Load Assigned Matches Failed': props<{ error: string }>(),
    'Load Match': props<{ matchId: string }>(),
    'Load Match Succeeded': props<{ matchId: string; bundle: MatchReadBundle }>(),
    'Load Match Failed': props<{ matchId: string; error: string }>(),
    'Match Updated': props<{ match: MatchDetail }>(),
    'Event Recorded': props<{ event: MatchEvent }>(),
  },
});
