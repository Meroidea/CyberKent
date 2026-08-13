import type { NextFunction, Request, Response } from "express";
import { AppError, sendOk } from "@/lib/http";
import { authService } from "@/modules/auth/auth.service";

/**
 * Controllers receive, delegate and respond — nothing else (Rule 2.3).
 *
 * There is no business logic in this file by design; if a rule about accounts
 * needs to change, it changes in the service and every caller inherits it.
 */
export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      sendOk(res, result, "Account created. Check your email to verify it.", 201);
    } catch (error) {
      next(error);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.verifyEmail(req.body.token);
      sendOk(res, { user }, "Email verified.");
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      sendOk(res, result, "Signed in.");
    } catch (error) {
      next(error);
    }
  },

  /**
   * FR5. Access tokens are stateless, so the server has nothing to revoke; the
   * client discards the token. Endpoint exists so the client has one place to
   * call and so a future deny-list has somewhere to live.
   */
  async logout(_req: Request, res: Response): Promise<void> {
    sendOk(res, null, "Signed out.");
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, "Sign in to continue.");
      }

      const user = await authService.profile(req.user.id);
      sendOk(res, { user }, "OK");
    } catch (error) {
      next(error);
    }
  },
};
