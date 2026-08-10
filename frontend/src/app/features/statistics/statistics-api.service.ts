import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../core/api';
import type {
  MatchStatistics,
  PublicUser,
  PlayerProfile,
  PlayerStatistic,
  PlayerStatisticLeader,
  PlayerStatisticsFilters,
} from './statistics.models';

@Injectable({
  providedIn: 'root',
})
export class StatisticsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  listPlayerStatistics(filters: PlayerStatisticsFilters = {}): Observable<PlayerStatistic[]> {
    return this.http.get<PlayerStatistic[]>(this.apiUrl.build('/statistics/players'), {
      params: this.toParams(filters),
    });
  }

  listPlayerStatisticLeaders(filters: PlayerStatisticsFilters = {}): Observable<PlayerStatisticLeader[]> {
    return this.http.get<PlayerStatisticLeader[]>(this.apiUrl.build('/statistics/players/leaders'), {
      params: this.toParams(filters),
    });
  }

  listTournamentPlayerStatistics(
    tournamentId: string,
    filters: PlayerStatisticsFilters = {},
  ): Observable<PlayerStatistic[]> {
    return this.http.get<PlayerStatistic[]>(this.apiUrl.build(`/tournaments/${tournamentId}/statistics/players`), {
      params: this.toParams({ ...filters, tournamentId: undefined }),
    });
  }

  listTournamentPlayerStatisticLeaders(
    tournamentId: string,
    filters: PlayerStatisticsFilters = {},
  ): Observable<PlayerStatisticLeader[]> {
    return this.http.get<PlayerStatisticLeader[]>(
      this.apiUrl.build(`/tournaments/${tournamentId}/statistics/players/leaders`),
      {
        params: this.toParams({ ...filters, tournamentId: undefined }),
      },
    );
  }

  getMatchStatistics(matchId: string): Observable<MatchStatistics> {
    return this.http.get<MatchStatistics>(this.apiUrl.build(`/matches/${matchId}/statistics`));
  }

  getPlayerProfile(userId: string): Observable<PlayerProfile> {
    return this.http.get<PlayerProfile>(this.apiUrl.build(`/profiles/${userId}`));
  }

  searchPlayerProfiles(query: string): Observable<PublicUser[]> {
    return this.http.get<PublicUser[]>(this.apiUrl.build('/profiles/search'), {
      params: new HttpParams().set('q', query),
    });
  }

  private toParams(filters: PlayerStatisticsFilters): HttpParams {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      params = params.set(key, String(value));
    }

    return params;
  }
}
