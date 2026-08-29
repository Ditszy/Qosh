import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerProfilePreviousMatches } from './player-profile-previous-matches';
import type { PlayerRecentMatchStatistic } from '../../statistics.models';

describe('PlayerProfilePreviousMatches', () => {
  let component: PlayerProfilePreviousMatches;
  let fixture: ComponentFixture<PlayerProfilePreviousMatches>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerProfilePreviousMatches],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerProfilePreviousMatches);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('matches', [] satisfies PlayerRecentMatchStatistic[]);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
