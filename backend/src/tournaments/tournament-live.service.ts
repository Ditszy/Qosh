import { Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { Observable, concat, defer, from, ignoreElements } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { LiveEventBus, LiveEventTopic } from '../live-events/live-event-bus';
import { TournamentLiveEvent, TournamentLivePayload } from './types/tournament-live.types';

@Injectable()
export class TournamentLiveService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly liveEventBus: LiveEventBus,
    ) { }

    watchTournament(tournamentId: string): Observable<MessageEvent> {
        const ensureTournamentExists$ = defer(() => from(this.ensureTournamentExists(tournamentId))).pipe(
            ignoreElements(),
        );
        const updateMessages$ = this.liveEventBus.watch(LiveEventTopic.tournament(tournamentId));

        return concat(ensureTournamentExists$, updateMessages$);
    }

    publish(tournamentId: string, type: TournamentLiveEvent, data: TournamentLivePayload): void {
        this.liveEventBus.publish(LiveEventTopic.tournament(tournamentId), { type, data });
    }

    private async ensureTournamentExists(tournamentId: string): Promise<void> {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { id: true },
        });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }
    }
}
