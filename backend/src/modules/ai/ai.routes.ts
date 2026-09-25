import express, { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "@/config/env";
import { optionalAuth } from "@/middleware/auth";
import { requireStaff } from "@/middleware/staff";
import { validateBody } from "@/middleware/validate";
import { aiController } from "@/modules/ai/ai.controller";
import { analyseImageSchema, analyseTextSchema, assistantSchema } from "@/modules/ai/ai.schema";

/**
 * The AI Gateway — the single entry point to AI capability (System
 * Architecture: "Express → AI Gateway → FastAPI → AI modules").
 *
 * Open to anonymous callers, because checking a message never requires an
 * account (FR85), and therefore rate-limited per client far more tightly than
 * the rest of the API: every call here is paid for.
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.AI_RATE_LIMIT,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "You have used the AI features a lot in a short time. Try again in a few minutes.",
    data: null,
    errors: [],
  },
});

/* The app-wide body limit is 256 kB. Only the image route needs more, so only
   the image route gets it. */
const imageBody = express.json({ limit: "7mb" });

export const aiRoutes = Router();

aiRoutes.get("/status", aiController.status);
aiRoutes.post("/analyse-text", aiLimiter, optionalAuth, validateBody(analyseTextSchema), aiController.analyseText);
aiRoutes.post("/analyse-image", aiLimiter, imageBody, optionalAuth, validateBody(analyseImageSchema), aiController.analyseImage);
aiRoutes.post("/assistant", aiLimiter, optionalAuth, validateBody(assistantSchema), aiController.chat);
aiRoutes.get("/usage", ...requireStaff("ADMIN"), aiController.usage);
