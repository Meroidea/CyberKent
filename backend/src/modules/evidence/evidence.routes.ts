import express, { Router, type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { AppError, sendOk } from "@/lib/http";
import { requireAuth } from "@/middleware/auth";
import { requireStaff } from "@/middleware/staff";
import { evidenceService } from "@/modules/evidence/evidence.service";

const handle = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};

const reference = (req: Request) => {
  const value = String(req.params.reference ?? "").toUpperCase();
  if (!/^[A-Z0-9-]{4,32}$/.test(value)) throw new AppError(404, "There is no report with that reference.");
  return value;
};

/* The raw file is the body. Only this route reads a body this large. */
const fileBody = express.raw({ type: () => true, limit: "4.5mb" });

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `user:${req.user?.id ?? "anonymous"}`,
  message: { success: false, message: "You have attached a lot of files in a short time. Try again later.", data: null, errors: [] },
});

function header(req: Request, name: string): string | undefined {
  const raw = req.get(name);
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Serves a file so that nothing in it can run: never inline for anything but
 * an image or PDF, a sandbox CSP either way, and never cached anywhere.
 */
function sendFile(res: Response, file: { bytes: Buffer; mimeType: string; name: string }) {
  const inline = file.mimeType.startsWith("image/") || file.mimeType === "application/pdf";
  res.setHeader("Content-Type", file.mimeType === "text/plain" ? "text/plain; charset=utf-8" : file.mimeType);
  res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.name)}`);
  res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).send(file.bytes);
}

/** The reporter's side, mounted under `/api/reports`. */
export const reporterEvidenceRoutes = Router();

reporterEvidenceRoutes.get("/evidence/limits", (_req, res) => {
  sendOk(res, evidenceService.limits());
});

reporterEvidenceRoutes.get("/:reference/evidence", requireAuth, handle(async (req, res) => {
  sendOk(res, { evidence: await evidenceService.list(reference(req), req.user!.id) });
}));

reporterEvidenceRoutes.post("/:reference/evidence", requireAuth, uploadLimiter, fileBody, handle(async (req, res) => {
  if (!Buffer.isBuffer(req.body)) throw new AppError(422, "Send the file itself as the request body.");
  const file = await evidenceService.upload({
    reference: reference(req),
    authorId: req.user!.id,
    name: header(req, "X-File-Name") ?? "evidence",
    description: header(req, "X-Description"),
    bytes: req.body,
    ipAddress: req.ip,
  });
  sendOk(res, { file }, "File attached.", 201);
}));

reporterEvidenceRoutes.get("/:reference/evidence/:id", requireAuth, handle(async (req, res) => {
  sendFile(res, await evidenceService.open({ reference: reference(req), evidenceId: String(req.params.id), userId: req.user!.id, asStaff: false, ipAddress: req.ip }));
}));

reporterEvidenceRoutes.delete("/:reference/evidence/:id", requireAuth, handle(async (req, res) => {
  sendOk(res, { evidence: await evidenceService.remove(reference(req), String(req.params.id), req.user!.id, req.ip) }, "File removed.");
}));

/** Council's side, mounted under `/api/council/reports`. */
export const staffEvidenceRoutes = Router();

staffEvidenceRoutes.use(...requireStaff());

staffEvidenceRoutes.get("/:reference/evidence/:id", handle(async (req, res) => {
  sendFile(res, await evidenceService.open({ reference: reference(req), evidenceId: String(req.params.id), userId: req.user!.id, asStaff: true, ipAddress: req.ip }));
}));

staffEvidenceRoutes.get("/:reference/evidence/:id/log", handle(async (req, res) => {
  sendOk(res, { log: await evidenceService.accessLog(reference(req), String(req.params.id)) });
}));
