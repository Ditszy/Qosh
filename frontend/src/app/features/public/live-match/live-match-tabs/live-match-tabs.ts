import { Component, input, output } from '@angular/core';

export type LiveMatchPanel = 'events' | 'boxScore' | 'report';

@Component({
  selector: 'app-live-match-tabs',
  imports: [],
  templateUrl: './live-match-tabs.html',
  styleUrl: './live-match-tabs.scss',
})
export class LiveMatchTabs {
  readonly selectedPanel = input<LiveMatchPanel>('events');
  readonly panelSelected = output<LiveMatchPanel>();

  protected selectPanel(panel: LiveMatchPanel): void {
    this.panelSelected.emit(panel);
  }
}
