import type { AuthUser, UserRole } from '../../core/auth/auth';

export type AdminUser = AuthUser & {
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminUserSearchRole = UserRole | 'ALL';

export type AdminUserSearchFilters = {
  query: string;
  role: AdminUserSearchRole;
};

export type AdminAccountAction = 'activate' | 'deactivate' | 'delete';
