import { z } from "zod";

/**
 * Password floor.
 *
 * Length is the requirement that actually resists offline cracking; composition
 * rules mostly produce `Password1!`. Twelve characters with no character-class
 * mandate follows current NIST guidance rather than the older convention.
 */
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(200, "That is longer than we can accept.");

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

export const registerSchema = z
  .object({
    email,
    password: passwordSchema,
    fullName: z.string().trim().min(2, "Enter your name.").max(120),
    organisation: z.string().trim().max(160).optional(),
    phone: z.string().trim().max(40).optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1, "Enter your password.").max(200),
  })
  .strict();

export const verifyEmailSchema = z.object({ token: z.string().min(10).max(200) }).strict();

export const verifyCodeSchema = z
  .object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the six digits from the email.") })
  .strict();

export const forgotPasswordSchema = z.object({ email }).strict();

export const resetPasswordSchema = z
  .object({ token: z.string().min(10).max(200), password: passwordSchema })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
