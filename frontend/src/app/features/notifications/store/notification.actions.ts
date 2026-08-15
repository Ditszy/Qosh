import { createActionGroup, emptyProps, props } from '@ngrx/store';

import type { NotificationItem } from '../notification.models';

export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    'Load Mine': emptyProps(),
    'Load Mine Succeeded': props<{ notifications: NotificationItem[] }>(),
    'Load Mine Failed': props<{ error: string }>(),
    'Watch Mine': emptyProps(),
    'Notification Received': props<{ notification: NotificationItem }>(),
    'Mark Read': props<{ notificationId: string }>(),
    'Mark Read Succeeded': props<{ notification: NotificationItem }>(),
    'Mark Read Failed': props<{ error: string }>(),
    Delete: props<{ notificationId: string }>(),
    'Delete Succeeded': props<{ notificationId: string }>(),
    'Delete Failed': props<{ error: string }>(),
  },
});
