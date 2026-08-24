import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerProfileEfficiencyChart } from './player-profile-efficiency-chart';

describe('PlayerProfileEfficiencyChart', () => {
  let component: PlayerProfileEfficiencyChart;
  let fixture: ComponentFixture<PlayerProfileEfficiencyChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerProfileEfficiencyChart],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerProfileEfficiencyChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
