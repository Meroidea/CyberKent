import { z } from "zod";
import { passwordSchema } from "@/modules/auth/auth.schema";

/* An emptied optional field is a request to clear it, not to keep it. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional();

/** FR7. */
export const profileSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your name.").max(120).optional(),
    phone: optionalText(40),
    organisation: optionalText(160),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(200),
    newPassword: passwordSchema,
  })
  .strict()
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ["newPassword"],
    message: "Choose a password you have not used here before.",
  });

/** FR11. */
export const preferencesSchema = z
  .object({
    emailOnStatus: z.boolean(),
    emailOnAlerts: z.boolean(),
    emailOnRequest: z.boolean(),
  })
  .strict();

export const markReadSchema = z
  .object({ ids: z.array(z.string().min(1).max(40)).max(100).optional() })
  .strict();

/** FR12. */
export const deleteAccountSchema = z
  .object({
    password: z.string().min(1, "Enter your password to confirm.").max(200),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();
