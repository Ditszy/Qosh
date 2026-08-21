import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { MatchRecap, MatchRecapHighlightKey } from '../../live-match/match.models';

const highlightLabels: Record<MatchRecapHighlightKey, string> = {
  TOP_SCORER: 'Najbolji strelac',
  PLAYER_OF_MATCH: 'Igrač meča',
};

@Component({
  selector: 'app-tournament-match-recap',
  imports: [RouterLink],
  templateUrl: './tournament-match-recap.html',
  styleUrl: './tournament-match-recap.scss',
})
export class TournamentMatchRecap {
  readonly recaps = input.required<MatchRecap[]>();

  protected readonly sortedRecaps = computed(() =>
    [...this.recaps()].sort((first, second) =>
      first.match.round - second.match.round || first.match.bracketPosition - second.match.bracketPosition,
    ),
  );

  protected highlightLabel(key: MatchRecapHighlightKey): string {
    return highlightLabels[key];
  }
}
