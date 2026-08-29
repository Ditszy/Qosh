import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TournamentAwardsBoard } from './tournament-awards-board';
import type { TournamentAward } from '../../../../statistics/statistics.models';

describe('TournamentAwardsBoard', () => {
  let component: TournamentAwardsBoard;
  let fixture: ComponentFixture<TournamentAwardsBoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentAwardsBoard],
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentAwardsBoard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('awards', [] satisfies TournamentAward[]);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
