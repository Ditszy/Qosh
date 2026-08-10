import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../../core/api';
import { LiveStreamService } from '../../../core/live/live-stream.service';
import type { Tournament, TournamentLiveMessage, TournamentMatch } from './tournament.models';

@Injectable({
  providedIn: 'root',
})
export class TournamentsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly liveStream = inject(LiveStreamService);

  listTournaments(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(this.apiUrl.build('/tournaments'));
  }

  getTournament(id: string): Observable<Tournament> {
    return this.http.get<Tournament>(this.apiUrl.build(`/tournaments/${id}`));
  }

  listTournamentMatches(tournamentId: string): Observable<TournamentMatch[]> {
    return this.http.get<TournamentMatch[]>(this.apiUrl.build(`/tournaments/${tournamentId}/matches`));
  }

  watchTournamentLive(tournamentId: string): Observable<TournamentLiveMessage> {
    return this.liveStream.connect<TournamentLiveMessage['data']>(
      `/tournaments/${tournamentId}/live`,
    ) as Observable<TournamentLiveMessage>;
  }
}
