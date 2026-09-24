import { Router, type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { sendOk } from "@/lib/http";
import { optionalAuth, requireAuth } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { subscriptionsService } from "@/modules/subscriptions/subscriptions.service";

const handle = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};

const subscribeSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter an email address.").max(254),
    scope: z.enum(["ALL", "CATEGORY", "SUBURB"]),
    categoryId: z.string().trim().max(40).optional(),
    suburbId: z.string().trim().max(40).optional(),
  })
  .strict();

const tokenSchema = z.object({ token: z.string().trim().min(10).max(2_000) }).strict();

/* Each subscription can send an email; this is what stops the form from
   being used to mail-bomb someone else's inbox. */
const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many subscriptions from here in a short time. Try again later.", data: null, errors: [] },
});

/** Module 11 — FR64–FR66. */
export const subscriptionRoutes = Router();

subscriptionRoutes.post("/", subscribeLimiter, optionalAuth, validateBody(subscribeSchema), handle(async (req, res) => {
  const result = await subscriptionsService.subscribe(req.body, req.user, req.ip);
  const message = {
    confirmed: "You are subscribed.",
    pending: "Check your inbox — confirm the link we sent to start receiving alerts.",
    unavailable: "Saved, but email is not switched on for this site yet, so we cannot confirm your address. Sign in to subscribe with your account's address instead.",
  }[result.status];
  sendOk(res, result, message, 201);
}));

subscriptionRoutes.post("/confirm", validateBody(tokenSchema), handle(async (req, res) => {
  sendOk(res, { subscription: await subscriptionsService.confirm(req.body.token) }, "Subscription confirmed.");
}));

subscriptionRoutes.post("/unsubscribe", validateBody(tokenSchema), handle(async (req, res) => {
  sendOk(res, { subscription: await subscriptionsService.unsubscribe(req.body.token) }, "You are unsubscribed.");
}));

subscriptionRoutes.get("/mine", requireAuth, handle(async (req, res) => {
  sendOk(res, { subscriptions: await subscriptionsService.mine(req.user!.id) });
}));

subscriptionRoutes.delete("/mine/:id", requireAuth, handle(async (req, res) => {
  sendOk(res, { subscriptions: await subscriptionsService.cancelMine(req.user!.id, String(req.params.id ?? "").slice(0, 40)) }, "Unsubscribed.");
}));
