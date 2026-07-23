import "dotenv/config";
import { defineConfig } from "prisma/config";

const getDatabaseUrl = () => {
  if (process.env["DATABASE_URL"]) {
    return process.env["DATABASE_URL"];
  }

  const host = process.env["DB_HOST"];
  const port = process.env["DB_PORT"];
  const username = process.env["DB_USERNAME"];
  const password = process.env["DB_PASSWORD"];
  const database = process.env["DB_NAME"];

  if (!host || !port || !username || !password || !database) {
    return undefined;
  }

  return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=public`;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDatabaseUrl(),
  },
});
