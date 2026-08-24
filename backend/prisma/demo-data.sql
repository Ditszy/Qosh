-- Qosh pgAdmin demo data.
-- Run this against the qosh_db database after Prisma migrations/schema sync.
-- Shared login password for every demo user: Password123!
-- This script includes one completed demo bracket with match stats for public
-- bracket, profile, rankings, and awards-board demos, plus a wider
-- tournament list with varied capacities and entry fees.

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

insert into "users" ("id", "email", "username", "password", "firstName", "lastName", "role")
select
  format('00000000-0000-4000-8000-%s', lpad((100 + player_number)::text, 12, '0'))::uuid,
  format('player%s@qosh.demo', player_number),
  format('qosh_player%s', player_number),
  '$2b$10$diM8AdqES1sm8M1tj7pBU.SetSxDW1CWtiPlTi23cAHi3qokizIKu',
  'Demo',
  format('Player %s', player_number),
  'PLAYER'::"UserRole"
from generate_series(17, 40) as players(player_number)
on conflict ("email") do update set
  "username" = excluded."username",
  "password" = excluded."password",
  "firstName" = excluded."firstName",
  "lastName" = excluded."lastName",
  "role" = excluded."role";

insert into "tournaments" ("id", "name", "description", "location", "startsAt", "maxTeams", "entryFee", "status", "organizerId", "createdAt", "updatedAt")
values
  ('11111111-1111-4111-8111-111111111111', 'Qosh Open Dorcol', 'Completed demo tournament with a generated bracket and filled match stats.', 'Belgrade Sports Hall', '2026-08-15T18:00:00.000Z', 8, 1500, 'COMPLETED', (select "id" from "users" where "email" = 'organizer@qosh.demo'), now(), now()),
  ('11111111-1111-4111-8111-111111111112', 'Qosh Open Novi Sad', 'Open signup tournament with thirteen complete 3-player teams.', 'Novi Sad Outdoor Court', '2026-08-22T17:30:00.000Z', 16, 2000, 'SIGNUPS_OPEN', (select "id" from "users" where "email" = 'organizer@qosh.demo'), now(), now()),
  ('11111111-1111-4111-8111-111111111113', 'Qosh Open Zemun', 'Open signup tournament with five complete 3-player teams.', 'Zemun Arena', '2026-08-29T19:00:00.000Z', 8, 1200, 'SIGNUPS_OPEN', (select "id" from "users" where "email" = 'organizer2@qosh.demo'), now(), now()),
  ('11111111-1111-4111-8111-111111111114', 'Qosh Open Night', 'Open signup tournament with five complete 3-player teams.', 'Ada Night Court', '2026-09-05T20:00:00.000Z', 8, 1800, 'SIGNUPS_OPEN', (select "id" from "users" where "email" = 'organizer2@qosh.demo'), now(), now()),
  ('11111111-1111-4111-8111-111111111115', 'Qosh Open Nis', 'Tournament in progress with semifinal results and a live final.', 'Nis Fortress Court', '2026-09-12T18:30:00.000Z', 4, 900, 'IN_PROGRESS', (select "id" from "users" where "email" = 'organizer@qosh.demo'), now(), now()),
  ('11111111-1111-4111-8111-111111111116', 'Qosh Open Kragujevac', 'Tournament in progress with one completed match and one live match.', 'Jezero Court', '2026-09-19T17:00:00.000Z', 8, 1300, 'IN_PROGRESS', (select "id" from "users" where "email" = 'organizer2@qosh.demo'), now(), now()),
  ('11111111-1111-4111-8111-111111111117', 'Qosh Open Subotica', 'Open signup tournament with three complete 3-player teams.', 'Dudova Suma Court', '2026-09-26T16:30:00.000Z', 12, 1600, 'SIGNUPS_OPEN', (select "id" from "users" where "email" = 'organizer@qosh.demo'), now(), now()),
  ('11111111-1111-4111-8111-111111111118', 'Qosh Open Cacak', 'Open signup tournament with three complete 3-player teams.', 'Morava Sports Center', '2026-10-03T18:00:00.000Z', 16, 2200, 'SIGNUPS_OPEN', (select "id" from "users" where "email" = 'organizer2@qosh.demo'), now(), now()),
  ('11111111-1111-4111-8111-111111111119', 'Qosh Open Kraljevo', 'Open signup tournament with three complete 3-player teams.', 'Ibar Court', '2026-10-10T19:00:00.000Z', 8, 1100, 'SIGNUPS_OPEN', (select "id" from "users" where "email" = 'organizer@qosh.demo'), now(), now()),
  ('11111111-1111-4111-8111-111111111120', 'Qosh Open Pancevo', 'Open signup tournament with three complete 3-player teams.', 'Tamis Riverside Court', '2026-10-17T17:45:00.000Z', 12, 1700, 'SIGNUPS_OPEN', (select "id" from "users" where "email" = 'organizer2@qosh.demo'), now(), now()),
  ('11111111-1111-4111-8111-111111111121', 'Qosh Open Uzice', 'Open signup tournament with three complete 3-player teams.', 'Djetinja Court', '2026-10-24T18:15:00.000Z', 4, 800, 'SIGNUPS_OPEN', (select "id" from "users" where "email" = 'organizer@qosh.demo'), now(), now()),
  ('11111111-1111-4111-8111-111111111122', 'Qosh Open Sombor', 'Open signup tournament with two complete 3-player teams.', 'Sombor City Court', '2026-10-31T16:00:00.000Z', 8, 1400, 'SIGNUPS_OPEN', (select "id" from "users" where "email" = 'organizer2@qosh.demo'), now(), now())
on conflict ("id") do update set
  "name" = excluded."name",
  "description" = excluded."description",
  "location" = excluded."location",
  "startsAt" = excluded."startsAt",
  "maxTeams" = excluded."maxTeams",
  "entryFee" = excluded."entryFee",
  "status" = excluded."status",
  "organizerId" = excluded."organizerId",
  "updatedAt" = now();

insert into "teams" ("id", "name", "tournamentId", "createdAt", "updatedAt")
values
  ('22222222-2222-4222-8222-222222222222', 'North Rim', '11111111-1111-4111-8111-111111111111', now(), now()),
  ('33333333-3333-4333-8333-333333333333', 'South Arc', '11111111-1111-4111-8111-111111111111', now(), now()),
  ('44444444-4444-4444-8444-444444444444', 'East Forge', '11111111-1111-4111-8111-111111111111', now(), now()),
  ('55555555-5555-4555-8555-555555555555', 'West Line', '11111111-1111-4111-8111-111111111111', now(), now()),
  ('88888888-8888-4888-8888-888888888888', 'Baseline Five', '11111111-1111-4111-8111-111111111111', now(), now()),
  ('66666666-6666-4666-8666-666666666666', 'Signup Sparks', '11111111-1111-4111-8111-111111111112', now(), now()),
  ('77777777-7777-4777-8777-777777777777', 'Open Court', '11111111-1111-4111-8111-111111111112', now(), now()),
  ('99999999-9999-4999-8999-999999999999', 'River Hands', '11111111-1111-4111-8111-111111111112', now(), now()),
  ('12121212-1212-4212-8212-121212121212', 'Backboard Crew', '11111111-1111-4111-8111-111111111112', now(), now()),
  ('13131313-1313-4313-8313-131313131313', 'Corner Three', '11111111-1111-4111-8111-111111111112', now(), now()),
  ('25252525-2525-4525-8525-252525252525', 'Petrovaradin Step', '11111111-1111-4111-8111-111111111112', now(), now()),
  ('26262626-2626-4626-8626-262626262626', 'Dunav Screen', '11111111-1111-4111-8111-111111111112', now(), now()),
  ('27272727-2727-4727-8727-272727272727', 'Varadin Cutters', '11111111-1111-4111-8111-111111111112', now(), now()),
  ('28282828-2828-4828-8828-282828282828', 'Bridge Runners', '11111111-1111-4111-8111-111111111112', now(), now()),
  ('29292929-2929-4929-8929-292929292929', 'Limanski Rim', '11111111-1111-4111-8111-111111111112', now(), now()),
  ('30303030-3030-4030-8030-303030303030', 'Detelinara Press', '11111111-1111-4111-8111-111111111112', now(), now()),
  ('31313131-3131-4131-8131-313131313131', 'Kej Shooters', '11111111-1111-4111-8111-111111111112', now(), now()),
  ('32323232-3232-4232-8232-323232323232', 'Arena Novi Sad', '11111111-1111-4111-8111-111111111112', now(), now()),
  ('14141414-1414-4414-8414-141414141414', 'Zemun Drive', '11111111-1111-4111-8111-111111111113', now(), now()),
  ('15151515-1515-4515-8515-151515151515', 'Glass Work', '11111111-1111-4111-8111-111111111113', now(), now()),
  ('16161616-1616-4616-8616-161616161616', 'Paint Patrol', '11111111-1111-4111-8111-111111111113', now(), now()),
  ('17171717-1717-4717-8717-171717171717', 'Fast Break', '11111111-1111-4111-8111-111111111113', now(), now()),
  ('18181818-1818-4818-8818-181818181818', 'Zebra Cut', '11111111-1111-4111-8111-111111111113', now(), now()),
  ('19191919-1919-4919-8919-191919191919', 'Night Shift', '11111111-1111-4111-8111-111111111114', now(), now()),
  ('20202020-2020-4020-8020-202020202020', 'Late Clock', '11111111-1111-4111-8111-111111111114', now(), now()),
  ('21212121-2121-4121-8121-212121212121', 'Orange Rim', '11111111-1111-4111-8111-111111111114', now(), now()),
  ('23232323-2323-4323-8323-232323232323', 'Blacktop Unit', '11111111-1111-4111-8111-111111111114', now(), now()),
  ('24242424-2424-4424-8424-242424242424', 'Final Possession', '11111111-1111-4111-8111-111111111114', now(), now()),
  ('34343434-3434-4434-8434-343434343434', 'Fortress Handles', '11111111-1111-4111-8111-111111111115', now(), now()),
  ('35353535-3535-4535-8535-353535353535', 'Cair Sweep', '11111111-1111-4111-8111-111111111115', now(), now()),
  ('36363636-3636-4636-8636-363636363636', 'Nisava Break', '11111111-1111-4111-8111-111111111115', now(), now()),
  ('37373737-3737-4737-8737-373737373737', 'Mediana Arc', '11111111-1111-4111-8111-111111111115', now(), now()),
  ('38383838-3838-4838-8838-383838383838', 'Sumarice Cut', '11111111-1111-4111-8111-111111111116', now(), now()),
  ('39393939-3939-4939-8939-393939393939', 'Jezero Motion', '11111111-1111-4111-8111-111111111116', now(), now()),
  ('40404040-4040-4040-8040-404040404040', 'Kragujevac Press', '11111111-1111-4111-8111-111111111116', now(), now()),
  ('41414141-4141-4141-8141-414141414141', 'Spartak Drive', '11111111-1111-4111-8111-111111111117', now(), now()),
  ('42424242-4242-4242-8242-424242424242', 'Palic Rim', '11111111-1111-4111-8111-111111111117', now(), now()),
  ('43434343-4343-4343-8343-434343434343', 'Sever Arc', '11111111-1111-4111-8111-111111111117', now(), now()),
  ('45454545-4545-4545-8545-454545454545', 'Morava Step', '11111111-1111-4111-8111-111111111118', now(), now()),
  ('46464646-4646-4646-8646-464646464646', 'Cacak Screen', '11111111-1111-4111-8111-111111111118', now(), now()),
  ('47474747-4747-4747-8747-474747474747', 'Borac Line', '11111111-1111-4111-8111-111111111118', now(), now()),
  ('48484848-4848-4848-8848-484848484848', 'Ibar Bounce', '11111111-1111-4111-8111-111111111119', now(), now()),
  ('49494949-4949-4949-8949-494949494949', 'Kraljevo Cut', '11111111-1111-4111-8111-111111111119', now(), now()),
  ('50505050-5050-4050-8050-505050505050', 'Zica Rim', '11111111-1111-4111-8111-111111111119', now(), now()),
  ('51515151-5151-4151-8151-515151515151', 'Tamis Splash', '11111111-1111-4111-8111-111111111120', now(), now()),
  ('52525252-5252-4252-8252-525252525252', 'Pancevo Lock', '11111111-1111-4111-8111-111111111120', now(), now()),
  ('53535353-5353-4353-8353-535353535353', 'Rafinerija Run', '11111111-1111-4111-8111-111111111120', now(), now()),
  ('54545454-5454-4454-8454-545454545454', 'Djetinja Flow', '11111111-1111-4111-8111-111111111121', now(), now()),
  ('56565656-5656-4656-8656-565656565656', 'Uzice Screen', '11111111-1111-4111-8111-111111111121', now(), now()),
  ('57575757-5757-4757-8757-575757575757', 'Old Town Rim', '11111111-1111-4111-8111-111111111121', now(), now()),
  ('58585858-5858-4858-8858-585858585858', 'Ravangrad Drive', '11111111-1111-4111-8111-111111111122', now(), now()),
  ('59595959-5959-4959-8959-595959595959', 'Sombor Shooters', '11111111-1111-4111-8111-111111111122', now(), now())
on conflict ("id") do update set
  "name" = excluded."name",
  "tournamentId" = excluded."tournamentId",
  "updatedAt" = now();

delete from "team_members"
where "teamId" in (
  '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444', '55555555-5555-4555-8555-555555555555',
  '88888888-8888-4888-8888-888888888888', '66666666-6666-4666-8666-666666666666',
  '77777777-7777-4777-8777-777777777777', '99999999-9999-4999-8999-999999999999',
  '12121212-1212-4212-8212-121212121212', '13131313-1313-4313-8313-131313131313',
  '25252525-2525-4525-8525-252525252525', '26262626-2626-4626-8626-262626262626',
  '27272727-2727-4727-8727-272727272727', '28282828-2828-4828-8828-282828282828',
  '29292929-2929-4929-8929-292929292929', '30303030-3030-4030-8030-303030303030',
  '31313131-3131-4131-8131-313131313131', '32323232-3232-4232-8232-323232323232',
  '14141414-1414-4414-8414-141414141414', '15151515-1515-4515-8515-151515151515',
  '16161616-1616-4616-8616-161616161616', '17171717-1717-4717-8717-171717171717',
  '18181818-1818-4818-8818-181818181818', '19191919-1919-4919-8919-191919191919',
  '20202020-2020-4020-8020-202020202020', '21212121-2121-4121-8121-212121212121',
  '23232323-2323-4323-8323-232323232323', '24242424-2424-4424-8424-242424242424',
  '34343434-3434-4434-8434-343434343434', '35353535-3535-4535-8535-353535353535',
  '36363636-3636-4636-8636-363636363636', '37373737-3737-4737-8737-373737373737',
  '38383838-3838-4838-8838-383838383838', '39393939-3939-4939-8939-393939393939',
  '40404040-4040-4040-8040-404040404040', '41414141-4141-4141-8141-414141414141',
  '42424242-4242-4242-8242-424242424242', '43434343-4343-4343-8343-434343434343',
  '45454545-4545-4545-8545-454545454545', '46464646-4646-4646-8646-464646464646',
  '47474747-4747-4747-8747-474747474747', '48484848-4848-4848-8848-484848484848',
  '49494949-4949-4949-8949-494949494949', '50505050-5050-4050-8050-505050505050',
  '51515151-5151-4151-8151-515151515151', '52525252-5252-4252-8252-525252525252',
  '53535353-5353-4353-8353-535353535353', '54545454-5454-4454-8454-545454545454',
  '56565656-5656-4656-8656-565656565656', '57575757-5757-4757-8757-575757575757',
  '58585858-5858-4858-8858-585858585858', '59595959-5959-4959-8959-595959595959'
);

with roster ("teamId", "captain", "memberOne", "memberTwo") as (
  values
    ('22222222-2222-4222-8222-222222222222', 'player1@qosh.demo', 'player2@qosh.demo', 'player3@qosh.demo'),
    ('33333333-3333-4333-8333-333333333333', 'player4@qosh.demo', 'player5@qosh.demo', 'player6@qosh.demo'),
    ('44444444-4444-4444-8444-444444444444', 'player7@qosh.demo', 'player8@qosh.demo', 'player9@qosh.demo'),
    ('55555555-5555-4555-8555-555555555555', 'player10@qosh.demo', 'player11@qosh.demo', 'player12@qosh.demo'),
    ('88888888-8888-4888-8888-888888888888', 'player13@qosh.demo', 'player14@qosh.demo', 'player15@qosh.demo'),
    ('66666666-6666-4666-8666-666666666666', 'player1@qosh.demo', 'player2@qosh.demo', 'player3@qosh.demo'),
    ('77777777-7777-4777-8777-777777777777', 'player4@qosh.demo', 'player5@qosh.demo', 'player6@qosh.demo'),
    ('99999999-9999-4999-8999-999999999999', 'player7@qosh.demo', 'player8@qosh.demo', 'player9@qosh.demo'),
    ('12121212-1212-4212-8212-121212121212', 'player10@qosh.demo', 'player11@qosh.demo', 'player12@qosh.demo'),
    ('13131313-1313-4313-8313-131313131313', 'player13@qosh.demo', 'player14@qosh.demo', 'player15@qosh.demo'),
    ('25252525-2525-4525-8525-252525252525', 'player16@qosh.demo', 'player17@qosh.demo', 'player18@qosh.demo'),
    ('26262626-2626-4626-8626-262626262626', 'player19@qosh.demo', 'player20@qosh.demo', 'player21@qosh.demo'),
    ('27272727-2727-4727-8727-272727272727', 'player22@qosh.demo', 'player23@qosh.demo', 'player24@qosh.demo'),
    ('28282828-2828-4828-8828-282828282828', 'player25@qosh.demo', 'player26@qosh.demo', 'player27@qosh.demo'),
    ('29292929-2929-4929-8929-292929292929', 'player28@qosh.demo', 'player29@qosh.demo', 'player30@qosh.demo'),
    ('30303030-3030-4030-8030-303030303030', 'player31@qosh.demo', 'player32@qosh.demo', 'player33@qosh.demo'),
    ('31313131-3131-4131-8131-313131313131', 'player34@qosh.demo', 'player35@qosh.demo', 'player36@qosh.demo'),
    ('32323232-3232-4232-8232-323232323232', 'player37@qosh.demo', 'player38@qosh.demo', 'player39@qosh.demo'),
    ('14141414-1414-4414-8414-141414141414', 'player1@qosh.demo', 'player2@qosh.demo', 'player3@qosh.demo'),
    ('15151515-1515-4515-8515-151515151515', 'player4@qosh.demo', 'player5@qosh.demo', 'player6@qosh.demo'),
    ('16161616-1616-4616-8616-161616161616', 'player7@qosh.demo', 'player8@qosh.demo', 'player9@qosh.demo'),
    ('17171717-1717-4717-8717-171717171717', 'player10@qosh.demo', 'player11@qosh.demo', 'player12@qosh.demo'),
    ('18181818-1818-4818-8818-181818181818', 'player13@qosh.demo', 'player14@qosh.demo', 'player15@qosh.demo'),
    ('19191919-1919-4919-8919-191919191919', 'player1@qosh.demo', 'player2@qosh.demo', 'player3@qosh.demo'),
    ('20202020-2020-4020-8020-202020202020', 'player4@qosh.demo', 'player5@qosh.demo', 'player6@qosh.demo'),
    ('21212121-2121-4121-8121-212121212121', 'player7@qosh.demo', 'player8@qosh.demo', 'player9@qosh.demo'),
    ('23232323-2323-4323-8323-232323232323', 'player10@qosh.demo', 'player11@qosh.demo', 'player12@qosh.demo'),
    ('24242424-2424-4424-8424-242424242424', 'player13@qosh.demo', 'player14@qosh.demo', 'player15@qosh.demo'),
    ('34343434-3434-4434-8434-343434343434', 'player16@qosh.demo', 'player17@qosh.demo', 'player18@qosh.demo'),
    ('35353535-3535-4535-8535-353535353535', 'player19@qosh.demo', 'player20@qosh.demo', 'player21@qosh.demo'),
    ('36363636-3636-4636-8636-363636363636', 'player22@qosh.demo', 'player23@qosh.demo', 'player24@qosh.demo'),
    ('37373737-3737-4737-8737-373737373737', 'player25@qosh.demo', 'player26@qosh.demo', 'player27@qosh.demo'),
    ('38383838-3838-4838-8838-383838383838', 'player28@qosh.demo', 'player29@qosh.demo', 'player30@qosh.demo'),
    ('39393939-3939-4939-8939-393939393939', 'player31@qosh.demo', 'player32@qosh.demo', 'player33@qosh.demo'),
    ('40404040-4040-4040-8040-404040404040', 'player34@qosh.demo', 'player35@qosh.demo', 'player36@qosh.demo'),
    ('41414141-4141-4141-8141-414141414141', 'player37@qosh.demo', 'player38@qosh.demo', 'player39@qosh.demo'),
    ('42424242-4242-4242-8242-424242424242', 'player1@qosh.demo', 'player2@qosh.demo', 'player3@qosh.demo'),
    ('43434343-4343-4343-8343-434343434343', 'player4@qosh.demo', 'player5@qosh.demo', 'player6@qosh.demo'),
    ('45454545-4545-4545-8545-454545454545', 'player7@qosh.demo', 'player8@qosh.demo', 'player9@qosh.demo'),
    ('46464646-4646-4646-8646-464646464646', 'player10@qosh.demo', 'player11@qosh.demo', 'player12@qosh.demo'),
    ('47474747-4747-4747-8747-474747474747', 'player13@qosh.demo', 'player14@qosh.demo', 'player15@qosh.demo'),
    ('48484848-4848-4848-8848-484848484848', 'player16@qosh.demo', 'player17@qosh.demo', 'player18@qosh.demo'),
    ('49494949-4949-4949-8949-494949494949', 'player19@qosh.demo', 'player20@qosh.demo', 'player21@qosh.demo'),
    ('50505050-5050-4050-8050-505050505050', 'player22@qosh.demo', 'player23@qosh.demo', 'player24@qosh.demo'),
    ('51515151-5151-4151-8151-515151515151', 'player25@qosh.demo', 'player26@qosh.demo', 'player27@qosh.demo'),
    ('52525252-5252-4252-8252-525252525252', 'player28@qosh.demo', 'player29@qosh.demo', 'player30@qosh.demo'),
    ('53535353-5353-4353-8353-535353535353', 'player31@qosh.demo', 'player32@qosh.demo', 'player33@qosh.demo'),
    ('54545454-5454-4454-8454-545454545454', 'player34@qosh.demo', 'player35@qosh.demo', 'player36@qosh.demo'),
    ('56565656-5656-4656-8656-565656565656', 'player37@qosh.demo', 'player38@qosh.demo', 'player39@qosh.demo'),
    ('57575757-5757-4757-8757-575757575757', 'player1@qosh.demo', 'player2@qosh.demo', 'player3@qosh.demo'),
    ('58585858-5858-4858-8858-585858585858', 'player4@qosh.demo', 'player5@qosh.demo', 'player6@qosh.demo'),
    ('59595959-5959-4959-8959-595959595959', 'player7@qosh.demo', 'player8@qosh.demo', 'player9@qosh.demo')
),
expanded_roster as (
  select "teamId", "captain" as "email", 'CAPTAIN' as "role" from roster
  union all select "teamId", "memberOne", 'MEMBER' from roster
  union all select "teamId", "memberTwo", 'MEMBER' from roster
),
numbered_roster as (
  select row_number() over (order by "teamId", "role", "email") as "rowNumber", * from expanded_roster
)
insert into "team_members" ("id", "teamId", "userId", "role", "joinedAt")
select
  format('aaaaaaaa-%s-4000-8000-%s', lpad("rowNumber"::text, 4, '0'), lpad("rowNumber"::text, 12, '0'))::uuid,
  "teamId"::uuid,
  (select "id" from "users" where "email" = numbered_roster."email"),
  "role"::"TeamMemberRole",
  now()
from numbered_roster;

insert into "team_invites" ("id", "teamId", "invitedUserId", "inviterId", "status", "createdAt", "respondedAt")
values
  ('bbbbbbbb-0001-4000-8000-000000000001', '88888888-8888-4888-8888-888888888888', (select "id" from "users" where "email" = 'player40@qosh.demo'), (select "id" from "users" where "email" = 'player13@qosh.demo'), 'PENDING', now(), null)
on conflict ("id") do update set
  "teamId" = excluded."teamId",
  "invitedUserId" = excluded."invitedUserId",
  "inviterId" = excluded."inviterId",
  "status" = excluded."status",
  "respondedAt" = null;

delete from "notifications"
where "matchId" in (
  select "id" from "matches"
  where "tournamentId" in (
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111115',
    '11111111-1111-4111-8111-111111111116'
  )
);

delete from "referee_reports"
where "matchId" in (
  select "id" from "matches"
  where "tournamentId" in (
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111115',
    '11111111-1111-4111-8111-111111111116'
  )
);

delete from "match_player_stats"
where "matchId" in (
  select "id" from "matches"
  where "tournamentId" in (
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111115',
    '11111111-1111-4111-8111-111111111116'
  )
);

delete from "match_events"
where "matchId" in (
  select "id" from "matches"
  where "tournamentId" in (
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111115',
    '11111111-1111-4111-8111-111111111116'
  )
);

delete from "matches"
where "tournamentId" in (
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111115',
  '11111111-1111-4111-8111-111111111116'
);

insert into "matches" (
  "id", "tournamentId", "round", "bracketPosition", "teamAId", "teamBId", "winnerTeamId",
  "scorerId", "refereeId", "scheduledAt", "location", "status", "teamAScore", "teamBScore",
  "clockStatus", "clockDurationSeconds", "clockRemainingSeconds", "clockLastStartedAt",
  "nextRound", "nextBracketPosition", "nextMatchSlot", "createdAt", "updatedAt"
)
values
  (
    'dddddddd-0001-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    1,
    1,
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '22222222-2222-4222-8222-222222222222',
    (select "id" from "users" where "email" = 'scorer@qosh.demo'),
    (select "id" from "users" where "email" = 'referee@qosh.demo'),
    '2026-08-15T18:00:00.000Z',
    'Belgrade Sports Hall - Court 1',
    'FINAL',
    21,
    17,
    'ENDED',
    600,
    0,
    null,
    2,
    1,
    'TEAM_A',
    now(),
    now()
  ),
  (
    'dddddddd-0002-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    2,
    1,
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    '22222222-2222-4222-8222-222222222222',
    (select "id" from "users" where "email" = 'scorer@qosh.demo'),
    (select "id" from "users" where "email" = 'referee@qosh.demo'),
    '2026-08-15T18:20:00.000Z',
    'Belgrade Sports Hall - Court 1',
    'FINAL',
    19,
    16,
    'ENDED',
    600,
    0,
    null,
    3,
    1,
    'TEAM_A',
    now(),
    now()
  ),
  (
    'dddddddd-0003-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    2,
    2,
    '55555555-5555-4555-8555-555555555555',
    '88888888-8888-4888-8888-888888888888',
    '88888888-8888-4888-8888-888888888888',
    (select "id" from "users" where "email" = 'scorer2@qosh.demo'),
    (select "id" from "users" where "email" = 'referee2@qosh.demo'),
    '2026-08-15T18:40:00.000Z',
    'Belgrade Sports Hall - Court 1',
    'FINAL',
    14,
    21,
    'ENDED',
    600,
    0,
    null,
    3,
    1,
    'TEAM_B',
    now(),
    now()
  ),
  (
    'dddddddd-0004-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    3,
    1,
    '22222222-2222-4222-8222-222222222222',
    '88888888-8888-4888-8888-888888888888',
    '22222222-2222-4222-8222-222222222222',
    (select "id" from "users" where "email" = 'scorer@qosh.demo'),
    (select "id" from "users" where "email" = 'referee2@qosh.demo'),
    '2026-08-15T19:05:00.000Z',
    'Belgrade Sports Hall - Court 1',
    'FINAL',
    20,
    18,
    'ENDED',
    600,
    0,
    null,
    null,
    null,
    null,
    now(),
    now()
  );

insert into "matches" (
  "id", "tournamentId", "round", "bracketPosition", "teamAId", "teamBId", "winnerTeamId",
  "scorerId", "refereeId", "scheduledAt", "location", "status", "teamAScore", "teamBScore",
  "clockStatus", "clockDurationSeconds", "clockRemainingSeconds", "clockLastStartedAt",
  "nextRound", "nextBracketPosition", "nextMatchSlot", "createdAt", "updatedAt"
)
values
  (
    'dddddddd-1001-4000-8000-000000001001',
    '11111111-1111-4111-8111-111111111115',
    1,
    1,
    '34343434-3434-4434-8434-343434343434',
    '35353535-3535-4535-8535-353535353535',
    '34343434-3434-4434-8434-343434343434',
    (select "id" from "users" where "email" = 'scorer@qosh.demo'),
    (select "id" from "users" where "email" = 'referee@qosh.demo'),
    '2026-09-12T18:30:00.000Z',
    'Nis Fortress Court - Court 1',
    'FINAL',
    21,
    15,
    'ENDED',
    600,
    0,
    null,
    2,
    1,
    'TEAM_A',
    now(),
    now()
  ),
  (
    'dddddddd-1002-4000-8000-000000001002',
    '11111111-1111-4111-8111-111111111115',
    1,
    2,
    '36363636-3636-4636-8636-363636363636',
    '37373737-3737-4737-8737-373737373737',
    '37373737-3737-4737-8737-373737373737',
    (select "id" from "users" where "email" = 'scorer2@qosh.demo'),
    (select "id" from "users" where "email" = 'referee2@qosh.demo'),
    '2026-09-12T18:50:00.000Z',
    'Nis Fortress Court - Court 1',
    'FINAL',
    17,
    19,
    'ENDED',
    600,
    0,
    null,
    2,
    1,
    'TEAM_B',
    now(),
    now()
  ),
  (
    'dddddddd-1003-4000-8000-000000001003',
    '11111111-1111-4111-8111-111111111115',
    2,
    1,
    '34343434-3434-4434-8434-343434343434',
    '37373737-3737-4737-8737-373737373737',
    null,
    (select "id" from "users" where "email" = 'scorer@qosh.demo'),
    (select "id" from "users" where "email" = 'referee2@qosh.demo'),
    '2026-09-12T19:15:00.000Z',
    'Nis Fortress Court - Court 1',
    'LIVE',
    12,
    10,
    'RUNNING',
    600,
    284,
    now(),
    null,
    null,
    null,
    now(),
    now()
  ),
  (
    'dddddddd-2001-4000-8000-000000002001',
    '11111111-1111-4111-8111-111111111116',
    1,
    1,
    '38383838-3838-4838-8838-383838383838',
    '39393939-3939-4939-8939-393939393939',
    '38383838-3838-4838-8838-383838383838',
    (select "id" from "users" where "email" = 'scorer2@qosh.demo'),
    (select "id" from "users" where "email" = 'referee@qosh.demo'),
    '2026-09-19T17:00:00.000Z',
    'Jezero Court - Main',
    'FINAL',
    20,
    14,
    'ENDED',
    600,
    0,
    null,
    2,
    1,
    'TEAM_A',
    now(),
    now()
  ),
  (
    'dddddddd-2002-4000-8000-000000002002',
    '11111111-1111-4111-8111-111111111116',
    2,
    1,
    '38383838-3838-4838-8838-383838383838',
    '40404040-4040-4040-8040-404040404040',
    null,
    (select "id" from "users" where "email" = 'scorer@qosh.demo'),
    (select "id" from "users" where "email" = 'referee2@qosh.demo'),
    '2026-09-19T17:25:00.000Z',
    'Jezero Court - Main',
    'LIVE',
    8,
    6,
    'PAUSED',
    600,
    352,
    null,
    null,
    null,
    null,
    now(),
    now()
  );

with demo_match_stats (
  "matchId", "teamId", "playerEmail", "points", "onePointMade", "onePointAttempted",
  "twoPointMade", "twoPointAttempted", "freeThrowMade", "freeThrowAttempted",
  "rebounds", "assists", "steals", "blocks", "turnovers", "fouls"
) as (
  values
    ('dddddddd-0001-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'player1@qosh.demo', 9, 3, 5, 3, 5, 0, 0, 4, 2, 2, 0, 1, 1),
    ('dddddddd-0001-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'player2@qosh.demo', 7, 5, 7, 1, 2, 0, 0, 3, 4, 1, 1, 2, 2),
    ('dddddddd-0001-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'player3@qosh.demo', 5, 3, 5, 1, 2, 0, 0, 5, 1, 0, 1, 1, 2),
    ('dddddddd-0001-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'player4@qosh.demo', 8, 4, 6, 2, 4, 0, 0, 3, 2, 1, 0, 2, 2),
    ('dddddddd-0001-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'player5@qosh.demo', 5, 3, 5, 1, 3, 0, 0, 4, 2, 0, 1, 1, 1),
    ('dddddddd-0001-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'player6@qosh.demo', 4, 2, 4, 1, 2, 0, 0, 5, 1, 1, 0, 2, 3),
    ('dddddddd-0002-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'player1@qosh.demo', 8, 4, 6, 2, 4, 0, 0, 6, 3, 1, 1, 1, 1),
    ('dddddddd-0002-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'player2@qosh.demo', 6, 4, 6, 1, 2, 0, 0, 4, 5, 2, 0, 2, 2),
    ('dddddddd-0002-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'player3@qosh.demo', 5, 3, 5, 1, 2, 0, 0, 5, 2, 0, 1, 1, 2),
    ('dddddddd-0002-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'player7@qosh.demo', 7, 5, 8, 1, 3, 0, 0, 3, 3, 1, 0, 2, 1),
    ('dddddddd-0002-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'player8@qosh.demo', 5, 3, 5, 1, 3, 0, 0, 6, 1, 0, 1, 1, 2),
    ('dddddddd-0002-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'player9@qosh.demo', 4, 2, 4, 1, 2, 0, 0, 4, 2, 1, 0, 2, 2),
    ('dddddddd-0003-4000-8000-000000000003', '55555555-5555-4555-8555-555555555555', 'player10@qosh.demo', 6, 4, 7, 1, 3, 0, 0, 4, 2, 1, 0, 2, 2),
    ('dddddddd-0003-4000-8000-000000000003', '55555555-5555-4555-8555-555555555555', 'player11@qosh.demo', 5, 3, 5, 1, 3, 0, 0, 5, 2, 0, 1, 2, 1),
    ('dddddddd-0003-4000-8000-000000000003', '55555555-5555-4555-8555-555555555555', 'player12@qosh.demo', 3, 3, 5, 0, 2, 0, 0, 3, 3, 1, 0, 1, 2),
    ('dddddddd-0003-4000-8000-000000000003', '88888888-8888-4888-8888-888888888888', 'player13@qosh.demo', 10, 4, 6, 3, 5, 0, 0, 6, 2, 2, 1, 1, 2),
    ('dddddddd-0003-4000-8000-000000000003', '88888888-8888-4888-8888-888888888888', 'player14@qosh.demo', 6, 4, 6, 1, 2, 0, 0, 5, 4, 1, 0, 2, 2),
    ('dddddddd-0003-4000-8000-000000000003', '88888888-8888-4888-8888-888888888888', 'player15@qosh.demo', 5, 3, 5, 1, 2, 0, 0, 4, 2, 0, 1, 1, 1),
    ('dddddddd-0004-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 'player1@qosh.demo', 8, 4, 6, 2, 4, 0, 0, 7, 3, 2, 1, 1, 1),
    ('dddddddd-0004-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 'player2@qosh.demo', 7, 5, 7, 1, 2, 0, 0, 4, 5, 1, 0, 2, 2),
    ('dddddddd-0004-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 'player3@qosh.demo', 5, 3, 5, 1, 2, 0, 0, 6, 2, 1, 1, 1, 2),
    ('dddddddd-0004-4000-8000-000000000004', '88888888-8888-4888-8888-888888888888', 'player13@qosh.demo', 9, 5, 7, 2, 4, 0, 0, 6, 3, 2, 0, 2, 2),
    ('dddddddd-0004-4000-8000-000000000004', '88888888-8888-4888-8888-888888888888', 'player14@qosh.demo', 5, 3, 5, 1, 3, 0, 0, 5, 4, 1, 1, 2, 1),
    ('dddddddd-0004-4000-8000-000000000004', '88888888-8888-4888-8888-888888888888', 'player15@qosh.demo', 4, 2, 4, 1, 2, 0, 0, 4, 2, 1, 0, 1, 2)
),
numbered_match_stats as (
  select row_number() over (order by "matchId", "teamId", "playerEmail") as "rowNumber", * from demo_match_stats
)
insert into "match_player_stats" (
  "id", "matchId", "teamId", "playerId", "points", "onePointMade", "onePointAttempted",
  "twoPointMade", "twoPointAttempted", "freeThrowMade", "freeThrowAttempted",
  "rebounds", "assists", "steals", "blocks", "turnovers", "fouls", "createdAt", "updatedAt"
)
select
  format('eeeeeeee-%s-4000-8000-%s', lpad("rowNumber"::text, 4, '0'), lpad("rowNumber"::text, 12, '0'))::uuid,
  "matchId"::uuid,
  "teamId"::uuid,
  (select "id" from "users" where "email" = numbered_match_stats."playerEmail"),
  "points",
  "onePointMade",
  "onePointAttempted",
  "twoPointMade",
  "twoPointAttempted",
  "freeThrowMade",
  "freeThrowAttempted",
  "rebounds",
  "assists",
  "steals",
  "blocks",
  "turnovers",
  "fouls",
  now(),
  now()
from numbered_match_stats
on conflict ("matchId", "playerId") do update set
  "teamId" = excluded."teamId",
  "points" = excluded."points",
  "onePointMade" = excluded."onePointMade",
  "onePointAttempted" = excluded."onePointAttempted",
  "twoPointMade" = excluded."twoPointMade",
  "twoPointAttempted" = excluded."twoPointAttempted",
  "freeThrowMade" = excluded."freeThrowMade",
  "freeThrowAttempted" = excluded."freeThrowAttempted",
  "rebounds" = excluded."rebounds",
  "assists" = excluded."assists",
  "steals" = excluded."steals",
  "blocks" = excluded."blocks",
  "turnovers" = excluded."turnovers",
  "fouls" = excluded."fouls",
  "updatedAt" = now();

with active_match_stats (
  "matchId", "teamId", "playerEmail", "points", "onePointMade", "onePointAttempted",
  "twoPointMade", "twoPointAttempted", "freeThrowMade", "freeThrowAttempted",
  "rebounds", "assists", "steals", "blocks", "turnovers", "fouls"
) as (
  values
    ('dddddddd-1001-4000-8000-000000001001', '34343434-3434-4434-8434-343434343434', 'player16@qosh.demo', 10, 4, 6, 3, 5, 0, 0, 5, 2, 2, 0, 1, 1),
    ('dddddddd-1001-4000-8000-000000001001', '34343434-3434-4434-8434-343434343434', 'player17@qosh.demo', 7, 5, 7, 1, 3, 0, 0, 4, 4, 1, 1, 2, 2),
    ('dddddddd-1001-4000-8000-000000001001', '34343434-3434-4434-8434-343434343434', 'player18@qosh.demo', 4, 2, 4, 1, 2, 0, 0, 6, 1, 0, 1, 1, 2),
    ('dddddddd-1001-4000-8000-000000001001', '35353535-3535-4535-8535-353535353535', 'player19@qosh.demo', 8, 4, 6, 2, 4, 0, 0, 4, 2, 1, 0, 2, 2),
    ('dddddddd-1001-4000-8000-000000001001', '35353535-3535-4535-8535-353535353535', 'player20@qosh.demo', 4, 2, 5, 1, 3, 0, 0, 5, 2, 0, 1, 1, 1),
    ('dddddddd-1001-4000-8000-000000001001', '35353535-3535-4535-8535-353535353535', 'player21@qosh.demo', 3, 3, 5, 0, 2, 0, 0, 3, 1, 1, 0, 2, 3),
    ('dddddddd-1002-4000-8000-000000001002', '36363636-3636-4636-8636-363636363636', 'player22@qosh.demo', 7, 5, 8, 1, 3, 0, 0, 4, 3, 1, 0, 2, 1),
    ('dddddddd-1002-4000-8000-000000001002', '36363636-3636-4636-8636-363636363636', 'player23@qosh.demo', 6, 4, 6, 1, 2, 0, 0, 5, 2, 0, 1, 1, 2),
    ('dddddddd-1002-4000-8000-000000001002', '36363636-3636-4636-8636-363636363636', 'player24@qosh.demo', 4, 2, 5, 1, 3, 0, 0, 4, 2, 1, 0, 2, 2),
    ('dddddddd-1002-4000-8000-000000001002', '37373737-3737-4737-8737-373737373737', 'player25@qosh.demo', 9, 3, 5, 3, 5, 0, 0, 5, 2, 2, 0, 1, 1),
    ('dddddddd-1002-4000-8000-000000001002', '37373737-3737-4737-8737-373737373737', 'player26@qosh.demo', 6, 4, 6, 1, 2, 0, 0, 4, 5, 1, 1, 2, 2),
    ('dddddddd-1002-4000-8000-000000001002', '37373737-3737-4737-8737-373737373737', 'player27@qosh.demo', 4, 2, 4, 1, 2, 0, 0, 6, 1, 0, 1, 1, 2),
    ('dddddddd-1003-4000-8000-000000001003', '34343434-3434-4434-8434-343434343434', 'player16@qosh.demo', 6, 4, 6, 1, 3, 0, 0, 3, 2, 1, 0, 1, 1),
    ('dddddddd-1003-4000-8000-000000001003', '34343434-3434-4434-8434-343434343434', 'player17@qosh.demo', 4, 2, 4, 1, 2, 0, 0, 2, 3, 1, 0, 1, 1),
    ('dddddddd-1003-4000-8000-000000001003', '34343434-3434-4434-8434-343434343434', 'player18@qosh.demo', 2, 2, 3, 0, 1, 0, 0, 4, 1, 0, 1, 1, 2),
    ('dddddddd-1003-4000-8000-000000001003', '37373737-3737-4737-8737-373737373737', 'player25@qosh.demo', 5, 3, 5, 1, 3, 0, 0, 3, 1, 1, 0, 1, 1),
    ('dddddddd-1003-4000-8000-000000001003', '37373737-3737-4737-8737-373737373737', 'player26@qosh.demo', 3, 3, 4, 0, 1, 0, 0, 2, 2, 1, 0, 1, 2),
    ('dddddddd-1003-4000-8000-000000001003', '37373737-3737-4737-8737-373737373737', 'player27@qosh.demo', 2, 2, 3, 0, 1, 0, 0, 4, 1, 0, 1, 2, 1),
    ('dddddddd-2001-4000-8000-000000002001', '38383838-3838-4838-8838-383838383838', 'player28@qosh.demo', 9, 5, 7, 2, 4, 0, 0, 5, 3, 2, 0, 1, 1),
    ('dddddddd-2001-4000-8000-000000002001', '38383838-3838-4838-8838-383838383838', 'player29@qosh.demo', 7, 3, 5, 2, 4, 0, 0, 4, 4, 1, 1, 2, 2),
    ('dddddddd-2001-4000-8000-000000002001', '38383838-3838-4838-8838-383838383838', 'player30@qosh.demo', 4, 2, 4, 1, 2, 0, 0, 6, 1, 0, 1, 1, 2),
    ('dddddddd-2001-4000-8000-000000002001', '39393939-3939-4939-8939-393939393939', 'player31@qosh.demo', 6, 4, 7, 1, 3, 0, 0, 4, 2, 1, 0, 2, 2),
    ('dddddddd-2001-4000-8000-000000002001', '39393939-3939-4939-8939-393939393939', 'player32@qosh.demo', 5, 3, 5, 1, 3, 0, 0, 3, 3, 0, 1, 1, 1),
    ('dddddddd-2001-4000-8000-000000002001', '39393939-3939-4939-8939-393939393939', 'player33@qosh.demo', 3, 3, 4, 0, 2, 0, 0, 5, 1, 1, 0, 2, 3),
    ('dddddddd-2002-4000-8000-000000002002', '38383838-3838-4838-8838-383838383838', 'player28@qosh.demo', 4, 2, 3, 1, 2, 0, 0, 2, 2, 1, 0, 1, 1),
    ('dddddddd-2002-4000-8000-000000002002', '38383838-3838-4838-8838-383838383838', 'player29@qosh.demo', 2, 2, 4, 0, 1, 0, 0, 2, 1, 1, 0, 1, 1),
    ('dddddddd-2002-4000-8000-000000002002', '38383838-3838-4838-8838-383838383838', 'player30@qosh.demo', 2, 2, 3, 0, 1, 0, 0, 3, 1, 0, 1, 0, 2),
    ('dddddddd-2002-4000-8000-000000002002', '40404040-4040-4040-8040-404040404040', 'player34@qosh.demo', 3, 3, 5, 0, 1, 0, 0, 2, 1, 1, 0, 1, 1),
    ('dddddddd-2002-4000-8000-000000002002', '40404040-4040-4040-8040-404040404040', 'player35@qosh.demo', 2, 2, 3, 0, 1, 0, 0, 3, 2, 0, 1, 1, 1),
    ('dddddddd-2002-4000-8000-000000002002', '40404040-4040-4040-8040-404040404040', 'player36@qosh.demo', 1, 1, 2, 0, 1, 0, 0, 4, 1, 0, 0, 1, 2)
),
numbered_active_match_stats as (
  select row_number() over (order by "matchId", "teamId", "playerEmail") as "rowNumber", * from active_match_stats
)
insert into "match_player_stats" (
  "id", "matchId", "teamId", "playerId", "points", "onePointMade", "onePointAttempted",
  "twoPointMade", "twoPointAttempted", "freeThrowMade", "freeThrowAttempted",
  "rebounds", "assists", "steals", "blocks", "turnovers", "fouls", "createdAt", "updatedAt"
)
select
  format('ffffffff-%s-4000-8000-%s', lpad("rowNumber"::text, 4, '0'), lpad("rowNumber"::text, 12, '0'))::uuid,
  "matchId"::uuid,
  "teamId"::uuid,
  (select "id" from "users" where "email" = numbered_active_match_stats."playerEmail"),
  "points",
  "onePointMade",
  "onePointAttempted",
  "twoPointMade",
  "twoPointAttempted",
  "freeThrowMade",
  "freeThrowAttempted",
  "rebounds",
  "assists",
  "steals",
  "blocks",
  "turnovers",
  "fouls",
  now(),
  now()
from numbered_active_match_stats
on conflict ("matchId", "playerId") do update set
  "teamId" = excluded."teamId",
  "points" = excluded."points",
  "onePointMade" = excluded."onePointMade",
  "onePointAttempted" = excluded."onePointAttempted",
  "twoPointMade" = excluded."twoPointMade",
  "twoPointAttempted" = excluded."twoPointAttempted",
  "freeThrowMade" = excluded."freeThrowMade",
  "freeThrowAttempted" = excluded."freeThrowAttempted",
  "rebounds" = excluded."rebounds",
  "assists" = excluded."assists",
  "steals" = excluded."steals",
  "blocks" = excluded."blocks",
  "turnovers" = excluded."turnovers",
  "fouls" = excluded."fouls",
  "updatedAt" = now();

commit;
