import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

import type { NotificationItem as NotificationItemModel, NotificationType } from '../notification.models';

const notificationTypeLabels: Record<NotificationType, string> = {
  TEAM_INVITE: 'Poziv u tim',
  MATCH_ASSIGNMENT: 'Zaduženje za utakmicu',
  TOURNAMENT_STARTED: 'Turnir je počeo',
  MATCH_SCHEDULE_CHANGED: 'Promena rasporeda',
};

@Component({
  selector: 'app-notification-item',
  imports: [DatePipe],
  templateUrl: './notification-item.html',
  styleUrl: './notification-item.scss',
})
export class NotificationItem {
  readonly notification = input.required<NotificationItemModel>();
  readonly markReadRequested = output<string>();
  readonly deleteRequested = output<string>();

  protected notificationTypeLabel(type: NotificationType): string {
    return notificationTypeLabels[type];
  }

  protected markRead(): void {
    this.markReadRequested.emit(this.notification().id);
  }

  protected deleteNotification(): void {
    this.deleteRequested.emit(this.notification().id);
  }
}
