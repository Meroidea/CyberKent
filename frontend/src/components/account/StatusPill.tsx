import type { ReportStatus } from "@/lib/account/types";
import { STATUS } from "@/lib/report/labels";
import { cn } from "@/lib/cn";

/** A report's state as a coloured dot and a word — legible without the colour. */
export function StatusPill({ status, className }: { status: ReportStatus; className?: string }) {
  const meta = STATUS[status];

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-ui-fill px-2.5 py-1 text-[0.8125rem] font-medium", meta.text, className)}>
      <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", meta.tint)} />
      {meta.label}
    </span>
  );
}
