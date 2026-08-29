import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveMatchTabs } from './live-match-tabs';

describe('LiveMatchTabs', () => {
  let component: LiveMatchTabs;
  let fixture: ComponentFixture<LiveMatchTabs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveMatchTabs],
    }).compileComponents();

    fixture = TestBed.createComponent(LiveMatchTabs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
