import { Router, type Request } from "express";
import { AppError, sendOk } from "@/lib/http";
import { credentialLimiter } from "@/lib/limits";
import { requireAuth } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import {
  changePasswordSchema,
  deleteAccountSchema,
  markReadSchema,
  preferencesSchema,
  profileSchema,
} from "@/modules/account/account.schema";
import { accountService } from "@/modules/account/account.service";

/** Module 2 — everything a signed-in person manages about themselves. */
export const accountRoutes = Router();

accountRoutes.use(requireAuth);

function me(req: Request): string {
  if (!req.user) {
    throw new AppError(401, "Sign in to continue.");
  }
  return req.user.id;
}

accountRoutes.get("/overview", async (req, res, next) => {
  try {
    sendOk(res, await accountService.overview(me(req)));
  } catch (error) {
    next(error);
  }
});

accountRoutes.patch("/profile", validateBody(profileSchema), async (req, res, next) => {
  try {
    sendOk(res, { user: await accountService.updateProfile(me(req), req.body) }, "Profile saved.");
  } catch (error) {
    next(error);
  }
});

accountRoutes.post("/password", credentialLimiter, validateBody(changePasswordSchema), async (req, res, next) => {
  try {
    const result = await accountService.changePassword(me(req), req.body.currentPassword, req.body.newPassword, req.ip);
    sendOk(res, result, "Password changed.");
  } catch (error) {
    next(error);
  }
});

accountRoutes.get("/preferences", async (req, res, next) => {
  try {
    sendOk(res, { preferences: await accountService.preferences(me(req)) });
  } catch (error) {
    next(error);
  }
});

accountRoutes.put("/preferences", validateBody(preferencesSchema), async (req, res, next) => {
  try {
    sendOk(res, { preferences: await accountService.setPreferences(me(req), req.body) }, "Preferences saved.");
  } catch (error) {
    next(error);
  }
});

accountRoutes.get("/notifications", async (req, res, next) => {
  try {
    sendOk(res, await accountService.notifications(me(req)));
  } catch (error) {
    next(error);
  }
});

accountRoutes.post("/notifications/read", validateBody(markReadSchema), async (req, res, next) => {
  try {
    sendOk(res, await accountService.markRead(me(req), req.body.ids));
  } catch (error) {
    next(error);
  }
});

accountRoutes.post("/delete", credentialLimiter, validateBody(deleteAccountSchema), async (req, res, next) => {
  try {
    await accountService.deleteAccount(me(req), req.body.password, req.body.reason, req.ip);
    sendOk(res, { deleted: true }, "Your account has been deleted.");
  } catch (error) {
    next(error);
  }
});
