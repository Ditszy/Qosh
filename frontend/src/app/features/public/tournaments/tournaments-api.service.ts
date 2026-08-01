import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../../core/api';
import type { Tournament, TournamentMatch } from './tournament.models';

@Injectable({
  providedIn: 'root',
})
export class TournamentsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  listTournaments(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(this.apiUrl.build('/tournaments'));
  }

  getTournament(id: string): Observable<Tournament> {
    return this.http.get<Tournament>(this.apiUrl.build(`/tournaments/${id}`));
  }

  listTournamentMatches(tournamentId: string): Observable<TournamentMatch[]> {
    return this.http.get<TournamentMatch[]>(this.apiUrl.build(`/tournaments/${tournamentId}/matches`));
  }
}
