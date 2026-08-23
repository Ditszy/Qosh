import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule, type NgForm, type NgModel } from '@angular/forms';

import { OfficialsApiService, type OfficialRole, type OfficialUser } from '../officials-api.service';
import type { TournamentMatch } from '../../public/tournaments/tournament.models';

type OfficialDisplayUser = Pick<OfficialUser, 'firstName' | 'lastName' | 'username'>;

export type OrganizerMatchScheduleFormValue = {
  scheduledAt: string;
  location: string;
  scorerId: string | null;
  refereeId: string | null;
};

@Component({
  selector: 'app-organizer-match-schedule-form',
  imports: [FormsModule],
  templateUrl: './organizer-match-schedule-form.html',
  styleUrl: './organizer-match-schedule-form.scss',
})
export class OrganizerMatchScheduleForm {
  private readonly officialsApi = inject(OfficialsApiService);

  readonly match = input<TournamentMatch | null>(null);
  readonly fallbackLocation = input('');
  readonly isSubmitting = input(false);

  readonly scheduleSubmitted = output<OrganizerMatchScheduleFormValue>();
  readonly cancelRequested = output<void>();

  protected readonly officialSearchError = signal('');
  protected readonly scorerName = signal<string | null | undefined>(undefined);
  protected readonly refereeName = signal<string | null | undefined>(undefined);
  protected readonly scorers = signal<OfficialUser[]>([]);
  protected readonly referees = signal<OfficialUser[]>([]);

  protected submit(form: NgForm): void {
    if (form.invalid || this.isSubmitting()) {
      form.control.markAllAsTouched();
      return;
    }

    const value = form.value as { scheduledAt: string; location: string; scorerId?: string; refereeId?: string };

    this.scheduleSubmitted.emit({
      scheduledAt: new Date(value.scheduledAt).toISOString(),
      location: value.location,
      scorerId: value.scorerId || null,
      refereeId: value.refereeId || null,
    });
  }

  protected matchScheduleInput(value: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

    return localDate.toISOString().slice(0, 16);
  }

  protected officialInputValue(role: OfficialRole, official: OfficialDisplayUser | null): string {
    const selected = role === 'SCORER' ? this.scorerName() : this.refereeName();

    return selected !== undefined ? selected ?? '' : official ? this.officialName(official) : '';
  }

  protected selectOfficial(role: OfficialRole, official: OfficialUser, model: NgModel): void {
    model.control.setValue(official.id);

    if (role === 'SCORER') {
      this.scorerName.set(this.officialName(official));
      this.scorers.set([]);
    } else {
      this.refereeName.set(this.officialName(official));
      this.referees.set([]);
    }
  }

  protected clearOfficial(role: OfficialRole, model: NgModel): void {
    model.control.setValue('');

    if (role === 'SCORER') {
      this.scorerName.set(null);
      this.scorers.set([]);
    } else {
      this.refereeName.set(null);
      this.referees.set([]);
    }
  }

  protected searchOfficials(query: string, role: OfficialRole): void {
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

  protected cancel(): void {
    this.cancelRequested.emit();
  }

  private officialName(official: OfficialDisplayUser): string {
    return `${official.firstName} ${official.lastName} (${official.username})`;
  }
}
