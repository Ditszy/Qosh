import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';

import type { NotificationItem } from '../notification.models';
import { NotificationsActions } from './notification.actions';

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
  on(NotificationsActions.deleteSucceeded, (state, { notificationId }) =>
    notificationsAdapter.removeOne(notificationId, state),
  ),
  on(NotificationsActions.deleteFailed, (state, { error }) => ({ ...state, error })),
);
