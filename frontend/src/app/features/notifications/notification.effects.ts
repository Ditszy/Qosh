import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, EMPTY, exhaustMap, map, of, switchMap } from 'rxjs';

import { NotificationsApiService } from './notifications-api.service';
import { NotificationsActions } from './notification.state';

export const loadMineNotifications = createEffect(
  (actions$ = inject(Actions), notificationsApi = inject(NotificationsApiService)) =>
    actions$.pipe(
      ofType(NotificationsActions.loadMine),
      switchMap(() =>
        notificationsApi.listMine().pipe(
          map((notifications) => NotificationsActions.loadMineSucceeded({ notifications })),
          catchError(() =>
            of(NotificationsActions.loadMineFailed({ error: 'Notifications are not available.' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const watchMineNotifications = createEffect(
  (actions$ = inject(Actions), notificationsApi = inject(NotificationsApiService)) =>
    actions$.pipe(
      ofType(NotificationsActions.watchMine),
      exhaustMap(() =>
        notificationsApi.watchMine().pipe(
          map((message) =>
            NotificationsActions.notificationReceived({ notification: message.data.notification }),
          ),
          catchError(() => EMPTY),
        ),
      ),
    ),
  { functional: true },
);
