import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, of, startWith, Subject, switchMap } from 'rxjs';

import { AuthService } from '../../../core/auth/auth';
import { OrganizerTournamentsApiService } from '../organizer-tournaments-api.service';
import { OfficialsApiService, type OfficialRole, type OfficialUser } from '../officials-api.service';
import { TournamentsApiService } from '../../public/tournaments/tournaments-api.service';

type OfficialDisplayUser = Pick<OfficialUser, 'firstName' | 'lastName' | 'username'>;

@Component({
  selector: 'app-organizer-dashboard',
  imports: [AsyncPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './organizer-dashboard.html',
  styleUrl: './organizer-dashboard.scss',
})
export class OrganizerDashboard {
  private readonly auth = inject(AuthService);
  private readonly organizerApi = inject(OrganizerTournamentsApiService);
  private readonly officialsApi = inject(OfficialsApiService);
  private readonly tournamentsApi = inject(TournamentsApiService);
  private readonly reload$ = new Subject<void>();

  protected readonly isSubmitting = signal(false);
  protected readonly pendingAction = signal('');
  protected readonly errorMessage = signal('');
  protected readonly officialSearchError = signal('');
  protected readonly editingMatchId = signal('');
  protected readonly selectedOfficialNames = signal<Record<string, string | null>>({});
  protected readonly scorers = signal<OfficialUser[]>([]);
  protected readonly referees = signal<OfficialUser[]>([]);

  protected readonly state$ = this.reload$.pipe(
    startWith(void 0),
    switchMap(() => this.tournamentsApi.listTournaments({ pageSize: 50 })),
    switchMap((page) => {
      const tournaments = page.items;
      const user = this.auth.currentUser();
      const owned = user?.role === 'ADMIN' ? tournaments : tournaments.filter((item) => item.organizerId === user?.id);

      if (owned.length === 0) {
        return of({ status: 'loaded' as const, tournaments: [] });
      }

      return forkJoin(
        owned.map((tournament) =>
          this.tournamentsApi.listTournamentMatches(tournament.id).pipe(map((matches) => ({ ...tournament, matches }))),
        ),
      ).pipe(map((tournamentsWithMatches) => ({ status: 'loaded' as const, tournaments: tournamentsWithMatches })));
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

  protected generateBracket(id: string): void {
    if (this.pendingAction()) {
      return;
    }

    this.errorMessage.set('');
    this.pendingAction.set(`bracket:${id}`);
    this.organizerApi.generateBracket(id).pipe(finalize(() => this.pendingAction.set(''))).subscribe({
      next: () => this.reload$.next(),
      error: () => this.errorMessage.set('Zreb nije generisan. Proveri broj timova.'),
    });
  }

  protected startTournament(id: string): void {
    if (this.pendingAction()) {
      return;
    }

    this.errorMessage.set('');
    this.pendingAction.set(`start:${id}`);
    this.organizerApi.startTournament(id).pipe(finalize(() => this.pendingAction.set(''))).subscribe({
      next: () => this.reload$.next(),
      error: () => this.errorMessage.set('Turnir nije pokrenut. Prvo generisi zreb.'),
    });
  }

  protected scheduleMatch(id: string, form: NgForm): void {
    if (form.invalid || this.pendingAction()) {
      form.control.markAllAsTouched();
      return;
    }

    const value = form.value as { scheduledAt: string; location: string; scorerId?: string; refereeId?: string };
    this.errorMessage.set('');
    this.pendingAction.set(`schedule:${id}`);
    this.organizerApi
      .scheduleMatch(id, {
        scheduledAt: new Date(value.scheduledAt).toISOString(),
        location: value.location,
        scorerId: value.scorerId || null,
        refereeId: value.refereeId || null,
      })
      .pipe(finalize(() => this.pendingAction.set('')))
      .subscribe({
        next: () => {
          this.editingMatchId.set('');
          this.reload$.next();
        },
        error: () => this.errorMessage.set('Termin nije sačuvan.'),
      });
  }

  protected editMatch(id: string): void {
    this.editingMatchId.set(id);
  }

  protected cancelMatchEdit(): void {
    this.editingMatchId.set('');
  }

  protected matchScheduleInput(scheduledAt: string | null): string {
    if (!scheduledAt) {
      return '';
    }

    const date = new Date(scheduledAt);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

    return localDate.toISOString().slice(0, 16);
  }

  protected officialInputValue(matchId: string, role: OfficialRole, official: OfficialDisplayUser | null): string {
    const key = this.officialKey(matchId, role);
    const selected = this.selectedOfficialNames();

    return key in selected ? selected[key] ?? '' : official ? this.officialName(official) : '';
  }

  protected selectOfficial(matchId: string, role: OfficialRole, official: OfficialUser, model: NgModel): void {
    model.control.setValue(official.id);
    this.selectedOfficialNames.update((selected) => ({
      ...selected,
      [this.officialKey(matchId, role)]: this.officialName(official),
    }));

    if (role === 'SCORER') {
      this.scorers.set([]);
    } else {
      this.referees.set([]);
    }
  }

  protected clearOfficial(matchId: string, role: OfficialRole, model: NgModel): void {
    model.control.setValue('');
    this.selectedOfficialNames.update((selected) => ({
      ...selected,
      [this.officialKey(matchId, role)]: null,
    }));

    if (role === 'SCORER') {
      this.scorers.set([]);
    } else {
      this.referees.set([]);
    }
  }

  protected searchScorers(query: string): void {
    this.searchOfficials(query, 'SCORER');
  }

  protected searchReferees(query: string): void {
    this.searchOfficials(query, 'REFEREE');
  }

  private searchOfficials(query: string, role: OfficialRole): void {
    const search = query.trim();
    const target = role === 'SCORER' ? this.scorers : this.referees;

    if (search.length < 2) {
      target.set([]);
      return;
    }

    this.officialSearchError.set('');
    this.officialsApi.searchOfficials(search, { role }).subscribe({
      next: (officials) => target.set(officials),
      error: () => this.officialSearchError.set('Službena lica nisu učitana.'),
    });
  }

  private officialKey(matchId: string, role: OfficialRole): string {
    return `${matchId}:${role}`;
  }

  private officialName(official: OfficialDisplayUser): string {
    return `${official.firstName} ${official.lastName} (${official.username})`;
  }
}
