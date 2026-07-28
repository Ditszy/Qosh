import { Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { Observable, Subject, concat, defer, from } from 'rxjs';
import { filter, ignoreElements, map } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { TournamentLiveEvent, TournamentLivePayload } from './types/tournament-live.types';

type TournamentLiveUpdate = {
    tournamentId: string;
    message: MessageEvent;
};

@Injectable()
export class TournamentLiveService {
    private readonly tournamentUpdates$ = new Subject<TournamentLiveUpdate>();

    constructor(private readonly prisma: PrismaService) { }

    watchTournament(tournamentId: string): Observable<MessageEvent> {
        const ensureTournamentExists$ = defer(() => from(this.ensureTournamentExists(tournamentId))).pipe(
            ignoreElements(),
        );
        const updateMessages$ = this.tournamentUpdates$.pipe(
            filter((update) => update.tournamentId === tournamentId),
            map((update) => update.message),
        );

        return concat(ensureTournamentExists$, updateMessages$);
    }

    publish(tournamentId: string, type: TournamentLiveEvent, data: TournamentLivePayload): void {
        this.tournamentUpdates$.next({
            tournamentId,
            message: {
                type,
                data,
            },
        });
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
