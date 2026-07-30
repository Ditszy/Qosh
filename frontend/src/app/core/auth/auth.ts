import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

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
  private readonly sessionSignal = signal<AuthSession | null>(this.readSession());

  readonly session = this.sessionSignal.asReadonly();
  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly accessToken = computed(() => this.session()?.access_token ?? null);
  readonly isAuthenticated = computed(() => Boolean(this.accessToken()));

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
    this.sessionSignal.set(null);
  }

  private saveSession(session: AuthSession): void {
    localStorage.setItem(storageKey, JSON.stringify(session));
    this.sessionSignal.set(session);
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
