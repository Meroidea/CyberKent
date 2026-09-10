import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AtSign,
  Globe2,
  MessageSquare,
  Phone,
  ScanSearch,
  ShieldCheck,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import { analyse } from "@/lib/scam/analyse";
import { describeFiles } from "@/lib/scam/ocr";
import type { Analysis, Channel, MediaDescriptor } from "@/lib/scam/types";
import { AnalysisReport } from "@/components/check/AnalysisReport";
import { MediaDropzone } from "@/components/check/MediaDropzone";
import {
  MODAL_SCAN_DURATION_MS,
  MODAL_SCAN_STAGE_MS,
  SCAN_STAGES,
  SCAN_STILL_MS,
  useScanStage,
} from "@/components/check/scanStages";
import { HAS_WEBGL, ScanGlobe } from "@/components/globe/ScanGlobe";
import { holdScroll } from "@/lib/smoothScroll";
import { EASE_OUT_EXPO, springSoft } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** FR14 — the channels a submission can be attributed to. */
const CHANNELS: { value: Channel; label: string; Icon: typeof MessageSquare }[] = [
  { value: "sms", label: "Text message", Icon: Smartphone },
  { value: "email", label: "Email", Icon: AtSign },
  { value: "phone", label: "Phone call", Icon: Phone },
  { value: "website", label: "Website", Icon: Globe2 },
  { value: "social", label: "Social media", Icon: Users },
  { value: "other", label: "Something else", Icon: MessageSquare },
];

/**
 * Shortest submission worth running the rules over.
 *
 * The same floor the analyser uses before it returns "not enough to assess".
 * Catching it here means a reader is told what to do about it while they are
 * still in the field, rather than after a five-second wait for a non-verdict.
 */
const MINIMUM_LENGTH = 12;

type Phase = "form" | "scanning" | "report";

interface FieldErrors {
  channel?: string;
  text?: string;
}

/**
 * Reading images takes as long as it takes.
 *
 * The globe hold is a minimum rather than a duration: whichever of the two
 * finishes last decides when the verdict appears, so a check with three
 * screenshots in it does not cut the recognition short, and one with none still
 * gets the full five seconds it was designed around.
 */
async function atLeast<T>(work: Promise<T>, ms: number): Promise<T> {
  const [result] = await Promise.all([work, new Promise((resolve) => setTimeout(resolve, ms))]);
  return result;
}

/** Everything inside the panel that a keyboard can land on. */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function CheckModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("form");
  const [channel, setChannel] = useState<Channel | null>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [reading, setReading] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaDescriptor[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  /* Where focus was before the dialog took it, so it can be handed back. */
  const openerRef = useRef<HTMLElement | null>(null);
  /*
   * Identifies the check currently in flight. Recognition is asynchronous and
   * can outlive the dialog it was started from, so every resolve checks that it
   * is still the run the component is waiting on before it writes a verdict.
   */
  const runRef = useRef(0);

  const prefersReducedMotion = useReducedMotion();
  /*
   * The globe is the wait. Where it cannot run — no WebGL, or a reader who has
   * asked for less motion — there is nothing to watch, so the hold collapses to
   * a short beat rather than becoming five seconds of a still image.
   */
  const canWatch = HAS_WEBGL && !prefersReducedMotion;
  const holdMs = canWatch ? MODAL_SCAN_DURATION_MS : SCAN_STILL_MS;

  const stage = useScanStage(
    phase === "scanning",
    canWatch ? MODAL_SCAN_STAGE_MS : SCAN_STILL_MS / SCAN_STAGES.length,
  );

  /* Holds the page still beneath the dialog, through the smoothing rather than
     around it, so releasing cannot leave Lenis stopped. */
  useEffect(() => {
    if (!open) {
      return;
    }

    openerRef.current = document.activeElement as HTMLElement | null;
    const release = holdScroll();

    return () => {
      release();
      openerRef.current?.focus?.();
    };
  }, [open]);

  /* Opening is a fresh check; the previous verdict is not re-shown, and any
     recognition still running from the last one is disowned. */
  useEffect(() => {
    if (!open) {
      return;
    }

    runRef.current += 1;
    setPhase("form");
    setChannel(null);
    setText("");
    setFiles([]);
    setMedia([]);
    setReading(null);
    setErrors({});
    setAnalysis(null);
  }, [open]);

  useEffect(() => {
    if (!open || phase !== "form") {
      return;
    }

    /* After the entrance, so the panel is in place before focus moves into it. */
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [open, phase]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      /*
       * Focus is kept inside the panel by hand. The page behind is inert to the
       * eye but not to the tab key, and a dialog a reader can tab out of —
       * behind its own backdrop — is one they cannot get back into.
       */
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null,
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onKeyDown]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = text.trim();
    const next: FieldErrors = {};

    if (!channel) {
      next.channel = "Choose how it reached you.";
    }

    /*
     * Either half of the form satisfies the requirement on its own. Insisting
     * on pasted text alongside an attachment would defeat the point of
     * accepting one: the common case is a screenshot and nothing else.
     */
    if (files.length === 0) {
      if (trimmed.length === 0) {
        next.text = "Paste the message, or attach a screenshot, photo or file to check.";
      } else if (trimmed.length < MINIMUM_LENGTH) {
        next.text = "That is too short to check — paste the whole message, including any link.";
      }
    }

    setErrors(next);

    if (Object.keys(next).length > 0) {
      return;
    }

    runRef.current += 1;
    const run = runRef.current;

    setPhase("scanning");
    setReading(null);

    /*
     * A deliberate hold before the verdict. The analysis itself is synchronous
     * and returns in under a millisecond; a result that fast reads as though
     * nothing was examined, and is more likely to be trusted than considered.
     * Reading attachments is genuinely slow, so the hold is a floor under it
     * rather than a wait beside it.
     */
    void atLeast(
      describeFiles(files, (_, name) => setReading(name)),
      holdMs,
    ).then((described) => {
      if (run !== runRef.current) {
        return;
      }

      setMedia(described);
      setAnalysis(analyse({ text, channel: channel!, media: described }));
      setReading(null);
      setPhase("report");
    });
  };

  const checkAnother = () => {
    runRef.current += 1;
    setPhase("form");
    setText("");
    setFiles([]);
    setMedia([]);
    setReading(null);
    setChannel(null);
    setErrors({});
    setAnalysis(null);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="check-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
          onClick={onClose}
          /*
           * The overlay itself does not scroll — the panel's body does. When it
           * did, a tall form slid the whole dialog up underneath the fixed
           * masthead, which reads as the modal being cropped by the page it is
           * supposed to be sitting above.
           *
           * The top padding is the masthead's 4rem plus room, so the panel is
           * bounded by space the header does not occupy rather than merely
           * starting below it.
           *
           * On a phone the panel is a bottom sheet instead of a centred card —
           * the Lecturer asked for the interface to be mobile friendly, and a
           * floating card on a 390px screen spent a sixth of it on a gap above
           * the dialog. Anchored to the bottom edge, the form sits where the
           * thumb already is and the keyboard pushes it up rather than over it.
           */
          className="fixed inset-0 z-[80] flex items-end justify-center px-0 pb-0 pt-14 sm:items-center sm:px-6 sm:pb-8 sm:pt-28 bg-slate-900/40 backdrop-blur-xl dark:bg-black/60"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="check-modal-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.2 } }}
            transition={springSoft}
            onClick={(event) => event.stopPropagation()}
            className="glass-surface flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-t-3xl shadow-2xl sm:rounded-3xl"
          >
            {/* The sheet's grab handle — a phone convention that says "this is a
                layer over the page", shown only where the panel is a sheet. */}
            <span aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-900/15 sm:hidden dark:bg-white/20" />
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-900/[0.06] px-5 py-4 sm:px-7 sm:py-5 dark:border-white/10">
              <div className="min-w-0">
                <p className="font-mono text-caption uppercase tracking-[0.2em] text-indigo-600 dark:text-cyan-400">
                  Scam checker
                </p>
                <h2
                  id="check-modal-title"
                  className="mt-1 font-display text-display-3 font-bold text-slate-900 dark:text-white"
                >
                  {phase === "report" ? "What the indicators say" : "Check a message"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close the scam checker"
                className="interactive flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:text-slate-400 dark:hover:border-cyan-400/40 dark:hover:text-cyan-400"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* The only scrolling element in the dialog. `min-h-0` is what lets
                it actually shrink inside the flex column rather than pushing the
                panel past the height it was capped at. */}
            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7"
              /* The page beneath is held still, so the wheel has to reach here. */
              data-lenis-prevent
            >
              <AnimatePresence mode="wait">
                {phase === "form" ? (
                <motion.form
                  key="form"
                  id="check-modal-form"
                  onSubmit={onSubmit}
                  noValidate
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.18 } }}
                  className="flex flex-col gap-5"
                >
                  <fieldset>
                    <legend className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      How did it reach you? <span className="text-rose-500">*</span>
                    </legend>
                    <div
                      /* A grid on a phone, where six chips otherwise wrap two,
                         two, one, one and read as a broken row rather than a
                         set. Wide enough and they lay out on their own. */
                      className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
                      role="radiogroup"
                      aria-label="How did it reach you?"
                      aria-invalid={Boolean(errors.channel)}
                      aria-describedby={errors.channel ? "check-channel-error" : undefined}
                    >
                      {CHANNELS.map(({ value, label, Icon }) => {
                        const selected = channel === value;

                        return (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => {
                              setChannel(value);
                              setErrors((current) => ({ ...current, channel: undefined }));
                            }}
                            className={cn(
                              "interactive inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-medium sm:justify-start sm:px-3.5",
                              selected
                                ? "border-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-600/20 dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950"
                                : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:text-cyan-300",
                            )}
                          >
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {errors.channel ? (
                      <p id="check-channel-error" role="alert" className="mt-2 text-caption text-rose-500">
                        {errors.channel}
                      </p>
                    ) : null}
                  </fieldset>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <label
                        htmlFor="check-modal-text"
                        className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400"
                      >
                        The message{" "}
                        {files.length === 0 ? (
                          <span className="text-rose-500">*</span>
                        ) : (
                          <span className="font-normal normal-case tracking-normal text-slate-400">
                            (optional — you have attached a file)
                          </span>
                        )}
                      </label>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "font-mono text-[0.6875rem] tabular-nums",
                          text.trim().length >= MINIMUM_LENGTH
                            ? "text-slate-400 dark:text-slate-500"
                            : "text-slate-300 dark:text-slate-600",
                        )}
                      >
                        {text.trim().length} characters
                      </span>
                    </div>
                    <textarea
                      id="check-modal-text"
                      ref={textareaRef}
                      value={text}
                      onChange={(event) => {
                        setText(event.target.value);
                        setErrors((current) => ({ ...current, text: undefined }));
                      }}
                      rows={4}
                      required
                      placeholder="Paste the whole message, including any link."
                      aria-invalid={Boolean(errors.text)}
                      aria-describedby={errors.text ? "check-modal-error" : "check-modal-privacy"}
                      className="glass-surface max-h-56 resize-y rounded-xl px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-slate-700 placeholder:text-slate-400 dark:text-slate-200"
                    />
                    {errors.text ? (
                      <p id="check-modal-error" role="alert" className="text-caption text-rose-500">
                        {errors.text}
                      </p>
                    ) : null}
                  </div>

                  <MediaDropzone files={files} onChange={setFiles} />

                </motion.form>
              ) : null}

              {phase === "scanning" ? (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                  aria-busy="true"
                  className="flex flex-col items-center gap-4"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
                    aria-hidden="true"
                    className="h-[min(34svh,17rem)] w-full"
                  >
                    <ScanGlobe scanning className="h-full w-full" />
                  </motion.div>

                  <div className="flex w-full flex-col items-center gap-3 text-center">
                    <p
                      role="status"
                      aria-live="polite"
                      className="font-mono text-caption uppercase tracking-[0.2em] text-indigo-600 dark:text-cyan-400"
                    >
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={stage}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.24 }}
                          className="inline-block"
                        >
                          {SCAN_STAGES[stage]}
                        </motion.span>
                      </AnimatePresence>
                    </p>

                    {/* Named while it happens: reading three screenshots takes
                        long enough that an unchanging caption looks stuck. */}
                    {reading ? (
                      <p className="max-w-full truncate text-caption text-slate-500 dark:text-slate-400">
                        Reading {reading}
                      </p>
                    ) : null}

                    {/* Progress, so the hold reads as bounded rather than hung. */}
                    <div
                      aria-hidden="true"
                      className="h-1 w-56 max-w-full overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10"
                    >
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: holdMs / 1000, ease: "linear" }}
                        style={{ transformOrigin: "left" }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400"
                      />
                    </div>

                    <p className="max-w-xs text-caption text-slate-500 dark:text-slate-400">
                      Matching what you pasted against the indicators reported across Hume.
                    </p>
                  </div>
                </motion.div>
              ) : null}

              {phase === "report" && analysis ? (
                <motion.div
                  key="report"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.18 } }}
                  aria-live="polite"
                >
                  <AnalysisReport
                    analysis={analysis}
                    submission={{ text, channel: channel ?? "other", media }}
                    files={files}
                    onCheckAnother={checkAnother}
                  />
                </motion.div>
              ) : null}
              </AnimatePresence>
            </div>

            {/*
             * Pinned rather than scrolled to.
             *
             * The primary action stays on screen while the reader works down a
             * long form — on a phone the channel chips, the message and the
             * dropzone are already more than a screen, and a submit button at
             * the bottom of that is a button most people never see.
             *
             * `form` associates it with the form it sits outside of, which is
             * what lets the layout be a column of three fixed regions.
             */}
            {phase === "form" ? (
              <div className="shrink-0 border-t border-slate-900/[0.06] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-7 sm:pb-4 dark:border-white/10">
                <button
                  type="submit"
                  form="check-modal-form"
                  className="interactive inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950"
                >
                  <ScanSearch className="h-4 w-4" aria-hidden="true" />
                  Check this
                </button>
                <p
                  id="check-modal-privacy"
                  className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-caption text-slate-500 dark:text-slate-400"
                >
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Checked on your own device. Nothing is sent to Council or stored.
                </p>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
