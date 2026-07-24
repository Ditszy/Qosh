-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINAL');

-- CreateEnum
CREATE TYPE "MatchClockStatus" AS ENUM ('NOT_STARTED', 'RUNNING', 'PAUSED', 'ENDED');

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "round" INTEGER NOT NULL,
    "bracketPosition" INTEGER NOT NULL,
    "teamAId" UUID,
    "teamBId" UUID,
    "winnerTeamId" UUID,
    "scorerId" UUID,
    "refereeId" UUID,
    "scheduledAt" TIMESTAMPTZ,
    "location" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "teamAScore" INTEGER NOT NULL DEFAULT 0,
    "teamBScore" INTEGER NOT NULL DEFAULT 0,
    "clockStatus" "MatchClockStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "clockDurationSeconds" INTEGER NOT NULL DEFAULT 600,
    "clockRemainingSeconds" INTEGER NOT NULL DEFAULT 600,
    "clockLastStartedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matches_tournamentId_status_idx" ON "matches"("tournamentId", "status");

-- CreateIndex
CREATE INDEX "matches_teamAId_idx" ON "matches"("teamAId");

-- CreateIndex
CREATE INDEX "matches_teamBId_idx" ON "matches"("teamBId");

-- CreateIndex
CREATE INDEX "matches_scorerId_idx" ON "matches"("scorerId");

-- CreateIndex
CREATE INDEX "matches_refereeId_idx" ON "matches"("refereeId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_tournamentId_round_bracketPosition_key" ON "matches"("tournamentId", "round", "bracketPosition");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_scorerId_fkey" FOREIGN KEY ("scorerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
