import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlayerRecentMatchStatistic } from '../../statistics.models';

@Component({
  selector: 'app-player-profile-details',
  imports: [RouterLink, DatePipe],
  templateUrl: './player-profile-details.html',
  styleUrl: './player-profile-details.scss',
})
export class PlayerProfileDetails {
  readonly matches = input.required<PlayerRecentMatchStatistic[]>();

  protected bestMatch(): PlayerRecentMatchStatistic | null {
    return [...this.matches()].sort(
      (first, second) =>
        second.points - first.points ||
        second.rebounds - first.rebounds ||
        second.assists - first.assists,
    )[0] ?? null;
  }
}
