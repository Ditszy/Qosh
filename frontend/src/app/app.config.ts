import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';

import { routes } from './app.routes';
import { provideApiBaseUrl } from './core/api';
import { authTokenInterceptor } from './core/auth/auth-token.interceptor';
import { authFeatureKey, authReducer } from './core/auth/auth.state';
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
  ],
};
