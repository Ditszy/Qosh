import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { PlayerRecentMatchStatistic } from '../../statistics.models';

@Component({
  selector: 'app-player-profile-previous-matches',
  imports: [DatePipe, RouterLink],
  templateUrl: './player-profile-previous-matches.html',
  styleUrl: './player-profile-previous-matches.scss',
})
export class PlayerProfilePreviousMatches {
  readonly matches = input.required<PlayerRecentMatchStatistic[]>();
}
