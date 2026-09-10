import { AlertTriangle, ShieldCheck, ShieldQuestion, type LucideIcon } from "lucide-react";
import type { AiVerdict } from "@/lib/ai/types";
import type { RiskBand } from "@/lib/scam/types";

/**
 * Presentation for AI verdicts, in the same colour language the rule-based
 * report uses — so a reader comparing the two is comparing meanings, not
 * learning a second palette. Every verdict also carries an icon and a word:
 * no information is carried by colour alone (WCAG 1.4.1).
 */
export const VERDICT_STYLE: Record<AiVerdict, { label: string; chip: string; text: string; Icon: LucideIcon }> = {
  likely_scam: {
    label: "Likely a scam",
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    text: "text-rose-600 dark:text-rose-400",
    Icon: AlertTriangle,
  },
  suspicious: {
    label: "Suspicious",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    text: "text-amber-600 dark:text-amber-400",
    Icon: ShieldQuestion,
  },
  likely_genuine: {
    label: "Likely genuine",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-600 dark:text-emerald-400",
    Icon: ShieldCheck,
  },
  unclear: {
    label: "Unclear",
    chip: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
    text: "text-slate-600 dark:text-slate-300",
    Icon: ShieldQuestion,
  },
};

/** The rule band an AI verdict corresponds to, for the agreement line. */
export const VERDICT_BAND: Record<AiVerdict, RiskBand> = {
  likely_scam: "high",
  suspicious: "medium",
  likely_genuine: "low",
  unclear: "unclear",
};

export function humanise(value: string): string {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
