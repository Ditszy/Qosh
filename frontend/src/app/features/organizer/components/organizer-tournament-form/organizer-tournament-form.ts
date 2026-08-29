import { Component, input, output, viewChild } from '@angular/core';
import { FormsModule, type NgForm } from '@angular/forms';

export type OrganizerTournamentFormValue = {
  name: string;
  description?: string;
  location: string;
  startsAt: string;
  maxTeams: number;
  entryFee: number;
};

export type OrganizerTournamentFormInitialValue = {
  name?: string;
  description?: string | null;
  location?: string;
  startsAt?: string;
  maxTeams?: number;
  entryFee?: number;
};

@Component({
  selector: 'app-organizer-tournament-form',
  imports: [FormsModule],
  templateUrl: './organizer-tournament-form.html',
  styleUrl: './organizer-tournament-form.scss',
})
export class OrganizerTournamentForm {
  readonly title = input('Novi turnir');
  readonly submitLabel = input('Sačuvaj');
  readonly pendingLabel = input('Čuvanje...');
  readonly isSubmitting = input(false);
  readonly errorMessage = input('');
  readonly showCancel = input(false);
  readonly initialValue = input<OrganizerTournamentFormInitialValue | null>(null);

  readonly formSubmitted = output<OrganizerTournamentFormValue>();
  readonly cancelRequested = output<void>();

  private readonly tournamentForm = viewChild<NgForm>('tournamentForm');

  reset(): void {
    this.tournamentForm()?.resetForm({ maxTeams: 8, entryFee: 0 });
  }

  protected submit(form: NgForm): void {
    if (form.invalid || this.isSubmitting()) {
      form.control.markAllAsTouched();
      return;
    }

    const value = form.value as {
      name: string;
      description?: string;
      location: string;
      startsAt: string;
      maxTeams: number;
      entryFee?: number;
    };

    this.formSubmitted.emit({
      name: value.name,
      description: value.description?.trim() || undefined,
      location: value.location,
      startsAt: new Date(value.startsAt).toISOString(),
      maxTeams: Number(value.maxTeams) || 8,
      entryFee: Number(value.entryFee) || 0,
    });
  }

  protected dateInput(value: string | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

    return localDate.toISOString().slice(0, 16);
  }

  protected cancel(): void {
    this.cancelRequested.emit();
  }
}
