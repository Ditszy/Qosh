import { DatePipe } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import type { RefereeAssignedMatch } from '../referee-reports-api.service';
import {
  RefereeActions,
  selectRefereeAssignedMatches,
  selectRefereeAssignedMatchesLoading,
  selectRefereeError,
  selectRefereeLoadedReport,
  selectRefereeReportSubmitting,
  selectRefereeSelectedMatch,
  selectRefereeSelectedMatchLoading,
} from '../store';

@Component({
  selector: 'app-referee-reports',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './referee-reports.html',
  styleUrl: './referee-reports.scss',
})
export class RefereeReports implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);

  protected readonly hasSelectedMatch = signal(false);
  protected readonly isSubmitting = this.store.selectSignal(selectRefereeReportSubmitting);
  protected readonly errorMessage = this.store.selectSignal(selectRefereeError);
  protected readonly loadedReport = this.store.selectSignal(selectRefereeLoadedReport);
  protected readonly isLoadingAssignedMatches = this.store.selectSignal(selectRefereeAssignedMatchesLoading);
  protected readonly isLoadingSelectedMatch = this.store.selectSignal(selectRefereeSelectedMatchLoading);
  protected readonly assignedMatches = this.store.selectSignal(selectRefereeAssignedMatches);
  protected readonly selectedMatch = this.store.selectSignal(selectRefereeSelectedMatch);

  protected readonly reportForm = this.formBuilder.nonNullable.group({
    matchId: ['', Validators.required],
    notes: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const report = this.loadedReport();

      if (report && this.reportForm.controls.notes.value !== report.notes) {
        this.reportForm.controls.notes.setValue(report.notes, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    const matchId = this.route.snapshot.paramMap.get('matchId');

    if (matchId) {
      this.reportForm.controls.matchId.setValue(matchId);
      this.hasSelectedMatch.set(true);
      this.store.dispatch(RefereeActions.loadSelectedMatch({ matchId }));
      this.store.dispatch(RefereeActions.loadExistingReport({ matchId }));
    } else {
      this.loadAssignedMatches();
    }
  }

  private loadAssignedMatches(): void {
    this.store.dispatch(RefereeActions.loadAssignedMatches());
  }

  protected submitReport(): void {
    if (this.reportForm.invalid || this.isSubmitting() || this.cannotSubmitReport()) {
      this.reportForm.markAllAsTouched();
      return;
    }

    const { matchId, notes } = this.reportForm.getRawValue();

    this.store.dispatch(RefereeActions.submitReport({ matchId: matchId.trim(), notes: notes.trim() }));
  }

  protected hasLoadedReport(): boolean {
    return Boolean(this.loadedReport());
  }

  protected cannotSubmitReport(): boolean {
    return this.hasLoadedReport() || (this.hasSelectedMatch() && this.selectedMatch()?.status !== 'FINAL');
  }

  protected submitButtonLabel(): string {
    if (this.hasLoadedReport()) {
      return 'Izveštaj je već sačuvan';
    }

    if (this.hasSelectedMatch() && this.selectedMatch()?.status !== 'FINAL') {
      return 'Čeka se kraj meča';
    }

    return 'Sačuvaj izveštaj';
  }

  protected matchStatusLabel(match: RefereeAssignedMatch): string {
    if (match.hasReport) {
      return 'Izveštaj sačuvan';
    }

    if (match.status === 'FINAL') {
      return 'Spreman za izveštaj';
    }

    if (match.status === 'LIVE') {
      return 'U toku';
    }

    return 'Zakazan';
  }
}
