import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import type { TournamentStatus } from '../tournament.models';
import { selectTournamentListView, TournamentListViewState, TournamentsActions } from '../store';

type TournamentSort = 'startsAt:asc' | 'startsAt:desc' | 'name:asc';

const statusLabels: Record<TournamentStatus, string> = {
  DRAFT: 'U pripremi',
  SIGNUPS_OPEN: 'Prijave otvorene',
  SIGNUPS_LOCKED: 'Prijave zaključane',
  IN_PROGRESS: 'U toku',
  COMPLETED: 'Završen',
  CANCELLED: 'Otkazan',
};

const sortLabels: Record<TournamentSort, string> = {
  'startsAt:asc': 'Najskorije',
  'startsAt:desc': 'Najkasnije',
  'name:asc': 'Naziv A-Z',
};

@Component({
  selector: 'app-tournament-list',
  imports: [AsyncPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './tournament-list.html',
  styleUrl: './tournament-list.scss',
})
export class TournamentList {
  private readonly store = inject(Store);
  protected readonly page = signal(1);
  protected readonly pageSize = 9;
  protected statusFilter: TournamentStatus | '' = '';
  protected sortSelection: TournamentSort = 'startsAt:asc';
  protected readonly selectedStatus = signal<TournamentStatus | ''>('');
  protected readonly sortMode = signal<TournamentSort>('startsAt:asc');
  protected readonly statusOptions = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));

  protected readonly state$: Observable<TournamentListViewState> = this.store.select(selectTournamentListView);

  constructor() {
    this.loadList();
  }

  protected statusLabel(status: TournamentStatus): string {
    return statusLabels[status];
  }

  protected selectedStatusLabel(): string {
    return this.selectedStatus() ? statusLabels[this.selectedStatus() as TournamentStatus] : 'Svi statusi';
  }

  protected sortLabel(): string {
    return sortLabels[this.sortMode()];
  }

  protected applySort(): void {
    this.sortMode.set(this.sortSelection);
    this.page.set(1);
    this.loadList();
  }

  protected applyStatus(): void {
    this.selectedStatus.set(this.statusFilter);
    this.page.set(1);
    this.loadList();
  }

  protected goToPage(page: number): void {
    this.page.set(page);
    this.loadList();
  }

  private loadList(): void {
    const [sortBy, sortDirection] = this.sortMode().split(':') as ['startsAt' | 'name', 'asc' | 'desc'];

    this.store.dispatch(TournamentsActions.loadList({
      query: {
        page: this.page(),
        pageSize: this.pageSize,
        status: this.selectedStatus() || undefined,
        sortBy,
        sortDirection,
      },
    }));
  }
}
