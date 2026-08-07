import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 configuration.
 *
 * The connection URL lives here rather than in schema.prisma, which is the
 * change Prisma 7 made: the schema describes shape, this describes where to
 * reach the database. Keeping the URL out of the schema also means the schema
 * file is safe to read and share without carrying a credential path.
 *
 * `dotenv/config` is imported for its side effect so the CLI picks up
 * backend/.env without the developer having to export anything by hand.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
