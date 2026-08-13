import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { AppError } from "@/lib/http";
import type { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/** FR4 — establishes who is calling. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "Sign in to continue."));
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as AuthenticatedUser;
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    /* Expired and forged tokens are answered identically: distinguishing them
       tells an attacker which half of the problem they have already solved. */
    next(new AppError(401, "Your session has expired. Sign in again."));
  }
}

/**
 * FR10 — establishes whether they may do this.
 *
 * Separate from `requireAuth` because authentication and authorisation are
 * different questions (Avoid.md §6), and collapsing them is how an endpoint
 * ends up checking that someone is signed in and forgetting to check who.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, "Sign in to continue."));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "You do not have access to this."));
      return;
    }

    next();
  };
}
