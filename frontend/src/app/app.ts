import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthService, UserRole } from './core/auth/auth';

type NavRole = 'GUEST' | UserRole;

type NavItem = {
  label: string;
  path: string;
  roles: NavRole[];
};

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isHomeRoute = signal(this.router.url === '/');
  protected readonly currentUser = this.authService.currentUser;
  protected readonly currentRole = computed<NavRole>(() => this.currentUser()?.role ?? 'GUEST');
  protected readonly accountLabel = computed(() => {
    const user = this.currentUser();

    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  protected readonly navItems: NavItem[] = [
    { label: 'Početna', path: '/', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'REFEREE', 'SCORER', 'ADMIN'] },
    { label: 'Turniri', path: '/tournaments', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'REFEREE', 'SCORER', 'ADMIN'] },
    { label: 'Uživo', path: '/live', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'REFEREE', 'SCORER', 'ADMIN'] },
    { label: 'Rang lista', path: '/rankings', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'REFEREE', 'SCORER', 'ADMIN'] },
    { label: 'Moj tim', path: '/my-team', roles: ['PLAYER'] },
    { label: 'Organizator', path: '/organizer', roles: ['ORGANIZER', 'ADMIN'] },
    { label: 'Zapisničar', path: '/scorer', roles: ['SCORER', 'ADMIN'] },
    { label: 'Izveštaji', path: '/reports', roles: ['REFEREE', 'ADMIN'] },
    { label: 'Admin', path: '/admin', roles: ['ADMIN'] },
  ];

  protected readonly visibleNavItems = computed(() =>
    this.navItems.filter((item) => item.roles.includes(this.currentRole())),
  );

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isHomeRoute.set(event.urlAfterRedirects.split('?')[0] === '/');
      }
    });
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/');
  }
}
