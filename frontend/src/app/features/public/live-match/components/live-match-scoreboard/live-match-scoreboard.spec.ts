import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { MatchDetail } from '../../match.models';
import { LiveMatchScoreboard } from './live-match-scoreboard';

describe('LiveMatchScoreboard', () => {
  let component: LiveMatchScoreboard;
  let fixture: ComponentFixture<LiveMatchScoreboard>;
  const match = {
    status: 'LIVE',
    clockStatus: 'RUNNING',
    clockRemainingSeconds: 480,
    teamAScore: 8,
    teamBScore: 6,
    teamA: { name: 'North Rim' },
    teamB: { name: 'South Arc' },
  } as MatchDetail;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveMatchScoreboard],
    }).compileComponents();

    fixture = TestBed.createComponent(LiveMatchScoreboard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('match', match);
    fixture.componentRef.setInput('visibleClockRemainingSeconds', 480);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
