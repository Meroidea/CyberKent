import { Router, type NextFunction, type Request, type Response } from "express";
import { AppError, sendOk } from "@/lib/http";
import { requireStaff } from "@/middleware/staff";
import { parseQuery, validateBody } from "@/middleware/validate";
import {
  assignSchema,
  decisionSchema,
  indicatorStatusSchema,
  queueQuerySchema,
  reopenSchema,
  requestInfoSchema,
  statsQuerySchema,
  triageSchema,
} from "@/modules/council/council.schema";
import { councilService, type Actor } from "@/modules/council/council.service";
import { councilStats } from "@/modules/council/council.stats";
import { councilSimilarity } from "@/modules/council/council.similarity";
import { z } from "zod";
import { staffAlertsRoutes } from "@/modules/alerts/alerts.routes";

/**
 * Modules 7 and 12 from Council's side — the review queue, the report
 * workspace and the statistics behind the officer dashboard.
 *
 * Every route is staff-only and the role is re-read from the database on each
 * request (see `requireStaff`), so removing someone's access is immediate.
 */
export const councilRoutes = Router();

councilRoutes.use(...requireStaff());

function actor(req: Request): Actor {
  return { id: req.user!.id, role: req.user!.role as Actor["role"], ipAddress: req.ip };
}

function reference(req: Request): string {
  const value = String(req.params.reference ?? "").toUpperCase();
  if (!/^[A-Z0-9-]{4,32}$/.test(value)) {
    throw new AppError(404, "There is no report with that reference.");
  }
  return value;
}

/* Every handler here is async and answers with one envelope; this is the one try/catch. */
const handle = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};

/* A staff screen is personal and changes by the second: never cache it anywhere. */
councilRoutes.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/* Module 9, from Council's side — behind the same staff check. */
councilRoutes.use("/alerts", staffAlertsRoutes);

councilRoutes.get("/stats", handle(async (req, res) => {
  const { days } = parseQuery(statsQuerySchema, req);
  sendOk(res, await councilStats.summary(days));
}));

councilRoutes.get("/staff", handle(async (_req, res) => {
  sendOk(res, { staff: await councilService.staff() });
}));

councilRoutes.get("/reports", handle(async (req, res) => {
  sendOk(res, await councilService.queue(parseQuery(queueQuerySchema, req), actor(req)));
}));

councilRoutes.get("/reports/:reference", handle(async (req, res) => {
  sendOk(res, { report: await councilService.get(reference(req), actor(req)) });
}));

councilRoutes.post("/reports/:reference/assign", validateBody(assignSchema), handle(async (req, res) => {
  const report = await councilService.assign(reference(req), req.body.reviewerId, actor(req));
  sendOk(res, { report }, report.reviewer ? `Assigned to ${report.reviewer.fullName}.` : "Returned to the queue.");
}));

councilRoutes.patch("/reports/:reference/triage", validateBody(triageSchema), handle(async (req, res) => {
  sendOk(res, { report: await councilService.triage(reference(req), req.body, actor(req)) }, "Classification saved.");
}));

councilRoutes.post("/reports/:reference/start", handle(async (req, res) => {
  sendOk(res, { report: await councilService.start(reference(req), actor(req)) }, "Review started.");
}));

councilRoutes.post("/reports/:reference/request-info", validateBody(requestInfoSchema), handle(async (req, res) => {
  sendOk(res, { report: await councilService.requestInformation(reference(req), req.body.message, actor(req)) }, "Question sent to the reporter.");
}));

councilRoutes.post("/reports/:reference/decision", validateBody(decisionSchema), handle(async (req, res) => {
  const report = await councilService.decide(reference(req), req.body, actor(req));
  sendOk(res, { report }, report.status === "APPROVED" ? "Report verified." : "Report closed.");
}));

councilRoutes.post("/reports/:reference/reopen", ...requireStaff("ADMIN"), validateBody(reopenSchema), handle(async (req, res) => {
  sendOk(res, { report: await councilService.reopen(reference(req), req.body.reason, actor(req)) }, "Report re-opened.");
}));

councilRoutes.patch("/reports/:reference/indicators/:indicatorId", validateBody(indicatorStatusSchema), handle(async (req, res) => {
  const report = await councilService.setIndicatorStatus(reference(req), String(req.params.indicatorId), req.body.status, actor(req));
  sendOk(res, { report }, "Detail updated.");
}));

/* Module 8 — FR43–FR48. Suggestions are computed on request; links are an officer's. */
const linkSchema = z
  .object({ targetReference: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{4,32}$/), kind: z.enum(["DUPLICATE", "RELATED"]) })
  .strict();

councilRoutes.get("/reports/:reference/similar", handle(async (req, res) => {
  sendOk(res, await councilSimilarity.candidates(reference(req)));
}));

councilRoutes.post("/reports/:reference/links", validateBody(linkSchema), handle(async (req, res) => {
  await councilSimilarity.link(reference(req), req.body.targetReference, req.body.kind, actor(req));
  sendOk(res, { report: await councilService.get(reference(req), actor(req), false) }, req.body.kind === "DUPLICATE" ? "Marked as a duplicate." : "Linked as related.");
}));

councilRoutes.delete("/reports/:reference/links/:target", handle(async (req, res) => {
  await councilSimilarity.unlink(reference(req), String(req.params.target ?? "").toUpperCase().slice(0, 32), actor(req));
  sendOk(res, { report: await councilService.get(reference(req), actor(req), false) }, "Link removed.");
}));
