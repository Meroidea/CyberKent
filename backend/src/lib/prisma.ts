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

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

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
