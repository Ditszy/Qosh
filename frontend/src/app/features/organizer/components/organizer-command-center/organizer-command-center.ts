import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import type {
  OrganizerCommandCenterData,
  OrganizerCommandMatch,
} from '../../organizer-tournaments-api.service';

@Component({
  selector: 'app-organizer-command-center',
  imports: [DatePipe, RouterLink],
  templateUrl: './organizer-command-center.html',
  styleUrl: './organizer-command-center.scss',
})
export class OrganizerCommandCenter {
  readonly data = input<OrganizerCommandCenterData | null>(null);
  readonly pendingAction = input('');
  readonly matchEditRequested = output<OrganizerCommandMatch>();
  readonly bracketRequested = output<string>();
  readonly startRequested = output<string>();

  protected readonly liveMatches = computed(() => this.data()?.liveMatches ?? []);
  protected readonly nextMatches = computed(() => this.data()?.nextMatches ?? []);
  protected readonly unscheduledMatches = computed(() => this.data()?.unscheduledMatches ?? []);
  protected readonly missingOfficialMatches = computed(() => this.data()?.missingOfficialMatches ?? []);
  protected readonly readyForBracket = computed(() => this.data()?.readyForBracket ?? []);
  protected readonly readyToStart = computed(() => this.data()?.readyToStart ?? []);
  protected readonly recentFinals = computed(() => this.data()?.recentFinals ?? []);

  protected teamLabel(item: OrganizerCommandMatch): string {
    return `${item.match.teamA?.name ?? 'TBD'} - ${item.match.teamB?.name ?? 'TBD'}`;
  }

  protected missingOfficialsLabel(item: OrganizerCommandMatch): string {
    const missing = [
      !item.match.scorerId ? 'zapisničar' : '',
      !item.match.refereeId ? 'sudija' : '',
    ].filter(Boolean);

    return missing.join(' i ');
  }

  protected winnerLabel(item: OrganizerCommandMatch): string {
    return item.match.winnerTeam?.name ?? 'Pobednik nije upisan';
  }

  protected requestMatchEdit(item: OrganizerCommandMatch): void {
    this.matchEditRequested.emit(item);
  }

  protected requestBracket(tournamentId: string): void {
    this.bracketRequested.emit(tournamentId);
  }

  protected requestStart(tournamentId: string): void {
    this.startRequested.emit(tournamentId);
  }
}
