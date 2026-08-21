import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, debounceTime, distinctUntilChanged, exhaustMap, map, of, switchMap } from 'rxjs';

import { AdminUsersApiService } from '../admin-users-api.service';
import { AdminUsersActions } from './admin-users.actions';
import { normalizeSearchFilters, searchFiltersEqual } from './admin-users.reducer';

export const loadAdminUserStats = createEffect(
  (actions$ = inject(Actions), adminUsersApi = inject(AdminUsersApiService)) =>
    actions$.pipe(
      ofType(AdminUsersActions.loadStats),
      switchMap(() =>
        adminUsersApi.getUserStats().pipe(
          map((stats) => AdminUsersActions.loadStatsSucceeded({ stats })),
          catchError(() =>
            of(AdminUsersActions.loadStatsFailed({ error: 'Nije moguće učitati statistiku korisnika.' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const searchAdminUsers = createEffect(
  (actions$ = inject(Actions), adminUsersApi = inject(AdminUsersApiService)) =>
    actions$.pipe(
      ofType(AdminUsersActions.searchFiltersChanged),
      map(({ filters }) => normalizeSearchFilters(filters)),
      debounceTime(250),
      distinctUntilChanged(searchFiltersEqual),
      switchMap((filters) => {
        if (filters.query.length < 2) {
          return of(AdminUsersActions.searchUsersSkipped());
        }

        return adminUsersApi.searchUsers({
          q: filters.query,
          ...(filters.role !== 'ALL' ? { role: filters.role } : {}),
        }).pipe(
          map((users) => AdminUsersActions.searchUsersSucceeded({ users })),
          catchError(() => of(AdminUsersActions.searchUsersFailed({ error: 'Nije moguće učitati korisnike.' }))),
        );
      }),
    ),
  { functional: true },
);

export const createAdminUser = createEffect(
  (actions$ = inject(Actions), adminUsersApi = inject(AdminUsersApiService)) =>
    actions$.pipe(
      ofType(AdminUsersActions.createUser),
      exhaustMap(({ payload }) =>
        adminUsersApi.createUser(payload).pipe(
          map((user) => AdminUsersActions.createUserSucceeded({ user })),
          catchError((error: unknown) => of(AdminUsersActions.createUserFailed({ error: createUserError(error) }))),
        ),
      ),
    ),
  { functional: true },
);

export const runAdminAccountAction = createEffect(
  (actions$ = inject(Actions), adminUsersApi = inject(AdminUsersApiService)) =>
    actions$.pipe(
      ofType(AdminUsersActions.accountAction),
      exhaustMap(({ userId, action }) =>
        adminAccountActionRequest(adminUsersApi, userId, action).pipe(
          map((user) => AdminUsersActions.accountActionSucceeded({ user, action })),
          catchError((error: unknown) => of(AdminUsersActions.accountActionFailed({
            error: accountActionError(error, action),
          }))),
        ),
      ),
    ),
  { functional: true },
);

function adminAccountActionRequest(
  adminUsersApi: AdminUsersApiService,
  userId: string,
  action: 'activate' | 'deactivate' | 'delete',
) {
  if (action === 'activate') {
    return adminUsersApi.activateUser(userId);
  }

  if (action === 'deactivate') {
    return adminUsersApi.deactivateUser(userId);
  }

  return adminUsersApi.deleteUser(userId);
}

function accountActionError(error: unknown, action: 'activate' | 'deactivate' | 'delete'): string {
  if (error instanceof HttpErrorResponse && error.status === 400 && action === 'delete') {
    return 'Korisnik ima podatke u aplikaciji. Deaktiviraj nalog umesto brisanja.';
  }

  if (error instanceof HttpErrorResponse && error.status === 404) {
    return 'Korisnik nije pronaen.';
  }

  return 'Nije moguće izvršiti akciju nad korisnikom.';
}

function createUserError(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 409) {
    return 'Email ili korisničko ime je već zauzeto.';
  }

  return 'Nije moguće kreirati korisnika.';
}
