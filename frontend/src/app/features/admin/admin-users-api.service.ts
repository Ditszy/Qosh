import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../core/api';
import type { AuthUser, UserRole } from '../../core/auth/auth';

export type AdminCreateUserRole = Extract<UserRole, 'ORGANIZER' | 'REFEREE' | 'SCORER'>;

export type AdminCreateUserRequest = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: AdminCreateUserRole;
};

export type AdminUserStats = {
  totalUsers: number;
  players: number;
  organizers: number;
  referees: number;
  scorers: number;
  admins: number;
};

export type AdminUserSearchParams = {
  q?: string;
  role?: UserRole;
};

@Injectable({
  providedIn: 'root',
})
export class AdminUsersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  getUserStats(): Observable<AdminUserStats> {
    return this.http.get<AdminUserStats>(this.apiUrl.build('/users/stats'));
  }

  searchUsers(params: AdminUserSearchParams = {}): Observable<AuthUser[]> {
    return this.http.get<AuthUser[]>(this.apiUrl.build('/users'), { params });
  }

  createUser(payload: AdminCreateUserRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(this.apiUrl.build('/users/create'), payload);
  }
}
