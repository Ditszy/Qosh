import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../core/api';
import type { AuthUser, UserRole } from '../../core/auth/auth';

export type AdminManagedUser = AuthUser;

export type AdminCreateUserRole = Extract<UserRole, 'ORGANIZER' | 'REFEREE' | 'SCORER'>;

export type AdminCreateUserRequest = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: AdminCreateUserRole;
};

@Injectable({
  providedIn: 'root',
})
export class AdminUsersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  listUsers(): Observable<AdminManagedUser[]> {
    return this.http.get<AdminManagedUser[]>(this.apiUrl.build('/users'));
  }

  createUser(payload: AdminCreateUserRequest): Observable<AdminManagedUser> {
    return this.http.post<AdminManagedUser>(this.apiUrl.build('/users/create'), payload);
  }
}
