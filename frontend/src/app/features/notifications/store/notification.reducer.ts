import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { AuthActions } from '../../../core/auth/store';

import type { NotificationItem } from '../notification.models';
import { NotificationsActions } from './notification.actions';

export const notificationsFeatureKey = 'notifications';

export type NotificationsState = EntityState<NotificationItem> & {
  loading: boolean;
  loadingMore: boolean;
  nextCursor: string | null;
  unreadCount: number;
  error: string | null;
};

export const notificationsAdapter = createEntityAdapter<NotificationItem>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

export const initialNotificationsState: NotificationsState = notificationsAdapter.getInitialState({
  loading: false,
  loadingMore: false,
  nextCursor: null,
  unreadCount: 0,
  error: null,
});

export const notificationsReducer = createReducer(
  initialNotificationsState,
  on(NotificationsActions.loadMine, (state) => ({ ...state, loading: true, loadingMore: false, error: null })),
  on(NotificationsActions.loadMineSucceeded, (state, { page }) =>
    notificationsAdapter.setAll(page.items, {
      ...state,
      loading: false,
      loadingMore: false,
      nextCursor: page.nextCursor,
      unreadCount: page.unreadCount,
      error: null,
    }),
  ),
  on(NotificationsActions.loadMineFailed, (state, { error }) => ({ ...state, loading: false, loadingMore: false, error })),
  on(NotificationsActions.loadOlder, (state) => ({ ...state, loadingMore: true, error: null })),
  on(NotificationsActions.loadOlderSucceeded, (state, { page }) => capNotifications(
    notificationsAdapter.upsertMany(page.items, {
      ...state,
      loadingMore: false,
      nextCursor: page.nextCursor,
      unreadCount: page.unreadCount,
      error: null,
    }),
  )),
  on(NotificationsActions.loadOlderFailed, (state, { error }) => ({ ...state, loadingMore: false, error })),
  on(NotificationsActions.notificationReceived, (state, { notification }) => {
    const previous = state.entities[notification.id];

    return capNotifications(notificationsAdapter.upsertOne(notification, {
      ...state,
      unreadCount: !previous && !notification.readAt ? state.unreadCount + 1 : state.unreadCount,
    }));
  }),
  on(NotificationsActions.markReadSucceeded, (state, { notification }) => {
    const previous = state.entities[notification.id];
    const unreadCount = previous && !previous.readAt && notification.readAt
      ? Math.max(0, state.unreadCount - 1)
      : state.unreadCount;

    return notificationsAdapter.upsertOne(notification, { ...state, unreadCount });
  }),
  on(NotificationsActions.markReadFailed, (state, { error }) => ({ ...state, error })),
  on(NotificationsActions.deleteSucceeded, (state, { notificationId }) => {
    const notification = state.entities[notificationId];

    return notificationsAdapter.removeOne(notificationId, {
      ...state,
      unreadCount: notification && !notification.readAt ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    });
  }),
  on(NotificationsActions.deleteFailed, (state, { error }) => ({ ...state, error })),
  on(AuthActions.logout, () => initialNotificationsState),
);

function capNotifications(state: NotificationsState): NotificationsState {
  const notifications = notificationsAdapter.getSelectors().selectAll(state);

  if (notifications.length <= 100) {
    return state;
  }

  return notificationsAdapter.removeMany(
    notifications.slice(100).map((notification) => notification.id),
    state,
  );
}
