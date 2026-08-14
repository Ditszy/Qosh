import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';

import { API_BASE_URL } from '../api';
import { AuthService, AuthSession } from './auth';
import { selectAccessToken } from './auth.state';

let refreshSessionRequest$: Observable<AuthSession> | null = null;

const getRefreshSessionRequest = (authService: AuthService): Observable<AuthSession> => {
  refreshSessionRequest$ ??= authService.refreshSession().pipe(
    finalize(() => {
      refreshSessionRequest$ = null;
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  return refreshSessionRequest$;
};

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const apiBaseUrl = inject(API_BASE_URL);
  const store = inject(Store);
  const authService = inject(AuthService);
  const accessToken = store.selectSignal(selectAccessToken)();
  const isApiRequest = request.url.startsWith(apiBaseUrl);
  const isAuthRequest = request.url.startsWith(`${apiBaseUrl}/auth/`);

  if (!isApiRequest || isAuthRequest) {
    return next(request);
  }

  const authorizedRequest = accessToken
    ? request.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return getRefreshSessionRequest(authService).pipe(
        catchError((refreshError: unknown) => {
          authService.clearSession();

          return throwError(() => refreshError);
        }),
        switchMap((session) =>
          next(
            request.clone({
              setHeaders: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }),
          ),
        ),
      );
    }),
  );
};
