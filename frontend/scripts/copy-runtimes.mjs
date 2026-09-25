/**
 * Copies the in-browser image readers' runtimes into `public/`, so they are
 * served from this site rather than from a CDN.
 *
 * Both libraries default to fetching code from cdn.jsdelivr.net at the moment
 * a resident attaches an image. The site's Content-Security-Policy only lets
 * scripts run from its own origin — which is right — so tesseract's worker
 * failed to start and the check waited on it forever. Serving the files from
 * here fixes that, and keeps the promise the checker makes: an image is read
 * on the resident's own device, with nothing fetched from anyone else.
 *
 *   public/tesseract/worker.min.js        the OCR worker
 *   public/tesseract/core/*-lstm.*        the OCR engine (plain, SIMD, relaxed SIMD)
 *   public/tesseract/lang/eng.traineddata.gz
 *   public/ort/ort-wasm-simd-threaded.*   ONNX runtime for the AI-image detector
 *
 * Run by `npm run build`; the copies are build output and are not committed.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const modules = join(root, "node_modules");
const pub = join(root, "public");

function copy(from, to) {
  if (!existsSync(from)) throw new Error(`Missing ${from}. Run npm install.`);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}

copy(join(modules, "tesseract.js/dist/worker.min.js"), join(pub, "tesseract/worker.min.js"));

/* Only the LSTM builds: the recogniser is created with the LSTM engine, and
   tesseract picks plain, SIMD or relaxed-SIMD for the visitor's browser. */
for (const file of readdirSync(join(modules, "tesseract.js-core"))) {
  if (/^tesseract-core(-simd|-relaxedsimd)?-lstm\.(js|wasm|wasm\.js)$/.test(file)) {
    copy(join(modules, "tesseract.js-core", file), join(pub, "tesseract/core", file));
  }
}

/* The integer "best" model: accurate on screenshots at a quarter of the size. */
copy(join(modules, "@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz"), join(pub, "tesseract/lang/eng.traineddata.gz"));

for (const file of ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]) {
  copy(join(modules, "onnxruntime-web/dist", file), join(pub, "ort", file));
}

console.log("Image-reader runtimes copied to public/tesseract and public/ort.");
