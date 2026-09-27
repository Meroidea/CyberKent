import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { PROXY_CLIENT_IP_HEADER, PROXY_SECRET_HEADER, proxyGate } from "@/middleware/proxy-gate";

const SECRET = "a-shared-secret-that-is-at-least-32-characters";

function gated() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(proxyGate(SECRET));
  app.get("/api/health", (req, res) => res.json({ ip: req.ip }));
  return app;
}

describe("API reachable only through the website's proxy", () => {
  it("answers a direct request with a bare 404", async () => {
    const response = await request(gated()).get("/api/health");
    expect(response.status).toBe(404);
    expect(response.text).toBe("");
  });

  it("refuses a wrong secret", async () => {
    const response = await request(gated()).get("/api/health").set(PROXY_SECRET_HEADER, "not-the-secret");
    expect(response.status).toBe(404);
  });

  it("serves the proxy, and takes the caller's address from it", async () => {
    const response = await request(gated())
      .get("/api/health")
      .set(PROXY_SECRET_HEADER, SECRET)
      .set(PROXY_CLIENT_IP_HEADER, "203.0.113.7");
    expect(response.status).toBe(200);
    expect(response.body.ip).toBe("203.0.113.7");
  });

  it("ignores a forged address when the secret is missing", async () => {
    const response = await request(gated()).get("/api/health").set(PROXY_CLIENT_IP_HEADER, "203.0.113.7");
    expect(response.status).toBe(404);
  });
});
