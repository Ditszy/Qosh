import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerProfileSummary } from './player-profile-summary';

describe('PlayerProfileSummary', () => {
  let component: PlayerProfileSummary;
  let fixture: ComponentFixture<PlayerProfileSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerProfileSummary],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerProfileSummary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
