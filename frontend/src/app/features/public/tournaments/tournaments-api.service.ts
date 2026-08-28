import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../../core/api';
import { LiveStreamService } from '../../../core/live/live-stream.service';
import type {
  PaginatedTournaments,
  Tournament,
  TournamentListQuery,
  TournamentLiveMessage,
  TournamentMatch,
  TournamentTeamDetail,
} from './tournament.models';

@Injectable({
  providedIn: 'root',
})
export class TournamentsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly liveStream = inject(LiveStreamService);

  listTournaments(query: TournamentListQuery = {}): Observable<PaginatedTournaments> {
    const params = Object.fromEntries(
      (Object.entries(query) as [string, unknown][])
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)]),
    );

    return this.http.get<PaginatedTournaments>(this.apiUrl.build('/tournaments'), { params });
  }

  getTournament(id: string): Observable<Tournament> {
    return this.http.get<Tournament>(this.apiUrl.build(`/tournaments/${id}`));
  }

  listTournamentMatches(tournamentId: string): Observable<TournamentMatch[]> {
    return this.http.get<TournamentMatch[]>(this.apiUrl.build(`/tournaments/${tournamentId}/matches`));
  }

  listTournamentTeams(tournamentId: string): Observable<TournamentTeamDetail[]> {
    return this.http.get<TournamentTeamDetail[]>(this.apiUrl.build(`/teams/tournament/${tournamentId}`));
  }

  watchTournamentLive(tournamentId: string): Observable<TournamentLiveMessage> {
    return this.liveStream.connect<TournamentLiveMessage['data']>(
      `/tournaments/${tournamentId}/live`,
    ) as Observable<TournamentLiveMessage>;
  }
}
