import { createActionGroup, emptyProps, props } from '@ngrx/store';

import type { OrganizerTournamentWithMatches } from './organizer-dashboard.reducer';

export const OrganizerDashboardActions = createActionGroup({
  source: 'Organizer Dashboard',
  events: {
    Load: emptyProps(),
    'Load Succeeded': props<{ tournaments: OrganizerTournamentWithMatches[] }>(),
    'Load Failed': emptyProps(),
  },
});
