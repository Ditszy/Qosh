import { createActionGroup, emptyProps, props } from '@ngrx/store';

import type { MyTeamLiveMessage, TeamDetail, TeamInvite } from '../teams-api.service';

export const PlayerTeamsActions = createActionGroup({
  source: 'Player Teams',
  events: {
    'Load Page': emptyProps(),
    'Load Page Succeeded': props<{ teams: TeamDetail[]; invites: TeamInvite[] }>(),
    'Load Page Failed': emptyProps(),
    'Reload Invites': emptyProps(),
    'Reload Invites Succeeded': props<{ invites: TeamInvite[] }>(),
    'Watch My Teams': emptyProps(),
    'Live Message Received': props<{ message: MyTeamLiveMessage; currentUserId: string | null }>(),
    'Team Upserted': props<{ team: TeamDetail }>(),
    'Team Removed': props<{ teamId: string }>(),
    'Invite Removed': props<{ inviteId: string }>(),
  },
});
