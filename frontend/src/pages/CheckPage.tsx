import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, ScanSearch, ShieldCheck, ShieldQuestion } from "lucide-react";
import { analyse } from "@/lib/scam/analyse";
import type { Analysis, Channel, RiskBand } from "@/lib/scam/types";
import { ROUTES } from "@/config/site";
import { ActionLink } from "@/components/ui/ActionLink";
import { Pill } from "@/components/ui/Pill";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** FR14 — the channels a submission can be attributed to. */
const CHANNELS: { value: Channel; label: string }[] = [
  { value: "sms", label: "Text message" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone call" },
  { value: "website", label: "Website" },
  { value: "social", label: "Social media" },
  { value: "other", label: "Other" },
];

const BAND_STYLES: Record<
  RiskBand,
  { ring: string; text: string; chip: string; Icon: typeof ShieldCheck }
> = {
  high: {
    ring: "stroke-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    Icon: AlertTriangle,
  },
  medium: {
    ring: "stroke-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Icon: ShieldQuestion,
  },
  low: {
    ring: "stroke-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    Icon: ShieldCheck,
  },
  unclear: {
    ring: "stroke-slate-400",
    text: "text-slate-600 dark:text-slate-300",
    chip: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
    Icon: ShieldQuestion,
  },
};

const WEIGHT_CHIP: Record<string, string> = {
  high: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

/** Circumference of the r=42 gauge, so the score can be drawn as a dash offset. */
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 42;

function ScoreGauge({ analysis }: { analysis: Analysis }) {
  const style = BAND_STYLES[analysis.band];
  const offset = GAUGE_CIRCUMFERENCE * (1 - analysis.score / 100);

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="7" className="stroke-slate-200 dark:stroke-white/10" />
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          className={style.ring}
          strokeDasharray={GAUGE_CIRCUMFERENCE}
          initial={{ strokeDashoffset: GAUGE_CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-display text-2xl font-bold tabular-nums", style.text)}>
          {analysis.score}
        </span>
        <span className="text-[0.625rem] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          risk score
        </span>
      </div>
    </div>
  );
}

/**
 * FR13–FR24. The scam checker.
 *
 * The analysis runs in the browser against `@/lib/scam`, so a result comes back
 * without the submitted message leaving the device — which is why no account is
 * required and why the page can promise that nothing is stored. The same module
 * is written to run unchanged on the server once submissions need to be
 * retained for FR24 matching.
 */
export function CheckPage() {
  const [text, setText] = useState("");
  const [channel, setChannel] = useState<Channel>("sms");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => text.trim().length > 0, [text]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      setError("Paste the message you want checked.");
      return;
    }

    setError(null);
    setPending(true);

    /*
     * A deliberate beat before the result. The analysis itself is synchronous
     * and returns in under a millisecond; showing a verdict that fast reads as
     * though nothing was examined, and the result is more likely to be trusted
     * than considered.
     */
    window.setTimeout(() => {
      setAnalysis(analyse({ text, channel }));
      setPending(false);
    }, 450);
  };

  const style = analysis ? BAND_STYLES[analysis.band] : null;

  return (
    <section className="relative z-10 py-section">
      <div className="container">
        <header className="flex max-w-2xl flex-col items-start gap-4">
          <Pill>
            <ScanSearch className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400" aria-hidden="true" />
            Scam checker
          </Pill>
          <h1 className="display-depth text-balance font-display text-display-2 font-bold text-slate-900 dark:text-white">
            Paste it here and see what the indicators say.
          </h1>
          <p className="text-lede text-slate-600 dark:text-slate-400">
            Works for a text message, an email, a link or a transcript of a call.
            You do not need an account, and the message is analysed on your own
            device — it is not sent to Council or stored anywhere.
          </p>
        </header>

        <div className="mt-section-gap grid gap-6 lg:grid-cols-2">
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="check-channel"
                className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400"
              >
                How did it reach you?
              </label>
              <select
                id="check-channel"
                value={channel}
                onChange={(event) => setChannel(event.target.value as Channel)}
                className="glass-surface rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200"
              >
                {CHANNELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="check-text"
                className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400"
              >
                The message
              </label>
              <textarea
                id="check-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={10}
                placeholder="Paste the whole message, including any link."
                aria-invalid={error !== null}
                aria-describedby={error ? "check-error" : undefined}
                className="glass-surface resize-y rounded-xl px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-slate-700 placeholder:text-slate-400 dark:text-slate-200"
              />
              {error ? (
                <p id="check-error" role="alert" className="text-caption text-rose-500">
                  {error}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="interactive inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 disabled:opacity-70 dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Analysing
                </>
              ) : (
                <>
                  <ScanSearch className="h-4 w-4" aria-hidden="true" />
                  Check this message
                </>
              )}
            </button>
          </form>

          {/* Results. `aria-live` so a screen reader hears the verdict arrive. */}
          <div aria-live="polite" className="min-h-[12rem]">
            <AnimatePresence mode="wait">
              {analysis && style ? (
                <motion.div
                  key={`${analysis.score}-${analysis.indicators.length}`}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="glass-surface flex flex-col gap-5 rounded-2xl p-6"
                >
                  <div className="flex items-start gap-5">
                    <ScoreGauge analysis={analysis} />
                    <div className="min-w-0">
                      <p className={cn("font-display text-display-3 font-semibold", style.text)}>
                        {analysis.headline}
                      </p>
                      <p className="mt-2 text-copy text-slate-600 dark:text-slate-400">
                        {analysis.summary}
                      </p>
                      <p className="mt-3 font-mono text-caption text-slate-500 dark:text-slate-400">
                        confidence {analysis.confidence.toFixed(2)} · advisory only
                      </p>
                    </div>
                  </div>

                  {analysis.indicators.length > 0 ? (
                    <div>
                      <h2 className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Why — {analysis.indicators.length}{" "}
                        {analysis.indicators.length === 1 ? "signal" : "signals"}
                      </h2>
                      <ul className="mt-3 flex flex-col divide-y divide-slate-900/[0.06] dark:divide-white/10">
                        {analysis.indicators.map((indicator) => (
                          <li key={indicator.id} className="flex items-start gap-3 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {indicator.label}
                              </p>
                              <p className="mt-0.5 text-copy text-slate-600 dark:text-slate-400">
                                {indicator.detail}
                              </p>
                              {indicator.evidence ? (
                                <p className="mt-1 truncate font-mono text-[0.6875rem] text-slate-500 dark:text-slate-400">
                                  {indicator.evidence}
                                </p>
                              ) : null}
                            </div>
                            <span
                              className={cn(
                                "shrink-0 rounded-md border px-2 py-0.5 text-[0.625rem] font-semibold uppercase",
                                WEIGHT_CHIP[indicator.weight],
                              )}
                            >
                              {indicator.weight}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {/*
                   * Ethical requirement, stated at the point of the verdict
                   * rather than only in a policy page — this is the moment a
                   * reader is deciding how much authority to give the result.
                   */}
                  <p className="rounded-xl border border-slate-900/[0.06] bg-slate-900/[0.03] p-3 text-caption leading-relaxed text-slate-600 dark:border-white/10 dark:bg-black/20 dark:text-slate-400">
                    This is general guidance based on the text you provided, not a
                    professional assessment, and it cannot guarantee that a
                    message is safe or unsafe. If money has already changed hands,
                    contact your bank first and then use the{" "}
                    <a
                      href={ROUTES.recover}
                      className="font-medium text-indigo-600 underline underline-offset-4 dark:text-cyan-400"
                    >
                      recovery checklist
                    </a>
                    .
                  </p>

                  <ActionLink href={ROUTES.reportScam} variant="secondary">
                    Report this to Council
                  </ActionLink>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
