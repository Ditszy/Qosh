import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, finalize, map, of, switchMap } from 'rxjs';

import { AdminCreateUserRole, AdminUserStats, AdminUsersApiService } from '../admin-users-api.service';

const roleLabels: Record<AdminCreateUserRole | 'PLAYER' | 'ADMIN', string> = {
  PLAYER: 'Igrači',
  ORGANIZER: 'Organizatori',
  REFEREE: 'Sudije',
  SCORER: 'Zapisničari',
  ADMIN: 'Administratori',
};

type UserStatKey = Exclude<keyof AdminUserStats, 'totalUsers'>;

@Component({
  selector: 'app-admin-users',
  imports: [AsyncPipe, ReactiveFormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
})
export class AdminUsers {
  private readonly adminUsersApi = inject(AdminUsersApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly refreshStats$ = new BehaviorSubject<void>(undefined);

  readonly roleOptions: AdminCreateUserRole[] = ['ORGANIZER', 'REFEREE', 'SCORER'];
  readonly roleLabels = roleLabels;
  readonly roleStats: { label: string; key: UserStatKey }[] = [
    { label: roleLabels.PLAYER, key: 'players' },
    { label: roleLabels.ORGANIZER, key: 'organizers' },
    { label: roleLabels.REFEREE, key: 'referees' },
    { label: roleLabels.SCORER, key: 'scorers' },
    { label: roleLabels.ADMIN, key: 'admins' },
  ];
  readonly createUserForm = this.formBuilder.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['SCORER' as AdminCreateUserRole, Validators.required],
  });
  createUserMessage = '';
  isCreatingUser = false;

  readonly statsState$ = this.refreshStats$.pipe(
    switchMap(() =>
      this.adminUsersApi.getUserStats().pipe(
        map((stats) => ({ stats, error: null })),
        catchError(() => of({ stats: null, error: 'Nije moguce ucitati statistiku korisnika.' })),
      ),
    ),
  );

  createUser(): void {
    if (this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.createUserMessage = '';
    this.isCreatingUser = true;
    this.adminUsersApi.createUser(this.createUserForm.getRawValue()).pipe(
      finalize(() => {
        this.isCreatingUser = false;
      }),
    ).subscribe({
      next: () => {
        this.createUserMessage = 'Korisnik je kreiran.';
        this.createUserForm.reset({ role: 'SCORER' });
        this.refreshStats$.next();
      },
      error: () => {
        this.createUserMessage = 'Nije moguce kreirati korisnika.';
      },
    });
  }
}
