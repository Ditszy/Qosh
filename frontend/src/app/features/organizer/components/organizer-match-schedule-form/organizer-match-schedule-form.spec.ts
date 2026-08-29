import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizerMatchScheduleForm } from './organizer-match-schedule-form';

describe('OrganizerMatchScheduleForm', () => {
  let component: OrganizerMatchScheduleForm;
  let fixture: ComponentFixture<OrganizerMatchScheduleForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizerMatchScheduleForm],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizerMatchScheduleForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
