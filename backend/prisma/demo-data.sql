-- Qosh pgAdmin demo data.
-- Run this against the qosh_db database after Prisma migrations/schema sync.
-- Shared login password for every demo user: Password123!
-- This script intentionally does not insert matches, match events, match stats,
-- referee reports, or notifications.

begin;

insert into "users" ("id", "email", "username", "password", "firstName", "lastName", "role")
values
  ('00000000-0000-4000-8000-000000000001', 'admin@qosh.demo', 'qosh_admin', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Admin', 'User', 'ADMIN'),
  ('00000000-0000-4000-8000-000000000002', 'organizer@qosh.demo', 'qosh_organizer', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Olivia', 'Organizer', 'ORGANIZER'),
  ('00000000-0000-4000-8000-000000000003', 'organizer2@qosh.demo', 'qosh_organizer2', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Ognjen', 'Nikolic', 'ORGANIZER'),
  ('00000000-0000-4000-8000-000000000004', 'scorer@qosh.demo', 'qosh_scorer', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Sam', 'Scorer', 'SCORER'),
  ('00000000-0000-4000-8000-000000000005', 'scorer2@qosh.demo', 'qosh_scorer2', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Stefan', 'Pavlovic', 'SCORER'),
  ('00000000-0000-4000-8000-000000000006', 'referee@qosh.demo', 'qosh_referee', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Riley', 'Referee', 'REFEREE'),
  ('00000000-0000-4000-8000-000000000007', 'referee2@qosh.demo', 'qosh_referee2', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Relja', 'Savic', 'REFEREE'),
  ('00000000-0000-4000-8000-000000000101', 'player1@qosh.demo', 'qosh_player1', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Mila', 'Petrovic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000102', 'player2@qosh.demo', 'qosh_player2', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Nikola', 'Jovanovic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000103', 'player3@qosh.demo', 'qosh_player3', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Lena', 'Markovic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000104', 'player4@qosh.demo', 'qosh_player4', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Ivan', 'Stojanovic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000105', 'player5@qosh.demo', 'qosh_player5', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Sara', 'Kovacevic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000106', 'player6@qosh.demo', 'qosh_player6', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Marko', 'Ilic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000107', 'player7@qosh.demo', 'qosh_player7', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Ana', 'Popovic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000108', 'player8@qosh.demo', 'qosh_player8', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Vuk', 'Lazic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000109', 'player9@qosh.demo', 'qosh_player9', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Jana', 'Ristic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000110', 'player10@qosh.demo', 'qosh_player10', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Luka', 'Djordjevic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000111', 'player11@qosh.demo', 'qosh_player11', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Tara', 'Milic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000112', 'player12@qosh.demo', 'qosh_player12', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Filip', 'Simic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000113', 'player13@qosh.demo', 'qosh_player13', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Nina', 'Matic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000114', 'player14@qosh.demo', 'qosh_player14', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Uros', 'Vasic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000115', 'player15@qosh.demo', 'qosh_player15', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Tea', 'Bogdanovic', 'PLAYER'),
  ('00000000-0000-4000-8000-000000000116', 'player16@qosh.demo', 'qosh_player16', '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu', 'Pavle', 'Maric', 'PLAYER')
on conflict ("email") do update set
  "username" = excluded."username",
  "password" = excluded."password",
  "firstName" = excluded."firstName",
  "lastName" = excluded."lastName",
  "role" = excluded."role";

insert into "tournaments" ("id", "name", "description", "location", "startsAt", "maxTeams", "status", "organizerId", "createdAt", "updatedAt")
values
  ('11111111-1111-4111-8111-111111111111', 'Qosh Bracket Lab', 'Locked tournament with four complete teams. Generate the bracket from the organizer dashboard.', 'Belgrade Sports Hall', '2026-08-15T18:00:00.000Z', 8, 'SIGNUPS_LOCKED', (select "id" from "users" where "email" = 'organizer@qosh.demo'), now(), now()),
  ('11111111-1111-4111-8111-111111111112', 'Qosh Signup Lab', 'Open tournament for testing team creation, player search, invites, and roster changes.', 'Novi Sad Outdoor Court', '2026-08-22T17:30:00.000Z', 8, 'SIGNUPS_OPEN', (select "id" from "users" where "email" = 'organizer@qosh.demo'), now(), now()),
  ('11111111-1111-4111-8111-111111111113', 'Qosh Draft Lab', 'Draft tournament for testing organizer setup and opening signups.', 'Zemun Arena', '2026-08-29T19:00:00.000Z', 12, 'DRAFT', (select "id" from "users" where "email" = 'organizer2@qosh.demo'), now(), now())
on conflict ("id") do update set
  "name" = excluded."name",
  "description" = excluded."description",
  "location" = excluded."location",
  "startsAt" = excluded."startsAt",
  "maxTeams" = excluded."maxTeams",
  "status" = excluded."status",
  "organizerId" = excluded."organizerId",
  "updatedAt" = now();

insert into "teams" ("id", "name", "tournamentId", "createdAt", "updatedAt")
values
  ('22222222-2222-4222-8222-222222222222', 'North Rim', '11111111-1111-4111-8111-111111111111', now(), now()),
  ('33333333-3333-4333-8333-333333333333', 'South Arc', '11111111-1111-4111-8111-111111111111', now(), now()),
  ('44444444-4444-4444-8444-444444444444', 'East Forge', '11111111-1111-4111-8111-111111111111', now(), now()),
  ('55555555-5555-4555-8555-555555555555', 'West Line', '11111111-1111-4111-8111-111111111111', now(), now()),
  ('66666666-6666-4666-8666-666666666666', 'Signup Sparks', '11111111-1111-4111-8111-111111111112', now(), now()),
  ('77777777-7777-4777-8777-777777777777', 'Open Court', '11111111-1111-4111-8111-111111111112', now(), now())
on conflict ("id") do update set
  "name" = excluded."name",
  "tournamentId" = excluded."tournamentId",
  "updatedAt" = now();

insert into "team_members" ("id", "teamId", "userId", "role", "joinedAt")
values
  ('aaaaaaaa-0001-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', (select "id" from "users" where "email" = 'player1@qosh.demo'), 'CAPTAIN', now()),
  ('aaaaaaaa-0002-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', (select "id" from "users" where "email" = 'player2@qosh.demo'), 'MEMBER', now()),
  ('aaaaaaaa-0003-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', (select "id" from "users" where "email" = 'player3@qosh.demo'), 'MEMBER', now()),
  ('aaaaaaaa-0004-4000-8000-000000000004', '33333333-3333-4333-8333-333333333333', (select "id" from "users" where "email" = 'player4@qosh.demo'), 'CAPTAIN', now()),
  ('aaaaaaaa-0005-4000-8000-000000000005', '33333333-3333-4333-8333-333333333333', (select "id" from "users" where "email" = 'player5@qosh.demo'), 'MEMBER', now()),
  ('aaaaaaaa-0006-4000-8000-000000000006', '33333333-3333-4333-8333-333333333333', (select "id" from "users" where "email" = 'player6@qosh.demo'), 'MEMBER', now()),
  ('aaaaaaaa-0007-4000-8000-000000000007', '44444444-4444-4444-8444-444444444444', (select "id" from "users" where "email" = 'player7@qosh.demo'), 'CAPTAIN', now()),
  ('aaaaaaaa-0008-4000-8000-000000000008', '44444444-4444-4444-8444-444444444444', (select "id" from "users" where "email" = 'player8@qosh.demo'), 'MEMBER', now()),
  ('aaaaaaaa-0009-4000-8000-000000000009', '44444444-4444-4444-8444-444444444444', (select "id" from "users" where "email" = 'player9@qosh.demo'), 'MEMBER', now()),
  ('aaaaaaaa-0010-4000-8000-000000000010', '55555555-5555-4555-8555-555555555555', (select "id" from "users" where "email" = 'player10@qosh.demo'), 'CAPTAIN', now()),
  ('aaaaaaaa-0011-4000-8000-000000000011', '55555555-5555-4555-8555-555555555555', (select "id" from "users" where "email" = 'player11@qosh.demo'), 'MEMBER', now()),
  ('aaaaaaaa-0012-4000-8000-000000000012', '55555555-5555-4555-8555-555555555555', (select "id" from "users" where "email" = 'player12@qosh.demo'), 'MEMBER', now()),
  ('aaaaaaaa-0013-4000-8000-000000000013', '66666666-6666-4666-8666-666666666666', (select "id" from "users" where "email" = 'player13@qosh.demo'), 'CAPTAIN', now()),
  ('aaaaaaaa-0014-4000-8000-000000000014', '66666666-6666-4666-8666-666666666666', (select "id" from "users" where "email" = 'player14@qosh.demo'), 'MEMBER', now()),
  ('aaaaaaaa-0015-4000-8000-000000000015', '77777777-7777-4777-8777-777777777777', (select "id" from "users" where "email" = 'player15@qosh.demo'), 'CAPTAIN', now())
on conflict ("teamId", "userId") do update set
  "role" = excluded."role";

insert into "team_invites" ("id", "teamId", "invitedUserId", "inviterId", "status", "createdAt", "respondedAt")
values
  ('bbbbbbbb-0001-4000-8000-000000000001', '77777777-7777-4777-8777-777777777777', (select "id" from "users" where "email" = 'player16@qosh.demo'), (select "id" from "users" where "email" = 'player15@qosh.demo'), 'PENDING', now(), null)
on conflict ("id") do update set
  "teamId" = excluded."teamId",
  "invitedUserId" = excluded."invitedUserId",
  "inviterId" = excluded."inviterId",
  "status" = excluded."status",
  "respondedAt" = null;

commit;
