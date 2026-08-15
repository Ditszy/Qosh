import { createReducer, on } from '@ngrx/store';

import type { AuthSession } from '../auth';
import { AuthActions } from './auth.actions';

export const authFeatureKey = 'auth';

export type AuthState = {
  session: AuthSession | null;
};

export const initialAuthState: AuthState = {
  session: null,
};

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.loginSucceeded, (state, { session }) => ({ ...state, session })),
  on(AuthActions.logout, (state) => ({ ...state, session: null })),
);
