import { mkdir, writeFile, access } from "node:fs/promises";
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
const MODEL_ID = "Organika/sdxl-detector";

const HOST = process.env.HF_ENDPOINT ?? "https://huggingface.co";

/**
 * What `transformers.js` asks for when it builds an image-classification
 * pipeline. The quantised weights are listed first and are what the browser
 * actually loads; the full-precision file is not fetched at all.
 */
const FILES = [
  { path: "config.json", required: true },
  { path: "preprocessor_config.json", required: true },
  { path: "onnx/model_quantized.onnx", required: false },
  { path: "onnx/model.onnx", required: false },
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

  let weights = false;

  for (const file of FILES) {
    /* The two ONNX paths are alternatives: whichever the repository publishes
       is the one used, and finding the quantised file means the larger one is
       not worth downloading. */
    if (file.path.startsWith("onnx/") && weights) {
      continue;
    }

    const written = await fetchOne(file);

    if (written && file.path.startsWith("onnx/")) {
      weights = true;
    }
  }

  if (!weights) {
    throw new Error(
      `no ONNX weights published under ${MODEL_ID}/onnx — the checkpoint needs converting before it can run in a browser`,
    );
  }
}

try {
  await main();
} catch (error) {
  process.stdout.write(
    `\n  image detector not deployed: ${error.message}\n` +
      `  The site will build and run; the AI-image check will report itself unavailable.\n` +
      `  See frontend/public/models/README.md to deploy it.\n\n`,
  );
}
