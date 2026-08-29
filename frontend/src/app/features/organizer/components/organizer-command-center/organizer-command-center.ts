import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { TournamentMatch } from '../../../public/tournaments/tournament.models';
import type { OrganizerTournamentWithMatches } from '../../store/organizer-dashboard.reducer';

type CommandMatch = {
  tournament: OrganizerTournamentWithMatches;
  match: TournamentMatch;
};

@Component({
  selector: 'app-organizer-command-center',
  imports: [DatePipe, RouterLink],
  templateUrl: './organizer-command-center.html',
  styleUrl: './organizer-command-center.scss',
})
export class OrganizerCommandCenter {
  readonly tournaments = input<OrganizerTournamentWithMatches[]>([]);
  readonly pendingAction = input('');
  readonly matchEditRequested = output<TournamentMatch>();
  readonly bracketRequested = output<string>();
  readonly startRequested = output<string>();

  protected readonly queueLimit = 4;
  protected readonly matchItems = computed<CommandMatch[]>(() =>
    this.tournaments().flatMap((tournament) => tournament.matches.map((match) => ({ tournament, match }))),
  );
  protected readonly liveMatches = computed(() =>
    this.matchItems()
      .filter(({ match }) => match.status === 'LIVE')
      .sort(compareScheduledThenTournament)
      .slice(0, this.queueLimit),
  );
  protected readonly nextMatches = computed(() =>
    this.matchItems()
      .filter(({ match }) => match.status === 'SCHEDULED' && !!match.scheduledAt && !!match.teamA && !!match.teamB)
      .sort((first, second) => getTime(first.match.scheduledAt) - getTime(second.match.scheduledAt))
      .slice(0, this.queueLimit),
  );
  protected readonly unscheduledMatches = computed(() =>
    this.matchItems()
      .filter(({ match }) => match.status === 'SCHEDULED' && !match.scheduledAt)
      .sort(compareOperationalOrder)
      .slice(0, this.queueLimit),
  );
  protected readonly missingOfficialMatches = computed(() =>
    this.matchItems()
      .filter(({ match }) => match.status !== 'FINAL' && (!match.scorerId || !match.refereeId))
      .sort(compareOperationalOrder)
      .slice(0, this.queueLimit),
  );
  protected readonly readyForBracket = computed(() =>
    this.tournaments()
      .filter((tournament) => tournament.status === 'SIGNUPS_LOCKED' && tournament.matches.length === 0)
      .sort((first, second) => getTime(first.startsAt) - getTime(second.startsAt))
      .slice(0, this.queueLimit),
  );
  protected readonly readyToStart = computed(() =>
    this.tournaments()
      .filter((tournament) => tournament.status === 'SIGNUPS_LOCKED' && tournament.matches.length > 0)
      .sort((first, second) => getTime(first.startsAt) - getTime(second.startsAt))
      .slice(0, this.queueLimit),
  );
  protected readonly recentFinals = computed(() =>
    this.matchItems()
      .filter(({ match }) => match.status === 'FINAL')
      .sort((first, second) => getRecentTime(second.match) - getRecentTime(first.match))
      .slice(0, this.queueLimit),
  );

  protected teamLabel(match: TournamentMatch): string {
    return `${match.teamA?.name ?? 'TBD'} - ${match.teamB?.name ?? 'TBD'}`;
  }

  protected missingOfficialsLabel(match: TournamentMatch): string {
    const missing = [
      !match.scorerId ? 'zapisničar' : '',
      !match.refereeId ? 'sudija' : '',
    ].filter(Boolean);

    return missing.join(' i ');
  }

  protected winnerLabel(match: TournamentMatch): string {
    return match.winnerTeam?.name ?? 'Pobednik nije upisan';
  }

  protected requestMatchEdit(match: TournamentMatch): void {
    this.matchEditRequested.emit(match);
  }

  protected requestBracket(tournamentId: string): void {
    this.bracketRequested.emit(tournamentId);
  }

  protected requestStart(tournamentId: string): void {
    this.startRequested.emit(tournamentId);
  }
}

function compareScheduledThenTournament(first: CommandMatch, second: CommandMatch): number {
  return getTime(first.match.scheduledAt) - getTime(second.match.scheduledAt)
    || first.tournament.name.localeCompare(second.tournament.name)
    || first.match.round - second.match.round
    || first.match.bracketPosition - second.match.bracketPosition;
}

function compareOperationalOrder(first: CommandMatch, second: CommandMatch): number {
  return getTime(first.tournament.startsAt) - getTime(second.tournament.startsAt)
    || first.tournament.name.localeCompare(second.tournament.name)
    || first.match.round - second.match.round
    || first.match.bracketPosition - second.match.bracketPosition;
}

function getRecentTime(match: TournamentMatch): number {
  return getTime(match.updatedAt || match.scheduledAt);
}

function getTime(value: string | null | undefined): number {
  return value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER;
}
