import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { RefereeReportsApiService, type RefereeReportDetail } from '../referee-reports-api.service';

@Component({
  selector: 'app-referee-reports',
  imports: [ReactiveFormsModule],
  templateUrl: './referee-reports.html',
  styleUrl: './referee-reports.scss',
})
export class RefereeReports {
  private readonly api = inject(RefereeReportsApiService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly loadedReport = signal<RefereeReportDetail | null>(null);

  protected readonly reportForm = this.formBuilder.nonNullable.group({
    matchId: ['', Validators.required],
    notes: ['', Validators.required],
  });

  protected loadReport(): void {
    const matchId = this.reportForm.controls.matchId.value.trim();

    if (!matchId || this.isLoading()) {
      return;
    }

    this.clearMessages();
    this.isLoading.set(true);

    this.api
      .getReport(matchId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (report) => this.loadedReport.set(report),
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
        next: () => this.successMessage.set('Izvestaj je sacuvan.'),
        error: () => this.errorMessage.set('Izvestaj nije sacuvan. Proveri da li je mec finalan.'),
      });
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
