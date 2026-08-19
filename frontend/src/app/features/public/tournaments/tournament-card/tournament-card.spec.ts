import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { Tournament } from '../tournament.models';
import { TournamentCard } from './tournament-card';

describe('TournamentCard', () => {
  let component: TournamentCard;
  let fixture: ComponentFixture<TournamentCard>;
  const tournament: Tournament = {
    id: 'tournament-1',
    name: 'Qosh Open',
    description: null,
    location: 'Novi Sad',
    startsAt: '2026-09-10T12:00:00.000Z',
    maxTeams: 16,
    entryFee: 0,
    status: 'SIGNUPS_OPEN',
    organizerId: 'organizer-1',
    createdAt: '2026-08-19T12:00:00.000Z',
    updatedAt: '2026-08-19T12:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentCard],
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tournament', tournament);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
