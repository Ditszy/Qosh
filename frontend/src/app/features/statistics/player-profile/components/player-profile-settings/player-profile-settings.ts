import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { ChangeMyPasswordRequest, UpdateMyProfileRequest } from '../../../../../core/auth/auth';
import type { PlayerProfile as PlayerProfileModel } from '../../../statistics.models';

const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PROFILE_IMAGE_HELP_TEXT = 'Dozvoljeni su JPG, PNG i WebP fajlovi do 5 MB.';

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
  readonly savingImage = input(false);
  readonly savingPassword = input(false);
  readonly nameMessage = input('');
  readonly imageMessage = input('');
  readonly passwordMessage = input('');

  readonly closeRequested = output<void>();
  readonly profileSubmitted = output<UpdateMyProfileRequest>();
  readonly imageSubmitted = output<File>();
  readonly passwordSubmitted = output<ChangeMyPasswordRequest>();

  protected readonly profileForm = this.formBuilder.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
  });
  protected readonly passwordForm = this.formBuilder.nonNullable.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });
  protected readonly selectedImage = signal<File | null>(null);
  protected readonly imageError = signal('');
  protected readonly imageHelpText = PROFILE_IMAGE_HELP_TEXT;

  constructor() {
    effect(() => {
      const user = this.profile().user;

      this.profileForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
      });
      this.passwordForm.reset();
      this.selectedImage.set(null);
      this.imageError.set('');
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

  protected selectImage(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0] ?? null;

    this.imageError.set('');
    this.selectedImage.set(null);

    if (!file) {
      return;
    }

    if (!ALLOWED_PROFILE_IMAGE_TYPES.includes(file.type) || file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
      inputElement.value = '';
      this.imageError.set(PROFILE_IMAGE_HELP_TEXT);
      return;
    }

    this.selectedImage.set(file);
  }

  protected saveImage(): void {
    const file = this.selectedImage();

    if (!file || this.savingImage()) {
      this.imageError.set(PROFILE_IMAGE_HELP_TEXT);
      return;
    }

    this.imageSubmitted.emit(file);
  }
}
