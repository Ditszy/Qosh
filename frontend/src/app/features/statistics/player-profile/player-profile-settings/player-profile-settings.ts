import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { ChangeMyPasswordRequest, UpdateMyProfileRequest } from '../../../../core/auth/auth';
import type { PlayerProfile as PlayerProfileModel } from '../../statistics.models';

@Component({
  selector: 'app-player-profile-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './player-profile-settings.html',
  styleUrl: './player-profile-settings.scss',
})
export class PlayerProfileSettings {
  private readonly formBuilder = inject(FormBuilder);

  readonly profile = input.required<PlayerProfileModel>();
  readonly savingName = input(false);
  readonly savingPassword = input(false);
  readonly nameMessage = input('');
  readonly passwordMessage = input('');

  readonly closeRequested = output<void>();
  readonly profileSubmitted = output<UpdateMyProfileRequest>();
  readonly passwordSubmitted = output<ChangeMyPasswordRequest>();

  protected readonly profileForm = this.formBuilder.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
  });
  protected readonly passwordForm = this.formBuilder.nonNullable.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    effect(() => {
      const user = this.profile().user;

      this.profileForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
      });
      this.passwordForm.reset();
    });
  }

  protected close(): void {
    this.closeRequested.emit();
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid || this.savingName()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileSubmitted.emit(this.profileForm.getRawValue());
  }

  protected changePassword(): void {
    if (this.passwordForm.invalid || this.savingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordSubmitted.emit(this.passwordForm.getRawValue());
  }
}
