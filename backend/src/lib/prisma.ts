import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "@/config/env";

/**
 * Prisma client, created once per process.
 *
 * Cached on `globalThis` because the API runs as a serverless function: each
 * warm invocation re-enters this module, and a new client per invocation would
 * open a new pool until the database refused connections. Neon pools on its
 * side, but the client still has to stop creating them on ours.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * The Postgres schema the tables live in, read from `?schema=` on the URL —
 * the convention Prisma's own CLI uses for `migrate deploy`, so one URL serves
 * both. The adapter would otherwise qualify every table as "public", which is
 * wrong when CyberKent shares a database with another application under its
 * own schema. The parameter is removed before the URL reaches `pg`, which does
 * not know it.
 */
export function splitSchema(url: string): { connectionString: string; schema?: string } {
  try {
    const parsed = new URL(url);
    const schema = parsed.searchParams.get("schema") ?? undefined;
    parsed.searchParams.delete("schema");
    return { connectionString: parsed.toString(), schema };
  } catch {
    return { connectionString: url };
  }
}

function createClient(): PrismaClient {
  const { connectionString, schema } = splitSchema(env.DATABASE_URL);
  const adapter = new PrismaPg({ connectionString }, schema ? { schema } : undefined);

  return new PrismaClient({
    adapter,
    /* Errors and warnings only. Query logging would put submitted content into
       the platform log, which is user data we have no reason to retain there. */
    log: env.isProduction ? ["error"] : ["error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}
