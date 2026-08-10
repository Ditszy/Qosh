import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';

import { AdminUsersApiService } from '../admin-users-api.service';

@Component({
  selector: 'app-admin-users',
  imports: [AsyncPipe],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
})
export class AdminUsers {
  private readonly adminUsersApi = inject(AdminUsersApiService);

  readonly usersState$ = this.adminUsersApi.listUsers().pipe(
    map((users) => ({ users, error: null })),
    catchError(() => of({ users: [], error: 'Nije moguce ucitati korisnike.' })),
  );
}
