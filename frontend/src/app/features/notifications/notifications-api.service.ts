import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../core/api';
import { LiveStreamService } from '../../core/live';
import type { NotificationItem, NotificationLivePayload, NotificationLiveStreamMessage, NotificationPage } from './notification.models';

@Injectable({
  providedIn: 'root',
})
export class NotificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly liveStream = inject(LiveStreamService);

  listMine(options: { limit?: number; cursor?: string } = {}): Observable<NotificationPage> {
    let params = new HttpParams();

    if (options.limit !== undefined) {
      params = params.set('limit', options.limit);
    }

    if (options.cursor) {
      params = params.set('cursor', options.cursor);
    }

    return this.http.get<NotificationPage>(this.apiUrl.build('/notifications'), { params });
  }

  markAsRead(notificationId: string): Observable<NotificationItem> {
    return this.http.patch<NotificationItem>(this.apiUrl.build(`/notifications/${notificationId}/read`), {});
  }

  delete(notificationId: string): Observable<NotificationItem> {
    return this.http.delete<NotificationItem>(this.apiUrl.build(`/notifications/${notificationId}`));
  }

  watchMine(): Observable<NotificationLiveStreamMessage> {
    return this.liveStream.connect<NotificationLivePayload>('/notifications/live', {
      authenticated: true,
    }) as Observable<NotificationLiveStreamMessage>;
  }
}
