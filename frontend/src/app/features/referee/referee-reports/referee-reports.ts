import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { MatchesApiService } from '../../public/live-match/matches-api.service';
import type { MatchDetail } from '../../public/live-match/match.models';
import { RefereeReportsApiService, type RefereeReportDetail } from '../referee-reports-api.service';

@Component({
  selector: 'app-referee-reports',
  imports: [ReactiveFormsModule],
  templateUrl: './referee-reports.html',
  styleUrl: './referee-reports.scss',
})
export class RefereeReports implements OnInit {
  private readonly api = inject(RefereeReportsApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly matchesApi = inject(MatchesApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly loadedReport = signal<RefereeReportDetail | null>(null);
  protected readonly hasSelectedMatch = signal(false);
  protected readonly selectedMatch = signal<MatchDetail | null>(null);

  protected readonly reportForm = this.formBuilder.nonNullable.group({
    matchId: ['', Validators.required],
    notes: ['', Validators.required],
  });

  ngOnInit(): void {
    const matchId = this.route.snapshot.paramMap.get('matchId');

    if (matchId) {
      this.reportForm.controls.matchId.setValue(matchId);
      this.hasSelectedMatch.set(true);
      this.loadSelectedMatch(matchId);
    }
  }

  private loadSelectedMatch(matchId: string): void {
    this.matchesApi.getMatch(matchId).subscribe({
      next: (match) => this.selectedMatch.set(match),
      error: () => this.errorMessage.set('Mec nije pronadjen.'),
    });
  }

  protected loadReport(clearMessages = true): void {
    const matchId = this.reportForm.controls.matchId.value.trim();

    if (!matchId || this.isLoading()) {
      return;
    }

    if (clearMessages) {
      this.clearMessages();
    }
    this.isLoading.set(true);

    this.api
      .getReport(matchId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (report) => {
          this.loadedReport.set(report);
          this.reportForm.controls.notes.setValue(report.notes);
        },
        error: () => this.errorMessage.set('Izvestaj za ovaj mec nije pronadjen.'),
      });
  }

  protected submitReport(): void {
    if (this.reportForm.invalid || this.isSubmitting()) {
      this.reportForm.markAllAsTouched();
      return;
    }

    const { matchId, notes } = this.reportForm.getRawValue();

    this.clearMessages();
    this.isSubmitting.set(true);

    this.api
      .createReport(matchId.trim(), { notes: notes.trim() })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Izvestaj je sacuvan.');
          this.loadReport(false);
        },
        error: () => this.errorMessage.set('Izvestaj nije sacuvan. Proveri da li je mec finalan.'),
      });
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
