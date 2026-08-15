import { createActionGroup, props } from '@ngrx/store';

import type { MatchLiveStreamMessage, MatchReadBundle } from '../match.models';

export const LiveMatchActions = createActionGroup({
  source: 'Live Match',
  events: {
    Load: props<{ matchId: string }>(),
    'Load Succeeded': props<{ matchId: string; bundle: MatchReadBundle }>(),
    'Load Failed': props<{ matchId: string }>(),
    'Live Message Received': props<{ matchId: string; message: MatchLiveStreamMessage }>(),
  },
});
