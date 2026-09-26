import { AsyncPipe } from '@angular/common';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { OrganizerCommandCenter } from '../components/organizer-command-center/organizer-command-center';
import type { OrganizerMatchScheduleFormValue } from '../components/organizer-match-schedule-form/organizer-match-schedule-form';
import {
  OrganizerTournamentCard,
  type OrganizerMatchScheduleRequest,
  type OrganizerRoundToggleRequest,
  type OrganizerSignupStatusRequest,
  type OrganizerTournamentUpdateRequest,
} from '../components/organizer-tournament-card/organizer-tournament-card';
import {
  OrganizerTournamentForm,
  type OrganizerTournamentFormValue,
} from '../components/organizer-tournament-form/organizer-tournament-form';
import {
  OrganizerDashboardActions,
  selectOrganizerDashboardErrorMessage,
  selectOrganizerDashboardPendingAction,
  selectOrganizerDashboardView,
} from '../store';
import type { TournamentMatch } from '../../public/tournaments/tournament.models';

@Component({
  selector: 'app-organizer-dashboard',
  imports: [AsyncPipe, OrganizerCommandCenter, OrganizerTournamentCard, OrganizerTournamentForm],
  templateUrl: './organizer-dashboard.html',
  styleUrl: './organizer-dashboard.scss',
})
export class OrganizerDashboard {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);

  protected readonly editingTournamentId = signal('');
  protected readonly editingMatchId = signal('');
  protected readonly expandedTournamentMatches = signal<Record<string, boolean>>({});
  protected readonly expandedRounds = signal<Record<string, boolean>>({});

  protected readonly state$ = this.store.select(selectOrganizerDashboardView);
  protected readonly pendingAction = this.store.selectSignal(selectOrganizerDashboardPendingAction);
  protected readonly errorMessage = this.store.selectSignal(selectOrganizerDashboardErrorMessage);
  protected readonly isSubmitting = computed(() => this.pendingAction() === 'create');
  protected readonly createTournamentForm = viewChild<OrganizerTournamentForm>('createTournamentForm');

  constructor() {
    this.reloadDashboard();
    this.actions$.pipe(
      ofType(OrganizerDashboardActions.createTournamentSucceeded),
      takeUntilDestroyed(),
    ).subscribe(() => this.createTournamentForm()?.reset());

    this.actions$.pipe(
      ofType(OrganizerDashboardActions.updateTournamentSucceeded),
      takeUntilDestroyed(),
    ).subscribe(() => this.editingTournamentId.set(''));

    this.actions$.pipe(
      ofType(OrganizerDashboardActions.scheduleMatchSucceeded),
      takeUntilDestroyed(),
    ).subscribe(() => this.editingMatchId.set(''));
  }

  protected submitTournament(value: OrganizerTournamentFormValue): void {
    if (this.isSubmitting()) {
      return;
    }

    this.store.dispatch(OrganizerDashboardActions.createTournament({ value }));
  }

  protected updateTournamentDetails(id: string, value: OrganizerTournamentFormValue): void {
    if (this.pendingAction()) {
      return;
    }

    this.store.dispatch(OrganizerDashboardActions.updateTournament({ id, value }));
  }

  protected updateSignupStatus(id: string, action: 'open' | 'lock'): void {
    if (this.pendingAction()) {
      return;
    }

    this.store.dispatch(OrganizerDashboardActions.setSignupStatus({ id, action }));
  }

  protected generateBracket(id: string): void {
    if (this.pendingAction()) {
      return;
    }

    this.store.dispatch(OrganizerDashboardActions.generateBracket({ id }));
  }

  protected startTournament(id: string): void {
    if (this.pendingAction()) {
      return;
    }

    this.store.dispatch(OrganizerDashboardActions.startTournament({ id }));
  }

  protected cancelTournament(id: string): void {
    if (this.pendingAction()) {
      return;
    }

    const confirmed = confirm('Da li si siguran da želiš da otkažeš turnir?');

    if (!confirmed) {
      return;
    }

    this.store.dispatch(OrganizerDashboardActions.cancelTournament({ id }));
  }

  protected scheduleMatch(id: string, value: OrganizerMatchScheduleFormValue): void {
    if (this.pendingAction()) {
      return;
    }

    this.store.dispatch(OrganizerDashboardActions.scheduleMatch({ id, value }));
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
