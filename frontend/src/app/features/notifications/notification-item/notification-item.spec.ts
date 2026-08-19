import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { NotificationItem as NotificationItemModel } from '../notification.models';
import { NotificationItem } from './notification-item';

describe('NotificationItem', () => {
  let component: NotificationItem;
  let fixture: ComponentFixture<NotificationItem>;
  const notification: NotificationItemModel = {
    id: 'notification-1',
    recipientId: 'user-1',
    type: 'TEAM_INVITE',
    title: 'Poziv u tim',
    body: 'Pozvani ste u tim North Rim.',
    tournamentId: 'tournament-1',
    matchId: null,
    teamId: 'team-1',
    inviteId: 'invite-1',
    readAt: null,
    createdAt: '2026-08-19T12:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationItem],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationItem);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('notification', notification);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
