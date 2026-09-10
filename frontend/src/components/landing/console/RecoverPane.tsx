import { useState } from "react";
import { LifeBuoy, ListChecks } from "lucide-react";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { SegmentedControl, type Segment } from "@/components/settings/SegmentedControl";
import {
  RECOVERY_STEPS,
  RECOVERY_WINDOWS,
  type RecoveryWindow,
} from "@/components/landing/console/deviceData";
import { ControlLabel, GlyphObject, HeroRing, PaneHero } from "@/components/landing/console/paneParts";

const WINDOW_SEGMENTS: readonly Segment<RecoveryWindow>[] = RECOVERY_WINDOWS.map((window) => ({
  value: window,
  label: window,
}));

/**
 * The recovery checklist, as a settings pane.
 *
 * Segmented by when a step has to happen rather than by what kind of step it
 * is, because that is the only ordering that matters to someone who has just
 * lost money: a card can be stopped in the first hour and not afterwards. The
 * control opens on the first hour for the same reason.
 */
export function RecoverPane() {
  const [window, setWindow] = useState<RecoveryWindow>("First hour");
  const shown = RECOVERY_STEPS.filter((step) => step.window === window);

  return (
    <>
      <PaneHero
        rings={
          <>
            <HeroRing value={38} caption="checklist done" trackClassName="stroke-teal-500" />
            <HeroRing value={64} caption="guides read" trackClassName="stroke-sky-500" />
          </>
        }
      >
        <GlyphObject icon={LifeBuoy} gradient="from-teal-300 to-teal-600" size={62} />
        <GlyphObject icon={ListChecks} gradient="from-indigo-400 to-indigo-600" size={62} />
      </PaneHero>

      <div>
        <ControlLabel>When it matters</ControlLabel>
        <SegmentedControl
          segments={WINDOW_SEGMENTS}
          value={window}
          onChange={setWindow}
          label="Choose a recovery window"
        />
      </div>

      <SettingsGroup
        title={window}
        action={
          <span className="text-[0.8125rem] text-ui-label-2">
            {shown.length} of {RECOVERY_STEPS.length} steps
          </span>
        }
        footer="Nothing here needs an account. The checklist is written to be worked through in order, and the first three steps are the ones that get money back."
      >
        <SettingsRows inset={52}>
          {shown.map((step) => (
            <SettingsRow
              key={step.label}
              icon={step.icon}
              iconClassName={step.tint}
              label={step.label}
              detail={step.detail}
              chevron
            />
          ))}
          <SettingsRow label="Open the full recovery checklist" emphasis="tint" chevron />
        </SettingsRows>
      </SettingsGroup>
    </>
  );
}
