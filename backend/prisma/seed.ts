import "dotenv/config";
import * as bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "@prisma/client";

const DEMO_PASSWORD = "Password123!";

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

  for (const user of demoUsers) {
    await prisma.user.upsert({
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
  }

  console.log(`Seeded ${demoUsers.length} demo users. Shared password: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
