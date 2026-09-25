import { CheckCircle2, Quote } from "lucide-react";
import type { AiResult, AiTextAnalysis } from "@/lib/ai/types";
import type { RiskBand } from "@/lib/scam/types";
import { humanise, VERDICT_BAND, VERDICT_STYLE } from "@/components/ai/aiStyles";
import { cn } from "@/lib/cn";

const SECTION_HEADING =
  "text-[0.8125rem] font-semibold text-ui-label-2";

const PRESSURE_WIDTH: Record<AiTextAnalysis["sentiment"]["pressure_level"], string> = {
  none: "w-0",
  low: "w-1/4",
  moderate: "w-1/2",
  high: "w-full",
};

/** Whether the two readers agree, stated in words a person can act on. */
function agreement(ruleBand: RiskBand, aiBand: RiskBand): { tone: "agree" | "higher" | "lower"; text: string } {
  const rank: Record<RiskBand, number> = { unclear: 0, low: 1, medium: 2, high: 3 };

  if (rank[aiBand] === rank[ruleBand]) {
    return { tone: "agree", text: "The AI reached the same conclusion as the rule-based check." };
  }

  if (rank[aiBand] > rank[ruleBand]) {
    return {
      tone: "higher",
      text: "The AI rates this as riskier than the rule-based check did. Treat it with the more cautious of the two.",
    };
  }

  return {
    tone: "lower",
    text: "The AI rates this as less risky than the rule-based check. The rules name specific warning signs — do not ignore them because the AI is less concerned.",
  };
}

/**
 * The NLP second opinion: verdict, the manipulation tactics with the words that
 * show them, the emotional pressure the message applies (sentiment analysis),
 * and what the model thinks may be genuine.
 *
 * The agreement line is the most important element here. Two readers that
 * disagree is information, and the rule for resolving it is stated rather than
 * left to the reader: take the more cautious one.
 */
export function AiTextResult({ response, ruleBand }: { response: AiResult<AiTextAnalysis>; ruleBand: RiskBand }) {
  const { result, usage, redactions } = response;
  const style = VERDICT_STYLE[result.verdict];
  const verdictAgreement = agreement(ruleBand, VERDICT_BAND[result.verdict]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em]",
            style.chip,
          )}
        >
          <style.Icon className="h-3 w-3" aria-hidden="true" />
          {style.label}
        </span>
        <span className={cn("font-display text-2xl font-bold tabular-nums", style.text)}>
          {result.risk_score}
          <span className="text-sm font-medium text-slate-400">/100</span>
        </span>
        <span className="font-mono text-caption text-slate-500 dark:text-slate-400">
          confidence {result.confidence.toFixed(2)} · {humanise(result.scam_type)}
        </span>
      </div>

      <p
        className={cn(
          "rounded-xl border px-3 py-2 text-caption leading-relaxed",
          verdictAgreement.tone === "agree"
            ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-800 dark:text-emerald-300"
            : "border-amber-500/30 bg-amber-500/[0.08] text-amber-800 dark:text-amber-300",
        )}
      >
        {verdictAgreement.text}
      </p>

      <p className="text-copy text-slate-700 dark:text-slate-300">{result.explanation}</p>

      {result.tactics.length > 0 ? (
        <div>
          <h4 className={SECTION_HEADING}>Manipulation tactics — {result.tactics.length}</h4>
          <ul className="mt-2 flex flex-col divide-y divide-slate-900/[0.06] dark:divide-white/10">
            {result.tactics.map((tactic) => (
              <li key={`${tactic.tactic}-${tactic.evidence}`} className="py-2.5">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{tactic.tactic}</p>
                <p className="mt-0.5 text-copy text-slate-600 dark:text-slate-400">{tactic.explanation}</p>
                <p className="mt-1 flex items-start gap-1.5 break-words font-mono text-[0.6875rem] text-slate-500 dark:text-slate-400">
                  <Quote className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                  {tactic.evidence}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h4 className={SECTION_HEADING}>Emotional pressure (sentiment)</h4>
        <div className="mt-2 flex items-center gap-3 text-caption text-slate-600 dark:text-slate-400">
          <span className="w-28 shrink-0">Pressure: {result.sentiment.pressure_level}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10" aria-hidden="true">
            <div className={cn("h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500", PRESSURE_WIDTH[result.sentiment.pressure_level])} />
          </div>
        </div>
        {result.sentiment.emotions.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-1.5" aria-label="Emotions the message tries to provoke">
            {result.sentiment.emotions.map((emotion) => (
              <li key={emotion.emotion} className="flex items-center gap-3 text-caption text-slate-600 dark:text-slate-400">
                <span className="w-28 shrink-0 capitalize">{emotion.emotion}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                    style={{ width: `${Math.round(emotion.intensity * 100)}%` }}
                  />
                </div>
                <span className="w-9 text-right font-mono tabular-nums">{emotion.intensity.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-caption text-slate-500">The message does not try to provoke any strong emotion. Overall tone: {result.sentiment.overall}.</p>
        )}
      </div>

      {result.genuine_signals.length > 0 ? (
        <div>
          <h4 className={SECTION_HEADING}>What could suggest it is genuine</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-copy text-slate-600 dark:text-slate-400">
            {result.genuine_signals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.recommended_actions.length > 0 ? (
        <div>
          <h4 className={SECTION_HEADING}>Suggested next steps</h4>
          <ol className="mt-2 flex flex-col gap-1.5">
            {result.recommended_actions.map((action) => (
              <li key={action} className="flex items-start gap-2 text-copy text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500 dark:text-cyan-400" aria-hidden="true" />
                {action}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <p className="font-mono text-[0.6875rem] text-slate-400 dark:text-slate-500">
        CyberSafe AI · answered in {(usage.latency_ms / 1000).toFixed(1)}s
        {redactions > 0 ? ` · ${redactions} sensitive ${redactions === 1 ? "number" : "numbers"} masked before sending` : ""}
      </p>
    </div>
  );
}
