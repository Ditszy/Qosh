import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../core/api';
import type { PublicUser, Tournament } from '../public/tournaments/tournament.models';

export type TeamMemberRole = 'CAPTAIN' | 'MEMBER';
export type TeamInviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
export type TeamSummary = { id: string; name: string; tournamentId: string; createdAt: string; updatedAt: string };
export type TeamMember = { id: string; teamId: string; userId: string; role: TeamMemberRole; joinedAt: string; user: PublicUser };
export type TeamDetail = TeamSummary & { members: TeamMember[] };
export type TeamInvite = {
  id: string;
  teamId: string;
  invitedUserId: string;
  inviterId: string;
  createdAt: string;
  status: TeamInviteStatus;
  respondedAt: string | null;
  invitedUser: PublicUser;
  inviter: PublicUser;
  team?: TeamSummary & { tournament: Tournament };
};
export type CreateTeamRequest = { name: string; tournamentId: string };
export type SendTeamInviteRequest = { invitedUserId: string };

@Injectable({ providedIn: 'root' })
export class TeamsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  createTeam(request: CreateTeamRequest): Observable<TeamSummary> {
    return this.http.post<TeamSummary>(this.apiUrl.build('/teams'), request);
  }

  listTournamentTeams(tournamentId: string): Observable<TeamDetail[]> {
    return this.http.get<TeamDetail[]>(this.apiUrl.build(`/teams/tournament/${tournamentId}`));
  }

  listMyPendingInvites(): Observable<TeamInvite[]> {
    return this.http.get<TeamInvite[]>(this.apiUrl.build('/teams/invites/me'));
  }

  listMyTeams(): Observable<TeamDetail[]> {
    return this.http.get<TeamDetail[]>(this.apiUrl.build('/teams/me'));
  }

  searchPlayers(query: string): Observable<PublicUser[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<PublicUser[]>(this.apiUrl.build('/users/players/search'), { params });
  }

  sendInvite(teamId: string, request: SendTeamInviteRequest): Observable<TeamInvite> {
    return this.http.post<TeamInvite>(this.apiUrl.build(`/teams/${teamId}/invites`), request);
  }

  acceptInvite(inviteId: string): Observable<TeamDetail> {
    return this.http.post<TeamDetail>(this.apiUrl.build(`/teams/invites/${inviteId}/accept`), {});
  }

  declineInvite(inviteId: string): Observable<TeamInvite> {
    return this.http.post<TeamInvite>(this.apiUrl.build(`/teams/invites/${inviteId}/decline`), {});
  }

  removeMember(teamId: string, memberId: string): Observable<TeamDetail> {
    return this.http.delete<TeamDetail>(this.apiUrl.build(`/teams/${teamId}/members/${memberId}`));
  }

  transferCaptain(teamId: string, memberId: string): Observable<TeamDetail> {
    return this.http.post<TeamDetail>(this.apiUrl.build(`/teams/${teamId}/members/${memberId}/transfer-captain`), {});
  }
}
