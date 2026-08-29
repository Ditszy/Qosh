import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerProfileDetails } from './player-profile-details';

describe('PlayerProfileDetails', () => {
  let component: PlayerProfileDetails;
  let fixture: ComponentFixture<PlayerProfileDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerProfileDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerProfileDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
