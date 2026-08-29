import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizerCommandCenter } from './organizer-command-center';

describe('OrganizerCommandCenter', () => {
  let component: OrganizerCommandCenter;
  let fixture: ComponentFixture<OrganizerCommandCenter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizerCommandCenter],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizerCommandCenter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
