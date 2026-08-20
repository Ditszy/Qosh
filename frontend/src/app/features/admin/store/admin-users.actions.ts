import { createActionGroup, emptyProps, props } from '@ngrx/store';

import type { AdminCreateUserRequest, AdminUserStats } from '../admin-users-api.service';
import type { AdminUser, AdminUserSearchFilters } from '../admin-users.models';

export const AdminUsersActions = createActionGroup({
  source: 'Admin Users',
  events: {
    'Load Stats': emptyProps(),
    'Load Stats Succeeded': props<{ stats: AdminUserStats }>(),
    'Load Stats Failed': props<{ error: string }>(),
    'Search Filters Changed': props<{ filters: AdminUserSearchFilters }>(),
    'Search Users Skipped': emptyProps(),
    'Search Users Succeeded': props<{ users: AdminUser[] }>(),
    'Search Users Failed': props<{ error: string }>(),
    'Select User': props<{ userId: string }>(),
    'Clear Selected User': emptyProps(),
    'Create User': props<{ payload: AdminCreateUserRequest }>(),
    'Create User Succeeded': props<{ user: AdminUser }>(),
    'Create User Failed': props<{ error: string }>(),
  },
});
