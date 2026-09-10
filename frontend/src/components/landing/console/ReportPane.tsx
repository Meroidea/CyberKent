import { useState } from "react";
import { FileText, Flag, Image as ImageIcon, Inbox, Paperclip } from "lucide-react";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { SegmentedControl, type Segment } from "@/components/settings/SegmentedControl";
import {
  REPORT_QUEUE,
  REPORT_STATES,
  SEVERITY_LABEL,
  SEVERITY_TEXT,
  SEVERITY_TINT,
  type ReportState,
} from "@/components/landing/console/deviceData";
import { ControlLabel, GlyphObject, HeroRing, PaneHero } from "@/components/landing/console/paneParts";
import { cn } from "@/lib/cn";

const STATE_SEGMENTS: readonly Segment<ReportState>[] = REPORT_STATES.map((state) => ({
  value: state,
  label: state,
}));

const EVIDENCE = [
  { icon: ImageIcon, label: "screenshot-01.png", meta: "1.2 MB", tint: "bg-violet-500" },
  { icon: Paperclip, label: "message-thread.txt", meta: "8 KB", tint: "bg-slate-500" },
];

/**
 * The report queue, as a settings pane.
 *
 * A report's state is the one thing a reporter actually wants from this
 * screen, so it is what the segmented control switches between — the queue is
 * short enough that a filter is faster than a search, and a resident who has
 * been asked for more information can find their own report in one tap.
 */
export function ReportPane() {
  const [state, setState] = useState<ReportState>("In review");
  const shown = REPORT_QUEUE.filter((report) => report.state === state);

  return (
    <>
      <PaneHero
        rings={
          <>
            <HeroRing value={94} caption="triaged under 48h" trackClassName="stroke-emerald-500" />
            <HeroRing value={31} caption="duplicates merged" trackClassName="stroke-violet-500" />
          </>
        }
      >
        <GlyphObject icon={FileText} gradient="from-rose-400 to-rose-600" size={62} />
        <GlyphObject icon={Inbox} gradient="from-slate-400 to-slate-600" size={62} />
      </PaneHero>

      <SettingsGroup footer="Every state change is visible to the person who filed the report, and a report keeps the reference it was issued at submission.">
        <SettingsRow label="Reference" value="HCC-2408-118" chevron />
      </SettingsGroup>

      <div>
        <ControlLabel>Queue state</ControlLabel>
        <SegmentedControl
          segments={STATE_SEGMENTS}
          value={state}
          onChange={setState}
          label="Filter the review queue by state"
        />
      </div>

      <SettingsGroup
        title={state}
        action={
          <span className="text-[0.8125rem] text-ui-label-2">
            {shown.length} of {REPORT_QUEUE.length}
          </span>
        }
      >
        <SettingsRows inset={52}>
          {shown.map((report) => (
            <SettingsRow
              key={report.reference}
              icon={Flag}
              iconClassName={cn(SEVERITY_TINT[report.severity])}
              label={report.category}
              detail={`${report.reference} · ${report.received}`}
              value={
                <span className={cn("text-[0.9375rem]", SEVERITY_TEXT[report.severity])}>
                  {SEVERITY_LABEL[report.severity]}
                </span>
              }
            />
          ))}
        </SettingsRows>
      </SettingsGroup>

      <SettingsGroup title="Evidence">
        <SettingsRows inset={52}>
          {EVIDENCE.map((file) => (
            <SettingsRow
              key={file.label}
              icon={file.icon}
              iconClassName={file.tint}
              label={file.label}
              value={file.meta}
              chevron
            />
          ))}
        </SettingsRows>
      </SettingsGroup>
    </>
  );
}
