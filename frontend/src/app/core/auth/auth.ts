import { computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { EMPTY, catchError, tap } from 'rxjs';

import { ApiUrlService } from '../api';
import { AuthActions, selectAccessToken, selectAuthSession, selectCurrentUser } from './store';

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

export type UpdateMyProfileRequest = {
  firstName: string;
  lastName: string;
};

export type ChangeMyPasswordRequest = {
  oldPassword: string;
  newPassword: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type AuthCommandResponse = {
  success: true;
};

export type AuthSession = {
  access_token: string;
  user: AuthUser;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly store = inject(Store);

  readonly session = this.store.selectSignal(selectAuthSession);
  readonly currentUser = this.store.selectSignal(selectCurrentUser);
  readonly accessToken = this.store.selectSignal(selectAccessToken);
  readonly isAuthenticated = computed(() => Boolean(this.accessToken()));

  login(credentials: LoginRequest) {
    return this.http.post<AuthSession>(this.apiUrl.build('/auth/login'), credentials, { withCredentials: true }).pipe(
      tap((session) => this.saveSession(session)),
    );
  }

  refreshSession() {
    return this.http.post<AuthSession>(this.apiUrl.build('/auth/refresh'), {}, { withCredentials: true }).pipe(
      tap((session) => this.saveSession(session)),
    );
  }

  register(payload: RegisterRequest) {
    return this.http.post<AuthUser>(this.apiUrl.build('/auth/register'), payload);
  }

  updateMyProfile(payload: UpdateMyProfileRequest) {
    return this.http.patch<AuthUser>(this.apiUrl.build('/users/me/profile'), payload).pipe(
      tap((user) => this.store.dispatch(AuthActions.currentUserUpdated({ user }))),
    );
  }

  changeMyPassword(payload: ChangeMyPasswordRequest) {
    return this.http.patch<void>(this.apiUrl.build('/users/me/password'), payload);
  }

  forgotPassword(payload: ForgotPasswordRequest) {
    return this.http.post<AuthCommandResponse>(this.apiUrl.build('/auth/forgot-password'), payload);
  }

  resetPassword(payload: ResetPasswordRequest) {
    return this.http.post<AuthCommandResponse>(this.apiUrl.build('/auth/reset-password'), payload);
  }

  logout(): void {
    this.clearSession();
    this.http.post(this.apiUrl.build('/auth/logout'), {}, { withCredentials: true }).pipe(
      catchError(() => EMPTY),
    ).subscribe();
  }

  clearSession(): void {
    this.store.dispatch(AuthActions.logout());
  }

  private saveSession(session: AuthSession): void {
    this.store.dispatch(AuthActions.loginSucceeded({ session }));
  }
}
