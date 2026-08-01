import { InjectionToken, Provider } from '@angular/core';

const defaultApiBaseUrl = 'http://localhost:3000';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => defaultApiBaseUrl,
});

export function provideApiBaseUrl(baseUrl = defaultApiBaseUrl): Provider {
  return {
    provide: API_BASE_URL,
    useValue: normalizeApiBaseUrl(baseUrl),
  };
}

function normalizeApiBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}
