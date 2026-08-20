import type { UserRole } from '../../core/auth/auth';

export type AdminUserSearchRole = UserRole | 'ALL';

export type AdminUserSearchFilters = {
  query: string;
  role: AdminUserSearchRole;
};
