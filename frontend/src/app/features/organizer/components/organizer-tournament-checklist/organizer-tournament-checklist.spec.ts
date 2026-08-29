import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizerTournamentChecklist } from './organizer-tournament-checklist';

describe('OrganizerTournamentChecklist', () => {
  let component: OrganizerTournamentChecklist;
  let fixture: ComponentFixture<OrganizerTournamentChecklist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizerTournamentChecklist],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizerTournamentChecklist);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
