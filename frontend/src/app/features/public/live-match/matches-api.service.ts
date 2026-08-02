import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';

import { ApiUrlService } from '../../../core/api';
import { LiveStreamService } from '../../../core/live';
import type { MatchStatistics } from '../../statistics';
import type { MatchDetail, MatchEvent, MatchLivePayload, MatchLiveStreamMessage, MatchReadBundle } from './match.models';

@Injectable({
  providedIn: 'root',
})
export class MatchesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly liveStream = inject(LiveStreamService);

  getMatch(matchId: string): Observable<MatchDetail> {
    return this.http.get<MatchDetail>(this.apiUrl.build(`/matches/${matchId}`));
  }

  listMatchEvents(matchId: string): Observable<MatchEvent[]> {
    return this.http.get<MatchEvent[]>(this.apiUrl.build(`/matches/${matchId}/events`));
  }

  getMatchStatistics(matchId: string): Observable<MatchStatistics> {
    return this.http.get<MatchStatistics>(this.apiUrl.build(`/matches/${matchId}/statistics`));
  }

  getMatchReadBundle(matchId: string): Observable<MatchReadBundle> {
    return combineLatest({
      match: this.getMatch(matchId),
      events: this.listMatchEvents(matchId),
      statistics: this.getMatchStatistics(matchId),
    });
  }

  watchLiveMatch(matchId: string): Observable<MatchLiveStreamMessage> {
    return this.liveStream.connect<MatchLivePayload>(`/matches/${matchId}/live`) as Observable<MatchLiveStreamMessage>;
  }
}
