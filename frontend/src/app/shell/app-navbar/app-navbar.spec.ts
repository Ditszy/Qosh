import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';

import { AppNavbar } from './app-navbar';
import { provideApiBaseUrl } from '../../core/api';
import { authFeatureKey, authReducer } from '../../core/auth/store';
import { notificationsFeatureKey, notificationsReducer } from '../../features/notifications/store';

describe('AppNavbar', () => {
  let component: AppNavbar;
  let fixture: ComponentFixture<AppNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppNavbar],
      providers: [
        provideHttpClient(),
        provideApiBaseUrl(),
        provideRouter([]),
        provideStore({
          [authFeatureKey]: authReducer,
          [notificationsFeatureKey]: notificationsReducer,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppNavbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
