import { createActionGroup, emptyProps, props } from '@ngrx/store';

import type {
  ManagedTournamentPage,
  ManagedTournamentSummary,
  OrganizerCommandCenterData,
  OrganizerTournamentRequest,
  ScheduleMatchRequest,
  UpdateOrganizerTournamentRequest,
} from '../organizer-tournaments-api.service';
import type { Tournament, TournamentMatch } from '../../public/tournaments/tournament.models';
import type { TournamentTeamDetail } from '../../public/tournaments/tournament.models';

export const OrganizerDashboardActions = createActionGroup({
  source: 'Organizer Dashboard',
  events: {
    Load: emptyProps(),
    'Load Succeeded': props<{ page: ManagedTournamentPage; commandCenter: OrganizerCommandCenterData }>(),
    'Load Failed': emptyProps(),
    'Load Page': props<{ page: number; view?: 'active' | 'history' }>(),
    'Load Page Succeeded': props<{ page: ManagedTournamentPage }>(),
    'Load Page Failed': emptyProps(),
    'Load Command Center': emptyProps(),
    'Load Command Center Succeeded': props<{ commandCenter: OrganizerCommandCenterData }>(),
    'Load Command Center Failed': emptyProps(),
    'Load Tournament Details': props<{ tournamentId: string; tournament?: ManagedTournamentSummary }>(),
    'Load Tournament Details Succeeded': props<{
      tournamentId: string;
      matches: TournamentMatch[];
      teams: TournamentTeamDetail[];
    }>(),
    'Load Tournament Details Failed': props<{ tournamentId: string }>(),
    'Create Tournament': props<{ value: OrganizerTournamentRequest }>(),
    'Create Tournament Succeeded': props<{ tournament: Tournament }>(),
    'Update Tournament': props<{ id: string; value: UpdateOrganizerTournamentRequest }>(),
    'Update Tournament Succeeded': props<{ tournament: Tournament }>(),
    'Set Signup Status': props<{ id: string; action: 'open' | 'lock' }>(),
    'Set Signup Status Succeeded': props<{ tournament: Tournament }>(),
    'Generate Bracket': props<{ id: string }>(),
    'Generate Bracket Succeeded': props<{ tournamentId: string; matches: TournamentMatch[] }>(),
    'Start Tournament': props<{ id: string }>(),
    'Start Tournament Succeeded': props<{ tournament: Tournament }>(),
    'Cancel Tournament': props<{ id: string }>(),
    'Cancel Tournament Succeeded': props<{ tournament: Tournament }>(),
    'Schedule Match': props<{ id: string; value: ScheduleMatchRequest }>(),
    'Schedule Match Succeeded': props<{ match: TournamentMatch }>(),
    'Command Failed': props<{ errorMessage: string }>(),
  },
});
