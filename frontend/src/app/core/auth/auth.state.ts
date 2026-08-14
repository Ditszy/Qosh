import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';

import type { AuthSession } from './auth';

export const authFeatureKey = 'auth';

export type AuthState = {
  session: AuthSession | null;
};

export const initialAuthState: AuthState = {
  session: null,
};

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login Succeeded': props<{ session: AuthSession }>(),
    Logout: emptyProps(),
  },
});

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.loginSucceeded, (state, { session }) => ({ ...state, session })),
  on(AuthActions.logout, (state) => ({ ...state, session: null })),
);

export const selectAuthState = createFeatureSelector<AuthState>(authFeatureKey);
export const selectAuthSession = createSelector(selectAuthState, (state) => state.session);
export const selectCurrentUser = createSelector(selectAuthSession, (session) => session?.user ?? null);
export const selectAccessToken = createSelector(selectAuthSession, (session) => session?.access_token ?? null);
