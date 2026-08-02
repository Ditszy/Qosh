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
        this.emitError(subscriber, new Error('An authenticated live stream requires a logged-in session.'));
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

      await this.readStream<T>(response.body, subscriber);
      this.emitComplete(subscriber);
    } catch (error) {
      if (!controller.signal.aborted) {
        this.emitError(subscriber, error);
      }
    }
  }

  private async readStream<T>(
    body: ReadableStream<Uint8Array>,
    subscriber: Subscriber<LiveStreamMessage<T>>,
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      buffer = this.emitBufferedMessages(buffer, subscriber);
    }

    buffer += decoder.decode();
    this.emitBufferedMessages(`${buffer}\n\n`, subscriber);
  }

  private emitBufferedMessages<T>(
    buffer: string,
    subscriber: Subscriber<LiveStreamMessage<T>>,
  ): string {
    const normalized = buffer.replace(/\r\n/g, '\n');
    const frames = normalized.split('\n\n');
    const remaining = frames.pop() ?? '';

    for (const frame of frames) {
      const parsed = this.parseFrame(frame);

      if (parsed) {
        this.emitNext(subscriber, {
          type: parsed.type,
          data: this.parseData<T>(parsed.data),
          id: parsed.id,
          retry: parsed.retry,
        });
      }
    }

    return remaining;
  }

  private parseFrame(frame: string): ParsedSseFrame | null {
    let type = 'message';
    let id: string | undefined;
    let retry: number | undefined;
    const data: string[] = [];

    for (const line of frame.split('\n')) {
      if (!line || line.startsWith(':')) {
        continue;
      }

      const separatorIndex = line.indexOf(':');
      const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
      const rawValue = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1);
      const value = rawValue.startsWith(' ') ? rawValue.slice(1) : rawValue;

      if (field === 'event') {
        type = value;
      } else if (field === 'data') {
        data.push(value);
      } else if (field === 'id') {
        id = value;
      } else if (field === 'retry') {
        const parsedRetry = Number(value);
        retry = Number.isNaN(parsedRetry) ? undefined : parsedRetry;
      }
    }

    if (!data.length) {
      return null;
    }

    return {
      type,
      data: data.join('\n'),
      id,
      retry,
    };
  }

  private parseData<T>(data: string): T {
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as T;
    }
  }

  private emitNext<T>(
    subscriber: Subscriber<LiveStreamMessage<T>>,
    message: LiveStreamMessage<T>,
  ): void {
    this.zone.run(() => subscriber.next(message));
  }

  private emitError<T>(
    subscriber: Subscriber<LiveStreamMessage<T>>,
    error: unknown,
  ): void {
    this.zone.run(() => subscriber.error(error));
  }

  private emitComplete<T>(subscriber: Subscriber<LiveStreamMessage<T>>): void {
    this.zone.run(() => subscriber.complete());
  }
}
