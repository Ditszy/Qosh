import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';

import { NotificationItem } from '../notification-item/notification-item';
import {
  NotificationsActions,
  selectAllNotifications,
  selectNotificationsError,
  selectNotificationsLoadingMore,
  selectNotificationsLoading,
  selectNotificationsNextCursor,
  selectUnreadNotificationCount,
} from '../store';

@Component({
  selector: 'app-notification-bell',
  imports: [AsyncPipe, NotificationItem],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
})
export class NotificationBell implements OnInit {
  private readonly store = inject(Store);

  protected readonly state$ = combineLatest({
    notifications: this.store.select(selectAllNotifications),
    unreadCount: this.store.select(selectUnreadNotificationCount),
    loading: this.store.select(selectNotificationsLoading),
    loadingMore: this.store.select(selectNotificationsLoadingMore),
    nextCursor: this.store.select(selectNotificationsNextCursor),
    error: this.store.select(selectNotificationsError),
  });

  ngOnInit(): void {
    this.store.dispatch(NotificationsActions.loadMine());
    this.store.dispatch(NotificationsActions.watchMine());
  }

  protected markRead(notificationId: string): void {
    this.store.dispatch(NotificationsActions.markRead({ notificationId }));
  }

  protected deleteNotification(notificationId: string): void {
    this.store.dispatch(NotificationsActions.delete({ notificationId }));
  }

  protected loadOlder(cursor: string | null): void {
    if (cursor) {
      this.store.dispatch(NotificationsActions.loadOlder({ cursor }));
    }
  }
}
