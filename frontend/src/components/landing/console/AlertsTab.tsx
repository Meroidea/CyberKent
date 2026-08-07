import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Chip, LiveDot, Panel } from "@/components/landing/console/primitives";
import { useInterval } from "@/hooks/useInterval";

interface StreamRow {
  id: number;
  time: string;
  text: string;
  tone: "info" | "warn" | "ok";
}

const STREAM_TEMPLATES: Omit<StreamRow, "id" | "time">[] = [
  { text: "report HCC-2408-121 received · delivery SMS", tone: "info" },
  { text: "indicator match · number seen in 4 prior reports", tone: "warn" },
  { text: "alert AL-0342 approved for publication", tone: "ok" },
  { text: "reporter details removed before publishing", tone: "ok" },
  { text: "duplicate detected · merged into HCC-2408-116", tone: "info" },
  { text: "subscription digest sent · Craigieburn region", tone: "info" },
  { text: "new lookalike domain added to watchlist", tone: "warn" },
];

const SUBSCRIPTIONS = [
  { label: "Impersonation", count: 4120 },
  { label: "Investment", count: 2874 },
  { label: "Marketplace", count: 2255 },
  { label: "Remote access", count: 1408 },
];

const TONE_ACCENT = { info: "indigo", warn: "amber", ok: "emerald" } as const;

function clockLabel(offsetSeconds: number): string {
  const base = 9 * 3600 + 42 * 60;
  const total = base + offsetSeconds;
  const hours = Math.floor(total / 3600) % 24;
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

const VISIBLE_ROWS = 6;

/** Seeded newest-first, matching the order rows are rendered in. */
const INITIAL_ROWS: StreamRow[] = STREAM_TEMPLATES.slice(0, 5)
  .map((template, index) => ({ ...template, id: index, time: clockLabel(index * 17) }))
  .reverse();

/** Append-only feed; rows fade with age and the list is capped so it never grows. */
export function AlertsTab({ animated }: { animated: boolean }) {
  const [rows, setRows] = useState<StreamRow[]>(INITIAL_ROWS);
  // Ids come from a monotonic counter rather than the head of the list, which
  // would repeat an id already held further down and collide on the React key.
  const nextIdRef = useRef(INITIAL_ROWS.length);

  const appendRow = useCallback(() => {
    const id = nextIdRef.current;
    nextIdRef.current += 1;

    const template = STREAM_TEMPLATES[id % STREAM_TEMPLATES.length];

    if (!template) {
      return;
    }

    setRows((current) =>
      [{ ...template, id, time: clockLabel(id * 17) }, ...current].slice(0, VISIBLE_ROWS),
    );
  }, []);

  useInterval(appendRow, animated ? 2200 : null);

  return (
    <div className="grid grid-cols-[1.3fr_1fr] gap-3">
      <Panel
        title="Moderation stream"
        meta={
          <span className="flex items-center gap-1.5">
            <LiveDot /> live
          </span>
        }
      >
        <ul className="flex flex-col gap-1">
          <AnimatePresence mode="popLayout" initial={false}>
            {rows.map((row, index) => (
              <motion.li
                key={row.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1 - index * 0.14, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-2 rounded-lg border border-slate-200/70 px-2 py-1.5 dark:border-white/5"
              >
                <span className="font-mono text-[10px] text-slate-400">{row.time}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-700 dark:text-slate-300">
                  {row.text}
                </span>
                <Chip accent={TONE_ACCENT[row.tone]}>{row.tone}</Chip>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </Panel>

      <div className="flex flex-col gap-3">
        <Panel title="Published alert" meta="AL-0342">
          <p className="text-[11px] font-semibold text-slate-900 dark:text-white">
            Fake toll notice demanding immediate payment
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Reviewed and de-identified before publication. Residents in
            Broadmeadows and Dallas have reported the same wording since Monday.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip accent="rose">High severity</Chip>
            <Chip accent="indigo">SMS</Chip>
            <Chip accent="emerald">Verified</Chip>
          </div>
        </Panel>

        <Panel title="Category subscriptions" meta="residents opted in">
          <ul className="flex flex-col gap-2">
            {SUBSCRIPTIONS.map((subscription, index) => (
              <li key={subscription.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-700 dark:text-slate-300">{subscription.label}</span>
                  <span className="font-mono text-slate-400">
                    {subscription.count.toLocaleString("en-AU")}
                  </span>
                </div>
                <span className="block h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <motion.span
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: subscription.count / 4500 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: index * 0.08, ease: "easeOut" }}
                    style={{ originX: 0 }}
                    className="block h-full w-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                  />
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
