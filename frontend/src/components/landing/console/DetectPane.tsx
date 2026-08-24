import { useState } from "react";
import { Link2, ScanSearch, ShieldAlert } from "lucide-react";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { SegmentedControl, type Segment } from "@/components/settings/SegmentedControl";
import {
  CHECKED_MESSAGE,
  INDICATORS,
  SEVERITY_LABEL,
  SEVERITY_STROKE,
  SEVERITY_TEXT,
  SEVERITY_TINT,
  type Severity,
} from "@/components/landing/console/deviceData";
import { ControlLabel, GlyphObject, HeroRing, PaneHero } from "@/components/landing/console/paneParts";
import { cn } from "@/lib/cn";

const SEVERITIES: readonly Segment<Severity>[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Clear" },
];

/**
 * The submitted message, drawn as the object the pane is about.
 *
 * The accessory pane opens with a picture of the thing being configured. Here
 * that is the text someone pasted in, so it is shown as a message rather than
 * as a glyph — a reader recognises the shape of a scam SMS before they have
 * read a word of it, and that recognition is the whole point of the screen.
 */
function MessageObject() {
  return (
    <span className="relative inline-block w-[10.5rem] shrink-0">
      <span
        aria-hidden="true"
        className="absolute inset-x-4 bottom-[-6px] h-3 rounded-[50%] bg-slate-900/20 blur-[6px] dark:bg-black/50"
      />
      <span className="relative block rounded-[0.875rem] rounded-bl-[0.25rem] bg-ui-card p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_20px_-12px_rgba(0,0,0,0.35)]">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden="true" />
          <span className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-ui-label-3">
            SMS · unknown number
          </span>
        </span>
        <span className="mt-1 block text-[0.6875rem] leading-[1.35] text-ui-label-2 [display:-webkit-box] [overflow:hidden] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {CHECKED_MESSAGE}
        </span>
      </span>
    </span>
  );
}

/**
 * The checker, as a settings pane.
 *
 * The segmented control filters by severity rather than switching mode,
 * because a risk read is not a mode — but it is a list nobody reads all of,
 * and the first question anyone asks of it is "what were the bad ones". The
 * control opens on High for that reason.
 */
export function DetectPane() {
  const [severity, setSeverity] = useState<Severity>("high");
  const shown = INDICATORS.filter((indicator) => indicator.severity === severity);

  return (
    <>
      <PaneHero
        rings={
          <>
            <HeroRing value={87} caption="risk" trackClassName={SEVERITY_STROKE.high} />
            <HeroRing value={91} caption="confidence" />
          </>
        }
      >
        <MessageObject />
        <GlyphObject icon={Link2} gradient="from-sky-400 to-cyan-600" size={64} />
      </PaneHero>

      <SettingsGroup footer="Advisory only. The checker shows its reasoning so you can weigh it yourself; it never decides for you.">
        <SettingsRow
          label="Verdict"
          value={<span className="font-medium text-rose-500">Very likely a scam</span>}
          chevron
        />
      </SettingsGroup>

      <div>
        <ControlLabel>Indicator severity</ControlLabel>
        <SegmentedControl
          segments={SEVERITIES}
          value={severity}
          onChange={setSeverity}
          label="Filter indicators by severity"
        />
      </div>

      <SettingsGroup
        title={`${SEVERITY_LABEL[severity]} indicators`}
        action={
          <span className="text-[0.8125rem] text-ui-label-2">
            {shown.length} of {INDICATORS.length}
          </span>
        }
      >
        <SettingsRows inset={52}>
          {shown.map((indicator) => (
            <SettingsRow
              key={indicator.label}
              icon={ShieldAlert}
              iconClassName={cn(SEVERITY_TINT[indicator.severity])}
              label={indicator.label}
              detail={indicator.detail}
              value={
                <span className={cn("text-[0.9375rem]", SEVERITY_TEXT[indicator.severity])}>
                  {SEVERITY_LABEL[indicator.severity]}
                </span>
              }
            />
          ))}
          <SettingsRow
            icon={ScanSearch}
            label="Check a message of your own"
            emphasis="tint"
            chevron
          />
        </SettingsRows>
      </SettingsGroup>
    </>
  );
}
