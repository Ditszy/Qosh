import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, catchError, combineLatest, filter, map, of, startWith, switchMap } from 'rxjs';

import { AuthService, ChangeMyPasswordRequest, UpdateMyProfileRequest } from '../../../core/auth/auth';
import { PlayerProfileAvatar } from './player-profile-avatar/player-profile-avatar';
import { PlayerProfileEfficiencyChart } from './player-profile-efficiency-chart/player-profile-efficiency-chart';
import { PlayerProfilePreviousMatches } from './player-profile-previous-matches/player-profile-previous-matches';
import { PlayerProfileSettings } from './player-profile-settings/player-profile-settings';
import { StatisticsApiService } from '../statistics-api.service';
import type { PlayerProfile as PlayerProfileModel, PlayerRecentMatchStatistic } from '../statistics.models';
import { PlayerProfileSummary } from "./player-profile-summary/player-profile-summary";

type PlayerProfileState =
  | { status: 'loading' }
  | { status: 'loaded'; profile: PlayerProfileModel }
  | { status: 'error' };

@Component({
  selector: 'app-player-profile',
  imports: [AsyncPipe, DatePipe, RouterLink, PlayerProfileAvatar, PlayerProfileEfficiencyChart, PlayerProfilePreviousMatches, PlayerProfileSettings, PlayerProfileSummary],
  templateUrl: './player-profile.html',
  styleUrl: './player-profile.scss',
})
export class PlayerProfile {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly statisticsApi = inject(StatisticsApiService);
  private readonly refreshProfile$ = new Subject<void>();

  protected readonly currentUser = this.authService.currentUser;
  protected readonly settingsOpen = signal(false);
  protected readonly nameMessage = signal('');
  protected readonly imageMessage = signal('');
  protected readonly passwordMessage = signal('');
  protected readonly savingName = signal(false);
  protected readonly savingImage = signal(false);
  protected readonly savingPassword = signal(false);

  protected readonly state$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id): id is string => Boolean(id)),
    switchMap((id) => combineLatest([of(id), this.refreshProfile$.pipe(startWith(undefined))])),
    switchMap(([id]) =>
      this.statisticsApi.getPlayerProfile(id).pipe(
        map((profile) => ({ status: 'loaded', profile }) satisfies PlayerProfileState),
        startWith({ status: 'loading' } satisfies PlayerProfileState),
        catchError(() => of({ status: 'error' } satisfies PlayerProfileState)),
      ),
    ),
  );


  protected bestMatch(matches: PlayerRecentMatchStatistic[]): PlayerRecentMatchStatistic | null {
    return [...matches].sort(
      (first, second) =>
        second.points - first.points ||
        second.rebounds - first.rebounds ||
        second.assists - first.assists,
    )[0] ?? null;
  }

  protected canManageProfile(profile: PlayerProfileModel): boolean {
    const user = this.currentUser();

    return user?.id === profile.user.id;
  }

  protected openSettings(): void {
    this.nameMessage.set('');
    this.imageMessage.set('');
    this.passwordMessage.set('');
    this.settingsOpen.set(true);
  }

  protected closeSettings(): void {
    this.settingsOpen.set(false);
  }

  protected saveProfile(payload: UpdateMyProfileRequest): void {
    this.savingName.set(true);
    this.nameMessage.set('');
    this.authService.updateMyProfile(payload).subscribe({
      next: () => {
        this.savingName.set(false);
        this.nameMessage.set('Profil je ažuriran.');
        this.refreshProfile$.next();
      },
      error: () => {
        this.savingName.set(false);
        this.nameMessage.set('Nije moguće ažurirati profil.');
      },
    });
  }

  protected saveProfileImage(file: File): void {
    this.savingImage.set(true);
    this.imageMessage.set('');
    this.authService.uploadMyProfileImage(file).subscribe({
      next: () => {
        this.savingImage.set(false);
        this.imageMessage.set('Slika je ažurirana.');
        this.refreshProfile$.next();
      },
      error: () => {
        this.savingImage.set(false);
        this.imageMessage.set('Nije moguće ažurirati sliku.');
      },
    });
  }

  protected changePassword(payload: ChangeMyPasswordRequest): void {
    this.savingPassword.set(true);
    this.passwordMessage.set('');
    this.authService.changeMyPassword(payload).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordMessage.set('Lozinka je promenjena.');
      },
      error: (error: unknown) => {
        this.savingPassword.set(false);
        this.passwordMessage.set(this.passwordErrorMessage(error));
      },
    });
  }

  private passwordErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 400) {
      return 'Stara lozinka nije tačna.';
    }

    return 'Nije moguće promeniti lozinku.';
  }
}
