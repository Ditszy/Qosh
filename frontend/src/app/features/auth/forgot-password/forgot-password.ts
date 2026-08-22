import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/auth';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly isSubmitting = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');

  protected readonly forgotPasswordForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected submit(): void {
    if (this.forgotPasswordForm.invalid || this.isSubmitting()) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.authService
      .forgotPassword(this.forgotPasswordForm.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => this.successMessage.set('Ako nalog postoji, poslali smo instrukcije za reset lozinke.'),
        error: () => this.errorMessage.set('Trenutno nije moguce poslati instrukcije. Pokusaj ponovo.'),
      });
  }
}
