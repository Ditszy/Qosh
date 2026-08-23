import { AsyncPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';

import { AuthService, UserRole } from '../../core/auth/auth';
import { NotificationBell } from '../../features/notifications';
import { PlayerProfileSearchService, PublicUser } from '../../features/statistics';

type NavRole = 'GUEST' | UserRole;

type NavItem = {
  label: string;
  path: string;
  roles: NavRole[];
};

@Component({
  selector: 'app-navbar',
  imports: [AsyncPipe, NotificationBell, ReactiveFormsModule, RouterLink],
  templateUrl: './app-navbar.html',
  styleUrl: './app-navbar.scss',
})
export class AppNavbar {
  private readonly authService = inject(AuthService);
  private readonly playerProfileSearch = inject(PlayerProfileSearchService);
  private readonly router = inject(Router);

  protected readonly playerSearchControl = new FormControl('', { nonNullable: true });
  protected readonly playerSearchState$ = this.playerProfileSearch.watch(
    this.playerSearchControl.valueChanges.pipe(startWith(this.playerSearchControl.value)),
  );
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

  protected logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/');
  }

  protected openPlayerProfile(player: PublicUser): void {
    this.playerSearchControl.setValue('');
    void this.router.navigateByUrl(`/profiles/${player.id}`);
  }
}
