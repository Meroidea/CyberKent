import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Image as ImageIcon, Paperclip } from "lucide-react";
import { Chip, Panel, RingGauge } from "@/components/landing/console/primitives";
import { useInterval } from "@/hooks/useInterval";

const STAGES = [
  "Draft saved",
  "Submitted",
  "Reference issued",
  "Reviewer assigned",
  "Classified",
  "Alert considered",
] as const;

const QUEUE = [
  { reference: "HCC-2408-118", type: "Phishing email", severity: "High", state: "In review" },
  { reference: "HCC-2408-117", type: "Investment", severity: "High", state: "Info requested" },
  { reference: "HCC-2408-116", type: "Marketplace", severity: "Medium", state: "Verified" },
  { reference: "HCC-2408-115", type: "Remote access", severity: "High", state: "Verified" },
  { reference: "HCC-2408-113", type: "Delivery SMS", severity: "Low", state: "Duplicate" },
];

const EVIDENCE = [
  { icon: ImageIcon, label: "screenshot-01.png", meta: "1.2 MB" },
  { icon: FileText, label: "invoice-copy.pdf", meta: "340 KB" },
  { icon: Paperclip, label: "message-thread.txt", meta: "8 KB" },
];

export function ReportTab({ animated }: { animated: boolean }) {
  const [activeStage, setActiveStage] = useState(0);

  useInterval(
    () => setActiveStage((stage) => (stage + 1) % STAGES.length),
    animated ? 900 : null,
  );

  return (
    <div className="flex flex-col gap-3">
      <Panel title="Report lifecycle" meta="every step is visible to the reporter">
        <ol className="flex items-center gap-1">
          {STAGES.map((stage, index) => {
            const reached = index <= activeStage;

            return (
              <li key={stage} className="flex min-w-0 flex-1 items-center gap-1">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <motion.span
                    animate={{
                      backgroundColor: reached ? "rgb(99 102 241)" : "rgba(148,163,184,0.35)",
                    }}
                    transition={{ duration: 0.3 }}
                    className="block h-1 w-full rounded-full"
                  />
                  <span
                    className={`truncate text-[10px] font-medium transition-colors duration-300 ${
                      reached
                        ? "text-slate-800 dark:text-slate-100"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </Panel>

      <div className="grid grid-cols-[1.4fr_1fr] gap-3">
        <Panel title="Review queue" meta="assigned to Council officers">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                <th scope="col" className="pb-1.5 font-medium">Reference</th>
                <th scope="col" className="pb-1.5 font-medium">Category</th>
                <th scope="col" className="pb-1.5 font-medium">Severity</th>
                <th scope="col" className="pb-1.5 font-medium">State</th>
              </tr>
            </thead>
            <tbody>
              {QUEUE.map((row, index) => (
                <motion.tr
                  key={row.reference}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="border-t border-slate-200/70 text-[11px] dark:border-white/5"
                >
                  <td className="py-1.5 font-mono text-slate-500 dark:text-slate-400">{row.reference}</td>
                  <td className="py-1.5 text-slate-800 dark:text-slate-200">{row.type}</td>
                  <td className="py-1.5">
                    <Chip
                      accent={
                        row.severity === "High" ? "rose" : row.severity === "Medium" ? "amber" : "emerald"
                      }
                    >
                      {row.severity}
                    </Chip>
                  </td>
                  <td className="py-1.5 text-slate-600 dark:text-slate-400">{row.state}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="flex flex-col gap-3">
          <Panel title="Evidence" meta="access restricted, logged">
            <ul className="flex flex-col gap-1.5">
              {EVIDENCE.map((file) => (
                <li
                  key={file.label}
                  className="flex items-center gap-2 rounded-lg border border-slate-200/70 px-2 py-1.5 dark:border-white/5"
                >
                  <file.icon className="h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-cyan-400" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-700 dark:text-slate-300">
                    {file.label}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{file.meta}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Queue health" meta="rolling 7 days">
            <div className="flex items-center justify-around">
              <RingGauge label="triaged under 48h" value={94} accent="emerald" />
              <RingGauge label="duplicates merged" value={31} accent="violet" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
