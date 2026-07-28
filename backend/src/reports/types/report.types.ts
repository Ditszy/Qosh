import { PublicUser } from '../../users/users.service';

export type RefereeReportRecord = {
    id: string;
    matchId: string;
    refereeId: string;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
};

export type RefereeReportWithRelations = RefereeReportRecord & {
    referee: PublicUser;
    match: {
        id: string;
        tournamentId: string;
        round: number;
        bracketPosition: number;
        tournament: {
            id: string;
            name: string;
            organizerId: string;
        };
    };
};
