import type { NextFunction, Request, Response } from "express";
import { AppError, sendOk } from "@/lib/http";
import { authService } from "@/modules/auth/auth.service";

/**
 * Controllers receive, delegate and respond — nothing else (Rule 2.3).
 *
 * There is no business logic in this file by design; if a rule about accounts
 * needs to change, it changes in the service and every caller inherits it.
 */

/** `requireAuth` has run on every route that calls this. */
function callerId(req: Request): string {
  if (!req.user) {
    throw new AppError(401, "Sign in to continue.");
  }
  return req.user.id;
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body, req.ip);
      sendOk(res, result, "Account created. We have emailed you a code to confirm your address.", 201);
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

  async verifyCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.verifyCode(callerId(req), req.body.code);
      sendOk(res, { user }, "Email verified.");
    } catch (error) {
      next(error);
    }
  },

  async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resendVerification(callerId(req));
      sendOk(res, result, result.user.emailVerified ? "Your email is already verified." : "A new code is on its way.");
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body, req.ip);
      sendOk(res, result, "Signed in.");
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.forgotPassword(req.body.email, req.ip);
      sendOk(res, { sent: true }, "If that address has an account, a reset link is on its way.");
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password, req.ip);
      sendOk(res, result, "Password changed. You are signed in.");
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
    sendOk(res, { signedOut: true }, "Signed out.");
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.profile(callerId(req));
      sendOk(res, { user }, "OK");
    } catch (error) {
      next(error);
    }
  },
};
