import { AsyncPipe } from '@angular/common';
import { Component, effect, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';

import { AdminCreateUserRole, AdminUserStats } from '../admin-users-api.service';
import type { AdminUserSearchRole } from '../admin-users.models';
import {
  AdminUsersActions,
  selectAdminCreateUserState,
  selectAdminUserSearchState,
  selectAdminUserStatsState,
} from '../store';
import type { UserRole } from '../../../core/auth/auth';

const roleLabels: Record<UserRole, string> = {
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
export class AdminUsers implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly store = inject(Store);

  readonly roleOptions: AdminCreateUserRole[] = ['ORGANIZER', 'REFEREE', 'SCORER'];
  readonly roleLabels = roleLabels;
  readonly searchRoleOptions: AdminUserSearchRole[] = ['ALL', 'PLAYER', 'ORGANIZER', 'REFEREE', 'SCORER', 'ADMIN'];
  readonly searchRoleLabels: Record<AdminUserSearchRole, string> = {
    ALL: 'Sve uloge',
    ...roleLabels,
  };
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
  readonly userSearchForm = this.formBuilder.nonNullable.group({
    query: [''],
    role: ['ALL' as AdminUserSearchRole],
  });

  readonly statsState$ = this.store.select(selectAdminUserStatsState);
  readonly userSearchState$ = this.store.select(selectAdminUserSearchState);
  readonly createUserState = this.store.selectSignal(selectAdminCreateUserState);

  constructor() {
    effect(() => {
      if (this.createUserState().status === 'success') {
        this.createUserForm.reset({ role: 'SCORER' });
      }
    });
  }

  ngOnInit(): void {
    this.store.dispatch(AdminUsersActions.loadStats());
  }

  createUser(): void {
    if (this.createUserForm.invalid || this.createUserState().loading) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.store.dispatch(AdminUsersActions.createUser({ payload: this.createUserForm.getRawValue() }));
  }

  updateUserSearch(): void {
    const value = this.userSearchForm.getRawValue();

    this.store.dispatch(AdminUsersActions.searchFiltersChanged({
      filters: {
        query: value.query,
        role: value.role,
      },
    }));
  }
}
