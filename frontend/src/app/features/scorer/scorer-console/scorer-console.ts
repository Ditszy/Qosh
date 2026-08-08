import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-scorer-console',
  imports: [FormsModule, RouterLink],
  templateUrl: './scorer-console.html',
  styleUrl: './scorer-console.scss',
})
export class ScorerConsole {
  protected readonly matchId = signal('');
  protected readonly liveMatchLink = computed(() => {
    const id = this.matchId().trim();

    return id ? ['/matches', id, 'live'] : null;
  });

  protected updateMatchId(value: string): void {
    this.matchId.set(value);
  }
}
