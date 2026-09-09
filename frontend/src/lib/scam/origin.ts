import type { FileMetadata, MediaDescriptor, Provenance, SyntheticRead } from "@/lib/scam/types";

/**
 * Answering "is this AI-generated?" once, in a number, with the reasoning.
 *
 * The service previously answered this question three times in three places
 * and never in so many words. A provenance line said what the metadata claimed,
 * a separate line quoted a model's raw percentage, and a chip said "AI-
 * generated" or "Unconfirmed" on a threshold applied to one of them. A reader
 * who came to ask one question was handed three partial answers and left to
 * reconcile them, which is not an answer.
 *
 * So the evidence is combined here, once, and the combination is arithmetic
 * rather than a chain of `if`s: each piece of evidence is weighed as a
 * likelihood ratio and the ratios are summed in log-odds. That has two
 * properties worth the trouble. Weak evidence stays weak no matter how much of
 * it accumulates, and every contribution is a number that can be shown to the
 * reader and argued with — which is what turns a verdict into a report.
 *
 * The scale is bounded at both ends on purpose. Only a signature reaches
 * certainty, because only a signature is evidence of that order; everything
 * else asymptotes short of it. And the answer is always accompanied by what it
 * could not establish, because a detector trained before a generator existed
 * will be confidently wrong about that generator's output, and a resident told
 * their own photograph is fake on that basis has been failed by the service.
 */

export type OriginAnswer =
  /** A validated signature says a machine made it. As close to proof as this gets. */
  | "generated"
  /** The unsigned evidence points that way and little contradicts it. */
  | "likely-generated"
  /** More of the evidence points that way than against, without settling it. */
  | "leaning-generated"
  /** The evidence does not settle it. The honest answer for most images. */
  | "unclear"
  /** The evidence leans towards a camera. */
  | "likely-captured"
  /** A validated signature says a camera took it. */
  | "captured";

export interface OriginReason {
  /** What was found, in one clause. */
  text: string;
  /** How far it moved the answer, in log-odds. Sign says which way. */
  weight: number;
  /** Whether it is signed, structural or statistical — its order of evidence. */
  kind: "signed" | "metadata" | "model" | "structural";
}

export interface OriginAssessment {
  answer: OriginAnswer;
  /** The service's own estimate that this is AI-generated, 0 to 1. */
  probability: number;
  /** How much the estimate rests on, in words the reader can act on. */
  confidence: "high" | "moderate" | "low";
  headline: string;
  detail: string;
  /** Everything that pushed towards generated, strongest first. */
  towardsGenerated: OriginReason[];
  /** Everything that pushed towards a camera, strongest first. */
  towardsCaptured: OriginReason[];
  /** What this answer cannot establish. Always present, never conditional. */
  limits: string;
}

/**
 * The starting assumption, before any evidence.
 *
 * Most images reaching a scam checker are screenshots and photographs, not
 * generated pictures, so an image about which nothing can be established
 * should not come back at even odds. Stated as a constant rather than buried
 * in a threshold so it can be argued with: it is a judgement about this
 * service's traffic, not a measured rate.
 */
const PRIOR = 0.18;

/** Log-odds contribution of each piece of evidence. */
const WEIGHTS = {
  /** An unsigned tag naming a generator. Strong, and trivially forged. */
  generatorNamed: 2.2,
  /** Content Credentials that do not validate. Suspicious, not conclusive. */
  untrustedManifest: 0.5,
  /** A validated manifest that says nothing about how the image was made. */
  signedSilent: -0.3,
  /** A full camera record: make, model and the exposure the shutter used. */
  cameraRecord: -1.6,
  /** Only make and model, without the exposure a real capture writes. */
  partialCameraRecord: -0.7,
  /** Coordinates. Generators do not write them; cameras and phones do. */
  location: -0.7,
  /** The camera's own embedded preview, which generators do not produce. */
  thumbnail: -0.5,
  /** A lens is named. Software rarely bothers to invent one. */
  lens: -0.5,
} as const;

/**
 * How much the classifier is allowed to move the answer.
 *
 * Its raw score is damped and then clamped. Damped because these detectors are
 * trained to be decisive and report 0.99 on images they are simply wrong
 * about; clamped because no statistical read of pixels should be able to reach
 * a verdict by itself. At the limit the model can carry an image from the
 * prior to "leaning generated" and no further — enough to be worth showing,
 * not enough to convict on.
 */
const MODEL_DAMPING = 0.6;
const MODEL_CEILING = 2.2;

function logit(p: number): number {
  const bounded = Math.min(0.999, Math.max(0.001, p));
  return Math.log(bounded / (1 - bounded));
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** The headline for each band, and what it commits the service to. */
const COPY: Record<OriginAnswer, { headline: string; detail: string }> = {
  generated: {
    headline: "Yes — this image says so itself, and the claim checks out",
    detail:
      "The image carries Content Credentials that validate cryptographically and state it was produced by software rather than captured by a camera. This is the strongest evidence of origin that exists, because it cannot be written by anyone but the tool that made the picture.",
  },
  "leaning-generated": {
    headline: "Possibly — the evidence leans that way but is thin",
    detail:
      "Rather more of what could be read points to this having been generated than to it having been photographed, but the margin is not wide and none of the evidence is signed. The most common cause of a reading like this one is a detection model that is confident about an image it has never seen the like of before. Do not act on this alone; check where the picture came from.",
  },
  "likely-generated": {
    headline: "Probably — but nothing here proves it",
    detail:
      "More of the evidence points to this having been generated than photographed. None of it is signed, so none of it is proof: the metadata that names a generator can be written by anybody, and the model that reads the pixels was trained before some of today's generators existed. Treat this as a reason to check the picture's source rather than as a finding.",
  },
  unclear: {
    headline: "Cannot be established either way",
    detail:
      "There is not enough in this file to answer the question. That is the ordinary result and not a suspicious one: every messaging app and social network strips the information that would settle it, so most genuine photographs arrive here carrying nothing at all. An image that cannot be shown to be generated has not been shown to be real.",
  },
  "likely-captured": {
    headline: "Probably a real photograph",
    detail:
      "The file carries the record a camera writes when it takes a picture, and nothing contradicts it. That record can be copied onto a generated image by somebody who wants it to look genuine, so this is a reasonable reading of the evidence rather than a guarantee.",
  },
  captured: {
    headline: "No — a signature says a camera took it",
    detail:
      "The image carries Content Credentials that validate cryptographically and state it was captured by a camera or scanner. That is a signed claim from the device that made it, and it is the strongest assurance of origin available.",
  },
};

const LIMITS =
  "No detector is right every time, and this one is honest about which parts of its answer are which. A cryptographic signature is close to proof. Metadata naming a generator is a strong hint that anybody can write or delete. The on-device model is a statistical read of the pixels by a detector trained on the generators that existed when it was built — it is regularly wrong about newer ones, in both directions. Nothing here can rule out a generated image that had a camera's metadata copied onto it, and nothing here examines whether a genuine photograph shows something that never happened.";

/**
 * Combines every origin signal on one file into a single answer.
 *
 * Pure and synchronous, like the rule set it sits beside: given the same
 * readings it returns the same assessment, which is what lets it be tested and
 * what stops the answer drifting between two checks of the same image.
 */
export function assessOrigin(file: MediaDescriptor): OriginAssessment | null {
  if (file.kind !== "image") {
    return null;
  }

  const towardsGenerated: OriginReason[] = [];
  const towardsCaptured: OriginReason[] = [];

  const signed = signedAnswer(file.provenance);

  if (signed) {
    return signed;
  }

  let odds = logit(PRIOR);

  const add = (reason: OriginReason) => {
    odds += reason.weight;
    (reason.weight > 0 ? towardsGenerated : towardsCaptured).push(reason);
  };

  if (file.provenance?.status === "hinted-ai") {
    add({
      kind: "metadata",
      weight: WEIGHTS.generatorNamed,
      text: `The file's own metadata names ${file.provenance.generator ?? "an image generator"}. This tag is not signed, so it is strong evidence and forgeable evidence at the same time.`,
    });
  }

  if (file.provenance?.status === "untrusted") {
    add({
      kind: "metadata",
      weight: WEIGHTS.untrustedManifest,
      text: "The image carries Content Credentials that do not validate, so something about it changed after they were attached or they were never issued by a recognised signer.",
    });
  }

  if (file.provenance?.status === "signed") {
    add({
      kind: "signed",
      weight: WEIGHTS.signedSilent,
      text: "A valid signature is attached but says nothing about how the image was made. Its presence is mildly reassuring; its silence on this question is not evidence.",
    });
  }

  addModel(file.synthetic, add);
  addCameraEvidence(file.metadata, add);

  const probability = sigmoid(odds);
  const answer = band(probability);
  const evidence = [...towardsGenerated, ...towardsCaptured].reduce(
    (total, reason) => total + Math.abs(reason.weight),
    0,
  );

  return {
    answer,
    probability,
    confidence: evidence >= 2.4 ? "high" : evidence >= 1.1 ? "moderate" : "low",
    ...COPY[answer],
    towardsGenerated: towardsGenerated.sort((a, b) => b.weight - a.weight),
    towardsCaptured: towardsCaptured.sort((a, b) => a.weight - b.weight),
    limits: LIMITS,
  };
}

/**
 * A validated manifest settles the question, so it short-circuits the sum.
 *
 * Folding a signature into the same log-odds as a statistical guess would let
 * enough weak evidence outvote a cryptographic one, which is not how these two
 * kinds of evidence relate.
 */
function signedAnswer(provenance: Provenance | undefined): OriginAssessment | null {
  if (provenance?.status === "declared-ai") {
    return {
      answer: "generated",
      probability: 0.99,
      confidence: "high",
      ...COPY.generated,
      towardsGenerated: [
        {
          kind: "signed",
          weight: 6,
          text: provenance.detail,
        },
      ],
      towardsCaptured: [],
      limits: LIMITS,
    };
  }

  if (provenance?.status === "declared-capture") {
    return {
      answer: "captured",
      probability: 0.02,
      confidence: "high",
      ...COPY.captured,
      towardsGenerated: [],
      towardsCaptured: [
        {
          kind: "signed",
          weight: -6,
          text: provenance.detail,
        },
      ],
      limits: LIMITS,
    };
  }

  return null;
}

function addModel(synthetic: SyntheticRead | undefined, add: (reason: OriginReason) => void): void {
  if (!synthetic || synthetic.unavailable) {
    return;
  }

  const raw = logit(synthetic.probability) * MODEL_DAMPING;
  const weight = Math.max(-MODEL_CEILING, Math.min(MODEL_CEILING, raw));

  /* A reading sitting near the middle is the model declining to answer. Adding
     a near-zero weight would clutter the reasoning with a non-finding. */
  if (Math.abs(weight) < 0.2) {
    return;
  }

  const percent = Math.round(synthetic.probability * 100);

  add({
    kind: "model",
    weight,
    text:
      weight > 0
        ? `An image-detection model running on this device put the picture at ${percent}% generated. Its opinion is weighted down here, because detectors of this kind are trained to be decisive and are confidently wrong about generators newer than themselves.`
        : `An image-detection model running on this device put the picture at ${percent}% generated, which is a reading against this having been made by software. It is weighted as an opinion rather than a finding.`,
  });
}

/**
 * What a camera leaves behind, and what its absence is worth.
 *
 * Absence is worth nothing and contributes nothing — not a small penalty, not
 * a nudge. Every mainstream platform strips this metadata on upload, so an
 * image with none is the overwhelmingly ordinary case, and letting that push
 * the answer even slightly towards "generated" would mean leaning towards
 * "fake" on almost every genuine screenshot this service is sent.
 */
function addCameraEvidence(
  meta: FileMetadata | undefined,
  add: (reason: OriginReason) => void,
): void {
  const exif = meta?.exif;

  if (!exif?.present) {
    return;
  }

  const device = [exif.make, exif.model].filter(Boolean).join(" ");

  if (device && exif.exposure) {
    add({
      kind: "metadata",
      weight: WEIGHTS.cameraRecord,
      text: `The file carries a camera's own record of taking the picture — ${device}, at ${exif.exposure}. Generators do not produce exposure settings, though they can be copied onto a generated file afterwards.`,
    });
  } else if (device) {
    add({
      kind: "metadata",
      weight: WEIGHTS.partialCameraRecord,
      text: `The file names ${device} as the device that made it, but carries none of the exposure settings a camera writes alongside that name.`,
    });
  }

  if (exif.lens) {
    add({ kind: "metadata", weight: WEIGHTS.lens, text: `A lens is named: ${exif.lens}.` });
  }

  if (exif.gps) {
    add({
      kind: "metadata",
      weight: WEIGHTS.location,
      text: "The file records the coordinates where the picture was taken. Image generators do not write these.",
    });
  }

  if (exif.thumbnail) {
    add({
      kind: "structural",
      weight: WEIGHTS.thumbnail,
      text: "The file carries the small preview image a camera embeds when it saves a photograph.",
    });
  }
}

/**
 * Where each probability lands, given that the prior itself is 0.18.
 *
 * The unclear band is deliberately wide and deliberately contains the prior:
 * an image about which nothing could be established has to come back as "we
 * could not tell", not as a soft accusation and not as a clearance. The upper
 * boundaries are set so that the classifier at full confidence, with nothing
 * else agreeing with it, cannot on its own reach the top band.
 */
function band(probability: number): OriginAnswer {
  if (probability >= 0.8) return "likely-generated";
  if (probability >= 0.5) return "leaning-generated";
  if (probability >= 0.05) return "unclear";
  return "likely-captured";
}
