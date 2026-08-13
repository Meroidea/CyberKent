import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { authController } from "@/modules/auth/auth.controller";
import { loginSchema, registerSchema, verifyEmailSchema } from "@/modules/auth/auth.schema";

/**
 * Tighter limit on credential endpoints than the API default.
 *
 * Rule 6.4 lists brute force among the attacks to defend against, and the
 * general limiter is set for ordinary browsing — far too loose to slow a
 * password-guessing run.
 */
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Try again in a few minutes.",
    data: null,
    errors: [],
  },
});

export const authRoutes = Router();

authRoutes.post("/register", credentialLimiter, validateBody(registerSchema), authController.register);
authRoutes.post("/login", credentialLimiter, validateBody(loginSchema), authController.login);
authRoutes.post("/verify-email", credentialLimiter, validateBody(verifyEmailSchema), authController.verifyEmail);
authRoutes.post("/logout", authController.logout);
authRoutes.get("/me", requireAuth, authController.me);
