import { createFeatureSelector, createSelector } from '@ngrx/store';

import { authFeatureKey, type AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>(authFeatureKey);
export const selectAuthSession = createSelector(selectAuthState, (state) => state.session);
export const selectCurrentUser = createSelector(selectAuthSession, (session) => session?.user ?? null);
export const selectAccessToken = createSelector(selectAuthSession, (session) => session?.access_token ?? null);
