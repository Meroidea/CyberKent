import { execSync } from "node:child_process";

/** Migrates the test database and loads reference data, once per run. */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("Set TEST_DATABASE_URL to a PostgreSQL database the tests may reset.");
  const env = { ...process.env, DATABASE_URL: url, NODE_ENV: "test", SEED_ADMIN_PASSWORD: "" };
  execSync("npx prisma migrate deploy", { env, stdio: "inherit" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "inherit" });
}
