import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';

type NavRole = 'GUEST' | 'PLAYER' | 'ORGANIZER' | 'REFEREE' | 'SCORER' | 'ADMIN';

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
  private readonly router = inject(Router);

  protected readonly isHomeRoute = signal(this.router.url === '/');
  protected readonly currentRole = signal<NavRole>('GUEST');
  protected readonly roleOptions: { label: string; value: NavRole }[] = [
    { label: 'Gost', value: 'GUEST' },
    { label: 'Igrač', value: 'PLAYER' },
    { label: 'Organizator', value: 'ORGANIZER' },
    { label: 'Sudija', value: 'REFEREE' },
    { label: 'Zapisničar', value: 'SCORER' },
    { label: 'Admin', value: 'ADMIN' },
  ];

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

  protected setRole(role: string): void {
    const selectedRole = this.roleOptions.find((option) => option.value === role)?.value;

    if (selectedRole) {
      this.currentRole.set(selectedRole);
    }
  }
}
