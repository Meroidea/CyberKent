import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Metric, Panel, RingGauge } from "@/components/landing/console/primitives";
import { useInterval } from "@/hooks/useInterval";

const CHECKLIST_LINES = [
  "> recovery checklist · card details entered on a fake page",
  "1. call your bank now and ask for the card to be blocked",
  "2. change the password on the account you used to pay",
  "3. turn on two-factor authentication where it is offered",
  "4. keep the message — do not delete it, it is evidence",
  "5. report it here so the indicator is added to the watchlist",
  "6. report to Scamwatch and, if money was lost, to police",
  "7. watch for follow-up 'recovery' offers — those are scams too",
  "✓ checklist saved to your account · progress tracked",
];

const RESTART_DELAY_MS = 3400;
const LINE_DELAY_MS = 480;

/** Streams a recovery checklist line by line, then restarts after a pause. */
export function LearnTab({ animated }: { animated: boolean }) {
  const [visibleLines, setVisibleLines] = useState(animated ? 0 : CHECKLIST_LINES.length);
  const scrollRef = useRef<HTMLDivElement>(null);

  const complete = visibleLines >= CHECKLIST_LINES.length;

  useInterval(
    () => setVisibleLines((count) => Math.min(count + 1, CHECKLIST_LINES.length)),
    animated && !complete ? LINE_DELAY_MS : null,
  );

  useEffect(() => {
    if (!animated || !complete) {
      return;
    }

    const timer = window.setTimeout(() => setVisibleLines(0), RESTART_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [animated, complete]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [visibleLines]);

  return (
    <div className="grid grid-cols-[1.25fr_1fr] gap-3">
      <Panel title="Guided recovery" meta="ordered by urgency">
        <div
          ref={scrollRef}
          className="no-scrollbar h-[9.5rem] overflow-y-auto rounded-lg bg-slate-950/90 p-2.5 font-mono text-[10px] leading-relaxed text-emerald-300"
          data-lenis-prevent
        >
          {CHECKLIST_LINES.slice(0, visibleLines).map((line) => (
            <motion.p
              key={line}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={line.startsWith(">") ? "text-cyan-300" : line.startsWith("✓") ? "text-white" : ""}
            >
              {line}
            </motion.p>
          ))}
          <span
            aria-hidden="true"
            className="inline-block h-3 w-1.5 animate-caret-blink bg-emerald-300 align-middle"
          />
        </div>
      </Panel>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Guides published" value={38} seed={5} accent="violet" />
          <Metric label="Checklists started" value={612} seed={23} accent="cyan" />
        </div>

        <Panel title="Awareness coverage" meta="by audience">
          <div className="flex items-center justify-around">
            <RingGauge label="residents" value={88} accent="emerald" />
            <RingGauge label="small business" value={72} accent="cyan" />
            <RingGauge label="not-for-profit" value={64} accent="violet" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
