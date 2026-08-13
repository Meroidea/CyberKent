import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { sendFail, sendOk } from "@/lib/http";

export const healthRoutes = Router();

/**
 * Liveness — the process is up and answering.
 *
 * Deliberately does not touch the database: a health check that fails when a
 * dependency is slow tells a load balancer to recycle a process that is
 * perfectly healthy.
 */
healthRoutes.get("/", (_req, res) => {
  sendOk(res, { status: "ok", uptimeSeconds: Math.round(process.uptime()) });
});

/**
 * Readiness — the process can actually serve traffic.
 *
 * This one does reach the database, because an API that cannot read is not
 * ready regardless of how well the process itself is running.
 */
healthRoutes.get("/ready", async (_req, res) => {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    sendOk(res, { status: "ready", databaseLatencyMs: Date.now() - startedAt });
  } catch {
    /* The reason is logged, not returned — a connection error carries the host
       and sometimes the user (Avoid.md §4). */
    sendFail(res, 503, "The database is not reachable.");
  }
});
