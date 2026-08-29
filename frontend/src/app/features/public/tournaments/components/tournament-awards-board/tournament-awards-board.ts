import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { StatisticsTeamSummary, TournamentAward } from '../../../../statistics/statistics.models';

@Component({
  selector: 'app-tournament-awards-board',
  imports: [RouterLink],
  templateUrl: './tournament-awards-board.html',
  styleUrl: './tournament-awards-board.scss',
})
export class TournamentAwardsBoard {
  readonly awards = input.required<TournamentAward[]>();

  protected readonly hasWinners = computed(() => this.awards().some((award) => award.winner));

  protected teamNames(teams: StatisticsTeamSummary[]): string {
    return teams.map((team) => team.name).join(', ');
  }
}
