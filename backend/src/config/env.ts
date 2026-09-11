import "dotenv/config";
import { z } from "zod";

/**
 * Environment contract, validated once at startup.
 *
 * Rule 6.6 keeps secrets out of source, which means the process is only as
 * correct as the variables handed to it. Parsing them here turns a missing or
 * malformed value into an immediate, named failure rather than a
 * `undefined is not a string` somewhere inside a request months later.
 */
/* `KEY=` copied from .env.example arrives as "", which means "not set" rather
   than "set to nothing" — without this it fails the URL and length checks. */
const blankAsUnset = <T extends z.ZodTypeAny>(inner: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), inner);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  /* Long enough that a signature cannot be brute-forced offline. */
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("2h"),
  /* Comma-separated so more than one origin can be allowed in staging. */
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),

  /* The FastAPI AI service behind the AI Gateway (Rule 8.1). Optional in the
     sense that the API runs without it: AI features then answer "unavailable"
     and nothing else is affected (constraint C3). */
  AI_SERVICE_URL: z.string().url().default("http://127.0.0.1:8000"),
  AI_SERVICE_TOKEN: z.string().min(16).optional(),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000),
  /* Requests per client per 15 minutes. AI calls cost money per request, so
     they are limited far more tightly than ordinary browsing. */
  AI_RATE_LIMIT: z.coerce.number().int().positive().default(30),

  /* Transactional email (verification codes, password resets, report
     receipts). Without a key the mailer writes each message to the server log
     instead, which is what local development wants and what a misconfigured
     production deployment must not silently do — see lib/mailer. */
  RESEND_API_KEY: blankAsUnset(z.string().min(10).optional()),
  EMAIL_FROM: blankAsUnset(z.string().default("Hume CyberSafe <no-reply@cyberkent.local>")),
  /* Where links in emails point. Defaults to the first allowed origin. */
  PUBLIC_APP_URL: blankAsUnset(z.string().url().optional()),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  /* Names only. Printing values here would put the database password and the
     signing secret into the deployment log (Rule 6.7). */
  const problems = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${problems}`);
}

const allowedOrigins = parsed.data.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);

/* An entry may carry one `*`, standing for a single DNS label's worth of
   characters — so `https://cyber-kent-*-team.vercel.app` admits the platform's
   preview deployments without admitting `https://evil.example/?x=.vercel.app`. */
const originMatchers = allowedOrigins.map((entry) => {
  if (!entry.includes("*")) {
    return (origin: string) => origin === entry;
  }
  const pattern = new RegExp(`^${entry.split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[a-z0-9-]+")}$`);
  return (origin: string) => pattern.test(origin);
});

export const env = {
  ...parsed.data,
  /* The platform sets VERCEL=1 on every deployment, preview included. It is
     read as well as NODE_ENV because NODE_ENV=production cannot be set there:
     it would make the install skip the devDependencies the build runs on, and
     a deployment that believed itself in development would hand verification
     codes back in its responses. */
  isProduction: parsed.data.NODE_ENV === "production" || process.env.VERCEL === "1",
  allowedOrigins,
  isAllowedOrigin: (origin: string) => originMatchers.some((matches) => matches(origin)),
  appUrl: (parsed.data.PUBLIC_APP_URL ?? allowedOrigins[0] ?? "http://localhost:5173").replace(/\/$/, ""),
};
