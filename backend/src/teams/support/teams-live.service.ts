import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LiveEventBus, LiveEventTopic } from '../../live-events/live-event-bus';
import type { TeamWithMembers } from './team.types';

@Injectable()
export class TeamsLiveService {
    constructor(private readonly liveEventBus: LiveEventBus) { }

    watchMyTeams(userId: string): Observable<MessageEvent> {
        return this.liveEventBus.watch(LiveEventTopic.teamUser(userId));
    }

    publishTeamUpdated(team: TeamWithMembers): void {
        for (const member of team.members) {
            this.liveEventBus.publish(LiveEventTopic.teamUser(member.userId), {
                type: 'team.updated',
                data: { team },
            });
        }
    }

    publishTeamRemoved(userIds: string[], teamId: string): void {
        for (const userId of userIds) {
            this.liveEventBus.publish(LiveEventTopic.teamUser(userId), {
                type: 'team.removed',
                data: { teamId },
            });
        }
    }
}
