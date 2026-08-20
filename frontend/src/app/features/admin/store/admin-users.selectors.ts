import { createFeatureSelector, createSelector } from '@ngrx/store';

import { adminUsersFeatureKey, type AdminUsersState } from './admin-users.reducer';

export const selectAdminUsersState = createFeatureSelector<AdminUsersState>(adminUsersFeatureKey);

export const selectAdminUserStatsState = createSelector(selectAdminUsersState, (state) => ({
  stats: state.stats,
  loading: state.statsLoading,
  error: state.statsError,
}));

export const selectAdminUserSearchState = createSelector(selectAdminUsersState, (state) => ({
  users: state.users,
  loading: state.usersLoading,
  error: state.usersError,
  needsQuery: state.needsQuery,
}));

export const selectAdminCreateUserState = createSelector(selectAdminUsersState, (state) => ({
  loading: state.createUserLoading,
  status: state.createUserStatus,
  message: state.createUserMessage,
}));
