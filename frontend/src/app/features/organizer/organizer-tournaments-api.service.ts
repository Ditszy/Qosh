import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../core/api';
import type { Tournament, TournamentMatch } from '../public/tournaments/tournament.models';

export type ManagedTournamentSummary = Tournament & {
  teamCount: number;
  matchCount: number;
  scheduledMatchCount: number;
  liveMatchCount: number;
  finalMatchCount: number;
  unscheduledActiveMatchCount: number;
  missingOfficialsActiveMatchCount: number;
};

export type ManagedTournamentPage = {
  items: ManagedTournamentSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type OrganizerCommandMatch = {
  tournament: ManagedTournamentSummary;
  match: TournamentMatch;
};

export type OrganizerCommandCenterData = {
  liveMatches: OrganizerCommandMatch[];
  nextMatches: OrganizerCommandMatch[];
  unscheduledMatches: OrganizerCommandMatch[];
  missingOfficialMatches: OrganizerCommandMatch[];
  recentFinals: OrganizerCommandMatch[];
  readyForBracket: ManagedTournamentSummary[];
  readyToStart: ManagedTournamentSummary[];
};

export type ManagedTournamentListQuery = {
  page?: number;
  pageSize?: number;
  view?: 'active' | 'history';
};

export type OrganizerTournamentRequest = {
  name: string;
  description?: string;
  location: string;
  startsAt: string;
  maxTeams?: number;
  entryFee?: number;
};

export type UpdateOrganizerTournamentRequest = Partial<OrganizerTournamentRequest>;

export type ScheduleMatchRequest = {
  scheduledAt?: string;
  location?: string;
  scorerId?: string | null;
  refereeId?: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class OrganizerTournamentsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  listManagedTournaments(query: ManagedTournamentListQuery = {}): Observable<ManagedTournamentPage> {
    const params = Object.fromEntries(
      (Object.entries(query) as [string, unknown][])
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)]),
    );

    return this.http.get<ManagedTournamentPage>(this.apiUrl.build('/tournaments/managed'), { params });
  }

  getCommandCenter(limit = 4): Observable<OrganizerCommandCenterData> {
    return this.http.get<OrganizerCommandCenterData>(this.apiUrl.build('/tournaments/managed/command-center'), {
      params: { limit: String(limit) },
    });
  }

  createTournament(payload: OrganizerTournamentRequest): Observable<Tournament> {
    return this.http.post<Tournament>(this.apiUrl.build('/tournaments'), payload);
  }

  updateTournament(id: string, payload: UpdateOrganizerTournamentRequest): Observable<Tournament> {
    return this.http.patch<Tournament>(this.apiUrl.build(`/tournaments/${id}`), payload);
  }

  openSignups(id: string): Observable<Tournament> {
    return this.http.post<Tournament>(this.apiUrl.build(`/tournaments/${id}/open-signups`), {});
  }

  lockSignups(id: string): Observable<Tournament> {
    return this.http.post<Tournament>(this.apiUrl.build(`/tournaments/${id}/lock-signups`), {});
  }

  startTournament(id: string): Observable<Tournament> {
    return this.http.post<Tournament>(this.apiUrl.build(`/tournaments/${id}/start`), {});
  }

  cancelTournament(id: string): Observable<Tournament> {
    return this.http.post<Tournament>(this.apiUrl.build(`/tournaments/${id}/cancel`), {});
  }

  generateBracket(id: string): Observable<TournamentMatch[]> {
    return this.http.post<TournamentMatch[]>(this.apiUrl.build(`/tournaments/${id}/bracket/generate`), {});
  }

  scheduleMatch(id: string, payload: ScheduleMatchRequest): Observable<TournamentMatch> {
    return this.http.patch<TournamentMatch>(this.apiUrl.build(`/matches/${id}/schedule`), payload);
  }
}
