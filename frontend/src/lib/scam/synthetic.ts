import type { SyntheticRead } from "@/lib/scam/types";

/**
 * Asking whether an image was generated, on the reader's own device.
 *
 * The obvious implementation was to POST the image to a hosted inference API.
 * It is rejected here on purpose. The checker tells people "Checked on your own
 * device. Nothing is sent to Council or stored", and the images it is handed
 * are screenshots of banking apps, family messages and identity documents. A
 * classifier is not worth breaking that sentence for, so the model comes to the
 * image rather than the image going to the model.
 *
 * The cost of that choice is honest and bounded: a few megabytes of weights,
 * fetched once from this site's own origin and then cached by the browser, and
 * a checkpoint small enough to run in WebAssembly. The benefit is that the
 * privacy claim on the dialog stays literally true.
 */

/**
 * Where the weights live, relative to the site root.
 *
 * Served from this origin rather than from a model host, so the existing
 * `connect-src 'self'` policy covers the fetch and no third party learns that
 * a resident is checking an image. `scripts/fetch-model.mjs` puts them here at
 * build time; they are not committed.
 */
const MODEL_ROOT = "/models/";

/**
 * The checkpoint, as a repository id under {@link MODEL_ROOT}.
 *
 * Held in one place because it is the part of this module most likely to
 * change: detectors are trained against the generators that existed when they
 * were built, and they age badly as new ones appear. Swapping this constant and
 * re-running the fetch script is the whole upgrade path.
 *
 * Two properties decided this one over better-known checkpoints. It is **MIT
 * licensed**, where the widely used `Organika/sdxl-detector` and the TruFor
 * forensics framework are both non-commercial — a licence a council service
 * cannot rely on without clearance. And its quantised build is **under 15 MB**,
 * where that detector publishes only a 338 MB full-precision file. The size is
 * not a detail: this is downloaded by residents on the cheapest phones, and an
 * earlier revision pointed at that 338 MB file and broke the deployment.
 */
export const MODEL_ID = "onnx-community/ai-image-detect-distilled-ONNX";

/**
 * Which quantised build to load, in `transformers.js` terms.
 *
 * `q8` resolves to `onnx/model_quantized.onnx`, which is the file
 * `scripts/fetch-model.mjs` prefers. Naming it here rather than leaving the
 * default to decide is what keeps the two in step: if the loader asked for a
 * precision the fetch script never wrote, the request would fall through to
 * the catch-all rewrite and the pipeline would try to parse the front page as
 * a tensor.
 */
const MODEL_DTYPE = "q8";

/** Labels that mean "a machine made this", across the checkpoints in use. */
const SYNTHETIC_LABELS = ["artificial", "ai", "ai-generated", "aigenerated", "fake", "synthetic", "generated"];

/**
 * Below this the reading is treated as saying nothing rather than as saying
 * "real". These detectors are confidently wrong often enough that a weak score
 * in either direction is not worth showing a resident.
 */
export const INCONCLUSIVE_BELOW = 0.15;

/** At or above this the reading is strong enough to raise as an indicator. */
export const SYNTHETIC_ABOVE = 0.7;

type Classifier = (input: string) => Promise<{ label: string; score: number }[]>;

let classifier: Promise<Classifier> | null = null;
let deployed: Promise<boolean> | null = null;

/**
 * Asks whether the weights are actually deployed, before anything heavy loads.
 *
 * `transformers.js` and its ONNX runtime are more than twenty megabytes
 * together. Without this check, a build that never ran the fetch script — or
 * one whose fetch failed, which is a deliberately survivable state — would
 * download all of it onto a phone purely to discover that the model it needs
 * is not there. One conditional request for a small JSON file settles it.
 */
function isDeployed(): Promise<boolean> {
  deployed ??= fetch(`${MODEL_ROOT}${MODEL_ID}/config.json`)
    .then(async (response) => {
      if (!response.ok) {
        return false;
      }

      /*
       * A 200 is not enough. This is a single-page app behind a catch-all
       * rewrite, so a request for a file that does not exist comes back as the
       * app's own `index.html` with a perfectly healthy status. Parsing the
       * body is what distinguishes a deployed model from the front page
       * wearing its name — without this the check passes, twenty megabytes of
       * runtime download, and the failure surfaces at the far end instead.
       */
      try {
        const config: unknown = await response.json();
        return typeof config === "object" && config !== null && "architectures" in config;
      } catch {
        return false;
      }
    })
    .catch(() => false);

  return deployed;
}

/**
 * Loads the pipeline once per page, on first use.
 *
 * `transformers.js` is several megabytes and the great majority of checks are
 * pasted text that never touch it, so it is imported at the moment an image
 * arrives rather than bundled — the same treatment `tesseract.js` gets.
 */
function load(): Promise<Classifier> {
  classifier ??= (async () => {
    const { env, pipeline } = await import("@huggingface/transformers");

    /*
     * The two settings that make the privacy claim true. Remote models are
     * refused outright rather than merely not preferred, so a missing local
     * file fails the check instead of silently reaching out to a model host.
     */
    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    env.localModelPath = MODEL_ROOT;
    /* The ONNX runtime from this site too (scripts/copy-runtimes.mjs), not a CDN. */
    const onnx = env.backends.onnx as { wasm?: { wasmPaths?: unknown } };
    if (onnx.wasm) onnx.wasm.wasmPaths = { mjs: "/ort/ort-wasm-simd-threaded.mjs", wasm: "/ort/ort-wasm-simd-threaded.wasm" };

    const pipe = await pipeline("image-classification", MODEL_ID, { dtype: MODEL_DTYPE });

    return (input: string) => pipe(input) as Promise<{ label: string; score: number }[]>;
  })();

  return classifier;
}

/**
 * Runs the classifier over one image.
 *
 * Never throws and never guesses. Where the model is not deployed — which is
 * the state of any checkout that has not run the fetch script — the reading
 * comes back `unavailable` with a reason, and the caller reports the gap rather
 * than scoring around it. A missing detector must not read as a clean image.
 */
export async function readSynthetic(file: File): Promise<SyntheticRead> {
  let url: string | null = null;

  if (!(await isDeployed())) {
    return {
      probability: 0,
      model: MODEL_ID,
      unavailable:
        "The AI-image check is not available on this site yet. Everything else in this report was still checked.",
    };
  }

  try {
    const classify = await load();
    url = URL.createObjectURL(file);
    const results = await classify(url);

    const synthetic = results.find((result) =>
      SYNTHETIC_LABELS.includes(result.label.trim().toLowerCase().replace(/\s+/g, "-")),
    );

    if (!synthetic) {
      /* The checkpoint's labels are not the ones this module knows how to
         read. Reporting that plainly beats picking the highest score and
         hoping it meant "fake". */
      return {
        probability: 0,
        model: MODEL_ID,
        unavailable: "The image model returned labels this service does not recognise, so its answer was discarded.",
      };
    }

    return { probability: synthetic.score, model: MODEL_ID };
  } catch {
    return {
      probability: 0,
      model: MODEL_ID,
      unavailable:
        "The AI-image check did not run on this device. Everything else in this report was still checked.",
    };
  } finally {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
