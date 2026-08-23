import { AsyncPipe } from '@angular/common';
import { Component, inject, signal, viewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { finalize } from 'rxjs';

import { OrganizerTournamentsApiService } from '../organizer-tournaments-api.service';
import { OrganizerCommandCenter } from '../organizer-command-center/organizer-command-center';
import type { OrganizerMatchScheduleFormValue } from '../organizer-match-schedule-form/organizer-match-schedule-form';
import {
  OrganizerTournamentCard,
  type OrganizerMatchScheduleRequest,
  type OrganizerRoundToggleRequest,
  type OrganizerSignupStatusRequest,
  type OrganizerTournamentUpdateRequest,
} from '../organizer-tournament-card/organizer-tournament-card';
import {
  OrganizerTournamentForm,
  type OrganizerTournamentFormValue,
} from '../organizer-tournament-form/organizer-tournament-form';
import { OrganizerDashboardActions, selectOrganizerDashboardView } from '../store';
import type { TournamentMatch } from '../../public/tournaments/tournament.models';

@Component({
  selector: 'app-organizer-dashboard',
  imports: [AsyncPipe, OrganizerCommandCenter, OrganizerTournamentCard, OrganizerTournamentForm],
  templateUrl: './organizer-dashboard.html',
  styleUrl: './organizer-dashboard.scss',
})
export class OrganizerDashboard {
  private readonly store = inject(Store);
  private readonly organizerApi = inject(OrganizerTournamentsApiService);

  protected readonly isSubmitting = signal(false);
  protected readonly pendingAction = signal('');
  protected readonly errorMessage = signal('');
  protected readonly editingTournamentId = signal('');
  protected readonly editingMatchId = signal('');
  protected readonly expandedTournamentMatches = signal<Record<string, boolean>>({});
  protected readonly expandedRounds = signal<Record<string, boolean>>({});

  protected readonly state$ = this.store.select(selectOrganizerDashboardView);
  protected readonly createTournamentForm = viewChild<OrganizerTournamentForm>('createTournamentForm');

  constructor() {
    this.reloadDashboard();
  }

  protected submitTournament(value: OrganizerTournamentFormValue): void {
    if (this.isSubmitting()) {
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);
    this.organizerApi
      .createTournament(value)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.createTournamentForm()?.reset();
          this.reloadDashboard();
        },
        error: () => this.errorMessage.set('Turnir nije kreiran. Proveri podatke.'),
      });
  }

  protected updateTournamentDetails(id: string, value: OrganizerTournamentFormValue): void {
    if (this.pendingAction()) {
      return;
    }

    this.errorMessage.set('');
    this.pendingAction.set(`update:${id}`);
    this.organizerApi
      .updateTournament(id, value)
      .pipe(finalize(() => this.pendingAction.set('')))
      .subscribe({
        next: () => {
          this.editingTournamentId.set('');
          this.reloadDashboard();
        },
        error: () => this.errorMessage.set('Izmena turnira nije sačuvana.'),
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
      next: () => this.reloadDashboard(),
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
      next: () => this.reloadDashboard(),
      error: () => this.errorMessage.set('Žreb nije generisan. Proveri broj timova.'),
    });
  }

  protected startTournament(id: string): void {
    if (this.pendingAction()) {
      return;
    }

    this.errorMessage.set('');
    this.pendingAction.set(`start:${id}`);
    this.organizerApi.startTournament(id).pipe(finalize(() => this.pendingAction.set(''))).subscribe({
      next: () => this.reloadDashboard(),
      error: () => this.errorMessage.set('Turnir nije pokrenut. Prvo generiši žreb.'),
    });
  }

  protected scheduleMatch(id: string, value: OrganizerMatchScheduleFormValue): void {
    if (this.pendingAction()) {
      return;
    }

    this.errorMessage.set('');
    this.pendingAction.set(`schedule:${id}`);
    this.organizerApi
      .scheduleMatch(id, value)
      .pipe(finalize(() => this.pendingAction.set('')))
      .subscribe({
        next: () => {
          this.editingMatchId.set('');
          this.reloadDashboard();
        },
        error: () => this.errorMessage.set('Termin nije sačuvan.'),
      });
  }

  protected editCommandCenterMatch(match: TournamentMatch): void {
    this.editingMatchId.set(match.id);
    this.expandedTournamentMatches.update((expanded) => ({
      ...expanded,
      [match.tournamentId]: true,
    }));
    this.expandedRounds.update((expanded) => ({
      ...expanded,
      [this.roundKey(match.tournamentId, match.round)]: true,
    }));
  }

  protected updateTournamentFromCard(request: OrganizerTournamentUpdateRequest): void {
    this.updateTournamentDetails(request.tournamentId, request.value);
  }

  protected updateSignupStatusFromCard(request: OrganizerSignupStatusRequest): void {
    this.updateSignupStatus(request.tournamentId, request.action);
  }

  protected toggleRoundFromCard(request: OrganizerRoundToggleRequest): void {
    this.toggleRound(request.tournamentId, request.round);
  }

  protected scheduleMatchFromCard(request: OrganizerMatchScheduleRequest): void {
    this.scheduleMatch(request.matchId, request.value);
  }

  protected editTournament(id: string): void {
    this.editingTournamentId.set(id);
  }

  protected cancelTournamentEdit(): void {
    this.editingTournamentId.set('');
  }

  protected editMatch(id: string): void {
    this.editingMatchId.set(id);
  }

  protected cancelMatchEdit(): void {
    this.editingMatchId.set('');
  }

  protected toggleTournamentMatches(tournamentId: string): void {
    this.expandedTournamentMatches.update((expanded) => ({
      ...expanded,
      [tournamentId]: !expanded[tournamentId],
    }));
  }

  protected isTournamentMatchesExpanded(tournamentId: string): boolean {
    return Boolean(this.expandedTournamentMatches()[tournamentId]);
  }

  protected toggleRound(tournamentId: string, round: number): void {
    const key = this.roundKey(tournamentId, round);

    this.expandedRounds.update((expanded) => ({
      ...expanded,
      [key]: !expanded[key],
    }));
  }

  private roundKey(tournamentId: string, round: number): string {
    return `${tournamentId}:${round}`;
  }

  private reloadDashboard(): void {
    this.store.dispatch(OrganizerDashboardActions.load());
  }
}
