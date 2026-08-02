import { inject, Injectable, NgZone } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';

import { ApiUrlService } from '../api';
import { AuthService } from '../auth/auth';

export type LiveStreamMessage<T = unknown> = {
  type: string;
  data: T;
  id?: string;
  retry?: number;
};

export type LiveStreamOptions = {
  authenticated?: boolean;
};

type ParsedSseFrame = {
  type: string;
  data: string;
  id?: string;
  retry?: number;
};

@Injectable({
  providedIn: 'root',
})
export class LiveStreamService {
  private readonly apiUrl = inject(ApiUrlService);
  private readonly auth = inject(AuthService);
  private readonly zone = inject(NgZone);

  connect<T = unknown>(path: string, options: LiveStreamOptions = {}): Observable<LiveStreamMessage<T>> {
    return new Observable<LiveStreamMessage<T>>((subscriber) => {
      const controller = new AbortController();

      void this.open<T>(path, options, controller, subscriber);

      return () => controller.abort();
    });
  }

  private async open<T>(
    path: string,
    options: LiveStreamOptions,
    controller: AbortController,
    subscriber: Subscriber<LiveStreamMessage<T>>,
  ): Promise<void> {
    const headers = new Headers({
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    });

    if (options.authenticated) {
      const token = this.auth.accessToken();

      if (!token) {
        // this.emitError(subscriber, new Error('An authenticated live stream requires a logged-in session.'));
        return;
      }

      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const response = await fetch(this.apiUrl.build(path), {
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Live stream request failed with status ${response.status}.`);
      }

      if (!response.body) {
        throw new Error('Live stream response did not include a readable body.');
      }

      // await this.readStream<T>(response.body, subscriber);
      // this.emitComplete(subscriber);
    } catch (error) {
      if (!controller.signal.aborted) {
        //this.emitError(subscriber, error);
      }
    }
  }


}
