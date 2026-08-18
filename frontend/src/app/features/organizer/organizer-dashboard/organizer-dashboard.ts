import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { finalize } from 'rxjs';

import { OrganizerTournamentsApiService } from '../organizer-tournaments-api.service';
import { OfficialsApiService, type OfficialRole, type OfficialUser } from '../officials-api.service';
import { OrganizerDashboardActions, selectOrganizerDashboardView } from '../store';
import type { Tournament, TournamentMatch, TournamentStatus } from '../../public/tournaments/tournament.models';

type OfficialDisplayUser = Pick<OfficialUser, 'firstName' | 'lastName' | 'username'>;
type MatchRoundGroup = {
  round: number;
  matches: TournamentMatch[];
};

const tournamentStatusLabels: Record<TournamentStatus, string> = {
  DRAFT: 'U pripremi',
  SIGNUPS_OPEN: 'Prijave otvorene',
  SIGNUPS_LOCKED: 'Prijave zaključane',
  IN_PROGRESS: 'U toku',
  COMPLETED: 'Završen',
  CANCELLED: 'Otkazan',
};

@Component({
  selector: 'app-organizer-dashboard',
  imports: [AsyncPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './organizer-dashboard.html',
  styleUrl: './organizer-dashboard.scss',
})
export class OrganizerDashboard {
  private readonly store = inject(Store);
  private readonly organizerApi = inject(OrganizerTournamentsApiService);
  private readonly officialsApi = inject(OfficialsApiService);

  protected readonly isSubmitting = signal(false);
  protected readonly pendingAction = signal('');
  protected readonly errorMessage = signal('');
  protected readonly officialSearchError = signal('');
  protected readonly editingTournamentId = signal('');
  protected readonly editingMatchId = signal('');
  protected readonly expandedTournamentMatches = signal<Record<string, boolean>>({});
  protected readonly expandedRounds = signal<Record<string, boolean>>({});
  protected readonly selectedOfficialNames = signal<Record<string, string | null>>({});
  protected readonly scorers = signal<OfficialUser[]>([]);
  protected readonly referees = signal<OfficialUser[]>([]);

  protected readonly state$ = this.store.select(selectOrganizerDashboardView);

  constructor() {
    this.reloadDashboard();
  }

  protected submitTournament(form: NgForm): void {
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
    this.errorMessage.set('');
    this.isSubmitting.set(true);
    this.organizerApi
      .createTournament({
        ...value,
        description: value.description?.trim() || undefined,
        startsAt: new Date(value.startsAt).toISOString(),
        maxTeams: Number(value.maxTeams) || 8,
        entryFee: Number(value.entryFee) || 0,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          form.resetForm({ maxTeams: 8, entryFee: 0 });
          this.reloadDashboard();
        },
        error: () => this.errorMessage.set('Turnir nije kreiran. Proveri podatke.'),
      });
  }

  protected updateTournamentDetails(id: string, form: NgForm): void {
    if (form.invalid || this.pendingAction()) {
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

    this.errorMessage.set('');
    this.pendingAction.set(`update:${id}`);
    this.organizerApi
      .updateTournament(id, {
        name: value.name,
        description: value.description?.trim() || undefined,
        location: value.location,
        startsAt: new Date(value.startsAt).toISOString(),
        maxTeams: Number(value.maxTeams) || 8,
        entryFee: Number(value.entryFee) || 0,
      })
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
          this.reloadDashboard();
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

  protected canEditTournament(tournament: Tournament): boolean {
    return tournament.status === 'DRAFT' || tournament.status === 'SIGNUPS_OPEN';
  }

  protected statusLabel(status: TournamentStatus): string {
    return tournamentStatusLabels[status];
  }

  protected editTournament(id: string): void {
    this.editingTournamentId.set(id);
  }

  protected cancelTournamentEdit(): void {
    this.editingTournamentId.set('');
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

  protected isRoundExpanded(tournamentId: string, round: number): boolean {
    return Boolean(this.expandedRounds()[this.roundKey(tournamentId, round)]);
  }

  protected matchRoundGroups(matches: TournamentMatch[]): MatchRoundGroup[] {
    const grouped = matches.reduce<Record<number, TournamentMatch[]>>((rounds, match) => {
      rounds[match.round] = [...(rounds[match.round] ?? []), match];
      return rounds;
    }, {});

    return Object.entries(grouped)
      .map(([round, roundMatches]) => ({
        round: Number(round),
        matches: roundMatches.sort((a, b) => a.bracketPosition - b.bracketPosition),
      }))
      .sort((a, b) => a.round - b.round);
  }

  protected matchScheduleInput(scheduledAt: string | null): string {
    if (!scheduledAt) {
      return '';
    }

    const date = new Date(scheduledAt);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

    return localDate.toISOString().slice(0, 16);
  }

  protected tournamentDateInput(startsAt: string): string {
    return this.matchScheduleInput(startsAt);
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

  private roundKey(tournamentId: string, round: number): string {
    return `${tournamentId}:${round}`;
  }

  private officialName(official: OfficialDisplayUser): string {
    return `${official.firstName} ${official.lastName} (${official.username})`;
  }

  private reloadDashboard(): void {
    this.store.dispatch(OrganizerDashboardActions.load());
  }
}
