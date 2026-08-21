import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TournamentBracket } from './tournament-bracket';
import type { TournamentMatch } from '../tournament.models';

describe('TournamentBracket', () => {
  let component: TournamentBracket;
  let fixture: ComponentFixture<TournamentBracket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentBracket],
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentBracket);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('matches', [] satisfies TournamentMatch[]);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
