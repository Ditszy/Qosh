import { createActionGroup, emptyProps, props } from '@ngrx/store';

import type { AuthSession, AuthUser } from '../auth';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login Succeeded': props<{ session: AuthSession }>(),
    'Current User Updated': props<{ user: AuthUser }>(),
    Logout: emptyProps(),
  },
});
