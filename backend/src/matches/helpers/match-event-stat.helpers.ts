import { MatchEventType } from '../enums/match-event-type.enum';

type MatchPlayerStatCounters = {
    points: number;
    onePointMade: number;
    onePointAttempted: number;
    twoPointMade: number;
    twoPointAttempted: number;
    freeThrowMade: number;
    freeThrowAttempted: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
};

export function getMatchEventPointValue(type: MatchEventType): number {
    if (type === MatchEventType.ONE_POINT_MADE || type === MatchEventType.FREE_THROW_MADE) {
        return 1;
    }

    if (type === MatchEventType.TWO_POINT_MADE) {
        return 2;
    }

    return 0;
}

export function getMatchPlayerStatCreateData(matchId: string, teamId: string, playerId: string, type: MatchEventType) {
    return {
        matchId,
        teamId,
        playerId,
        ...getMatchPlayerStatCounterValues(type),
    };
}

export function getMatchPlayerStatUpdateData(type: MatchEventType) {
    const counters = getMatchPlayerStatCounterValues(type);
    const updateData: Record<string, { increment: number }> = {};

    for (const [field, value] of Object.entries(counters)) {
        if (value > 0) {
            updateData[field] = {
                increment: value,
            };
        }
    }

    return updateData;
}

export function getMatchPlayerStatRevertData(type: MatchEventType) {
    const counters = getMatchPlayerStatCounterValues(type);
    const updateData: Record<string, { decrement: number }> = {};

    for (const [field, value] of Object.entries(counters)) {
        if (value > 0) {
            updateData[field] = {
                decrement: value,
            };
        }
    }

    return updateData;
}

export function getMatchPlayerStatCounterValuesForEvent(type: MatchEventType): MatchPlayerStatCounters {
    return getMatchPlayerStatCounterValues(type);
}

function getMatchPlayerStatCounterValues(type: MatchEventType): MatchPlayerStatCounters {
    const counters = createEmptyCounters();

    switch (type) {
        case MatchEventType.ONE_POINT_MADE:
            counters.points = 1;
            counters.onePointMade = 1;
            counters.onePointAttempted = 1;
            break;
        case MatchEventType.ONE_POINT_MISSED:
            counters.onePointAttempted = 1;
            break;
        case MatchEventType.TWO_POINT_MADE:
            counters.points = 2;
            counters.twoPointMade = 1;
            counters.twoPointAttempted = 1;
            break;
        case MatchEventType.TWO_POINT_MISSED:
            counters.twoPointAttempted = 1;
            break;
        case MatchEventType.FREE_THROW_MADE:
            counters.points = 1;
            counters.freeThrowMade = 1;
            counters.freeThrowAttempted = 1;
            break;
        case MatchEventType.FREE_THROW_MISSED:
            counters.freeThrowAttempted = 1;
            break;
        case MatchEventType.REBOUND:
            counters.rebounds = 1;
            break;
        case MatchEventType.ASSIST:
            counters.assists = 1;
            break;
        case MatchEventType.STEAL:
            counters.steals = 1;
            break;
        case MatchEventType.BLOCK:
            counters.blocks = 1;
            break;
        case MatchEventType.TURNOVER:
            counters.turnovers = 1;
            break;
        case MatchEventType.FOUL:
            counters.fouls = 1;
            break;
    }

    return counters;
}

function createEmptyCounters(): MatchPlayerStatCounters {
    return {
        points: 0,
        onePointMade: 0,
        onePointAttempted: 0,
        twoPointMade: 0,
        twoPointAttempted: 0,
        freeThrowMade: 0,
        freeThrowAttempted: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
    };
}
