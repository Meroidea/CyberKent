import { z } from "zod";

const status = z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]);
const priority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const reportReference = z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{4,32}$/, "Enter a report reference such as HCC-2409-114.");
const labels = z.array(z.string().trim().min(1).max(24)).max(6);
const dueAt = z.coerce.date();

export const tasksQuerySchema = z
  .object({
    view: z.enum(["all", "mine", "unassigned", "overdue", "created"]).default("all"),
    status: status.optional(),
    priority: priority.optional(),
    assigneeId: z.string().trim().max(40).optional(),
    q: z.string().trim().max(120).optional(),
    includeDone: z.enum(["true", "false"]).default("true"),
  })
  .strict();

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(3, "Give the task a short title.").max(140),
    description: z.string().trim().max(4000).optional(),
    status: status.optional(),
    priority: priority.default("MEDIUM"),
    dueAt: dueAt.optional(),
    assigneeId: z.string().trim().max(40).optional(),
    labels: labels.default([]),
    reportReference: reportReference.optional(),
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(3).max(140).optional(),
    description: z.string().trim().max(4000).nullable().optional(),
    status: status.optional(),
    priority: priority.optional(),
    dueAt: dueAt.nullable().optional(),
    assigneeId: z.string().trim().max(40).nullable().optional(),
    labels: labels.optional(),
    reportReference: reportReference.nullable().optional(),
    position: z.number().finite().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Change something.");

export const commentSchema = z.object({ body: z.string().trim().min(1, "Write something.").max(2000) }).strict();
