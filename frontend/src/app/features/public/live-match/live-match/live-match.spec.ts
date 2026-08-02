import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveMatch } from './live-match';

describe('LiveMatch', () => {
  let component: LiveMatch;
  let fixture: ComponentFixture<LiveMatch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveMatch],
    }).compileComponents();

    fixture = TestBed.createComponent(LiveMatch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
