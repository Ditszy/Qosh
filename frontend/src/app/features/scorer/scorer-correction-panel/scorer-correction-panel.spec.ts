import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScorerCorrectionPanel } from './scorer-correction-panel';

describe('ScorerCorrectionPanel', () => {
  let component: ScorerCorrectionPanel;
  let fixture: ComponentFixture<ScorerCorrectionPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScorerCorrectionPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(ScorerCorrectionPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
