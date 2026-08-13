import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";
import { env } from "@/config/env";
import { AppError } from "@/lib/http";
import { authRepository } from "@/modules/auth/auth.repository";
import type { LoginInput, RegisterInput } from "@/modules/auth/auth.schema";

/**
 * Bcrypt work factor.
 *
 * 12 is the current sensible balance: roughly a quarter-second per hash on
 * commodity hardware, which is negligible on a login and expensive across a
 * stolen table.
 */
const BCRYPT_ROUNDS = 12;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** What a caller is allowed to see about a user — never the hash. */
export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: User["role"];
  emailVerified: boolean;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    emailVerified: user.emailVerified !== null,
  };
}

/** Tokens are stored as digests so a leaked table yields nothing usable. */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function issueAccessToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    /* Cast: jsonwebtoken types the span narrowly, the value is validated as a
       duration string by the env schema. */
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
}

export const authService = {
  /** FR1, FR2, FR3. */
  async register(input: RegisterInput): Promise<{ user: PublicUser; verificationToken: string }> {
    const existing = await authRepository.findByEmail(input.email);

    if (existing) {
      /* FR3. The address is already known to be registered by whoever is
         holding it, so saying so here reveals nothing they could not confirm
         from the sign-in form anyway. */
      throw new AppError(409, "An account already exists for that email address.", [
        { field: "email", message: "Already registered." },
      ]);
    }

    const user = await authRepository.create({
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      fullName: input.fullName,
      organisation: input.organisation ?? null,
      phone: input.phone ?? null,
      notificationPrefs: { create: {} },
    });

    /* Returned to the caller only until email delivery exists; at that point
       this becomes a link and stops crossing the API boundary. */
    const token = crypto.randomBytes(32).toString("base64url");

    await authRepository.createVerificationToken(
      user.id,
      hashToken(token),
      new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    );

    return { user: toPublicUser(user), verificationToken: token };
  },

  /** FR2. */
  async verifyEmail(token: string): Promise<PublicUser> {
    const record = await authRepository.findUsableVerificationToken(hashToken(token));

    if (!record) {
      throw new AppError(400, "That verification link is invalid or has expired.");
    }

    await authRepository.consumeVerification(record.id, record.userId);
    const user = await authRepository.findById(record.userId);

    if (!user) {
      throw new AppError(404, "That account no longer exists.");
    }

    return toPublicUser(user);
  },

  /** FR4. */
  async login(input: LoginInput): Promise<{ user: PublicUser; token: string }> {
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

    return { user: toPublicUser(user), token: issueAccessToken(user) };
  },

  /** FR7. */
  async profile(userId: string): Promise<PublicUser> {
    const user = await authRepository.findById(userId);

    if (!user) {
      throw new AppError(404, "That account no longer exists.");
    }

    return toPublicUser(user);
  },
};
