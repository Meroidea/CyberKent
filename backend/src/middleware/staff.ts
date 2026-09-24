import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { AppError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/auth";

/** The roles that work inside Council's console. */
export const STAFF_ROLES: Role[] = ["OFFICER", "ADMIN"];

/**
 * FR10, Rule 6.3 — Council-side authorisation, answered from the database.
 *
 * `requireRole` trusts the role inside the access token, which is right for a
 * resident's own screens and wrong here. A token lives for hours, and the
 * point of demoting or suspending an officer is that they stop reading victim
 * narratives now, not when their token happens to expire. So every staff
 * request re-reads the account: one indexed primary-key lookup is the price of
 * a revocation that takes effect on the next click.
 *
 * The fresh role replaces the token's on `req.user`, so a handler downstream
 * that branches on role is branching on the truth.
 */
export function requireStaff(...roles: Role[]) {
  const allowed = roles.length > 0 ? roles : STAFF_ROLES;

  return [
    requireAuth,
    async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      try {
        const account = await prisma.user.findFirst({
          where: { id: req.user!.id, deletedAt: null },
          select: { role: true },
        });

        if (!account) {
          next(new AppError(401, "That account no longer exists. Sign in again."));
          return;
        }

        if (!allowed.includes(account.role)) {
          next(new AppError(403, allowed.includes("OFFICER") ? "This part of the service is for Council staff." : "Only a Council administrator can do this."));
          return;
        }

        req.user!.role = account.role;
        next();
      } catch (error) {
        next(error);
      }
    },
  ];
}
