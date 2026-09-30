import { createFeatureSelector, createSelector } from '@ngrx/store';

import { notificationsAdapter, notificationsFeatureKey, type NotificationsState } from './notification.reducer';

export const selectNotificationsState = createFeatureSelector<NotificationsState>(notificationsFeatureKey);

const notificationSelectors = notificationsAdapter.getSelectors(selectNotificationsState);

export const selectAllNotifications = notificationSelectors.selectAll;
export const selectNotificationsLoading = createSelector(selectNotificationsState, (state) => state.loading);
export const selectNotificationsLoadingMore = createSelector(selectNotificationsState, (state) => state.loadingMore);
export const selectNotificationsNextCursor = createSelector(selectNotificationsState, (state) => state.nextCursor);
export const selectNotificationsError = createSelector(selectNotificationsState, (state) => state.error);
export const selectUnreadNotificationCount = createSelector(
  selectNotificationsState,
  (state) => state.unreadCount,
);
export const selectLatestNotifications = createSelector(
  selectAllNotifications,
  (notifications) => notifications.slice(0, 5),
);
