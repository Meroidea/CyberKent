import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Lock, RefreshCw, Sparkles, WifiOff } from "lucide-react";
import { requestImageAnalysis, requestTextAnalysis } from "@/lib/ai/api";
import { toStrippedDataUrl } from "@/lib/ai/image";
import type { AiImageAnalysis, AiResult, AiTextAnalysis } from "@/lib/ai/types";
import type { Analysis, Submission } from "@/lib/scam/types";
import { ApiError } from "@/lib/api/client";
import { AiTextResult } from "@/components/ai/AiTextResult";
import { AiImageResult } from "@/components/ai/AiImageResult";
import { useAiStatus } from "@/components/ai/useAiStatus";

/** Images sent per check. Each is a paid vision call; two covers a conversation screenshot pair. */
const MAX_IMAGES = 2;

type Phase = "idle" | "working" | "done" | "failed";

interface ImageOutcome {
  name: string;
  response?: AiResult<AiImageAnalysis>;
  error?: string;
}

/**
 * The OpenAI second opinion, offered beneath the rule-based verdict.
 *
 * Opt-in by design. The rule-based check runs entirely on the device, and the
 * checker promises as much; asking the AI sends the message to a third party
 * outside Australia. That is a real change in where the resident's data goes,
 * so it happens only when they choose it, after being told plainly what will be
 * sent and what will not (ETH-6, APP 8, ER-15).
 */
export function AiSecondOpinion({
  analysis,
  submission,
  files,
}: {
  analysis: Analysis;
  submission: Submission;
  files: File[];
}) {
  const { status } = useAiStatus();
  const [phase, setPhase] = useState<Phase>("idle");
  const [text, setText] = useState<AiResult<AiTextAnalysis> | null>(null);
  const [images, setImages] = useState<ImageOutcome[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* The message as the rules read it: what was typed plus what was read out of
     any screenshot, so the model sees the same words the rules did. */
  const corpus = [submission.text.trim(), ...(submission.media ?? []).map((file) => file.extractedText?.trim() ?? "")]
    .filter(Boolean)
    .join("\n\n");

  const imageFiles = files
    .filter((_, index) => submission.media?.[index]?.metadata?.detected?.family === "image")
    .slice(0, MAX_IMAGES);

  const canAnalyseText = corpus.length >= 12;
  const hasSomething = canAnalyseText || imageFiles.length > 0;

  const run = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("working");
    setError(null);
    setText(null);
    setImages([]);

    const textJob = canAnalyseText
      ? requestTextAnalysis(corpus, submission.channel, analysis, controller.signal)
      : Promise.resolve(null);

    const imageJobs = imageFiles.map(async (file): Promise<ImageOutcome> => {
      try {
        const image = await toStrippedDataUrl(file);
        return {
          name: file.name,
          response: await requestImageAnalysis(image, submission.text.trim() || undefined, controller.signal),
        };
      } catch (failure) {
        return { name: file.name, error: failure instanceof Error ? failure.message : "This image could not be analysed." };
      }
    });

    try {
      const [textResult, imageResults] = await Promise.all([textJob, Promise.all(imageJobs)]);

      if (controller.signal.aborted) {
        return;
      }

      setText(textResult);
      setImages(imageResults);

      if (!textResult && imageResults.every((outcome) => outcome.error)) {
        throw new ApiError(imageResults[0]?.error ?? "The AI second opinion is unavailable right now.", 503);
      }

      setPhase("done");
    } catch (failure) {
      if (failure instanceof DOMException && failure.name === "AbortError") {
        return;
      }

      setError(failure instanceof Error ? failure.message : "The AI second opinion is unavailable right now.");
      setPhase("failed");
    }
  };

  if (!hasSomething) {
    return null;
  }

  const unavailable = status !== null && !status.available;

  return (
    <section
      aria-labelledby="ai-second-opinion-title"
      className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.06] via-transparent to-cyan-500/[0.06] p-4 sm:p-5 dark:border-cyan-400/20"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-600/20">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="ai-second-opinion-title" className="text-sm font-semibold text-slate-900 dark:text-white">
            AI second opinion
          </h3>
          <p className="mt-0.5 text-caption text-slate-600 dark:text-slate-400">
            A second reader, powered by OpenAI, that looks for manipulation tactics and emotional pressure
            {imageFiles.length > 0 ? " and examines your screenshots" : ""}.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {phase === "idle" ? (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4">
            {unavailable ? (
              <p className="flex items-start gap-2 rounded-xl bg-slate-900/[0.04] px-3 py-2.5 text-caption text-slate-600 dark:bg-white/[0.04] dark:text-slate-400">
                <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                The AI second opinion is unavailable right now. The result above is complete on its own.
              </p>
            ) : (
              <>
                <p className="flex items-start gap-2 text-caption leading-relaxed text-slate-600 dark:text-slate-400">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    Only if you choose: the message text{imageFiles.length > 0 ? " and your screenshots, with their location and camera data removed," : ""} will be
                    sent to OpenAI in the United States. Card, account and ID numbers are masked first. Council does not
                    store the message, and OpenAI is asked not to keep it.
                  </span>
                </p>
                <button
                  type="button"
                  onClick={run}
                  disabled={status === null}
                  className="interactive mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-indigo-500/40 bg-white/70 px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:border-indigo-500 disabled:opacity-60 sm:w-auto dark:border-cyan-400/40 dark:bg-white/[0.04] dark:text-cyan-300"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Ask the AI for a second opinion
                </button>
              </>
            )}
          </motion.div>
        ) : null}

        {phase === "working" ? (
          <motion.div
            key="working"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex flex-col gap-2"
            role="status"
            aria-live="polite"
          >
            <p className="flex items-center gap-2 text-caption font-medium text-indigo-700 dark:text-cyan-300">
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Asking OpenAI{imageFiles.length > 0 ? " to read the message and look at your screenshots" : " to read the message"}…
            </p>
            {[0.9, 0.7, 0.8].map((width) => (
              <div
                key={width}
                className="h-3 animate-pulse rounded-full bg-slate-900/[0.07] motion-reduce:animate-none dark:bg-white/10"
                style={{ width: `${width * 100}%` }}
                aria-hidden="true"
              />
            ))}
          </motion.div>
        ) : null}

        {phase === "done" ? (
          <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col gap-4" aria-live="polite">
            {text ? <AiTextResult response={text} ruleBand={analysis.band} /> : null}

            {images.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                <h4 className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  What the AI sees in your screenshots
                </h4>
                {images.map((outcome) =>
                  outcome.response ? (
                    <AiImageResult key={outcome.name} name={outcome.name} response={outcome.response} />
                  ) : (
                    <p key={outcome.name} className="text-caption text-slate-500">
                      {outcome.name}: {outcome.error}
                    </p>
                  ),
                )}
              </div>
            ) : null}

            <p className="rounded-xl bg-slate-900/[0.04] px-3 py-2 text-[0.6875rem] leading-relaxed text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
              AI can be wrong, in either direction. This is general guidance, not a professional assessment. When the AI
              and the rules disagree, act on the more cautious result.
            </p>
          </motion.div>
        ) : null}

        {phase === "failed" ? (
          <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4" role="alert">
            <p className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-caption text-amber-800 dark:text-amber-300">
              <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
            <button
              type="button"
              onClick={run}
              className="interactive mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-white/10 dark:text-slate-300"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
