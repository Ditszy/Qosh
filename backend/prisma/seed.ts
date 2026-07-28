import "dotenv/config";
import * as bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, TeamMemberRole, TournamentStatus, UserRole } from "@prisma/client";

const DEMO_PASSWORD = "Password123!";
const DEMO_TOURNAMENT_ID = "11111111-1111-4111-8111-111111111111";
const DEMO_TEAM_NORTH_ID = "22222222-2222-4222-8222-222222222222";
const DEMO_TEAM_SOUTH_ID = "33333333-3333-4333-8333-333333333333";

const demoUsers = [
  {
    email: "admin@qosh.demo",
    username: "qosh_admin",
    firstName: "Admin",
    lastName: "User",
    role: UserRole.ADMIN,
  },
  {
    email: "organizer@qosh.demo",
    username: "qosh_organizer",
    firstName: "Olivia",
    lastName: "Organizer",
    role: UserRole.ORGANIZER,
  },
  {
    email: "scorer@qosh.demo",
    username: "qosh_scorer",
    firstName: "Sam",
    lastName: "Scorer",
    role: UserRole.SCORER,
  },
  {
    email: "referee@qosh.demo",
    username: "qosh_referee",
    firstName: "Riley",
    lastName: "Referee",
    role: UserRole.REFEREE,
  },
  {
    email: "player1@qosh.demo",
    username: "qosh_player1",
    firstName: "Mila",
    lastName: "Petrovic",
    role: UserRole.PLAYER,
  },
  {
    email: "player2@qosh.demo",
    username: "qosh_player2",
    firstName: "Nikola",
    lastName: "Jovanovic",
    role: UserRole.PLAYER,
  },
  {
    email: "player3@qosh.demo",
    username: "qosh_player3",
    firstName: "Lena",
    lastName: "Markovic",
    role: UserRole.PLAYER,
  },
  {
    email: "player4@qosh.demo",
    username: "qosh_player4",
    firstName: "Ivan",
    lastName: "Stojanovic",
    role: UserRole.PLAYER,
  },
  {
    email: "player5@qosh.demo",
    username: "qosh_player5",
    firstName: "Sara",
    lastName: "Kovacevic",
    role: UserRole.PLAYER,
  },
  {
    email: "player6@qosh.demo",
    username: "qosh_player6",
    firstName: "Marko",
    lastName: "Ilic",
    role: UserRole.PLAYER,
  },
];

const buildDatabaseUrl = () => {
  if (process.env["DATABASE_URL"]) {
    return process.env["DATABASE_URL"];
  }

  const host = process.env["DB_HOST"];
  const port = process.env["DB_PORT"];
  const username = process.env["DB_USERNAME"];
  const password = process.env["DB_PASSWORD"];
  const database = process.env["DB_NAME"];

  if (!host || !port || !username || !password || !database) {
    throw new Error("Set DATABASE_URL or DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, and DB_NAME before seeding.");
  }

  return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=public`;
};

const prisma = new PrismaClient({
  adapter: new PrismaPg(buildDatabaseUrl()),
});

async function main() {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const usersByEmail = new Map<string, { id: string }>();

  for (const user of demoUsers) {
    const seededUser = await prisma.user.upsert({
      where: { email: user.email },
      create: {
        ...user,
        password,
      },
      update: {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        password,
      },
    });

    usersByEmail.set(user.email, seededUser);
  }

  const organizer = usersByEmail.get("organizer@qosh.demo");

  if (!organizer) {
    throw new Error("Demo organizer was not seeded.");
  }

  const tournament = await prisma.tournament.upsert({
    where: { id: DEMO_TOURNAMENT_ID },
    create: {
      id: DEMO_TOURNAMENT_ID,
      name: "Qosh Demo Open",
      description: "Demo tournament",
      location: "Belgrade Sports Hall",
      startsAt: new Date("2026-08-15T18:00:00.000Z"),
      maxTeams: 8,
      status: TournamentStatus.SIGNUPS_OPEN,
      organizerId: organizer.id,
    },
    update: {
      name: "Qosh Demo Open",
      description: "Demo tournament",
      location: "Belgrade Sports Hall",
      startsAt: new Date("2026-08-15T18:00:00.000Z"),
      maxTeams: 8,
      status: TournamentStatus.SIGNUPS_OPEN,
      organizerId: organizer.id,
    },
  });

  const northTeam = await prisma.team.upsert({
    where: { id: DEMO_TEAM_NORTH_ID },
    create: {
      id: DEMO_TEAM_NORTH_ID,
      name: "North Rim",
      tournamentId: tournament.id,
    },
    update: {
      name: "North Rim",
      tournamentId: tournament.id,
    },
  });

  const southTeam = await prisma.team.upsert({
    where: { id: DEMO_TEAM_SOUTH_ID },
    create: {
      id: DEMO_TEAM_SOUTH_ID,
      name: "South Arc",
      tournamentId: tournament.id,
    },
    update: {
      name: "South Arc",
      tournamentId: tournament.id,
    },
  });

  await prisma.teamMember.deleteMany({
    where: {
      teamId: {
        in: [northTeam.id, southTeam.id],
      },
    },
  });

  await prisma.teamMember.createMany({
    data: [
      { teamId: northTeam.id, userId: usersByEmail.get("player1@qosh.demo")!.id, role: TeamMemberRole.CAPTAIN },
      { teamId: northTeam.id, userId: usersByEmail.get("player2@qosh.demo")!.id, role: TeamMemberRole.MEMBER },
      { teamId: northTeam.id, userId: usersByEmail.get("player3@qosh.demo")!.id, role: TeamMemberRole.MEMBER },
      { teamId: southTeam.id, userId: usersByEmail.get("player4@qosh.demo")!.id, role: TeamMemberRole.CAPTAIN },
      { teamId: southTeam.id, userId: usersByEmail.get("player5@qosh.demo")!.id, role: TeamMemberRole.MEMBER },
      { teamId: southTeam.id, userId: usersByEmail.get("player6@qosh.demo")!.id, role: TeamMemberRole.MEMBER },
    ],
  });

  console.log(`Seeded ${demoUsers.length} demo users. Shared password: ${DEMO_PASSWORD}`);
  console.log(`Seeded demo tournament "${tournament.name}" with 2 teams.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
