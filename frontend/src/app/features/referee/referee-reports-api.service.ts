import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../core/api';
import type { PublicUser, TournamentMatch } from '../public/tournaments/tournament.models';

export type CreateRefereeReportRequest = {
  notes: string;
};

export type RefereeReport = {
  id: string;
  matchId: string;
  refereeId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type RefereeReportDetail = RefereeReport & {
  referee: PublicUser;
  match: {
    id: string;
    tournamentId: string;
    round: number;
    bracketPosition: number;
    tournament: {
      id: string;
      name: string;
      organizerId: string;
    };
  };
};

export type RefereeAssignedMatch = TournamentMatch & {
  hasReport: boolean;
};

export type RefereeAssignedMatchPage = {
  items: RefereeAssignedMatch[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

@Injectable({
  providedIn: 'root',
})
export class RefereeReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  listAssignedMatches(query: { page?: number; pageSize?: number } = {}): Observable<RefereeAssignedMatchPage> {
    const params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('pageSize', query.pageSize ?? 25);

    return this.http.get<RefereeAssignedMatchPage>(this.apiUrl.build('/matches/referee/me'), {
      params,
    });
  }

  getReport(matchId: string): Observable<RefereeReportDetail> {
    return this.http.get<RefereeReportDetail>(this.reportUrl(matchId));
  }

  createReport(matchId: string, request: CreateRefereeReportRequest): Observable<RefereeReport> {
    return this.http.post<RefereeReport>(this.reportUrl(matchId), request);
  }

  private reportUrl(matchId: string): string {
    return this.apiUrl.build(`/matches/${matchId}/report`);
  }
}
