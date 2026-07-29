import { Component, computed, signal } from '@angular/core';

type NavRole = 'GUEST' | 'PLAYER' | 'ORGANIZER' | 'REFEREE' | 'SCORER' | 'ADMIN';

type NavItem = {
  label: string;
  href: string;
  roles: NavRole[];
};

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly currentRole = signal<NavRole>('GUEST');

  protected readonly navItems: NavItem[] = [
    { label: 'Početna', href: '#home', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'REFEREE', 'SCORER', 'ADMIN'] },
    { label: 'Turniri', href: '#tournaments', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'REFEREE', 'SCORER', 'ADMIN'] },
    { label: 'Uživo', href: '#live', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'REFEREE', 'SCORER', 'ADMIN'] },
    { label: 'Rang lista', href: '#rankings', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'REFEREE', 'SCORER', 'ADMIN'] },
    { label: 'Moj tim', href: '#team', roles: ['PLAYER'] },
    { label: 'Organizator', href: '#organizer', roles: ['ORGANIZER', 'ADMIN'] },
    { label: 'Zapisničar', href: '#scorer', roles: ['SCORER', 'ADMIN'] },
    { label: 'Izveštaji', href: '#reports', roles: ['REFEREE', 'ADMIN'] },
    { label: 'Admin', href: '#admin', roles: ['ADMIN'] },
  ];

  protected readonly visibleNavItems = computed(() =>
    this.navItems.filter((item) => item.roles.includes(this.currentRole())),
  );
}
