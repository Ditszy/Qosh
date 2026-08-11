import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';

import {
  NotificationsActions,
  selectLatestNotifications,
  selectNotificationsError,
  selectNotificationsLoading,
  selectUnreadNotificationCount,
} from '../notification.state';
import type { NotificationType } from '../notification.models';

const notificationTypeLabels: Record<NotificationType, string> = {
  TEAM_INVITE: 'Poziv u tim',
  MATCH_ASSIGNMENT: 'Zaduženje za utakmicu',
  TOURNAMENT_STARTED: 'Turnir je počeo',
  MATCH_SCHEDULE_CHANGED: 'Promena rasporeda',
};

@Component({
  selector: 'app-notification-bell',
  imports: [AsyncPipe, DatePipe],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
})
export class NotificationBell implements OnInit {
  private readonly store = inject(Store);

  protected readonly state$ = combineLatest({
    notifications: this.store.select(selectLatestNotifications),
    unreadCount: this.store.select(selectUnreadNotificationCount),
    loading: this.store.select(selectNotificationsLoading),
    error: this.store.select(selectNotificationsError),
  });

  ngOnInit(): void {
    this.store.dispatch(NotificationsActions.loadMine());
    this.store.dispatch(NotificationsActions.watchMine());
  }

  protected markRead(notificationId: string): void {
    this.store.dispatch(NotificationsActions.markRead({ notificationId }));
  }

  protected notificationTypeLabel(type: NotificationType): string {
    return notificationTypeLabels[type];
  }
}
