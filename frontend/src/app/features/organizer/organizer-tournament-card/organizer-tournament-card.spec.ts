import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizerTournamentCard } from './organizer-tournament-card';

describe('OrganizerTournamentCard', () => {
  let component: OrganizerTournamentCard;
  let fixture: ComponentFixture<OrganizerTournamentCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizerTournamentCard],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizerTournamentCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
