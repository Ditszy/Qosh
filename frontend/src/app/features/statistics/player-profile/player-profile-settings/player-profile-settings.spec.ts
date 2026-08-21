import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerProfileSettings } from './player-profile-settings';

describe('PlayerProfileSettings', () => {
  let component: PlayerProfileSettings;
  let fixture: ComponentFixture<PlayerProfileSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerProfileSettings],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerProfileSettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
