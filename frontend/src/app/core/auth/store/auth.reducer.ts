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
  on(AuthActions.currentUserUpdated, (state, { user }) => ({
    ...state,
    session: state.session ? { ...state.session, user } : null,
  })),
  on(AuthActions.logout, (state) => ({ ...state, session: null })),
);
