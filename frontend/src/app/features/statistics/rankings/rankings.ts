import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Observable, of } from 'rxjs';

import { PlayerRankingsService } from '../player-rankings.service';
import type { PlayerRankingsState } from '../statistics.models';

@Component({
  selector: 'app-rankings',
  imports: [AsyncPipe],
  templateUrl: './rankings.html',
  styleUrl: './rankings.scss',
})
export class Rankings {
  private readonly playerRankings = inject(PlayerRankingsService);

  protected readonly state$: Observable<PlayerRankingsState> = this.playerRankings.watchGlobalRankings(of({}));
}
