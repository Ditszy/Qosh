import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { MatchDetail } from '../match.models';
import { MatchCard } from './match-card';

describe('MatchCard', () => {
  let component: MatchCard;
  let fixture: ComponentFixture<MatchCard>;
  const match: MatchDetail = {
    id: 'match-1',
    tournamentId: 'tournament-1',
    round: 1,
    bracketPosition: 1,
    teamAId: 'team-a',
    teamBId: 'team-b',
    winnerTeamId: null,
    scorerId: null,
    refereeId: null,
    scheduledAt: '2026-09-10T12:00:00.000Z',
    location: 'Novi Sad',
    status: 'SCHEDULED',
    teamAScore: 0,
    teamBScore: 0,
    clockStatus: 'NOT_STARTED',
    clockDurationSeconds: 600,
    clockRemainingSeconds: 600,
    clockLastStartedAt: null,
    nextRound: null,
    nextBracketPosition: null,
    nextMatchSlot: null,
    createdAt: '2026-08-19T12:00:00.000Z',
    updatedAt: '2026-08-19T12:00:00.000Z',
    tournament: {
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
    },
    teamA: {
      id: 'team-a',
      name: 'North Rim',
      tournamentId: 'tournament-1',
      createdAt: '2026-08-19T12:00:00.000Z',
      updatedAt: '2026-08-19T12:00:00.000Z',
    },
    teamB: {
      id: 'team-b',
      name: 'South Arc',
      tournamentId: 'tournament-1',
      createdAt: '2026-08-19T12:00:00.000Z',
      updatedAt: '2026-08-19T12:00:00.000Z',
    },
    winnerTeam: null,
    scorer: null,
    referee: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchCard],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('match', match);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
