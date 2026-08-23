import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { catchError, map, of, startWith } from 'rxjs';

import type { MatchDetail } from './features/public/live-match/match.models';
import { MatchesApiService } from './features/public/live-match/matches-api.service';
import { AppNavbar } from './shell/app-navbar/app-navbar';

@Component({
  selector: 'app-root',
  imports: [AppNavbar, AsyncPipe, RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly matchesApi = inject(MatchesApiService);
  private readonly router = inject(Router);

  protected readonly isHomeRoute = signal(this.router.url === '/');
  protected readonly landingPreview$ = this.matchesApi.getLiveCenter().pipe(
    map(({ live, recent, upcoming }) => ({ match: live[0] ?? recent[0] ?? upcoming[0] ?? null })),
    startWith({ match: null }),
    catchError(() => of({ match: null })),
  );

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isHomeRoute.set(event.urlAfterRedirects.split('?')[0] === '/');
      }
    });
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
