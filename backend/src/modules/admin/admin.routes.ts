import { Router, type NextFunction, type Request, type Response } from "express";
import { sendOk } from "@/lib/http";
import { requireStaff } from "@/middleware/staff";
import { parseQuery, validateBody } from "@/middleware/validate";
import {
  auditQuerySchema,
  createCategorySchema,
  exportQuerySchema,
  roleSchema,
  suspendSchema,
  updateCategorySchema,
  usersQuerySchema,
} from "@/modules/admin/admin.schema";
import { adminService } from "@/modules/admin/admin.service";
import type { Actor } from "@/modules/council/council.service";

/**
 * Module 12 — administration (FR67–FR69), the audit trail (FR72) and the
 * de-identified export (FR71). Administrators only, re-checked per request.
 */
export const adminRoutes = Router();

adminRoutes.use(...requireStaff("ADMIN"));
adminRoutes.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

function actor(req: Request): Actor {
  return { id: req.user!.id, role: "ADMIN", ipAddress: req.ip };
}

const handle = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};

const id = (req: Request) => String(req.params.id ?? "").slice(0, 40);

adminRoutes.get("/users", handle(async (req, res) => {
  sendOk(res, await adminService.users(parseQuery(usersQuerySchema, req)));
}));

adminRoutes.patch("/users/:id/role", validateBody(roleSchema), handle(async (req, res) => {
  sendOk(res, { user: await adminService.setRole(id(req), req.body.role, actor(req)) }, "Role changed.");
}));

adminRoutes.post("/users/:id/suspend", validateBody(suspendSchema), handle(async (req, res) => {
  const result = await adminService.suspend(id(req), req.body.reason, actor(req));
  sendOk(res, result, result.releasedReports > 0 ? `Account suspended. ${result.releasedReports} open report(s) returned to the queue.` : "Account suspended.");
}));

adminRoutes.post("/users/:id/reactivate", handle(async (req, res) => {
  sendOk(res, { user: await adminService.reactivate(id(req), actor(req)) }, "Account reactivated.");
}));

adminRoutes.get("/categories", handle(async (_req, res) => {
  sendOk(res, { categories: await adminService.categories() });
}));

adminRoutes.post("/categories", validateBody(createCategorySchema), handle(async (req, res) => {
  sendOk(res, { category: await adminService.createCategory(req.body, actor(req)) }, "Category created.", 201);
}));

adminRoutes.patch("/categories/:id", validateBody(updateCategorySchema), handle(async (req, res) => {
  sendOk(res, { category: await adminService.updateCategory(id(req), req.body, actor(req)) }, "Category saved.");
}));

adminRoutes.get("/audit", handle(async (req, res) => {
  sendOk(res, await adminService.audit(parseQuery(auditQuerySchema, req)));
}));

/**
 * A file, not an envelope — the one route outside Rule 4.2's shape, because
 * what the caller wants is something a spreadsheet opens. Failures before this
 * point still answer in the envelope.
 */
adminRoutes.get("/export.csv", handle(async (req, res) => {
  const { days } = parseQuery(exportQuerySchema, req);
  const { csv } = await adminService.exportCsv(days, actor(req));
  const stamp = new Date().toISOString().slice(0, 10);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="cyberkent-reports-deidentified-${stamp}.csv"`);
  res.status(200).send(csv);
}));
