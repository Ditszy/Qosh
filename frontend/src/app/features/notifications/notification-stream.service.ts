import { inject, Injectable } from '@angular/core';
import { catchError, EMPTY, map, merge, Observable, of, scan, startWith, switchMap } from 'rxjs';

import type { NotificationItem } from './notification.models';
import { NotificationsApiService } from './notifications-api.service';

export type NotificationStreamState = {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
};

type NotificationStreamEvent =
  | { type: 'loaded'; notifications: NotificationItem[] }
  | { type: 'created'; notification: NotificationItem };

@Injectable({
  providedIn: 'root',
})
export class NotificationStreamService {
  private readonly notificationsApi = inject(NotificationsApiService);

  watchMine(): Observable<NotificationStreamState> {
    return this.notificationsApi.listMine().pipe(
      switchMap((notifications) =>
        merge(
          of({ type: 'loaded', notifications } satisfies NotificationStreamEvent),
          this.notificationsApi.watchMine().pipe(
            map((message) => ({
              type: 'created',
              notification: message.data.notification,
            }) satisfies NotificationStreamEvent),
            catchError(() => EMPTY),
          ),
        ).pipe(scan(reduceNotificationState, emptyState(false, null))),
      ),
      startWith(emptyState(true, null)),
      catchError(() => of(emptyState(false, 'Notifications are not available.'))),
    );
  }
}

function reduceNotificationState(
  state: NotificationStreamState,
  event: NotificationStreamEvent,
): NotificationStreamState {
  const notifications = event.type === 'loaded'
    ? event.notifications
    : [event.notification, ...state.notifications.filter((item) => item.id !== event.notification.id)];

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.readAt).length,
    loading: false,
    error: null,
  };
}

function emptyState(loading: boolean, error: string | null): NotificationStreamState {
  return {
    notifications: [],
    unreadCount: 0,
    loading,
    error,
  };
}
