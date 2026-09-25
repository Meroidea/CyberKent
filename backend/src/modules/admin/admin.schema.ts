import { z } from "zod";

const page = z.coerce.number().int().min(1).max(1000).default(1);

/** FR67. */
export const usersQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    role: z.enum(["RESIDENT", "BUSINESS", "OFFICER", "ADMIN", "SUPER_ADMIN"]).optional(),
    status: z.enum(["active", "suspended", "all"]).default("active"),
    page,
    pageSize: z.coerce.number().int().min(5).max(100).default(25),
  })
  .strict();

/** FR68. */
export const roleSchema = z.object({ role: z.enum(["RESIDENT", "BUSINESS", "OFFICER", "ADMIN", "SUPER_ADMIN"]) }).strict();

const optionalText = (max: number) => z.string().trim().max(max).optional();

/** People management — a new council member. */
export const inviteSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter their full name.").max(120),
    email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
    role: z.enum(["OFFICER", "ADMIN", "SUPER_ADMIN"]),
    jobTitle: optionalText(80),
    department: optionalText(80),
    phone: optionalText(30),
  })
  .strict();

export const profileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    jobTitle: z.string().trim().max(80).nullable().optional(),
    department: z.string().trim().max(80).nullable().optional(),
    phone: z.string().trim().max(30).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Change something.");

/** FR67 — suspension is reversible and always says why. */
export const suspendSchema = z.object({ reason: z.string().trim().min(5, "Record why the account is being suspended.").max(500) }).strict();

const categoryName = z.string().trim().min(3, "Give the category a name.").max(60);
const categoryDescription = z.string().trim().max(240);

/** FR69. */
export const createCategorySchema = z.object({ name: categoryName, description: categoryDescription.optional() }).strict();

export const updateCategorySchema = z
  .object({ name: categoryName.optional(), description: categoryDescription.nullable().optional(), archived: z.boolean().optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Change something.");

/** FR72. */
export const auditQuerySchema = z
  .object({
    action: z.string().trim().max(60).regex(/^[A-Za-z_.]*$/, "Actions are words separated by dots.").optional(),
    entityType: z.string().trim().max(40).regex(/^[A-Za-z]*$/).optional(),
    userId: z.string().trim().max(40).optional(),
    days: z.coerce.number().int().min(1).max(730).default(30),
    page,
    pageSize: z.coerce.number().int().min(10).max(100).default(50),
  })
  .strict();

/** FR71. */
export const exportQuerySchema = z
  .object({ days: z.coerce.number().int().refine((n) => [30, 90, 365, 730].includes(n), "Choose 30, 90, 365 or 730 days.").default(365) })
  .strict();
