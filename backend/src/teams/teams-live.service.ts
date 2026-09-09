import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import type { MyTeamLiveUpdate, TeamWithMembers } from './types/team.types';

@Injectable()
export class TeamsLiveService {
    private readonly myTeamUpdates$ = new Subject<MyTeamLiveUpdate>();

    watchMyTeams(userId: string): Observable<MessageEvent> {
        return this.myTeamUpdates$.pipe(
            filter((update) => update.userId === userId),
            map((update) => ({
                type: update.event.type,
                data: update.event.data,
            })),
        );
    }

    publishTeamUpdated(team: TeamWithMembers): void {
        for (const member of team.members) {
            this.myTeamUpdates$.next({
                userId: member.userId,
                event: {
                    type: 'team.updated',
                    data: { team },
                },
            });
        }
    }

    publishTeamRemoved(userIds: string[], teamId: string): void {
        for (const userId of userIds) {
            this.myTeamUpdates$.next({
                userId,
                event: {
                    type: 'team.removed',
                    data: { teamId },
                },
            });
        }
    }
}
