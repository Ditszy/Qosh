import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, combineLatest, Observable, of } from 'rxjs';

import { ApiUrlService } from '../../../core/api';
import { LiveStreamService } from '../../../core/live';
import type { MatchStatistics } from '../../statistics';
import type {
  MatchDetail,
  MatchEvent,
  MatchLiveCenter,
  MatchLiveCenterStreamMessage,
  MatchLivePayload,
  MatchLiveStreamMessage,
  MatchReadBundle,
  MatchRecap,
  MatchRefereeReport,
} from './match.models';

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

  getLiveCenter(): Observable<MatchLiveCenter> {
    return this.http.get<MatchLiveCenter>(this.apiUrl.build('/matches/live'));
  }

  watchLiveCenter(): Observable<MatchLiveCenterStreamMessage> {
    return this.liveStream.connect<MatchLiveCenter>('/matches/live/stream') as Observable<MatchLiveCenterStreamMessage>;
  }

  listMatchEvents(matchId: string): Observable<MatchEvent[]> {
    return this.http.get<MatchEvent[]>(this.apiUrl.build(`/matches/${matchId}/events`));
  }

  getMatchStatistics(matchId: string): Observable<MatchStatistics> {
    return this.http.get<MatchStatistics>(this.apiUrl.build(`/matches/${matchId}/statistics`));
  }

  getRefereeReport(matchId: string): Observable<MatchRefereeReport> {
    return this.http.get<MatchRefereeReport>(this.apiUrl.build(`/matches/${matchId}/report`));
  }

  getMatchRecap(matchId: string): Observable<MatchRecap> {
    return this.http.get<MatchRecap>(this.apiUrl.build(`/matches/${matchId}/recap`));
  }

  getMatchReadBundle(matchId: string): Observable<MatchReadBundle> {
    return combineLatest({
      match: this.getMatch(matchId),
      events: this.listMatchEvents(matchId),
      statistics: this.getMatchStatistics(matchId),
      refereeReport: this.getRefereeReport(matchId).pipe(catchError(() => of(null))),
    });
  }

  watchLiveMatch(matchId: string): Observable<MatchLiveStreamMessage> {
    return this.liveStream.connect<MatchLivePayload>(`/matches/${matchId}/live`) as Observable<MatchLiveStreamMessage>;
  }
}
