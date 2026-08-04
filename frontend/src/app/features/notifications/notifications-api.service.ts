import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../core/api';
import { LiveStreamService } from '../../core/live';
import type { NotificationItem, NotificationLivePayload, NotificationLiveStreamMessage } from './notification.models';

@Injectable({
  providedIn: 'root',
})
export class NotificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly liveStream = inject(LiveStreamService);

  listMine(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(this.apiUrl.build('/notifications'));
  }

  markAsRead(notificationId: string): Observable<NotificationItem> {
    return this.http.patch<NotificationItem>(this.apiUrl.build(`/notifications/${notificationId}/read`), {});
  }

  watchMine(): Observable<NotificationLiveStreamMessage> {
    return this.liveStream.connect<NotificationLivePayload>('/notifications/live', {
      authenticated: true,
    }) as Observable<NotificationLiveStreamMessage>;
  }
}
