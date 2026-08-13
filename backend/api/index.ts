import { createApp } from "../src/app";

/**
 * Serverless entry.
 *
 * Express applications are request handlers, so the platform can invoke this
 * directly. The app is built at module scope so a warm invocation reuses it
 * along with the Prisma client rather than rebuilding both per request.
 */
export default createApp();
