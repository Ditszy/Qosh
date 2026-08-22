import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../core/api';
import type { MatchDetail, MatchEvent, MatchEventType, MatchEventUndoResult } from '../public/live-match/match.models';

export type AdjustMatchClockRequest = {
  secondsDelta: number;
};

export type CreateMatchEventRequest = {
  type: MatchEventType;
  teamId: string;
  playerId?: string;
  occurredAt?: string;
};

@Injectable({
  providedIn: 'root',
})
export class ScorerMatchApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  listAssignedMatches(): Observable<MatchDetail[]> {
    return this.http.get<MatchDetail[]>(this.apiUrl.build('/matches/scorer/me'));
  }

  startClock(matchId: string): Observable<MatchDetail> {
    return this.postClockAction(matchId, 'start');
  }

  pauseClock(matchId: string): Observable<MatchDetail> {
    return this.postClockAction(matchId, 'pause');
  }

  resumeClock(matchId: string): Observable<MatchDetail> {
    return this.postClockAction(matchId, 'resume');
  }

  endClock(matchId: string): Observable<MatchDetail> {
    return this.postClockAction(matchId, 'end');
  }

  adjustClock(matchId: string, request: AdjustMatchClockRequest): Observable<MatchDetail> {
    return this.http.post<MatchDetail>(this.apiUrl.build(`/matches/${matchId}/clock/adjust`), request);
  }

  recordEvent(matchId: string, request: CreateMatchEventRequest): Observable<MatchEvent> {
    return this.http.post<MatchEvent>(this.apiUrl.build(`/matches/${matchId}/events`), request);
  }

  undoEvent(matchId: string, eventId: string): Observable<MatchEventUndoResult> {
    return this.http.delete<MatchEventUndoResult>(this.apiUrl.build(`/matches/${matchId}/events/${eventId}`));
  }

  finalizeMatch(matchId: string): Observable<MatchDetail> {
    return this.http.post<MatchDetail>(this.apiUrl.build(`/matches/${matchId}/finalize`), {});
  }

  private postClockAction(matchId: string, action: 'start' | 'pause' | 'resume' | 'end'): Observable<MatchDetail> {
    return this.http.post<MatchDetail>(this.apiUrl.build(`/matches/${matchId}/clock/${action}`), {});
  }
}
