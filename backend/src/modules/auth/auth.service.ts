import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";
import { env } from "@/config/env";
import { audit } from "@/lib/audit";
import { hashCode, hashToken, randomCode, randomToken } from "@/lib/crypto";
import { AppError } from "@/lib/http";
import { mailTemplates, sendMail } from "@/lib/mailer";
import { authRepository } from "@/modules/auth/auth.repository";
import type { LoginInput, RegisterInput } from "@/modules/auth/auth.schema";

/**
 * Bcrypt work factor.
 *
 * 12 is the current sensible balance: roughly a quarter-second per hash on
 * commodity hardware, which is negligible on a login and expensive across a
 * stolen table.
 */
export const BCRYPT_ROUNDS = 12;
const VERIFICATION_LINK_TTL_MS = 24 * 60 * 60 * 1000;
/* Short, because six digits is a small space: the code only has to survive the
   minute between the email arriving and it being typed. */
const VERIFICATION_CODE_TTL_MS = 30 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

/** What a caller is allowed to see about a user — never the hash. */
export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: User["role"];
  emailVerified: boolean;
  phone: string | null;
  organisation: string | null;
  createdAt: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    emailVerified: user.emailVerified !== null,
    phone: user.phone,
    organisation: user.organisation,
    createdAt: user.createdAt.toISOString(),
  };
}

export function issueAccessToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    /* Cast: jsonwebtoken types the span narrowly, the value is validated as a
       duration string by the env schema. */
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
}

/**
 * Only where there is no mail transport and this is not production — local
 * development — is the code handed back in the response, so the journey can be
 * walked end to end without an inbox. Anywhere mail can actually be sent, the
 * code travels by mail and nowhere else.
 */
const EXPOSE_DEV_CODES = !env.isProduction && !env.RESEND_API_KEY;

/**
 * FR2 — sends a fresh code and link.
 *
 * Both, in one message: the code is the fast path on the device the person
 * signed up on, and the link is the path that works when they open the email
 * on their phone instead.
 */
async function sendVerification(user: User): Promise<string> {
  const token = randomToken();
  const code = randomCode();

  await authRepository.replaceVerification(
    user.id,
    { hash: hashToken(token), expiresAt: new Date(Date.now() + VERIFICATION_LINK_TTL_MS) },
    { hash: hashCode(user.id, code), expiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS) },
  );

  const link = `${env.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  await sendMail({ to: user.email, ...mailTemplates.verify(firstName(user.fullName), code, link) });

  return code;
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export interface Session {
  user: PublicUser;
  token: string;
  /** Development only — see EXPOSE_DEV_CODES. */
  devCode?: string;
}

export const authService = {
  /**
   * FR1, FR2, FR3.
   *
   * Registration signs the person in. They came here to do something — most
   * often to report a scam they have just checked — and a sign-in screen
   * between creating a password and using it is a step that asks them to
   * prove what they did four seconds ago.
   */
  async register(input: RegisterInput, ipAddress?: string): Promise<Session> {
    const existing = await authRepository.findByEmail(input.email);

    if (existing) {
      /* FR3. The address is already known to be registered by whoever is
         holding it, so saying so here reveals nothing they could not confirm
         from the sign-in form anyway. */
      throw new AppError(409, "An account already exists for that email address.", [
        { field: "email", message: "Already registered. Sign in instead, or reset your password." },
      ]);
    }

    let user: User;

    try {
      user = await authRepository.create({
        email: input.email,
        passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
        fullName: input.fullName,
        organisation: input.organisation || null,
        phone: input.phone || null,
        notificationPrefs: { create: {} },
      });
    } catch (error) {
      /* Two requests for one address can both pass the lookup above; the
         unique index decides, and the loser gets the same answer. */
      if ((error as { code?: string }).code === "P2002") {
        throw new AppError(409, "An account already exists for that email address.", [
          { field: "email", message: "Already registered." },
        ]);
      }
      throw error;
    }

    const code = await sendVerification(user);
    await audit({ userId: user.id, action: "account.registered", entityType: "User", entityId: user.id, ipAddress });

    return {
      user: toPublicUser(user),
      token: issueAccessToken(user),
      ...(EXPOSE_DEV_CODES ? { devCode: code } : {}),
    };
  },

  /** FR2 — by link, from any device, signed in or not. */
  async verifyEmail(token: string): Promise<PublicUser> {
    const record = await authRepository.findUsableVerificationToken(hashToken(token));

    if (!record) {
      throw new AppError(400, "That verification link is invalid or has expired. Sign in to get a new one.");
    }

    await authRepository.consumeVerification(record.userId);
    const user = await authRepository.findById(record.userId);

    if (!user) {
      throw new AppError(404, "That account no longer exists.");
    }

    await audit({ userId: user.id, action: "account.verified", entityType: "User", entityId: user.id });
    return toPublicUser(user);
  },

  /** FR2 — by code, on the device that is signed in. */
  async verifyCode(userId: string, code: string): Promise<PublicUser> {
    const user = await authRepository.findById(userId);

    if (!user) {
      throw new AppError(404, "That account no longer exists.");
    }

    if (user.emailVerified) {
      return toPublicUser(user);
    }

    const record = await authRepository.findUsableVerificationToken(hashCode(userId, code));

    if (!record || record.userId !== userId) {
      throw new AppError(400, "That code is not right, or it has expired.", [
        { field: "code", message: "Check the six digits, or send a new code." },
      ]);
    }

    await authRepository.consumeVerification(userId);
    await audit({ userId, action: "account.verified", entityType: "User", entityId: userId });

    return toPublicUser({ ...user, emailVerified: new Date() });
  },

  async resendVerification(userId: string): Promise<{ user: PublicUser; devCode?: string }> {
    const user = await authRepository.findById(userId);

    if (!user) {
      throw new AppError(404, "That account no longer exists.");
    }

    if (user.emailVerified) {
      return { user: toPublicUser(user) };
    }

    const code = await sendVerification(user);
    return { user: toPublicUser(user), ...(EXPOSE_DEV_CODES ? { devCode: code } : {}) };
  },

  /** FR4. */
  async login(input: LoginInput, ipAddress?: string): Promise<Session> {
    const user = await authRepository.findByEmail(input.email);

    /*
     * A wrong address and a wrong password answer identically, and the hash is
     * compared even when no user was found. Both matter: differing messages
     * turn the form into an account-existence oracle, and skipping the compare
     * on a miss leaks the same thing through response timing.
     */
    const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
    const matches = await bcrypt.compare(input.password, hash);

    if (!user || !matches) {
      throw new AppError(401, "That email address or password is not correct.");
    }

    await authRepository.markSignedIn(user.id);
    await audit({ userId: user.id, action: "account.signed_in", entityType: "User", entityId: user.id, ipAddress });

    return { user: toPublicUser(user), token: issueAccessToken(user) };
  },

  /**
   * FR6 — always answers the same way.
   *
   * Whether or not the address has an account, the caller hears "if it does,
   * we have sent a link". Anything else turns this form into a way to test
   * which addresses are registered.
   */
  async forgotPassword(email: string, ipAddress?: string): Promise<void> {
    const user = await authRepository.findByEmail(email);

    if (!user) {
      return;
    }

    const token = randomToken();
    await authRepository.replacePasswordReset(user.id, hashToken(token), new Date(Date.now() + PASSWORD_RESET_TTL_MS));

    const link = `${env.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await sendMail({ to: user.email, ...mailTemplates.passwordReset(firstName(user.fullName), link) });
    await audit({ userId: user.id, action: "account.password_reset_requested", entityType: "User", entityId: user.id, ipAddress });
  },

  /**
   * FR6 — sets the new password and signs the person straight in.
   *
   * They have just proved control of the inbox and chosen a password; making
   * them type it again on a sign-in form is a step with no security value.
   */
  async resetPassword(token: string, password: string, ipAddress?: string): Promise<Session> {
    const record = await authRepository.findUsablePasswordReset(hashToken(token));
    const user = record ? await authRepository.findById(record.userId) : null;

    if (!record || !user) {
      throw new AppError(400, "That reset link is invalid or has expired. Ask for a new one.");
    }

    const spent = await authRepository.consumePasswordReset(
      record.id,
      user.id,
      await bcrypt.hash(password, BCRYPT_ROUNDS),
      user.emailVerified === null,
    );

    if (!spent) {
      throw new AppError(400, "That reset link has already been used. Ask for a new one.");
    }

    await audit({ userId: user.id, action: "account.password_reset", entityType: "User", entityId: user.id, ipAddress });

    const updated = (await authRepository.findById(user.id)) ?? user;
    return { user: toPublicUser(updated), token: issueAccessToken(updated) };
  },

  /** FR7. */
  async profile(userId: string): Promise<PublicUser> {
    const user = await authRepository.findById(userId);

    /* 401 rather than 404: a token that outlived its account is a session
       that has ended, and that is how the client should treat it. */
    if (!user) {
      throw new AppError(401, "That account no longer exists. Sign in again.");
    }

    return toPublicUser(user);
  },
};
