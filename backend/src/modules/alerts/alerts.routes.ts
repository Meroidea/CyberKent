import { Router, type NextFunction, type Request, type Response } from "express";
import { AppError, sendOk } from "@/lib/http";
import { parseQuery, validateBody } from "@/middleware/validate";
import { createAlertSchema, publicAlertsQuerySchema, returnAlertSchema, staffAlertsQuerySchema, updateAlertSchema } from "@/modules/alerts/alerts.schema";
import { alertsService } from "@/modules/alerts/alerts.service";
import type { Actor } from "@/modules/council/council.service";

const handle = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};

/**
 * FR52, FR53 — the public alert feed. No account, no cookies, nothing about
 * who is reading; cacheable for a minute so a spike of residents checking the
 * same alert does not become a spike of database reads.
 */
export const publicAlertsRoutes = Router();

publicAlertsRoutes.get("/", handle(async (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=60");
  sendOk(res, await alertsService.publicList(parseQuery(publicAlertsQuerySchema, req)));
}));

publicAlertsRoutes.get("/:reference", handle(async (req, res) => {
  const reference = String(req.params.reference ?? "").toUpperCase();
  if (!/^[A-Z0-9-]{4,32}$/.test(reference)) throw new AppError(404, "There is no published alert with that reference.");
  res.setHeader("Cache-Control", "public, max-age=60");
  sendOk(res, { alert: await alertsService.publicGet(reference) });
}));

/**
 * FR49–FR54 from Council's side. Mounted under `/api/council/alerts`, so the
 * council router's `requireStaff` has already run.
 */
export const staffAlertsRoutes = Router();

const actor = (req: Request): Actor => ({ id: req.user!.id, role: req.user!.role as Actor["role"], ipAddress: req.ip });
const id = (req: Request) => String(req.params.id ?? "").slice(0, 40);

staffAlertsRoutes.get("/", handle(async (req, res) => {
  const query = parseQuery(staffAlertsQuerySchema, req);
  sendOk(res, await alertsService.staffList(query.status, query.page, actor(req)));
}));

staffAlertsRoutes.get("/suggest/:reference", handle(async (req, res) => {
  sendOk(res, { suggestion: await alertsService.suggest(String(req.params.reference ?? "").toUpperCase()) });
}));

staffAlertsRoutes.post("/", validateBody(createAlertSchema), handle(async (req, res) => {
  sendOk(res, { alert: await alertsService.create(req.body, actor(req)) }, "Draft saved.", 201);
}));

staffAlertsRoutes.get("/:id", handle(async (req, res) => {
  sendOk(res, { alert: await alertsService.staffGet(id(req), actor(req)) });
}));

staffAlertsRoutes.patch("/:id", validateBody(updateAlertSchema), handle(async (req, res) => {
  sendOk(res, { alert: await alertsService.update(id(req), req.body, actor(req)) }, "Saved.");
}));

staffAlertsRoutes.post("/:id/submit", handle(async (req, res) => {
  sendOk(res, { alert: await alertsService.submit(id(req), actor(req)) }, "Sent for a second officer's approval.");
}));

staffAlertsRoutes.post("/:id/return", validateBody(returnAlertSchema), handle(async (req, res) => {
  sendOk(res, { alert: await alertsService.sendBack(id(req), req.body.note, actor(req)) }, "Returned to the author.");
}));

staffAlertsRoutes.post("/:id/approve", handle(async (req, res) => {
  sendOk(res, { alert: await alertsService.approve(id(req), actor(req)) }, "Published.");
}));

staffAlertsRoutes.post("/:id/archive", handle(async (req, res) => {
  sendOk(res, { alert: await alertsService.archive(id(req), actor(req)) }, "Archived.");
}));

staffAlertsRoutes.post("/:id/restore", handle(async (req, res) => {
  sendOk(res, { alert: await alertsService.restore(id(req), actor(req)) }, "Back on the feed.");
}));
