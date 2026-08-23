import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';

import { RefereeReports } from './referee-reports';
import { refereeFeatureKey, refereeReducer } from '../store';

describe('RefereeReports', () => {
  let component: RefereeReports;
  let fixture: ComponentFixture<RefereeReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefereeReports],
      providers: [
        provideRouter([]),
        provideStore({ [refereeFeatureKey]: refereeReducer }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RefereeReports);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
