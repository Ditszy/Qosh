import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { MatchStatistics } from '../../../statistics';

type BoxScoreSummary = {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  fouls: number;
};

@Component({
  selector: 'app-live-match-box-score',
  imports: [RouterLink],
  templateUrl: './live-match-box-score.html',
  styleUrl: './live-match-box-score.scss',
})
export class LiveMatchBoxScore {
  readonly statistics = input.required<MatchStatistics>();

  protected boxScoreSummary(): BoxScoreSummary {
    return this.statistics().teams.reduce<BoxScoreSummary>(
      (summary, team) => ({
        points: summary.points + team.totals.points,
        rebounds: summary.rebounds + team.totals.rebounds,
        assists: summary.assists + team.totals.assists,
        steals: summary.steals + team.totals.steals,
        fouls: summary.fouls + team.totals.fouls,
      }),
      { points: 0, rebounds: 0, assists: 0, steals: 0, fouls: 0 },
    );
  }
}
