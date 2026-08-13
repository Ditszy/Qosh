import { AsyncPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { catchError, map, of, startWith } from 'rxjs';

import { AuthService, UserRole } from './core/auth/auth';
import { NotificationBell } from './features/notifications';
import type { MatchDetail } from './features/public/live-match/match.models';
import { MatchesApiService } from './features/public/live-match/matches-api.service';
import { PlayerProfileSearchService, PublicUser } from './features/statistics';

type NavRole = 'GUEST' | UserRole;

type NavItem = {
  label: string;
  path: string;
  roles: NavRole[];
};

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, NotificationBell, ReactiveFormsModule, RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly matchesApi = inject(MatchesApiService);
  private readonly playerProfileSearch = inject(PlayerProfileSearchService);
  private readonly router = inject(Router);

  protected readonly isHomeRoute = signal(this.router.url === '/');
  protected readonly playerSearchControl = new FormControl('', { nonNullable: true });
  protected readonly playerSearchState$ = this.playerProfileSearch.watch(
    this.playerSearchControl.valueChanges.pipe(startWith(this.playerSearchControl.value)),
  );
  protected readonly currentUser = this.authService.currentUser;
  protected readonly currentRole = computed<NavRole>(() => this.currentUser()?.role ?? 'GUEST');
  protected readonly landingPreview$ = this.matchesApi.getLiveCenter().pipe(
    map(({ live, recent, upcoming }) => ({ match: live[0] ?? recent[0] ?? upcoming[0] ?? null })),
    startWith({ match: null }),
    catchError(() => of({ match: null })),
  );
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

  protected openPlayerProfile(player: PublicUser): void {
    this.playerSearchControl.setValue('');
    void this.router.navigateByUrl(`/profiles/${player.id}`);
  }

  protected landingTeamName(match: MatchDetail | null, slot: 'A' | 'B'): string {
    if (!match) {
      return slot === 'A' ? 'Blok 21' : 'Tigrovi';
    }

    return (slot === 'A' ? match.teamA?.name : match.teamB?.name) ?? 'TBD';
  }

  protected landingClockLabel(match: MatchDetail | null): string {
    if (!match) {
      return '04:18';
    }

    const minutes = Math.floor(match.clockRemainingSeconds / 60);
    const seconds = match.clockRemainingSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  protected landingStatusLabel(match: MatchDetail | null): string {
    if (!match) {
      return 'Demo pregled';
    }

    return match.status === 'LIVE' ? 'U toku' : match.status === 'FINAL' ? 'Završeno' : 'Zakazano';
  }

  protected landingPreviewLabel(match: MatchDetail | null): string {
    if (!match) {
      return 'Uživo centar';
    }

    return match.status === 'LIVE' ? 'Uživo centar' : match.status === 'FINAL' ? 'Poslednji meč' : 'Sledeći meč';
  }

  protected landingIsLeader(match: MatchDetail | null, slot: 'A' | 'B'): boolean {
    if (!match) {
      return slot === 'B';
    }

    return match.status !== 'SCHEDULED' && (slot === 'A' ? match.teamAScore >= match.teamBScore : match.teamBScore > match.teamAScore);
  }
}
