import crypto from "node:crypto";
import type { RequestHandler } from "express";

/* Set by the site's own proxy (frontend/api/proxy.js), never by a browser. */
export const PROXY_SECRET_HEADER = "x-cyberkent-proxy";
export const PROXY_CLIENT_IP_HEADER = "x-cyberkent-client-ip";

const sameSecret = (given: string, expected: string) => {
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
};

/**
 * The API is reached only through the website: cyberkent.meroidea.com/api/*
 * is proxied here with a shared secret, and anything that arrives without it —
 * the API's own addresses typed into a browser, a script aimed at them — gets
 * a bare 404, as if nothing were there.
 *
 * Behind the proxy every request comes from the proxy's address, so the
 * caller's own address travels in a header the proxy sets from the platform's
 * view of the connection. It is believed only alongside the secret, so it
 * cannot be forged to dodge sign-in throttling or to put a false address in
 * the audit trail.
 */
export function proxyGate(secret: string): RequestHandler {
  return (req, res, next) => {
    const given = req.get(PROXY_SECRET_HEADER);
    if (!given || !sameSecret(given, secret)) {
      res.status(404).end();
      return;
    }
    const clientIp = req.get(PROXY_CLIENT_IP_HEADER)?.trim();
    if (clientIp && clientIp.length <= 64) {
      Object.defineProperty(req, "ip", { value: clientIp, configurable: true });
    }
    next();
  };
}
