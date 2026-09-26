import { createActionGroup, emptyProps, props } from '@ngrx/store';

import type {
  OrganizerTournamentRequest,
  ScheduleMatchRequest,
  UpdateOrganizerTournamentRequest,
} from '../organizer-tournaments-api.service';
import type { Tournament, TournamentMatch } from '../../public/tournaments/tournament.models';
import type { OrganizerTournamentWithMatches } from './organizer-dashboard.reducer';

export const OrganizerDashboardActions = createActionGroup({
  source: 'Organizer Dashboard',
  events: {
    Load: emptyProps(),
    'Load Succeeded': props<{ tournaments: OrganizerTournamentWithMatches[] }>(),
    'Load Failed': emptyProps(),
    'Create Tournament': props<{ value: OrganizerTournamentRequest }>(),
    'Create Tournament Succeeded': props<{ tournament: Tournament }>(),
    'Update Tournament': props<{ id: string; value: UpdateOrganizerTournamentRequest }>(),
    'Update Tournament Succeeded': props<{ tournament: Tournament }>(),
    'Set Signup Status': props<{ id: string; action: 'open' | 'lock' }>(),
    'Set Signup Status Succeeded': props<{ tournament: Tournament }>(),
    'Generate Bracket': props<{ id: string }>(),
    'Generate Bracket Succeeded': props<{ matches: TournamentMatch[] }>(),
    'Start Tournament': props<{ id: string }>(),
    'Start Tournament Succeeded': props<{ tournament: Tournament }>(),
    'Cancel Tournament': props<{ id: string }>(),
    'Cancel Tournament Succeeded': props<{ tournament: Tournament }>(),
    'Schedule Match': props<{ id: string; value: ScheduleMatchRequest }>(),
    'Schedule Match Succeeded': props<{ match: TournamentMatch }>(),
    'Command Failed': props<{ errorMessage: string }>(),
  },
});
