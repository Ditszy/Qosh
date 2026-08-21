import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TournamentMatchRecap } from './tournament-match-recap';

describe('TournamentMatchRecap', () => {
  let component: TournamentMatchRecap;
  let fixture: ComponentFixture<TournamentMatchRecap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentMatchRecap],
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentMatchRecap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
