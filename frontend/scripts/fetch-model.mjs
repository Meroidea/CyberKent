import { copyFile, mkdir, readdir, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Fetches the synthetic-image detector's weights into `public/models/`.
 *
 * The weights are served from this site's own origin rather than from a model
 * host, which is what lets the checker keep `connect-src 'self'` and what stops
 * a third party learning that a particular resident is checking an image. They
 * are fetched at build time rather than committed because they are tens of
 * megabytes of binary that would otherwise sit in every clone of this
 * repository forever.
 *
 * This step is deliberately non-fatal. A build that cannot reach the model host
 * still produces a working site — the image classifier reports itself
 * unavailable and every other check runs unchanged. A missing optional model
 * must never be the reason a council service fails to deploy.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Must match MODEL_ID in src/lib/scam/synthetic.ts. */
const MODEL_ID = "onnx-community/ai-image-detect-distilled-ONNX";

/**
 * The ceiling this script will not write past, in megabytes.
 *
 * This is the guard, not the checkpoint choice. An earlier revision listed the
 * full-precision `model.onnx` as an acceptable fallback; the checkpoint it was
 * pointed at published no quantised build, so the fallback fired and wrote 338
 * megabytes into `public/`. The deployment that followed exceeded the host's
 * size limit and failed — the site did not build at all, over an optional
 * feature that was supposed to degrade quietly.
 *
 * So the size is checked before the bytes are pulled, and anything over this
 * is refused with a reason. A checkpoint too large to serve is treated as a
 * checkpoint that is not there, which is a state the rest of the pipeline
 * already handles.
 */
const MAX_WEIGHT_MB = 64;

const HOST = process.env.HF_ENDPOINT ?? "https://huggingface.co";

/** The small JSON files `transformers.js` reads before any weights load. */
const FILES = [
  { path: "config.json", required: true },
  { path: "preprocessor_config.json", required: true },
];

/**
 * Candidate weight files, most preferred first.
 *
 * Every one of these is a quantised build. The full-precision `model.onnx` is
 * deliberately absent: at a few hundred megabytes it is neither deployable on
 * the hosting this service uses nor downloadable on the phones its readers
 * hold. `model_quantized.onnx` is what `dtype: "q8"` asks for in the browser,
 * so it is tried first and the rest exist only so a checkpoint that names its
 * files differently still works.
 */
const WEIGHTS = [
  "onnx/model_quantized.onnx",
  "onnx/model_int8.onnx",
  "onnx/model_uint8.onnx",
  "onnx/model_q4f16.onnx",
  "onnx/model_q4.onnx",
];

const target = join(ROOT, "public", "models", MODEL_ID);

async function alreadyPresent() {
  try {
    await access(join(target, "config.json"));
    await access(join(target, "onnx"));
    return true;
  } catch {
    return false;
  }
}

/**
 * Asks how large a file is before deciding whether to pull it.
 *
 * A HEAD request, so a checkpoint that is too big costs a few hundred bytes to
 * rule out rather than the whole download. Hugging Face redirects file requests
 * to a CDN, hence `redirect: "follow"`; a response that declines to say how big
 * it is returns null and is treated as unknown rather than as acceptable.
 */
async function sizeOf(path) {
  try {
    const response = await fetch(`${HOST}/${MODEL_ID}/resolve/main/${path}`, {
      method: "HEAD",
      redirect: "follow",
    });

    if (!response.ok) {
      return null;
    }

    const length = Number(response.headers.get("content-length"));
    return Number.isFinite(length) && length > 0 ? length : null;
  } catch {
    return null;
  }
}

async function fetchOne({ path, required }) {
  const url = `${HOST}/${MODEL_ID}/resolve/main/${path}`;
  const response = await fetch(url, { redirect: "follow" });

  if (!response.ok) {
    if (required) {
      throw new Error(`${path} → HTTP ${response.status}`);
    }

    return false;
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const destination = join(target, path);

  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, bytes);

  const size = (bytes.length / 1024 / 1024).toFixed(1);
  process.stdout.write(`  ${path.padEnd(30)} ${size} MB\n`);

  return true;
}

async function main() {
  if (await alreadyPresent()) {
    process.stdout.write(`  ${MODEL_ID} already present, skipping\n`);
    return;
  }

  process.stdout.write(`  fetching ${MODEL_ID} from ${HOST}\n`);

  for (const file of FILES) {
    await fetchOne(file);
  }

  /*
   * The weights are alternatives: the first candidate that exists and fits is
   * the one taken. Size is settled by a HEAD request before any bytes move, so
   * an oversized checkpoint is refused rather than written and discovered at
   * deploy time.
   */
  const ceiling = MAX_WEIGHT_MB * 1024 * 1024;
  let oversized = 0;

  for (const path of WEIGHTS) {
    const size = await sizeOf(path);

    if (size === null) {
      continue;
    }

    if (size > ceiling) {
      oversized += 1;
      process.stdout.write(
        `  ${path.padEnd(30)} ${(size / 1024 / 1024).toFixed(1)} MB — over the ${MAX_WEIGHT_MB} MB ceiling, skipped\n`,
      );
      continue;
    }

    if (await fetchOne({ path, required: false })) {
      return;
    }
  }

  throw new Error(
    oversized > 0
      ? `every quantised build under ${MODEL_ID}/onnx is over the ${MAX_WEIGHT_MB} MB ceiling`
      : `no quantised ONNX weights published under ${MODEL_ID}/onnx — the checkpoint needs converting before it can run in a browser`,
  );
}

/**
 * Copies the ONNX runtime's own WebAssembly files into `public/ort/`.
 *
 * Without this the classifier does not run on the deployed site at all, and
 * says so in a way that reads like an ordinary absence.
 *
 * `onnxruntime-web` cannot locate its `.wasm` files when it has been bundled,
 * so it falls back to importing them from a public CDN at runtime. That import
 * is a script import, and this site's Content-Security-Policy allows scripts
 * from its own origin only — so the fetch is blocked, the backend fails to
 * initialise, and the reading comes back "the AI-image check did not run on
 * this device". The policy is right and the default is wrong for it.
 *
 * Copying the files here and pointing `wasmPaths` at them fixes that and is
 * the better arrangement anyway: the runtime is served from the same origin as
 * everything else, so no third party is told that somebody is checking an
 * image, and a blocked or unreachable CDN cannot silently disable the check on
 * one visit and not the next.
 */
async function copyRuntime() {
  const from = join(ROOT, "node_modules", "onnxruntime-web", "dist");
  const to = join(ROOT, "public", "ort");

  let files;

  try {
    files = (await readdir(from)).filter((name) => /^ort-wasm.*\.(wasm|mjs)$/.test(name));
  } catch {
    process.stdout.write("  onnxruntime-web is not installed; the AI-image check will not run\n");
    return;
  }

  if (files.length === 0) {
    process.stdout.write("  no onnxruntime wasm files found; the AI-image check will not run\n");
    return;
  }

  await mkdir(to, { recursive: true });

  for (const name of files) {
    await copyFile(join(from, name), join(to, name));
  }

  process.stdout.write(`  onnx runtime      ${files.length} files copied to public/ort/\n`);
}

try {
  await copyRuntime();
  await main();
} catch (error) {
  process.stdout.write(
    `\n  image detector not deployed: ${error.message}\n` +
      `  The site will build and run; the AI-image check will report itself unavailable.\n` +
      `  See frontend/public/models/README.md to deploy it.\n\n`,
  );
}
