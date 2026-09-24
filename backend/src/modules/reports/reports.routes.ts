import { Router, type Request } from "express";
import { AppError, sendOk } from "@/lib/http";
import { reportLimiter } from "@/lib/limits";
import { requireAuth } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { createReportSchema, draftSchema, respondSchema } from "@/modules/reports/reports.schema";
import { reportsService } from "@/modules/reports/reports.service";

/**
 * Modules 5–8, from the reporter's side.
 *
 * Every route needs an account: checking is free and anonymous, but a report
 * starts a piece of Council work that someone has to be able to follow up.
 * The officer-side review queue is a separate surface with its own roles.
 */
export const reportsRoutes = Router();

reportsRoutes.use(requireAuth);

function me(req: Request): string {
  if (!req.user) {
    throw new AppError(401, "Sign in to continue.");
  }
  return req.user.id;
}

/* Reference numbers are upper-case letters, digits and hyphens; anything else
   cannot be one, and is refused before it reaches a query. */
function reference(req: Request): string {
  const value = String(req.params.reference ?? "").toUpperCase();
  if (!/^[A-Z0-9-]{4,32}$/.test(value)) {
    throw new AppError(404, "We could not find a report with that reference on your account.");
  }
  return value;
}

reportsRoutes.post("/", reportLimiter, validateBody(createReportSchema), async (req, res, next) => {
  try {
    const result = await reportsService.create(me(req), req.body, req.ip);
    sendOk(res, result, `Report ${result.reference} sent to Council.`, 201);
  } catch (error) {
    next(error);
  }
});

/* FR26 — before "/:reference", so "drafts" is never read as a reference. */
reportsRoutes.get("/drafts", async (req, res, next) => {
  try {
    sendOk(res, { drafts: await reportsService.drafts(me(req)) });
  } catch (error) {
    next(error);
  }
});

reportsRoutes.put("/drafts", validateBody(draftSchema), async (req, res, next) => {
  try {
    sendOk(res, await reportsService.saveDraft(me(req), req.body), "Draft saved.");
  } catch (error) {
    next(error);
  }
});

reportsRoutes.delete("/drafts/:reference", async (req, res, next) => {
  try {
    await reportsService.discardDraft(me(req), reference(req));
    sendOk(res, { discarded: true }, "Draft discarded.");
  } catch (error) {
    next(error);
  }
});

reportsRoutes.get("/", async (req, res, next) => {
  try {
    sendOk(res, { reports: await reportsService.list(me(req)) });
  } catch (error) {
    next(error);
  }
});

reportsRoutes.get("/:reference", async (req, res, next) => {
  try {
    sendOk(res, { report: await reportsService.get(me(req), reference(req)) });
  } catch (error) {
    next(error);
  }
});

reportsRoutes.post("/:reference/withdraw", async (req, res, next) => {
  try {
    const report = await reportsService.withdraw(me(req), reference(req), req.ip);
    sendOk(res, { report }, "Report withdrawn.");
  } catch (error) {
    next(error);
  }
});

reportsRoutes.post("/:reference/requests/:requestId/respond", validateBody(respondSchema), async (req, res, next) => {
  try {
    const report = await reportsService.respond(me(req), reference(req), String(req.params.requestId), req.body.response);
    sendOk(res, { report }, "Answer sent to Council.");
  } catch (error) {
    next(error);
  }
});
