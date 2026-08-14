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
import { authFeatureKey, authReducer } from './core/auth/auth.state';
import * as notificationEffects from './features/notifications/notification.effects';
import { notificationsFeatureKey, notificationsReducer } from './features/notifications/notification.state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    provideApiBaseUrl(),
    provideRouter(routes),
    provideStore({
      [authFeatureKey]: authReducer,
      [notificationsFeatureKey]: notificationsReducer,
    }),
    provideEffects(notificationEffects),
    provideAppInitializer(() => {
      const authService = inject(AuthService);

      return firstValueFrom(authService.refreshSession().pipe(catchError(() => of(null))));
    }),
  ],
};
