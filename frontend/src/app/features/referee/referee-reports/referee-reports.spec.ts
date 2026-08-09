import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefereeReports } from './referee-reports';

describe('RefereeReports', () => {
  let component: RefereeReports;
  let fixture: ComponentFixture<RefereeReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefereeReports],
    }).compileComponents();

    fixture = TestBed.createComponent(RefereeReports);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
