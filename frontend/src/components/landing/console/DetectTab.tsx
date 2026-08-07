import { useState } from "react";
import { motion } from "framer-motion";
import {
  Chip,
  LiveDot,
  Metric,
  Panel,
  RingGauge,
  seededSeries,
  type Accent,
} from "@/components/landing/console/primitives";
import { useInterval } from "@/hooks/useInterval";

const BAR_COUNT = 36;

const INDICATORS: { label: string; detail: string; accent: Accent }[] = [
  { label: "Urgency language", detail: "\"final notice\", \"within 2 hours\"", accent: "rose" },
  { label: "Lookalike domain", detail: "hume-rates-refund.online", accent: "rose" },
  { label: "Domain age", detail: "registered 4 days ago", accent: "amber" },
  { label: "Payment method", detail: "requests card details by link", accent: "amber" },
  { label: "Sender mismatch", detail: "display name ≠ sending domain", accent: "amber" },
  { label: "No prior reports", detail: "number not seen in Hume before", accent: "emerald" },
];

/** Live-ish check volume; a small random walk reads as organic, pure noise does not. */
function nextBars(bars: number[]): number[] {
  return bars.map((bar) => {
    const drift = (Math.random() - 0.5) * 0.28;
    return Math.min(1, Math.max(0.12, bar + drift));
  });
}

export function DetectTab({ animated }: { animated: boolean }) {
  const [bars, setBars] = useState<number[]>(() => seededSeries(41, BAR_COUNT));

  useInterval(() => setBars(nextBars), animated ? 900 : null);

  return (
    <div className="grid grid-cols-[1.15fr_1fr] gap-3">
      <div className="flex flex-col gap-3">
        <Panel
          title="Submitted content"
          meta={
            <span className="flex items-center gap-1.5">
              <LiveDot accent="amber" /> analysing
            </span>
          }
        >
          <p className="rounded-lg bg-slate-100/80 p-2.5 font-mono text-[11px] leading-relaxed text-slate-600 dark:bg-black/40 dark:text-slate-300">
            HUME COUNCIL: your rates refund of $482.10 could not be processed.
            Confirm your bank details within 2 hours or the refund will be
            cancelled: hume-rates-refund.online/claim
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Chip accent="violet">SMS</Chip>
            <Chip accent="indigo">Council impersonation</Chip>
            <Chip accent="cyan">Link included</Chip>
          </div>
        </Panel>

        <Panel title="Indicators found" meta={`${INDICATORS.length} signals`}>
          <ul className="flex flex-col gap-1.5">
            {INDICATORS.map((indicator, index) => (
              <motion.li
                key={indicator.label}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06, duration: 0.4 }}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/70 px-2 py-1.5 dark:border-white/5"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[11px] font-medium text-slate-800 dark:text-slate-200">
                    {indicator.label}
                  </span>
                  <span className="truncate font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {indicator.detail}
                  </span>
                </span>
                <Chip accent={indicator.accent}>
                  {indicator.accent === "rose"
                    ? "high"
                    : indicator.accent === "amber"
                      ? "medium"
                      : "clear"}
                </Chip>
              </motion.li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-col gap-3">
        <Panel title="Risk read" meta="explained, not just scored">
          <div className="flex items-center gap-4">
            <RingGauge label="risk score" value={87} accent="rose" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-rose-500">Very likely a scam</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                Two high-severity indicators and a payment request on a domain
                registered this week. Council does not request bank details to
                issue a refund.
              </p>
              <p className="mt-2 font-mono text-[10px] text-slate-400">confidence 0.91 · advisory only</p>
            </div>
          </div>
        </Panel>

        <Panel title="Checks submitted" meta="last 30 minutes">
          <div className="flex h-16 items-end gap-[3px]" aria-hidden="true">
            {bars.map((bar, index) => (
              <motion.span
                key={index}
                animate={{ scaleY: bar }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                style={{ originY: 1 }}
                className="h-full flex-1 rounded-sm bg-gradient-to-t from-indigo-500/70 to-cyan-400/70"
              />
            ))}
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-3">
          <Metric label="Checks today" value={1284} seed={7} accent="indigo" />
          <Metric label="Flagged high risk" value={19.4} precision={1} suffix="%" seed={19} accent="rose" />
        </div>
      </div>
    </div>
  );
}
