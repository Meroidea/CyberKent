import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Integration tests against a real PostgreSQL database (Rule 11).
 *
 *   TEST_DATABASE_URL=postgresql://… npm test
 *
 * The database is migrated and seeded with reference data once, before the
 * run. Tests create their own people and reports with unique addresses, so
 * they do not depend on each other or on run order.
 */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
