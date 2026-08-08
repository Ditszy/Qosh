import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScorerConsole } from './scorer-console';

describe('ScorerConsole', () => {
  let component: ScorerConsole;
  let fixture: ComponentFixture<ScorerConsole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScorerConsole],
    }).compileComponents();

    fixture = TestBed.createComponent(ScorerConsole);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
