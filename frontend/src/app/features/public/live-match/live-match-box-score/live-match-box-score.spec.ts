import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type { MatchStatistics } from '../../../statistics';
import { LiveMatchBoxScore } from './live-match-box-score';

describe('LiveMatchBoxScore', () => {
  let component: LiveMatchBoxScore;
  let fixture: ComponentFixture<LiveMatchBoxScore>;
  const statistics = {
    teams: [
      {
        team: { id: 'team-1', name: 'North Rim' },
        players: [
          {
            player: { id: 'player-1', firstName: 'Mina', username: 'mina', lastName: 'Ilic' },
            points: 8,
            onePointMade: 2,
            onePointAttempted: 3,
            onePointPercentage: 67,
            twoPointMade: 3,
            twoPointAttempted: 5,
            twoPointPercentage: 60,
            freeThrowMade: 0,
            freeThrowAttempted: 0,
            freeThrowPercentage: null,
            rebounds: 4,
            assists: 2,
            steals: 1,
            blocks: 0,
            turnovers: 1,
            fouls: 2,
          },
        ],
        totals: {
          points: 8,
          onePointMade: 2,
          onePointAttempted: 3,
          onePointPercentage: 67,
          twoPointMade: 3,
          twoPointAttempted: 5,
          twoPointPercentage: 60,
          freeThrowMade: 0,
          freeThrowAttempted: 0,
          freeThrowPercentage: null,
          rebounds: 4,
          assists: 2,
          steals: 1,
          blocks: 0,
          turnovers: 1,
          fouls: 2,
        },
      },
    ],
  } as MatchStatistics;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveMatchBoxScore],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LiveMatchBoxScore);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('statistics', statistics);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
