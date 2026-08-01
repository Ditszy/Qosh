-- CreateEnum
CREATE TYPE "MatchEventType" AS ENUM ('ONE_POINT_MADE', 'ONE_POINT_MISSED', 'TWO_POINT_MADE', 'TWO_POINT_MISSED', 'FREE_THROW_MADE', 'FREE_THROW_MISSED', 'REBOUND', 'ASSIST', 'STEAL', 'BLOCK', 'TURNOVER', 'FOUL');

-- CreateEnum
CREATE TYPE "MatchSlot" AS ENUM ('TEAM_A', 'TEAM_B');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TEAM_INVITE', 'MATCH_ASSIGNMENT', 'TOURNAMENT_STARTED', 'MATCH_SCHEDULE_CHANGED');

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "nextBracketPosition" INTEGER,
ADD COLUMN     "nextMatchSlot" "MatchSlot",
ADD COLUMN     "nextRound" INTEGER;

-- CreateTable
CREATE TABLE "match_events" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "playerId" UUID,
    "scorerId" UUID NOT NULL,
    "type" "MatchEventType" NOT NULL,
    "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_player_stats" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "onePointMade" INTEGER NOT NULL DEFAULT 0,
    "onePointAttempted" INTEGER NOT NULL DEFAULT 0,
    "twoPointMade" INTEGER NOT NULL DEFAULT 0,
    "twoPointAttempted" INTEGER NOT NULL DEFAULT 0,
    "freeThrowMade" INTEGER NOT NULL DEFAULT 0,
    "freeThrowAttempted" INTEGER NOT NULL DEFAULT 0,
    "rebounds" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "steals" INTEGER NOT NULL DEFAULT 0,
    "blocks" INTEGER NOT NULL DEFAULT 0,
    "turnovers" INTEGER NOT NULL DEFAULT 0,
    "fouls" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "match_player_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tournamentId" UUID,
    "matchId" UUID,
    "teamId" UUID,
    "inviteId" UUID,
    "readAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referee_reports" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "refereeId" UUID NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "referee_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "match_events_matchId_occurredAt_idx" ON "match_events"("matchId", "occurredAt");

-- CreateIndex
CREATE INDEX "match_events_teamId_idx" ON "match_events"("teamId");

-- CreateIndex
CREATE INDEX "match_events_playerId_idx" ON "match_events"("playerId");

-- CreateIndex
CREATE INDEX "match_events_scorerId_idx" ON "match_events"("scorerId");

-- CreateIndex
CREATE INDEX "match_player_stats_matchId_idx" ON "match_player_stats"("matchId");

-- CreateIndex
CREATE INDEX "match_player_stats_teamId_idx" ON "match_player_stats"("teamId");

-- CreateIndex
CREATE INDEX "match_player_stats_playerId_idx" ON "match_player_stats"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "match_player_stats_matchId_playerId_key" ON "match_player_stats"("matchId", "playerId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_readAt_idx" ON "notifications"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_recipientId_createdAt_idx" ON "notifications"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_tournamentId_idx" ON "notifications"("tournamentId");

-- CreateIndex
CREATE INDEX "notifications_matchId_idx" ON "notifications"("matchId");

-- CreateIndex
CREATE INDEX "notifications_teamId_idx" ON "notifications"("teamId");

-- CreateIndex
CREATE INDEX "notifications_inviteId_idx" ON "notifications"("inviteId");

-- CreateIndex
CREATE UNIQUE INDEX "referee_reports_matchId_key" ON "referee_reports"("matchId");

-- CreateIndex
CREATE INDEX "referee_reports_refereeId_idx" ON "referee_reports"("refereeId");

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_scorerId_fkey" FOREIGN KEY ("scorerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referee_reports" ADD CONSTRAINT "referee_reports_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referee_reports" ADD CONSTRAINT "referee_reports_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
