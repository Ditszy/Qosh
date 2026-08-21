import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';

import type { PlayerRecentMatchStatistic } from '../../statistics.models';

@Component({
  selector: 'app-player-profile-previous-matches',
  imports: [DatePipe],
  templateUrl: './player-profile-previous-matches.html',
  styleUrl: './player-profile-previous-matches.scss',
})
export class PlayerProfilePreviousMatches {
  readonly matches = input.required<PlayerRecentMatchStatistic[]>();
}
