/**
 * The platform's function entry: the bundled API (see scripts/bundle.mjs).
 *
 * Plain JavaScript, so the platform has nothing to compile here — the bundle
 * is built by `npm run vercel-build` before this file is traced.
 */
export { default } from "../dist/serverless.mjs";
