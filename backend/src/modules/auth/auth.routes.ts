import { Router } from "express";
import { codeLimiter, credentialLimiter, resendLimiter } from "@/lib/limits";
import { requireAuth } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { authController } from "@/modules/auth/auth.controller";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyCodeSchema,
  verifyEmailSchema,
} from "@/modules/auth/auth.schema";

export const authRoutes = Router();

authRoutes.post("/register", credentialLimiter, validateBody(registerSchema), authController.register);
authRoutes.post("/login", credentialLimiter, validateBody(loginSchema), authController.login);
authRoutes.post("/verify-email", credentialLimiter, validateBody(verifyEmailSchema), authController.verifyEmail);
authRoutes.post("/verify-email/code", requireAuth, codeLimiter, validateBody(verifyCodeSchema), authController.verifyCode);
authRoutes.post("/verify-email/resend", requireAuth, resendLimiter, authController.resendVerification);
authRoutes.post("/forgot-password", credentialLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
authRoutes.post("/reset-password", credentialLimiter, validateBody(resetPasswordSchema), authController.resetPassword);
authRoutes.post("/logout", authController.logout);
authRoutes.get("/me", requireAuth, authController.me);
