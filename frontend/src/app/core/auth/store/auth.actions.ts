import { createActionGroup, emptyProps, props } from '@ngrx/store';

import type { AuthSession } from '../auth';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login Succeeded': props<{ session: AuthSession }>(),
    Logout: emptyProps(),
  },
});
