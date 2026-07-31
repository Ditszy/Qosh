import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService, UserRole } from './auth';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated() || router.createUrlTree(['/login']);
};

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();
  const roles = route.data['roles'] as UserRole[] | undefined;

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  return roles?.includes(user.role) ? true : router.createUrlTree(['/tournaments']);
};
