import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "@/config/env";
import { errorHandler, notFoundHandler } from "@/middleware/error";
import { authRoutes } from "@/modules/auth/auth.routes";
import { healthRoutes } from "@/modules/health/health.routes";
import { aiRoutes } from "@/modules/ai/ai.routes";
import { accountRoutes } from "@/modules/account/account.routes";
import { referenceRoutes } from "@/modules/reference/reference.routes";
import { reportsRoutes } from "@/modules/reports/reports.routes";
import { councilRoutes } from "@/modules/council/council.routes";
import { adminRoutes } from "@/modules/admin/admin.routes";
import { publicAlertsRoutes } from "@/modules/alerts/alerts.routes";
import { subscriptionRoutes } from "@/modules/subscriptions/subscriptions.routes";
import { recoveryRoutes } from "@/modules/recovery/recovery.routes";
import { insightsRoutes } from "@/modules/insights/insights.routes";
import { indicatorRoutes } from "@/modules/indicators/indicators.routes";
import { reporterEvidenceRoutes, staffEvidenceRoutes } from "@/modules/evidence/evidence.routes";
import { AppError, sendOk } from "@/lib/http";

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
        if (!origin || env.isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }

        /* A refusal, not a fault: answered as 403 rather than a generic 500. */
        callback(new AppError(403, "This site is not allowed to call the CyberKent API."));
      },
      credentials: true,
      /* So the console can name a downloaded export the way the API named it. */
      exposedHeaders: ["Content-Disposition"],
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
      endpoints: ["/api/health", "/api/health/ready", "/api/auth", "/api/account", "/api/reports", "/api/reference", "/api/ai", "/api/alerts", "/api/subscriptions", "/api/recovery", "/api/insights", "/api/indicators", "/api/council", "/api/admin"],
    });
  });

  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/account", accountRoutes);
  /* Evidence first: its limits route is public, and the reports router requires an account for everything. */
  app.use("/api/reports", reporterEvidenceRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/reference", referenceRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/alerts", publicAlertsRoutes);
  app.use("/api/subscriptions", subscriptionRoutes);
  app.use("/api/recovery", recoveryRoutes);
  app.use("/api/insights", insightsRoutes);
  app.use("/api/indicators", indicatorRoutes);
  app.use("/api/council/reports", staffEvidenceRoutes);
  app.use("/api/council", councilRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
