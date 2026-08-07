import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, map, of, startWith, Subject, switchMap } from 'rxjs';

import { AuthService } from '../../../core/auth/auth';
import { OrganizerTournamentsApiService } from '../organizer-tournaments-api.service';
import { TournamentsApiService } from '../../public/tournaments/tournaments-api.service';

@Component({
  selector: 'app-organizer-dashboard',
  imports: [AsyncPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './organizer-dashboard.html',
  styleUrl: './organizer-dashboard.scss',
})
export class OrganizerDashboard {
  private readonly auth = inject(AuthService);
  private readonly organizerApi = inject(OrganizerTournamentsApiService);
  private readonly tournamentsApi = inject(TournamentsApiService);
  private readonly reload$ = new Subject<void>();

  protected readonly isSubmitting = signal(false);
  protected readonly pendingAction = signal('');
  protected readonly errorMessage = signal('');

  protected readonly state$ = this.reload$.pipe(
    startWith(void 0),
    switchMap(() => this.tournamentsApi.listTournaments()),
    map((tournaments) => {
      const user = this.auth.currentUser();
      const owned = user?.role === 'ADMIN' ? tournaments : tournaments.filter((item) => item.organizerId === user?.id);

      return { status: 'loaded' as const, tournaments: owned };
    }),
    startWith({ status: 'loading' as const }),
    catchError(() => of({ status: 'error' as const })),
  );

  protected submitTournament(form: NgForm): void {
    if (form.invalid || this.isSubmitting()) {
      form.control.markAllAsTouched();
      return;
    }

    const value = form.value as { name: string; location: string; startsAt: string; maxTeams: number };
    this.errorMessage.set('');
    this.isSubmitting.set(true);
    this.organizerApi
      .createTournament({ ...value, startsAt: new Date(value.startsAt).toISOString(), maxTeams: Number(value.maxTeams) || 8 })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          form.resetForm({ maxTeams: 8 });
          this.reload$.next();
        },
        error: () => this.errorMessage.set('Turnir nije kreiran. Proveri podatke.'),
      });
  }

  protected updateSignupStatus(id: string, action: 'open' | 'lock'): void {
    if (this.pendingAction()) {
      return;
    }

    const request$ = action === 'open' ? this.organizerApi.openSignups(id) : this.organizerApi.lockSignups(id);
    this.errorMessage.set('');
    this.pendingAction.set(`${action}:${id}`);
    request$.pipe(finalize(() => this.pendingAction.set(''))).subscribe({
      next: () => this.reload$.next(),
      error: () => this.errorMessage.set('Promena statusa nije uspela.'),
    });
  }
}
