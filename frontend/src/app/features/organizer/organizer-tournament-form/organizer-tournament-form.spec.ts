import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizerTournamentForm } from './organizer-tournament-form';

describe('OrganizerTournamentForm', () => {
  let component: OrganizerTournamentForm;
  let fixture: ComponentFixture<OrganizerTournamentForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizerTournamentForm],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizerTournamentForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
