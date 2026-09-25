import { Router, type NextFunction, type Request, type Response } from "express";
import { sendOk } from "@/lib/http";
import { requireStaff } from "@/middleware/staff";
import { validateBody } from "@/middleware/validate";
import type { Actor } from "@/modules/council/council.service";
import { createArticleSchema, createNoticeSchema, importSchema, updateArticleSchema, updateNoticeSchema } from "@/modules/content/content.schema";
import { contentService } from "@/modules/content/content.service";

const handle = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};
const actor = (req: Request): Actor => ({ id: req.user!.id, role: req.user!.role as Actor["role"], ipAddress: req.ip });
const id = (req: Request) => String(req.params.id ?? "").slice(0, 40);

/** Public: published guides and live notices. Short browser cache; never the edge. */
export const publicContentRoutes = Router();
publicContentRoutes.use((_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=60");
  next();
});
publicContentRoutes.get("/articles", handle(async (_req, res) => sendOk(res, await contentService.publishedArticles())));
publicContentRoutes.get("/notices", handle(async (_req, res) => sendOk(res, await contentService.activeNotices())));

/** Administrators: the editor. */
export const adminContentRoutes = Router();
adminContentRoutes.use(...requireStaff("ADMIN"));
adminContentRoutes.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

adminContentRoutes.get("/articles", handle(async (_req, res) => sendOk(res, await contentService.articles())));
adminContentRoutes.post("/articles", validateBody(createArticleSchema), handle(async (req, res) => sendOk(res, await contentService.createArticle(req.body, actor(req)), "Draft saved.", 201)));
adminContentRoutes.post("/articles/import", validateBody(importSchema), handle(async (req, res) => {
  const result = await contentService.importBuiltIns(req.body.articles, actor(req));
  sendOk(res, result, result.imported ? `${result.imported} built-in guide(s) are now editable.` : "The built-in guides were already imported.");
}));
adminContentRoutes.get("/articles/:id", handle(async (req, res) => sendOk(res, await contentService.article(id(req)))));
adminContentRoutes.patch("/articles/:id", validateBody(updateArticleSchema), handle(async (req, res) => sendOk(res, await contentService.updateArticle(id(req), req.body, actor(req)), "Saved.")));
for (const state of ["publish", "unpublish", "archive", "restore"] as const) {
  adminContentRoutes.post(`/articles/:id/${state}`, handle(async (req, res) => {
    const messages = { publish: "Published to the library.", unpublish: "Taken off the library; kept as a draft.", archive: "Archived.", restore: "Restored as a draft." };
    sendOk(res, await contentService.setArticleState(id(req), state, actor(req)), messages[state]);
  }));
}

adminContentRoutes.get("/notices", handle(async (_req, res) => sendOk(res, await contentService.notices())));
adminContentRoutes.post("/notices", validateBody(createNoticeSchema), handle(async (req, res) => sendOk(res, await contentService.createNotice(req.body, actor(req)), "Notice saved.", 201)));
adminContentRoutes.patch("/notices/:id", validateBody(updateNoticeSchema), handle(async (req, res) => sendOk(res, await contentService.updateNotice(id(req), req.body, actor(req)), "Notice saved.")));
