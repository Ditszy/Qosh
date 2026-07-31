import { computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs';

import { AuthActions, selectAccessToken, selectAuthSession, selectCurrentUser } from './auth.state';

export type UserRole = 'PLAYER' | 'ORGANIZER' | 'REFEREE' | 'SCORER' | 'ADMIN';

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = LoginRequest & {
  username: string;
  firstName: string;
  lastName: string;
};

export type AuthSession = {
  access_token: string;
  user: AuthUser;
};

const apiBaseUrl = 'http://localhost:3000';
const storageKey = 'qosh.auth.session';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(Store);

  readonly session = this.store.selectSignal(selectAuthSession);
  readonly currentUser = this.store.selectSignal(selectCurrentUser);
  readonly accessToken = this.store.selectSignal(selectAccessToken);
  readonly isAuthenticated = computed(() => Boolean(this.accessToken()));

  constructor() {
    this.store.dispatch(AuthActions.hydrateSession({ session: this.readSession() }));
  }

  login(credentials: LoginRequest) {
    return this.http.post<AuthSession>(`${apiBaseUrl}/auth/login`, credentials).pipe(
      tap((session) => this.saveSession(session)),
    );
  }

  register(payload: RegisterRequest) {
    return this.http.post<AuthUser>(`${apiBaseUrl}/auth/register`, payload);
  }

  logout(): void {
    localStorage.removeItem(storageKey);
    this.store.dispatch(AuthActions.logout());
  }

  private saveSession(session: AuthSession): void {
    localStorage.setItem(storageKey, JSON.stringify(session));
    this.store.dispatch(AuthActions.loginSucceeded({ session }));
  }

  private readSession(): AuthSession | null {
    const rawSession = localStorage.getItem(storageKey);

    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as AuthSession;
    } catch {
      localStorage.removeItem(storageKey);
      return null;
    }
  }
}
