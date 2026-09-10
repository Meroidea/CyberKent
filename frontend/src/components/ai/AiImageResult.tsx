import { Eye, Flag, Tag } from "lucide-react";
import type { AiImageAnalysis, AiResult } from "@/lib/ai/types";
import { humanise, VERDICT_STYLE } from "@/components/ai/aiStyles";
import { cn } from "@/lib/cn";

const SECTION_HEADING =
  "text-caption font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400";

/**
 * The vision second opinion on one image: what it is, which brands appear in
 * it, and the visual red flags that text recognition cannot see — a fake login
 * form, a spoofed sender name, a payment QR code.
 */
export function AiImageResult({ name, response }: { name: string; response: AiResult<AiImageAnalysis> }) {
  const { result, usage } = response;
  const style = VERDICT_STYLE[result.verdict];

  return (
    <div className="rounded-xl border border-slate-900/[0.08] bg-white/40 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center gap-2">
        <Eye className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-white" title={name}>
          {name}
        </p>
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.625rem] font-semibold uppercase", style.chip)}>
          <style.Icon className="h-3 w-3" aria-hidden="true" />
          {style.label} · {result.risk_score}
        </span>
      </div>

      <p className="mt-2 text-caption font-medium text-slate-500 dark:text-slate-400">
        Identified as: {humanise(result.image_type)}
      </p>
      <p className="mt-1 text-copy text-slate-700 dark:text-slate-300">{result.description}</p>

      {result.brands_detected.length > 0 ? (
        <div className="mt-3">
          <h4 className={SECTION_HEADING}>Brands and logos seen</h4>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {result.brands_detected.map((brand) => (
              <li
                key={`${brand.name}-${brand.context}`}
                className="inline-flex items-center gap-1 rounded-md border border-slate-900/[0.08] px-2 py-0.5 text-[0.6875rem] text-slate-600 dark:border-white/10 dark:text-slate-300"
              >
                <Tag className="h-3 w-3" aria-hidden="true" />
                {brand.name} <span className="text-slate-400">— {brand.context}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.visual_red_flags.length > 0 ? (
        <div className="mt-3">
          <h4 className={SECTION_HEADING}>Visual red flags — {result.visual_red_flags.length}</h4>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {result.visual_red_flags.map((flag) => (
              <li key={flag.flag} className="flex items-start gap-2 text-copy text-slate-700 dark:text-slate-300">
                <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden="true" />
                <span>
                  <span className="font-semibold">{flag.flag}.</span> {flag.explanation}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-3 text-copy text-slate-600 dark:text-slate-400">{result.explanation}</p>

      <p className="mt-2 font-mono text-[0.6875rem] text-slate-400 dark:text-slate-500">
        {usage.model} vision · confidence {result.confidence.toFixed(2)} · metadata removed before sending
      </p>
    </div>
  );
}
