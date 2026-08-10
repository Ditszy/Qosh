import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { inject } from '@angular/core';

import { AdminUsersApiService } from '../admin-users-api.service';

@Component({
  selector: 'app-admin-users',
  imports: [AsyncPipe],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
})
export class AdminUsers {
  private readonly adminUsersApi = inject(AdminUsersApiService);

  readonly users$ = this.adminUsersApi.listUsers();
}
