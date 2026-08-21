import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../core/api';
import type { UserRole } from '../../core/auth/auth';
import type { AdminUser } from './admin-users.models';

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

  searchUsers(params: AdminUserSearchParams = {}): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.apiUrl.build('/users'), { params });
  }

  createUser(payload: AdminCreateUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.apiUrl.build('/users/create'), payload);
  }

  activateUser(userId: string): Observable<AdminUser> {
    return this.http.patch<AdminUser>(this.apiUrl.build(`/users/${userId}/activate`), {});
  }

  deactivateUser(userId: string): Observable<AdminUser> {
    return this.http.patch<AdminUser>(this.apiUrl.build(`/users/${userId}/deactivate`), {});
  }

  deleteUser(userId: string): Observable<AdminUser> {
    return this.http.delete<AdminUser>(this.apiUrl.build(`/users/${userId}`));
  }
}
