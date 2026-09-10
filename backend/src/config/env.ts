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

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  allowedOrigins: parsed.data.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()),
};
