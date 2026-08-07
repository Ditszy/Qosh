import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith } from 'rxjs';

import { AuthService } from '../../../core/auth/auth';
import { TournamentsApiService } from '../../public/tournaments/tournaments-api.service';

@Component({
  selector: 'app-organizer-dashboard',
  imports: [AsyncPipe, DatePipe, RouterLink],
  templateUrl: './organizer-dashboard.html',
  styleUrl: './organizer-dashboard.scss',
})
export class OrganizerDashboard {
  private readonly auth = inject(AuthService);
  private readonly tournamentsApi = inject(TournamentsApiService);

  protected readonly state$ = this.tournamentsApi.listTournaments().pipe(
    map((tournaments) => {
      const user = this.auth.currentUser();
      const owned = user?.role === 'ADMIN' ? tournaments : tournaments.filter((tournament) => tournament.organizerId === user?.id);

      return { status: 'loaded' as const, tournaments: owned };
    }),
    startWith({ status: 'loading' as const }),
    catchError(() => of({ status: 'error' as const })),
  );
}
