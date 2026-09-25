import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { attachDatabasePool } from "@vercel/functions";
import pg from "pg";
import { env } from "@/config/env";

/**
 * Prisma client, created once per process.
 *
 * Cached on `globalThis` because the API runs as a serverless function: each
 * warm invocation re-enters this module, and a new client per invocation would
 * open a new pool until the database refused connections.
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

/**
 * Refusals a connection pooler gives when it is momentarily full: Supavisor's
 * client and session limits, and Postgres's own. They clear as other requests
 * finish, so they are worth a short wait — not worth an error page.
 */
export function isTransientConnectError(error: unknown): boolean {
  const text = error instanceof Error ? `${(error as { code?: string }).code ?? ""} ${error.message}` : String(error);
  return /EMAXCONN|max client(s| connections) reached|too many clients|53300/i.test(text);
}

const RETRY_DELAYS_MS = [120, 350, 800];

/**
 * A pool that retries a refused connection a few times before giving up.
 *
 * Every query goes through connect(): `pool.query()` calls it with a callback,
 * transactions await it. Only obtaining the connection is retried — never a
 * statement — so nothing can run twice.
 */
export class ResilientPool extends pg.Pool {
  override connect(): Promise<pg.PoolClient>;
  override connect(callback: (err: Error | undefined, client: pg.PoolClient | undefined, done: (release?: unknown) => void) => void): void;
  override connect(callback?: (err: Error | undefined, client: pg.PoolClient | undefined, done: (release?: unknown) => void) => void): Promise<pg.PoolClient> | void {
    const attempt = (n: number): Promise<pg.PoolClient> =>
      super.connect().catch((error: unknown) => {
        const wait = RETRY_DELAYS_MS[n];
        if (wait === undefined || !isTransientConnectError(error)) throw error;
        return new Promise((resolve) => setTimeout(resolve, wait + Math.random() * wait)).then(() => attempt(n + 1));
      });

    if (!callback) return attempt(0);
    attempt(0).then(
      (client) => callback(undefined, client, (release) => client.release(release as Error | boolean | undefined)),
      (error: Error) => callback(error, undefined, () => undefined),
    );
  }
}

function createClient(): PrismaClient {
  const { connectionString, schema } = splitSchema(env.DATABASE_URL);
  /* Connections are released after a few idle seconds: on a serverless host an
     idle connection held by a quiet instance is one a busy instance cannot
     have. attachDatabasePool keeps a suspended Vercel instance alive just long
     enough to close them, rather than leaving them open against the pooler. */
  const pool = new ResilientPool({ connectionString, max: env.DATABASE_POOL_MAX, idleTimeoutMillis: 5_000, connectionTimeoutMillis: 15_000 });
  /* A connection dropped while idle (pooler restart, network blip) must not take
     the process down; the pool replaces it on next use. */
  pool.on("error", (error) => console.error("[db] idle connection error:", error.message));
  if (process.env.VERCEL) attachDatabasePool(pool);
  const adapter = new PrismaPg(pool, schema ? { schema } : undefined);

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
