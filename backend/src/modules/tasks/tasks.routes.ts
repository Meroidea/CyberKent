import { Router, type NextFunction, type Request, type Response } from "express";
import { AppError, sendOk } from "@/lib/http";
import { parseQuery, validateBody } from "@/middleware/validate";
import type { Actor } from "@/modules/council/council.service";
import { commentSchema, createTaskSchema, tasksQuerySchema, updateTaskSchema } from "@/modules/tasks/tasks.schema";
import { tasksService } from "@/modules/tasks/tasks.service";

/** The task tracker. Mounted inside the council routes, so staff-only already. */
export const tasksRoutes = Router();

const handle = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};

const actor = (req: Request): Actor => ({ id: req.user!.id, role: req.user!.role as Actor["role"], ipAddress: req.ip });

function reference(req: Request): string {
  const value = String(req.params.reference ?? "").toUpperCase();
  if (!/^TASK-\d{1,8}$/.test(value)) throw new AppError(404, "There is no task with that reference.");
  return value;
}

tasksRoutes.get("/", handle(async (req, res) => {
  sendOk(res, await tasksService.list(parseQuery(tasksQuerySchema, req), actor(req)));
}));

tasksRoutes.get("/suggestions", handle(async (_req, res) => {
  sendOk(res, await tasksService.suggestions());
}));

tasksRoutes.post("/", validateBody(createTaskSchema), handle(async (req, res) => {
  const task = await tasksService.create(req.body, actor(req));
  sendOk(res, { task }, `${task.reference} created.`, 201);
}));

tasksRoutes.get("/:reference", handle(async (req, res) => {
  sendOk(res, await tasksService.get(reference(req)));
}));

tasksRoutes.patch("/:reference", validateBody(updateTaskSchema), handle(async (req, res) => {
  sendOk(res, { task: await tasksService.update(reference(req), req.body, actor(req)) }, "Task saved.");
}));

tasksRoutes.delete("/:reference", handle(async (req, res) => {
  await tasksService.remove(reference(req), actor(req));
  sendOk(res, null, "Task deleted.");
}));

tasksRoutes.post("/:reference/comments", validateBody(commentSchema), handle(async (req, res) => {
  sendOk(res, { comment: await tasksService.comment(reference(req), req.body.body, actor(req)) }, "Comment added.", 201);
}));
