import { Component, input } from '@angular/core';
import { PlayerStatistic } from '../../../statistics.models';

@Component({
  selector: 'app-player-profile-summary',
  imports: [],
  templateUrl: './player-profile-summary.html',
  styleUrl: './player-profile-summary.scss',
})
export class PlayerProfileSummary {
  readonly stats = input.required<PlayerStatistic>();

  protected percentageValue(value: number | null): string {
    return value === null ? '-' : `${value}%`;
  }
}
