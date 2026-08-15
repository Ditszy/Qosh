import { createFeatureSelector, createSelector } from '@ngrx/store';

import { notificationsAdapter, notificationsFeatureKey, type NotificationsState } from './notification.reducer';

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
