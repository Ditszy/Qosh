import { createReducer, on } from '@ngrx/store';

import type { AuthUser, UserRole } from '../../../core/auth/auth';
import type { AdminUserStats } from '../admin-users-api.service';
import type { AdminUserSearchFilters } from '../admin-users.models';
import { AdminUsersActions } from './admin-users.actions';

export const adminUsersFeatureKey = 'adminUsers';

export type AdminUsersState = {
  stats: AdminUserStats | null;
  statsLoading: boolean;
  statsError: string;
  searchFilters: AdminUserSearchFilters;
  users: AuthUser[];
  usersLoading: boolean;
  usersError: string;
  needsQuery: boolean;
  createUserLoading: boolean;
  createUserStatus: 'success' | 'error' | '';
  createUserMessage: string;
};

export const initialAdminUsersState: AdminUsersState = {
  stats: null,
  statsLoading: false,
  statsError: '',
  searchFilters: {
    query: '',
    role: 'ALL',
  },
  users: [],
  usersLoading: false,
  usersError: '',
  needsQuery: true,
  createUserLoading: false,
  createUserStatus: '',
  createUserMessage: '',
};

export const adminUsersReducer = createReducer(
  initialAdminUsersState,
  on(AdminUsersActions.loadStats, (state) => ({
    ...state,
    statsLoading: true,
    statsError: '',
  })),
  on(AdminUsersActions.loadStatsSucceeded, (state, { stats }) => ({
    ...state,
    stats,
    statsLoading: false,
    statsError: '',
  })),
  on(AdminUsersActions.loadStatsFailed, (state, { error }) => ({
    ...state,
    statsLoading: false,
    statsError: error,
  })),
  on(AdminUsersActions.searchFiltersChanged, (state, { filters }) => {
    const normalizedFilters = normalizeSearchFilters(filters);
    const canSearch = normalizedFilters.query.length >= 2;

    return {
      ...state,
      searchFilters: normalizedFilters,
      users: canSearch ? state.users : [],
      usersLoading: canSearch,
      usersError: '',
      needsQuery: !canSearch,
    };
  }),
  on(AdminUsersActions.searchUsersSkipped, (state) => ({
    ...state,
    users: [],
    usersLoading: false,
    usersError: '',
    needsQuery: true,
  })),
  on(AdminUsersActions.searchUsersSucceeded, (state, { users }) => ({
    ...state,
    users,
    usersLoading: false,
    usersError: '',
    needsQuery: false,
  })),
  on(AdminUsersActions.searchUsersFailed, (state, { error }) => ({
    ...state,
    users: [],
    usersLoading: false,
    usersError: error,
    needsQuery: false,
  })),
  on(AdminUsersActions.createUser, (state) => ({
    ...state,
    createUserLoading: true,
    createUserStatus: '',
    createUserMessage: '',
  })),
  on(AdminUsersActions.createUserSucceeded, (state, { user }) => ({
    ...state,
    stats: incrementStats(state.stats, user.role),
    users: userMatchesSearch(user, state.searchFilters) ? [user, ...state.users].slice(0, 8) : state.users,
    createUserLoading: false,
    createUserStatus: 'success',
    createUserMessage: 'Korisnik je kreiran.',
  })),
  on(AdminUsersActions.createUserFailed, (state, { error }) => ({
    ...state,
    createUserLoading: false,
    createUserStatus: 'error',
    createUserMessage: error,
  })),
);

export function normalizeSearchFilters(filters: AdminUserSearchFilters): AdminUserSearchFilters {
  return {
    query: filters.query.trim(),
    role: filters.role,
  };
}

export function searchFiltersEqual(left: AdminUserSearchFilters, right: AdminUserSearchFilters): boolean {
  return left.query === right.query && left.role === right.role;
}

function incrementStats(stats: AdminUserStats | null, role: UserRole): AdminUserStats | null {
  if (!stats) {
    return stats;
  }

  const roleKeyByRole: Record<UserRole, keyof Omit<AdminUserStats, 'totalUsers'>> = {
    PLAYER: 'players',
    ORGANIZER: 'organizers',
    REFEREE: 'referees',
    SCORER: 'scorers',
    ADMIN: 'admins',
  };
  const roleKey = roleKeyByRole[role];

  return {
    ...stats,
    totalUsers: stats.totalUsers + 1,
    [roleKey]: stats[roleKey] + 1,
  };
}

function userMatchesSearch(user: AuthUser, filters: AdminUserSearchFilters): boolean {
  const query = filters.query.toLocaleLowerCase();

  if (query.length < 2 || (filters.role !== 'ALL' && user.role !== filters.role)) {
    return false;
  }

  return [user.username, user.firstName, user.lastName, user.email]
    .some((value) => value.toLocaleLowerCase().includes(query));
}
