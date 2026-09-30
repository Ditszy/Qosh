import { Component, computed, input, output } from '@angular/core';

import type { OrganizerTournamentWithMatches } from '../../store/organizer-dashboard.reducer';

type ChecklistStatus = 'done' | 'progress' | 'ready' | 'action' | 'blocked' | 'pending' | 'live';

type ChecklistAction = 'open' | 'lock' | 'bracket' | 'start' | 'review-matches';

type ChecklistStep = {
  title: string;
  detail: string;
  status: ChecklistStatus;
  action?: ChecklistAction;
  actionLabel?: string;
  pendingKey?: string;
};

export type OrganizerChecklistSignupStatusRequest = {
  tournamentId: string;
  action: 'open' | 'lock';
};

const statusLabels: Record<ChecklistStatus, string> = {
  done: 'Završeno',
  progress: 'U toku',
  ready: 'Spremno',
  action: 'Potrebna akcija',
  blocked: 'Blokirano',
  pending: 'Čeka',
  live: 'Uživo',
};

@Component({
  selector: 'app-organizer-tournament-checklist',
  imports: [],
  templateUrl: './organizer-tournament-checklist.html',
  styleUrl: './organizer-tournament-checklist.scss',
})
export class OrganizerTournamentChecklist {
  readonly tournament = input<OrganizerTournamentWithMatches | null>(null);
  readonly pendingAction = input('');

  readonly signupStatusRequested = output<OrganizerChecklistSignupStatusRequest>();
  readonly bracketRequested = output<string>();
  readonly startRequested = output<string>();
  readonly matchesReviewRequested = output<OrganizerTournamentWithMatches>();

  protected readonly steps = computed<ChecklistStep[]>(() => {
    const tournament = this.tournament();

    if (!tournament) {
      return [];
    }

    const teamsCount = tournament.teamCount;
    const hasEnoughTeams = teamsCount >= 2;
    const hasBracket = tournament.matchCount > 0;
    const unscheduledCount = tournament.unscheduledActiveMatchCount;
    const missingOfficialsCount = tournament.missingOfficialsActiveMatchCount;
    const liveCount = tournament.liveMatchCount;
    const finalCount = tournament.finalMatchCount;
    const scheduledCount = tournament.scheduledMatchCount;

    return [
      {
        title: 'Podešavanje turnira',
        detail: `${tournament.location} · ${tournament.maxTeams} timova maksimalno`,
        status: 'done',
      },
      this.signupsStep(tournament, teamsCount, hasEnoughTeams),
      this.bracketStep(tournament, hasBracket, hasEnoughTeams),
      this.scheduleStep(hasBracket, unscheduledCount),
      this.officialsStep(hasBracket, missingOfficialsCount),
      this.startStep(tournament, hasBracket, unscheduledCount, missingOfficialsCount, liveCount, finalCount, scheduledCount),
    ];
  });

  protected statusLabel(status: ChecklistStatus): string {
    return statusLabels[status];
  }

  protected isPending(step: ChecklistStep): boolean {
    return !!step.pendingKey && this.pendingAction() === step.pendingKey;
  }

  protected requestAction(step: ChecklistStep): void {
    const tournament = this.tournament();

    if (!tournament || !step.action || this.isPending(step)) {
      return;
    }

    if (step.action === 'open' || step.action === 'lock') {
      this.signupStatusRequested.emit({ tournamentId: tournament.id, action: step.action });
      return;
    }

    if (step.action === 'bracket') {
      this.bracketRequested.emit(tournament.id);
      return;
    }

    if (step.action === 'start') {
      this.startRequested.emit(tournament.id);
      return;
    }

    this.matchesReviewRequested.emit(tournament);
  }

  private signupsStep(
    tournament: OrganizerTournamentWithMatches,
    teamsCount: number,
    hasEnoughTeams: boolean,
  ): ChecklistStep {
    if (tournament.status === 'DRAFT') {
      return {
        title: 'Prijave timova',
        detail: 'Prijave još nisu otvorene.',
        status: 'action',
        action: 'open',
        actionLabel: 'Otvori prijave',
        pendingKey: `open:${tournament.id}`,
      };
    }

    if (tournament.status === 'SIGNUPS_OPEN') {
      return {
        title: 'Prijave timova',
        detail: `${teamsCount} / ${tournament.maxTeams} timova prijavljeno`,
        status: hasEnoughTeams ? 'ready' : 'blocked',
        action: hasEnoughTeams ? 'lock' : undefined,
        actionLabel: hasEnoughTeams ? 'Zaključaj prijave' : undefined,
        pendingKey: `lock:${tournament.id}`,
      };
    }

    return {
      title: 'Prijave timova',
      detail: `${teamsCount} timova zaključano za ovaj turnir`,
      status: 'done',
    };
  }

  private bracketStep(
    tournament: OrganizerTournamentWithMatches,
    hasBracket: boolean,
    hasEnoughTeams: boolean,
  ): ChecklistStep {
    if (hasBracket) {
      return {
        title: 'Žreb',
        detail: `${tournament.matchCount} mečeva generisano`,
        status: 'done',
      };
    }

    if (tournament.status === 'SIGNUPS_LOCKED') {
      return {
        title: 'Žreb',
        detail: hasEnoughTeams ? 'Prijave su zaključane i žreb može da se generiše.' : 'Potrebna su najmanje 2 tima.',
        status: hasEnoughTeams ? 'ready' : 'blocked',
        action: hasEnoughTeams ? 'bracket' : undefined,
        actionLabel: hasEnoughTeams ? 'Generiši žreb' : undefined,
        pendingKey: `bracket:${tournament.id}`,
      };
    }

    return {
      title: 'Žreb',
      detail: 'Čeka zaključavanje prijava.',
      status: 'pending',
    };
  }

  private scheduleStep(hasBracket: boolean, unscheduledCount: number): ChecklistStep {
    if (!hasBracket) {
      return {
        title: 'Raspored mečeva',
        detail: 'Čeka generisanje žreba.',
        status: 'pending',
      };
    }

    if (unscheduledCount > 0) {
      return {
        title: 'Raspored mečeva',
        detail: `${unscheduledCount} meča bez termina`,
        status: 'action',
        action: 'review-matches',
        actionLabel: 'Pregledaj mečeve',
      };
    }

    return {
      title: 'Raspored mečeva',
      detail: 'Svi aktivni mečevi imaju termin.',
      status: 'done',
    };
  }

  private officialsStep(hasBracket: boolean, missingOfficialsCount: number): ChecklistStep {
    if (!hasBracket) {
      return {
        title: 'Službena lica',
        detail: 'Čeka generisanje žreba.',
        status: 'pending',
      };
    }

    if (missingOfficialsCount > 0) {
      return {
        title: 'Službena lica',
        detail: `${missingOfficialsCount} meča bez zapisničara ili sudije`,
        status: 'action',
        action: 'review-matches',
        actionLabel: 'Dodeli lica',
      };
    }

    return {
      title: 'Službena lica',
      detail: 'Zapisničari i sudije su dodeljeni.',
      status: 'done',
    };
  }

  private startStep(
    tournament: OrganizerTournamentWithMatches,
    hasBracket: boolean,
    unscheduledCount: number,
    missingOfficialsCount: number,
    liveCount: number,
    finalCount: number,
    scheduledCount: number,
  ): ChecklistStep {
    if (tournament.status === 'IN_PROGRESS') {
      return {
        title: 'Tok turnira',
        detail: `${liveCount} uživo · ${scheduledCount} zakazano · ${finalCount} završeno`,
        status: liveCount > 0 ? 'live' : 'progress',
      };
    }

    if (tournament.status === 'COMPLETED') {
      return {
        title: 'Tok turnira',
        detail: 'Turnir je završen.',
        status: 'done',
      };
    }

    if (tournament.status !== 'SIGNUPS_LOCKED' || !hasBracket) {
      return {
        title: 'Start turnira',
        detail: 'Čeka žreb i pripremu mečeva.',
        status: 'pending',
      };
    }

    const preparationIssues = unscheduledCount + missingOfficialsCount;

    return {
      title: 'Start turnira',
      detail: preparationIssues > 0
        ? 'Turnir može da se pokrene, ali prvo proveri raspored i službena lica.'
        : 'Žreb, raspored i službena lica su spremni.',
      status: preparationIssues > 0 ? 'action' : 'ready',
      action: 'start',
      actionLabel: 'Pokreni turnir',
      pendingKey: `start:${tournament.id}`,
    };
  }
}
