import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, catchError, combineLatest, filter, map, of, startWith, switchMap } from 'rxjs';

import { AuthService } from '../../../core/auth/auth';
import { StatisticsApiService } from '../statistics-api.service';
import type { PlayerProfile as PlayerProfileModel } from '../statistics.models';

type PlayerProfileState =
  | { status: 'loading' }
  | { status: 'loaded'; profile: PlayerProfileModel }
  | { status: 'error' };

@Component({
  selector: 'app-player-profile',
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule],
  templateUrl: './player-profile.html',
  styleUrl: './player-profile.scss',
})
export class PlayerProfile {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly statisticsApi = inject(StatisticsApiService);
  private readonly refreshProfile$ = new Subject<void>();

  protected readonly currentUser = this.authService.currentUser;
  protected readonly settingsOpen = signal(false);
  protected readonly nameMessage = signal('');
  protected readonly passwordMessage = signal('');
  protected readonly savingName = signal(false);
  protected readonly savingPassword = signal(false);
  protected readonly profileForm = this.formBuilder.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
  });
  protected readonly passwordForm = this.formBuilder.nonNullable.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

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

  protected percentageValue(value: number | null): string {
    return value === null ? '-' : `${value}%`;
  }

  protected canManageProfile(profile: PlayerProfileModel): boolean {
    const user = this.currentUser();

    return user?.role === 'PLAYER' && user.id === profile.user.id;
  }

  protected openSettings(profile: PlayerProfileModel): void {
    this.profileForm.reset({
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
    });
    this.passwordForm.reset();
    this.nameMessage.set('');
    this.passwordMessage.set('');
    this.settingsOpen.set(true);
  }

  protected closeSettings(): void {
    this.settingsOpen.set(false);
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid || this.savingName()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingName.set(true);
    this.nameMessage.set('');
    this.authService.updateMyProfile(this.profileForm.getRawValue()).subscribe({
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

  protected changePassword(): void {
    if (this.passwordForm.invalid || this.savingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword.set(true);
    this.passwordMessage.set('');
    this.authService.changeMyPassword(this.passwordForm.getRawValue()).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordForm.reset();
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
