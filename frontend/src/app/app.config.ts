import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';

import { routes } from './app.routes';
import { provideApiBaseUrl } from './core/api';
import { authFeatureKey, authReducer } from './core/auth/auth.state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideApiBaseUrl(),
    provideRouter(routes),
    provideStore({ [authFeatureKey]: authReducer }),
  ],
};
