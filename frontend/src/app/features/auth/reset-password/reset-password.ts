import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/auth';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  protected readonly isSubmitting = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly resetPasswordForm = this.formBuilder.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected submit(): void {
    if (!this.token) {
      this.errorMessage.set('Link za reset lozinke nije validan.');
      return;
    }

    if (this.resetPasswordForm.invalid || this.isSubmitting()) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.authService
      .resetPassword({
        token: this.token,
        newPassword: this.resetPasswordForm.getRawValue().newPassword,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => this.successMessage.set('Lozinka je promenjena. Mozes da se prijavis.'),
        error: () => this.errorMessage.set('Link je istekao ili nije validan. Zatrazi novi reset lozinke.'),
      });
  }
}
