import type { ReportStatus } from "@/lib/account/types";
import { OFFICER_STATUS, PRIORITY, SEVERITY } from "@/lib/council/labels";
import type { PriorityBand, Severity } from "@/lib/council/types";
import { STATUS } from "@/lib/report/labels";
import { cn } from "@/lib/cn";

/** A report's state in the officer's words, with the resident screen's colour for it. */
export function OfficerStatus({ status, className }: { status: ReportStatus; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-ui-fill px-2.5 py-1 text-[0.75rem] font-medium", STATUS[status].text, className)}>
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", STATUS[status].tint)} />
      {OFFICER_STATUS[status]}
    </span>
  );
}

/** Severity as bars and a word — readable in greyscale and by a screen reader. */
export function SeverityBadge({ severity, className }: { severity: Severity | null; className?: string }) {
  if (!severity) {
    return <span className={cn("inline-flex items-center whitespace-nowrap text-[0.75rem] text-ui-label-3", className)}>Not triaged</span>;
  }

  const meta = SEVERITY[severity];

  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-[0.75rem] font-medium", meta.text, className)}>
      <span aria-hidden="true" className="flex items-end gap-[2px]">
        {[1, 2, 3].map((bar) => (
          <span key={bar} className={cn("w-[3px] rounded-full", bar <= meta.bars ? meta.dot : "bg-ui-fill-strong")} style={{ height: 4 + bar * 3 }} />
        ))}
      </span>
      {meta.label}
    </span>
  );
}

/**
 * The queue's priority as a ring filled to the score, with the number inside.
 * The reasons travel with it as its accessible name, so the ordering is never
 * a bare number to someone who cannot see the ring.
 */
export function PriorityRing({ score, band, reasons, size = 40 }: { score: number; band: PriorityBand; reasons: string[]; size?: number }) {
  const radius = size / 2 - 3;
  const circumference = 2 * Math.PI * radius;
  const meta = PRIORITY[band];

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Priority ${score} of 100, ${meta.label.toLowerCase()}${reasons.length ? `: ${reasons.join(", ")}` : ""}`}
      title={reasons.join(" · ")}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={3} className="stroke-ui-fill-strong" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          className={meta.ring}
          strokeDasharray={`${(Math.max(score, 2) / 100) * circumference} ${circumference}`}
        />
      </svg>
      <span className={cn("absolute text-[0.75rem] font-semibold tabular-nums", meta.text)}>{score}</span>
    </span>
  );
}
