/**
 * cyberkent.meroidea.com/api/* → the CyberKent API.
 *
 * The site and its API share one public address. Browsers only ever talk to
 * cyberkent.meroidea.com; this function forwards /api calls to the API with a
 * secret the API requires, so the API's own addresses answer nothing to anyone
 * who finds them (backend/src/middleware/proxy-gate.ts).
 *
 * API_UPSTREAM_URL  where the API runs, e.g. https://cyber-kent-api.vercel.app
 * API_PROXY_SECRET  shared with the API project; never sent to a browser
 */

const PATH_PARAM = "__ckpath";

/* Connection-level headers, and anything a caller could use to impersonate
   the proxy or the platform. The platform's own view of the caller is read
   before these are dropped. */
const DROP_REQUEST = new Set(["host", "connection", "content-length", "transfer-encoding", "keep-alive", "upgrade", "forwarded", "x-real-ip", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "x-forwarded-port"]);
const DROP_RESPONSE = new Set(["connection", "content-length", "content-encoding", "transfer-encoding", "keep-alive"]);

const notFound = () => new Response(null, { status: 404 });

async function forward(request) {
  const upstream = process.env.API_UPSTREAM_URL?.replace(/\/$/, "");
  const secret = process.env.API_PROXY_SECRET;
  if (!upstream || !secret) {
    return Response.json({ success: false, message: "The service is not available right now.", data: null, errors: [] }, { status: 503 });
  }

  const incoming = new URL(request.url);
  let path = incoming.searchParams.get(PATH_PARAM);
  incoming.searchParams.delete(PATH_PARAM);
  if (path !== null) {
    /* Vercel also appends the rewrite's named segment (`:path*` in vercel.json)
       to the query as `path=…`. Forwarded, it reached every filtered list and
       the API's strict query schemas refused it ("The filters are not valid").
       No API endpoint reads a `path` query parameter, so it is dropped. */
    incoming.searchParams.delete("path");
  }
  if (path === null) {
    /* Reached by its original address rather than through the rewrite. */
    if (!incoming.pathname.startsWith("/api/") || incoming.pathname === "/api/proxy") return notFound();
    path = incoming.pathname.slice("/api/".length);
  }

  /* The path is only ever a path on the API: no scheme, host or traversal. */
  const target = new URL(`${upstream}/api/${path.replace(/^\/+/, "")}${incoming.search}`);
  if (target.origin !== new URL(upstream).origin || !target.pathname.startsWith("/api/") || target.pathname.split("/").includes("..")) {
    return notFound();
  }

  const headers = new Headers();
  for (const [key, value] of request.headers) {
    const name = key.toLowerCase();
    if (DROP_REQUEST.has(name) || name.startsWith("x-vercel-") || name.startsWith("x-cyberkent-")) continue;
    headers.set(key, value);
  }
  headers.set("x-cyberkent-proxy", secret);
  const clientIp = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (clientIp) headers.set("x-cyberkent-client-ip", clientIp);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const send = () =>
    fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      duplex: hasBody ? "half" : undefined,
      redirect: "manual",
    });

  let response;
  try {
    response = await send();
  } catch (error) {
    /* A read is safe to repeat, and a connection dropped while the API rolls
       over to a new deployment usually succeeds a moment later. A write is
       not retried: its body is already spent, and it may have landed. */
    console.error(`[proxy] ${request.method} /api/${path} failed: ${error?.cause?.code ?? error?.message ?? error}`);
    if (hasBody) {
      return Response.json({ success: false, message: "The service is not available right now.", data: null, errors: [] }, { status: 502 });
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      response = await send();
    } catch {
      return Response.json({ success: false, message: "The service is not available right now.", data: null, errors: [] }, { status: 502 });
    }
  }

  const out = new Headers();
  for (const [key, value] of response.headers) {
    if (!DROP_RESPONSE.has(key.toLowerCase())) out.append(key, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: out });
}

export const GET = forward;
export const HEAD = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const OPTIONS = forward;
