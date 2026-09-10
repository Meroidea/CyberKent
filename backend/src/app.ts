import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "@/config/env";
import { errorHandler, notFoundHandler } from "@/middleware/error";
import { authRoutes } from "@/modules/auth/auth.routes";
import { healthRoutes } from "@/modules/health/health.routes";
import { aiRoutes } from "@/modules/ai/ai.routes";
import { sendOk } from "@/lib/http";

const IMAGE_ROUTE = "/api/ai/analyse-image";

/**
 * Builds the Express application.
 *
 * Separated from the listener so the same app can be mounted by a serverless
 * handler, started as a long-running process, or driven directly by a test
 * without a port ever being bound.
 */
export function createApp() {
  const app = express();

  /* Behind Vercel's proxy. Without this the rate limiter buckets every caller
     under the proxy's address and throttles the whole world as one client. */
  app.set("trust proxy", 1);

  app.disable("x-powered-by");
  app.use(helmet());

  app.use(
    cors({
      origin(origin, callback) {
        /* No Origin header: curl, server-to-server, same-origin. Nothing to
           enforce, since CORS only protects browser callers. */
        if (!origin || env.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin not allowed by CORS."));
      },
      credentials: true,
    }),
  );

  /* A scam report with a pasted email thread is legitimately long, but the
     limit exists so a body cannot be used to exhaust memory. The one route that
     carries an image parses its own body with its own, larger limit. */
  const defaultBody = express.json({ limit: "256kb" });
  app.use((req, res, next) => (req.path === IMAGE_ROUTE ? next() : defaultBody(req, res, next)));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );

  app.get("/", (_req, res) => {
    sendOk(res, {
      service: "CyberKent API",
      description: "Hume City Council CyberSafe Services — Online Scam Detection and Reporting System",
      version: "0.1.0",
      endpoints: ["/api/health", "/api/health/ready", "/api/auth", "/api/ai"],
    });
  });

  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/ai", aiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
