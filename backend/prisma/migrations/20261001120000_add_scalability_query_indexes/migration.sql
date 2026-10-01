-- CreateIndex
CREATE INDEX "tournaments_organizerId_status_startsAt_idx" ON "tournaments"("organizerId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "tournaments_status_startsAt_idx" ON "tournaments"("status", "startsAt");

-- CreateIndex
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");

-- CreateIndex
CREATE INDEX "team_invites_invitedUserId_status_createdAt_idx" ON "team_invites"("invitedUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "matches_status_scheduledAt_idx" ON "matches"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "matches_scorerId_status_scheduledAt_idx" ON "matches"("scorerId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "matches_refereeId_status_scheduledAt_idx" ON "matches"("refereeId", "status", "scheduledAt");
