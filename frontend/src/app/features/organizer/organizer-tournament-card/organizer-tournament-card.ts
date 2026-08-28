import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  OrganizerMatchScheduleForm,
  type OrganizerMatchScheduleFormValue,
} from '../organizer-match-schedule-form/organizer-match-schedule-form';
import {
  OrganizerTournamentForm,
  type OrganizerTournamentFormValue,
} from '../organizer-tournament-form/organizer-tournament-form';
import { OrganizerTournamentChecklist } from '../organizer-tournament-checklist/organizer-tournament-checklist';
import type { OrganizerTournamentWithMatches } from '../store/organizer-dashboard.reducer';
import type { TournamentMatch, TournamentStatus } from '../../public/tournaments/tournament.models';

type MatchRoundGroup = {
  round: number;
  matches: TournamentMatch[];
};

export type OrganizerSignupStatusRequest = {
  tournamentId: string;
  action: 'open' | 'lock';
};

export type OrganizerRoundToggleRequest = {
  tournamentId: string;
  round: number;
};

export type OrganizerTournamentUpdateRequest = {
  tournamentId: string;
  value: OrganizerTournamentFormValue;
};

export type OrganizerMatchScheduleRequest = {
  matchId: string;
  value: OrganizerMatchScheduleFormValue;
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
  selector: 'li[app-organizer-tournament-card]',
  imports: [DatePipe, RouterLink, OrganizerMatchScheduleForm, OrganizerTournamentForm, OrganizerTournamentChecklist],
  templateUrl: './organizer-tournament-card.html',
  styleUrl: './organizer-tournament-card.scss',
})
export class OrganizerTournamentCard {
  readonly tournament = input<OrganizerTournamentWithMatches | null>(null);
  readonly pendingAction = input('');
  readonly editingTournamentId = input('');
  readonly editingMatchId = input('');
  readonly matchesExpanded = input(false);
  readonly expandedRounds = input<Record<string, boolean>>({});

  readonly editTournamentRequested = output<string>();
  readonly tournamentUpdateSubmitted = output<OrganizerTournamentUpdateRequest>();
  readonly cancelTournamentEditRequested = output<void>();
  readonly signupStatusRequested = output<OrganizerSignupStatusRequest>();
  readonly bracketRequested = output<string>();
  readonly startRequested = output<string>();
  readonly matchesToggled = output<string>();
  readonly roundToggled = output<OrganizerRoundToggleRequest>();
  readonly matchEditRequested = output<string>();
  readonly matchScheduleSubmitted = output<OrganizerMatchScheduleRequest>();
  readonly cancelMatchEditRequested = output<void>();

  protected canEditTournament(tournament: OrganizerTournamentWithMatches): boolean {
    return tournament.status === 'DRAFT' || tournament.status === 'SIGNUPS_OPEN';
  }

  protected statusLabel(status: TournamentStatus): string {
    return tournamentStatusLabels[status];
  }

  protected matchRoundGroups(matches: TournamentMatch[]): MatchRoundGroup[] {
    const grouped = matches.reduce<Record<number, TournamentMatch[]>>((rounds, match) => {
      rounds[match.round] = [...(rounds[match.round] ?? []), match];
      return rounds;
    }, {});

    return Object.entries(grouped)
      .map(([round, roundMatches]) => ({
        round: Number(round),
        matches: [...roundMatches].sort((a, b) => a.bracketPosition - b.bracketPosition),
      }))
      .sort((a, b) => a.round - b.round);
  }

  protected isRoundExpanded(tournamentId: string, round: number): boolean {
    return Boolean(this.expandedRounds()[this.roundKey(tournamentId, round)]);
  }

  protected submitTournamentUpdate(tournamentId: string, value: OrganizerTournamentFormValue): void {
    this.tournamentUpdateSubmitted.emit({ tournamentId, value });
  }

  protected requestSignupStatus(tournamentId: string, action: 'open' | 'lock'): void {
    this.signupStatusRequested.emit({ tournamentId, action });
  }

  protected requestRoundToggle(tournamentId: string, round: number): void {
    this.roundToggled.emit({ tournamentId, round });
  }

  protected submitMatchSchedule(matchId: string, value: OrganizerMatchScheduleFormValue): void {
    this.matchScheduleSubmitted.emit({ matchId, value });
  }

  protected reviewChecklistMatches(tournament: OrganizerTournamentWithMatches): void {
    if (!this.matchesExpanded()) {
      this.matchesToggled.emit(tournament.id);
    }

    const reviewRounds = new Set(
      tournament.matches
        .filter((match) => match.status !== 'FINAL' && (!match.scheduledAt || !match.scorerId || !match.refereeId))
        .map((match) => match.round),
    );

    if (reviewRounds.size === 0) {
      tournament.matches.forEach((match) => reviewRounds.add(match.round));
    }

    reviewRounds.forEach((round) => {
      if (!this.isRoundExpanded(tournament.id, round)) {
        this.roundToggled.emit({ tournamentId: tournament.id, round });
      }
    });
  }

  private roundKey(tournamentId: string, round: number): string {
    return `${tournamentId}:${round}`;
  }
}
