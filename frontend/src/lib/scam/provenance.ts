import type { Provenance } from "@/lib/scam/types";

/**
 * Reading what an image says about its own origin, in the browser.
 *
 * Two sources, of very different authority, and the difference between them is
 * the reason this module exists rather than a single "is it AI" boolean:
 *
 *   - A C2PA manifest is cryptographically signed. When it validates against a
 *     trust list and declares a generative source, that is as close to proof as
 *     this service will ever get, and it costs no model and no network.
 *   - EXIF, XMP and PNG text chunks are unsigned strings. Generators do write
 *     honest ones, so they are worth reading, but anybody can put anything in
 *     them and so can anybody who wants to make a real photograph look fake.
 *
 * What this module refuses to do is treat silence as evidence. Every mainstream
 * platform strips metadata on upload, so most genuine scam screenshots arrive
 * carrying nothing — `absent` is the normal case, not a suspicious one.
 */

/**
 * IPTC and C2PA digital source types that mean a machine generated the pixels.
 *
 * `algorithmicallyEnhanced` is deliberately absent: it covers computational
 * photography, which is every phone camera sold in the last decade.
 */
const GENERATED_SOURCE_TYPES = [
  "trainedAlgorithmicMedia",
  "compositeWithTrainedAlgorithmicMedia",
  "trainedAlgorithmicData",
  "algorithmicMedia",
  "compositeSynthetic",
  "digitalCreation",
];

/** Source types that assert a lens and a sensor were involved. */
const CAPTURED_SOURCE_TYPES = ["digitalCapture", "computationalCapture", "negativeFilm", "positiveFilm"];

/**
 * Names that appear in unsigned metadata when a generator wrote the file.
 *
 * Matched case-insensitively against the `Software` tag, XMP, and PNG text
 * chunks. Kept to tools that write their own name — a list of every model
 * would go stale monthly and catch nothing extra, because the tools that hide
 * their output do not announce themselves in metadata either way.
 */
const GENERATOR_NAMES = [
  "midjourney",
  "stable diffusion",
  "stablediffusion",
  "dall-e",
  "dall·e",
  "dalle",
  "firefly",
  "imagen",
  "novelai",
  "comfyui",
  "automatic1111",
  "invokeai",
  "flux",
  "ideogram",
  "leonardo.ai",
  "nano banana",
  "gemini",
  "grok",
  "sora",
  "openai",
];

/** Formats the C2PA reader understands. Anything else skips straight to EXIF. */
const C2PA_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/tiff", "image/heic", "image/heif"];

/**
 * The C2PA SDK is WebAssembly and a worker, and is only ever needed once an
 * image is actually attached — so it is imported at that moment rather than
 * bundled, the same treatment `tesseract.js` and `three` get.
 *
 * The `inline` entry point is chosen deliberately over the default one: it
 * carries its own WASM as a base64 string instead of fetching a `.wasm` beside
 * itself, which keeps the whole check inside the app's own origin and means the
 * site's `connect-src 'self'` policy needs no exception to run it.
 */
async function c2paReader() {
  const { createC2pa } = await import("@contentauth/c2pa-web/inline");
  return createC2pa();
}

/** How much of a file to scan for a manifest marker before concluding there is none. */
const MARKER_SCAN_BYTES = 512 * 1024;

/**
 * Signatures that mean a C2PA manifest is embedded somewhere in this file.
 *
 * `jumb`/`jumd` are JUMBF box headers, `c2pa` is the manifest store label,
 * and `caBX` is the PNG chunk that carries one.
 */
const MANIFEST_MARKERS = ["jumb", "jumd", "c2pa", "caBX"];

/**
 * A dependency-free look for a manifest before the SDK is fetched.
 *
 * The reason this exists is bandwidth. The C2PA SDK is around ten megabytes,
 * and the honest expectation is that almost no image reaching this service
 * carries credentials at all — they are stripped by every messaging app and
 * social network a screenshot passes through. Downloading ten megabytes on a
 * phone, on mobile data, to establish that an image has no metadata is a cost
 * this service has no right to impose on someone who is mid-scam and worried.
 *
 * So the file's own bytes are searched for the box headers first. A false
 * positive here is harmless — the SDK loads and finds nothing, exactly as it
 * would have anyway. Only a false negative would cost accuracy, and the
 * markers scanned for are structural: a manifest cannot be embedded without
 * writing one of them near the head of the file.
 */
async function hasManifestMarker(file: File): Promise<boolean> {
  try {
    const head = await file.slice(0, MARKER_SCAN_BYTES).arrayBuffer();
    const text = new TextDecoder("latin1").decode(head);
    return MANIFEST_MARKERS.some((marker) => text.includes(marker));
  } catch {
    /* If the bytes cannot be read, let the SDK be the judge rather than
       reporting an absence this function failed to establish. */
    return true;
  }
}

/** Pulls the first named generator out of a claim generator string. */
function tidyGenerator(raw: string | null | undefined): string | undefined {
  const value = raw?.trim();

  if (!value) {
    return undefined;
  }

  /* Claim generators are User-Agent formatted — "Adobe_Firefly/1.0 c2pa-rs/0.25".
     The first token is the tool; the rest is plumbing nobody needs to read. */
  const first = value.split(/\s+/)[0] ?? value;
  return first.replace(/\/[\d.]+$/, "").replace(/_/g, " ");
}

function matchGeneratorName(haystack: string): string | undefined {
  const lowered = haystack.toLowerCase();
  return GENERATOR_NAMES.find((name) => lowered.includes(name));
}

/**
 * Reads the C2PA manifest, if there is one that validates.
 *
 * Returns `null` rather than a status when there is no manifest at all, so the
 * caller can fall through to the unsigned sources instead of reporting an
 * absence that has not been fully established yet.
 */
async function readManifest(file: File): Promise<Provenance | null> {
  if (!C2PA_FORMATS.includes(file.type)) {
    return null;
  }

  if (!(await hasManifestMarker(file))) {
    return null;
  }

  try {
    const c2pa = await c2paReader();
    const reader = await c2pa.reader.fromBlob(file.type, file);

    if (!reader) {
      return null;
    }

    const store = await reader.manifestStore();
    const manifest = await reader.activeManifest();

    /*
     * "Valid" means the signature verifies; "Trusted" means it also chains to a
     * certificate on the trust list. Anything else — a tampered asset, an
     * unknown signer — is reported as untrusted rather than quietly ignored,
     * because a manifest that does not validate is itself a finding.
     */
    const state = store.validation_state;

    if (state !== "Valid" && state !== "Trusted") {
      return {
        status: "untrusted",
        detail:
          "This image carries Content Credentials that do not validate. Either the image was altered after they were attached, or they were not issued by a recognised signer.",
      };
    }

    const issuer = manifest.signature_info?.issuer ?? undefined;
    const generator =
      tidyGenerator(manifest.claim_generator_info?.[0]?.name) ??
      tidyGenerator(manifest.claim_generator);

    /* Actions carry the digital source type, which is the field that actually
       states how the pixels came to exist. */
    const actions = manifest.assertions?.find((assertion) => assertion.label.startsWith("c2pa.actions"));
    const sourceTypes = collectSourceTypes(actions?.data);

    if (sourceTypes.some((type) => GENERATED_SOURCE_TYPES.some((needle) => type.includes(needle)))) {
      return {
        status: "declared-ai",
        generator,
        issuer: issuer ?? undefined,
        detail: generator
          ? `The image's own signed Content Credentials state it was generated by ${generator}.`
          : "The image's own signed Content Credentials state it was generated by software rather than captured.",
      };
    }

    if (sourceTypes.some((type) => CAPTURED_SOURCE_TYPES.some((needle) => type.includes(needle)))) {
      return {
        status: "declared-capture",
        generator,
        issuer: issuer ?? undefined,
        detail: `Signed Content Credentials state this was captured by a camera${issuer ? `, signed by ${issuer}` : ""}.`,
      };
    }

    return {
      status: "signed",
      generator,
      issuer: issuer ?? undefined,
      detail: `This image carries valid Content Credentials${issuer ? ` signed by ${issuer}` : ""}, but they do not state how it was made.`,
    };
  } catch {
    /* A reader failure is a gap in what we know, not a finding about the
       image. Fall through and let the unsigned sources have their turn. */
    return null;
  }
}

/** Digital source types can sit on the assertion or on each action within it. */
function collectSourceTypes(data: unknown): string[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const found: string[] = [];
  const record = data as { actions?: unknown; digitalSourceType?: unknown };

  if (typeof record.digitalSourceType === "string") {
    found.push(record.digitalSourceType);
  }

  if (Array.isArray(record.actions)) {
    for (const action of record.actions) {
      const type = (action as { digitalSourceType?: unknown })?.digitalSourceType;

      if (typeof type === "string") {
        found.push(type);
      }
    }
  }

  return found;
}

/**
 * Reads the unsigned metadata: EXIF, XMP, and the text chunks a PNG carries.
 *
 * The PNG chunks are worth the extra few lines. Locally-run generators write
 * their whole prompt into a `parameters` or `workflow` chunk, and that is both
 * the most common way an image reaches this service already labelled and the
 * one no EXIF parser looks at.
 */
async function readUnsigned(file: File): Promise<{ generator?: string }> {
  try {
    const exifr = await import("exifr");
    const tags = (await exifr.parse(file, { xmp: true, iptc: true, tiff: true })) as
      | Record<string, unknown>
      | undefined;

    if (tags) {
      const haystack = [
        tags.Software,
        tags.CreatorTool,
        tags.HistorySoftwareAgent,
        tags.DigitalSourceType,
        tags.Description,
        tags.Comment,
      ]
        .filter((value) => typeof value === "string")
        .join(" ");

      if (GENERATED_SOURCE_TYPES.some((needle) => haystack.includes(needle))) {
        return { generator: typeof tags.Software === "string" ? tags.Software : undefined };
      }

      const named = matchGeneratorName(haystack);

      if (named) {
        return { generator: named };
      }
    }
  } catch {
    /* Unreadable metadata is the same as no metadata. */
  }

  if (file.type === "image/png") {
    const named = await readPngTextChunks(file);

    if (named) {
      return { generator: named };
    }
  }

  return {};
}

/** How much of a PNG to scan for text chunks before giving up. */
const PNG_SCAN_BYTES = 256 * 1024;

/**
 * Scans the head of a PNG for `tEXt`/`iTXt` chunks naming a generator.
 *
 * Reads the leading bytes only. Generator metadata is written before the image
 * data, and pulling a whole multi-megabyte screenshot into memory to find a
 * string in its first few kilobytes would cost more than the check is worth.
 */
async function readPngTextChunks(file: File): Promise<string | undefined> {
  try {
    const head = await file.slice(0, PNG_SCAN_BYTES).arrayBuffer();
    /* Latin-1 rather than UTF-8: PNG keyword fields are Latin-1 by spec, and
       decoding binary image data as UTF-8 throws away bytes that may be part
       of a keyword straddling the boundary. */
    const text = new TextDecoder("latin1").decode(head);

    if (!/tEXt|iTXt|parameters|workflow/.test(text)) {
      return undefined;
    }

    return matchGeneratorName(text);
  } catch {
    return undefined;
  }
}

/**
 * The whole provenance read for one image. Never throws.
 *
 * Signed evidence is asked for first and wins outright: where a manifest
 * validates, an unsigned string that disagrees with it is not a second opinion,
 * it is noise.
 */
export async function readProvenance(file: File): Promise<Provenance> {
  const signed = await readManifest(file);

  if (signed) {
    return signed;
  }

  const { generator } = await readUnsigned(file);

  if (generator) {
    return {
      status: "hinted-ai",
      generator,
      detail: `The file's metadata names ${generator}, which suggests it was generated rather than photographed. This tag is not signed, so it can be written by anyone and can equally be removed.`,
    };
  }

  return {
    status: "absent",
    detail:
      "This image carries no Content Credentials and no origin metadata. That is the normal state for anything saved from a messaging app or social network, which strip it — it says nothing either way about how the image was made.",
  };
}
