import type { Request } from "express";
import rateLimit from "express-rate-limit";

/**
 * Rate limiters shared by more than one module.
 *
 * Two kinds. Per-address limiters slow anyone hammering a credential form.
 * Per-account limiters exist for the actions an attacker would run against one
 * specific account from many addresses — guessing a six-digit code, or making
 * the service send someone forty emails — and so must be keyed on the account,
 * which is why they run after `requireAuth`.
 */
function limiter(windowMs: number, limit: number, message: string, perAccount = false) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    ...(perAccount ? { keyGenerator: (req: Request) => `user:${req.user?.id ?? "anonymous"}` } : {}),
    message: { success: false, message, data: null, errors: [] },
  });
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

/**
 * Rule 6.4 lists brute force among the attacks to defend against, and the
 * general limiter is set for ordinary browsing — far too loose to slow a
 * password-guessing run.
 */
export const credentialLimiter = limiter(FIFTEEN_MINUTES, 10, "Too many attempts. Try again in a few minutes.");

/* Five guesses per account per quarter hour puts a six-digit code years out of
   reach, and a new code retires the old one besides. */
export const codeLimiter = limiter(FIFTEEN_MINUTES, 5, "Too many codes tried. Send a new code, or wait a few minutes.", true);

export const resendLimiter = limiter(FIFTEEN_MINUTES, 3, "We have sent several codes already. Check your spam folder, or wait a few minutes.", true);

/* Generous for a person, tight for a script flooding the review queue. */
export const reportLimiter = limiter(HOUR, 10, "You have sent a lot of reports in a short time. Try again later, or call Council.", true);
