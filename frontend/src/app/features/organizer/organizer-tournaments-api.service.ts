import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../core/api';
import type { Tournament, TournamentMatch } from '../public/tournaments/tournament.models';

export type OrganizerTournamentRequest = {
  name: string;
  description?: string;
  location: string;
  startsAt: string;
  maxTeams?: number;
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

  generateBracket(id: string): Observable<TournamentMatch[]> {
    return this.http.post<TournamentMatch[]>(this.apiUrl.build(`/tournaments/${id}/bracket/generate`), {});
  }

  scheduleMatch(id: string, payload: ScheduleMatchRequest): Observable<TournamentMatch> {
    return this.http.patch<TournamentMatch>(this.apiUrl.build(`/matches/${id}/schedule`), payload);
  }
}
