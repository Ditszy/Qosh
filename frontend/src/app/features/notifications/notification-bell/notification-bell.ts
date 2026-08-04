import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { NotificationStreamService } from '../notification-stream.service';

@Component({
  selector: 'app-notification-bell',
  imports: [AsyncPipe, DatePipe],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
})
export class NotificationBell {
  private readonly notificationStream = inject(NotificationStreamService);

  protected readonly state$ = this.notificationStream.watchMine();
}
