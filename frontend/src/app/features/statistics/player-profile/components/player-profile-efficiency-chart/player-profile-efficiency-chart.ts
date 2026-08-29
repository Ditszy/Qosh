import { Component, computed, input } from '@angular/core';

import type { PlayerRecentMatchStatistic } from '../../../statistics.models';

type EfficiencyPoint = {
  label: string;
  value: number;
  x: number;
  y: number;
};

@Component({
  selector: 'app-player-profile-efficiency-chart',
  imports: [],
  templateUrl: './player-profile-efficiency-chart.html',
  styleUrl: './player-profile-efficiency-chart.scss',
})
export class PlayerProfileEfficiencyChart {
  readonly matches = input.required<PlayerRecentMatchStatistic[]>();

  protected readonly chart = computed(() => {
    const orderedMatches = this.orderedMatches();
    const values = orderedMatches.map((match) => this.efficiency(match));

    if (!values.length) {
      return null;
    }

    const width = 320;
    const height = 132;
    const padding = 18;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    const bottom = height - padding;
    const points: EfficiencyPoint[] = values.map((value, index) => {
      const x = values.length === 1
        ? width / 2
        : padding + (index / (values.length - 1)) * (width - padding * 2);
      const y = min === max
        ? height / 2
        : bottom - ((value - min) / range) * (height - padding * 2);

      return {
        label: this.matchLabel(orderedMatches[index]),
        value,
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
      };
    });

    const latest = points[points.length - 1];
    const best = points.reduce((currentBest, point) => point.value > currentBest.value ? point : currentBest, points[0]);
    const average = values.reduce((total, value) => total + value, 0) / values.length;

    return {
      width,
      height,
      bottom,
      points,
      linePoints: points.map((point) => `${point.x},${point.y}`).join(' '),
      areaPath: `M ${points[0].x} ${bottom} L ${points.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${points[points.length - 1].x} ${bottom} Z`,
      latest,
      best,
      average: Number(average.toFixed(1)),
    };
  });

  private orderedMatches(): PlayerRecentMatchStatistic[] {
    return this.matches()
      .slice(0, 10)
      .map((match, index) => ({ match, index }))
      .sort((first, second) => {
        const firstTime = Date.parse(first.match.match.scheduledAt ?? '');
        const secondTime = Date.parse(second.match.match.scheduledAt ?? '');

        if (Number.isFinite(firstTime) && Number.isFinite(secondTime)) {
          return firstTime - secondTime;
        }

        return second.index - first.index;
      })
      .map(({ match }) => match);
  }

  private efficiency(match: PlayerRecentMatchStatistic): number {
    return match.points + match.rebounds + match.assists + match.steals + match.blocks - match.turnovers - match.fouls;
  }

  private matchLabel(match: PlayerRecentMatchStatistic): string {
    return match.match.scheduledAt
      ? new Date(match.match.scheduledAt).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })
      : `R${match.match.round}/M${match.match.bracketPosition}`;
  }
}
