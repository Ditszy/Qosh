import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';

import type { NotificationItem } from './notification.models';

export const notificationsFeatureKey = 'notifications';

export type NotificationsState = EntityState<NotificationItem> & {
  loading: boolean;
  error: string | null;
};

export const notificationsAdapter = createEntityAdapter<NotificationItem>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

export const initialNotificationsState: NotificationsState = notificationsAdapter.getInitialState({
  loading: false,
  error: null,
});

export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    'Load Mine': emptyProps(),
    'Load Mine Succeeded': props<{ notifications: NotificationItem[] }>(),
    'Load Mine Failed': props<{ error: string }>(),
    'Notification Received': props<{ notification: NotificationItem }>(),
    'Mark Read': props<{ notificationId: string }>(),
    'Mark Read Succeeded': props<{ notification: NotificationItem }>(),
    'Mark Read Failed': props<{ error: string }>(),
  },
});

export const notificationsReducer = createReducer(
  initialNotificationsState,
  on(NotificationsActions.loadMine, (state) => ({ ...state, loading: true, error: null })),
  on(NotificationsActions.loadMineSucceeded, (state, { notifications }) =>
    notificationsAdapter.setAll(notifications, { ...state, loading: false, error: null }),
  ),
  on(NotificationsActions.loadMineFailed, (state, { error }) => ({ ...state, loading: false, error })),
  on(NotificationsActions.notificationReceived, (state, { notification }) =>
    notificationsAdapter.upsertOne(notification, state),
  ),
  on(NotificationsActions.markReadSucceeded, (state, { notification }) =>
    notificationsAdapter.upsertOne(notification, state),
  ),
  on(NotificationsActions.markReadFailed, (state, { error }) => ({ ...state, error })),
);

export const selectNotificationsState = createFeatureSelector<NotificationsState>(notificationsFeatureKey);

const notificationSelectors = notificationsAdapter.getSelectors(selectNotificationsState);

export const selectAllNotifications = notificationSelectors.selectAll;
export const selectNotificationsLoading = createSelector(selectNotificationsState, (state) => state.loading);
export const selectNotificationsError = createSelector(selectNotificationsState, (state) => state.error);
export const selectUnreadNotificationCount = createSelector(
  selectAllNotifications,
  (notifications) => notifications.filter((notification) => !notification.readAt).length,
);
export const selectLatestNotifications = createSelector(
  selectAllNotifications,
  (notifications) => notifications.slice(0, 5),
);
