import { createApp } from "@/app";

/**
 * Serverless entry, bundled by scripts/bundle.mjs into dist/serverless.mjs and
 * re-exported by api/index.js.
 *
 * Express applications are request handlers, so the platform can invoke this
 * directly. The app is built at module scope so a warm invocation reuses it
 * along with the Prisma client rather than rebuilding both per request.
 */
export default createApp();
