import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, map, of, switchMap } from 'rxjs';

import { AdminCreateUserRole, AdminUsersApiService } from '../admin-users-api.service';

@Component({
  selector: 'app-admin-users',
  imports: [AsyncPipe, ReactiveFormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
})
export class AdminUsers {
  private readonly adminUsersApi = inject(AdminUsersApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly refreshUsers$ = new BehaviorSubject<void>(undefined);

  readonly roleOptions: AdminCreateUserRole[] = ['ORGANIZER', 'REFEREE', 'SCORER'];
  readonly createUserForm = this.formBuilder.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['SCORER' as AdminCreateUserRole, Validators.required],
  });
  createUserMessage = '';

  readonly usersState$ = this.refreshUsers$.pipe(
    switchMap(() =>
      this.adminUsersApi.listUsers().pipe(
        map((users) => ({ users, error: null })),
        catchError(() => of({ users: [], error: 'Nije moguce ucitati korisnike.' })),
      ),
    ),
  );

  createUser(): void {
    if (this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.createUserMessage = '';
    this.adminUsersApi.createUser(this.createUserForm.getRawValue()).subscribe({
      next: () => {
        this.createUserMessage = 'Korisnik je kreiran.';
        this.createUserForm.reset({ role: 'SCORER' });
        this.refreshUsers$.next();
      },
      error: () => {
        this.createUserMessage = 'Nije moguce kreirati korisnika.';
      },
    });
  }
}
