import { createActionGroup, props } from '@ngrx/store';

import type { MatchDetail } from '../../public/live-match/match.models';
import type { RefereeAssignedMatchPage, RefereeReportDetail } from '../referee-reports-api.service';

export const RefereeActions = createActionGroup({
  source: 'Referee',
  events: {
    'Load Assigned Matches': props<{ page?: number }>(),
    'Load Assigned Matches Succeeded': props<{ page: RefereeAssignedMatchPage }>(),
    'Load Assigned Matches Failed': props<{ error: string }>(),
    'Load Selected Match': props<{ matchId: string }>(),
    'Load Selected Match Succeeded': props<{ matchId: string; match: MatchDetail }>(),
    'Load Selected Match Failed': props<{ matchId: string; error: string }>(),
    'Load Existing Report': props<{ matchId: string }>(),
    'Load Existing Report Succeeded': props<{ matchId: string; report: RefereeReportDetail }>(),
    'Load Existing Report Missing': props<{ matchId: string }>(),
    'Submit Report': props<{ matchId: string; notes: string }>(),
    'Submit Report Succeeded': props<{ matchId: string; report: RefereeReportDetail }>(),
    'Submit Report Failed': props<{ matchId: string; error: string }>(),
  },
});
