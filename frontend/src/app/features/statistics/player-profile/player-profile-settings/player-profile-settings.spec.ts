import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerProfileSettings } from './player-profile-settings';
import type { PlayerProfile } from '../../statistics.models';

describe('PlayerProfileSettings', () => {
  let component: PlayerProfileSettings;
  let fixture: ComponentFixture<PlayerProfileSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerProfileSettings],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerProfileSettings);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('profile', {
      user: {
        id: 'player-1',
        email: 'player@example.com',
        username: 'player',
        firstName: 'Demo',
        lastName: 'Player',
        role: 'PLAYER',
      },
    } as PlayerProfile);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
