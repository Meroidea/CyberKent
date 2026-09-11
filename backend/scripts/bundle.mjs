import { build } from "esbuild";

/**
 * Bundles the API into one ESM file for the serverless platform.
 *
 * The source imports through the `@/` alias and without file extensions, which
 * `tsx` resolves in development but Node's ESM loader does not — and the
 * platform's TypeScript builder compiles files one by one without rewriting
 * either. Bundling resolves every internal import once, at build time, from
 * tsconfig.json, and leaves only package imports for Node to find in
 * node_modules. Packages stay external: Prisma loads generated files relative
 * to its own location, and bundling it would break that.
 *
 *   node scripts/bundle.mjs   →   dist/serverless.mjs
 */
await build({
  entryPoints: ["src/serverless.ts"],
  outfile: "dist/serverless.mjs",
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  packages: "external",
  tsconfig: "tsconfig.json",
  sourcemap: true,
  logLevel: "info",
});
