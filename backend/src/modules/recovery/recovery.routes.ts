import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { AppError, sendOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { CHECKLISTS } from "@/modules/recovery/recovery.content";

/**
 * Module 10 — recovery checklists (FR58), recommendations (FR59) and progress
 * (FR60).
 *
 * Checklists are public; progress needs an account because it is the one
 * thing here that is about a person. A guest's ticks stay on their device.
 */
export const recoveryRoutes = Router();

const handle = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};

let synced: Promise<void> | null = null;

/**
 * Brings the database's checklists in line with `recovery.content`, once per
 * process. Upserts keyed on slug and position, so it is safe to run on every
 * cold start and on every deployment; a step removed from the content is
 * removed from the database only if nobody has ticked it (their progress is
 * theirs, and the step it points at stays so it still means something).
 */
function ensure(): Promise<void> {
  synced ??= (async () => {
    for (const content of CHECKLISTS) {
      const checklist = await prisma.recoveryChecklist.upsert({
        where: { slug: content.slug },
        update: { title: content.title, situation: content.situation },
        create: { slug: content.slug, title: content.title, situation: content.situation },
      });

      for (const [index, [title, detail]] of content.steps.entries()) {
        await prisma.recoveryStep.upsert({
          where: { checklistId_position: { checklistId: checklist.id, position: index + 1 } },
          update: { title, detail },
          create: { checklistId: checklist.id, position: index + 1, title, detail },
        });
      }

      await prisma.recoveryStep.deleteMany({ where: { checklistId: checklist.id, position: { gt: content.steps.length }, progress: { none: {} } } });
    }
  })().catch((error: unknown) => {
    synced = null;
    throw error;
  });
  return synced;
}

recoveryRoutes.get("/", handle(async (_req, res) => {
  await ensure();
  const rows = await prisma.recoveryChecklist.findMany({
    where: { slug: { in: CHECKLISTS.map((c) => c.slug) } },
    select: { id: true, slug: true, title: true, situation: true, steps: { select: { id: true, position: true, title: true, detail: true }, orderBy: { position: "asc" } } },
  });

  const order = new Map(CHECKLISTS.map((c, i) => [c.slug, i]));
  const categories = new Map(CHECKLISTS.map((c) => [c.slug, c.categories]));
  const checklists = rows
    .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0))
    .map((row) => ({ ...row, steps: row.steps.slice(0, CHECKLISTS.find((c) => c.slug === row.slug)!.steps.length), categories: categories.get(row.slug) ?? [] }));

  res.setHeader("Cache-Control", "public, max-age=300");
  sendOk(res, { checklists });
}));

recoveryRoutes.get("/progress", requireAuth, handle(async (req, res) => {
  const rows = await prisma.recoveryProgress.findMany({ where: { userId: req.user!.id }, select: { stepId: true, completedAt: true } });
  sendOk(res, { completed: rows.map((row) => ({ stepId: row.stepId, completedAt: row.completedAt.toISOString() })) });
}));

const progressSchema = z.object({ stepIds: z.array(z.string().trim().min(1).max(40)).max(200), done: z.boolean() }).strict();

/** FR60 — tick or untick; several at once, so a guest's ticks can be carried over on sign-in. */
recoveryRoutes.put("/progress", requireAuth, validateBody(progressSchema), handle(async (req, res) => {
  const userId = req.user!.id;
  const { stepIds, done } = req.body as z.infer<typeof progressSchema>;

  const valid = await prisma.recoveryStep.findMany({ where: { id: { in: stepIds } }, select: { id: true } });
  if (valid.length !== new Set(stepIds).size) throw new AppError(422, "One of those steps does not exist.");

  if (done) {
    await prisma.recoveryProgress.createMany({ data: valid.map((step) => ({ userId, stepId: step.id })), skipDuplicates: true });
  } else {
    await prisma.recoveryProgress.deleteMany({ where: { userId, stepId: { in: stepIds } } });
  }

  /* That a checklist is being worked, not which steps — the steps together
     say what happened to someone. */
  if (done) await audit({ userId, action: "recovery.progress", entityType: "RecoveryProgress", metadata: { steps: stepIds.length } });

  const rows = await prisma.recoveryProgress.findMany({ where: { userId }, select: { stepId: true, completedAt: true } });
  sendOk(res, { completed: rows.map((row) => ({ stepId: row.stepId, completedAt: row.completedAt.toISOString() })) });
}));
