import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { catchError, firstValueFrom, of } from 'rxjs';

import { routes } from './app.routes';
import { provideApiBaseUrl } from './core/api';
import { AuthService } from './core/auth/auth';
import { authTokenInterceptor } from './core/auth/auth-token.interceptor';
import { authFeatureKey, authReducer } from './core/auth/store';
import * as notificationEffects from './features/notifications/store/notification.effects';
import { notificationsFeatureKey, notificationsReducer } from './features/notifications/store';
import * as liveMatchEffects from './features/public/live-match/store/live-match.effects';
import { liveMatchFeatureKey, liveMatchReducer } from './features/public/live-match/store';
import * as scorerEffects from './features/scorer/store/scorer.effects';
import { scorerFeatureKey, scorerReducer } from './features/scorer/store';
import * as statisticsEffects from './features/statistics/store/statistics.effects';
import { statisticsFeatureKey, statisticsReducer } from './features/statistics/store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    provideApiBaseUrl(),
    provideRouter(routes),
    provideStore({
      [authFeatureKey]: authReducer,
      [liveMatchFeatureKey]: liveMatchReducer,
      [notificationsFeatureKey]: notificationsReducer,
      [scorerFeatureKey]: scorerReducer,
      [statisticsFeatureKey]: statisticsReducer,
    }),
    provideEffects(liveMatchEffects),
    provideEffects(notificationEffects),
    provideEffects(scorerEffects),
    provideEffects(statisticsEffects),
    provideAppInitializer(() => {
      const authService = inject(AuthService);

      return firstValueFrom(authService.refreshSession().pipe(catchError(() => of(null))));
    }),
  ],
};
