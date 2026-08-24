import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Mail } from "lucide-react";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { SegmentedControl, type Segment } from "@/components/settings/SegmentedControl";
import {
  ALERT_CATEGORIES,
  MODERATION_STREAM,
  SEVERITY_LABEL,
  SEVERITY_TEXT,
  SEVERITY_TINT,
  SUBSCRIBER_CEILING,
} from "@/components/landing/console/deviceData";
import { ControlLabel, GlyphObject, HeroRing, PaneHero } from "@/components/landing/console/paneParts";
import { useInterval } from "@/hooks/useInterval";
import { cn } from "@/lib/cn";

const CATEGORY_SEGMENTS: readonly Segment<string>[] = ALERT_CATEGORIES.map((category) => ({
  value: category.label,
  label: category.label,
}));

const VISIBLE_LINES = 3;
const STREAM_INTERVAL_MS = 2600;

/**
 * The moderation ticker.
 *
 * Kept to three lines and driven by an index rather than a growing array: the
 * pane cannot scroll, so a feed that accumulates would push the card off the
 * bottom of the device within a minute. Cycling a fixed window shows the same
 * thing — that a queue is moving — and stays the same height forever.
 */
function ModerationStream({ animated }: { animated: boolean }) {
  const [head, setHead] = useState(0);

  useInterval(
    () => setHead((current) => (current + 1) % MODERATION_STREAM.length),
    animated ? STREAM_INTERVAL_MS : null,
  );

  const lines = Array.from({ length: VISIBLE_LINES }, (_, offset) => {
    const index = (head + offset) % MODERATION_STREAM.length;
    return { index, entry: MODERATION_STREAM[index] };
  });

  return (
    <ul className="flex flex-col">
      <AnimatePresence initial={false} mode="popLayout">
        {lines.map(({ index, entry }, position) =>
          entry ? (
            <motion.li
              key={index}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1 - position * 0.22, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-3 px-4 py-[0.5625rem]"
            >
              <span
                aria-hidden="true"
                className={cn("h-1.5 w-1.5 shrink-0 rounded-full", SEVERITY_TINT[entry.tone])}
              />
              <span className="min-w-0 flex-1 truncate text-[0.9375rem] leading-tight text-ui-label">
                {entry.text}
              </span>
            </motion.li>
          ) : null,
        )}
      </AnimatePresence>
    </ul>
  );
}

/**
 * The alerts feed, as a settings pane.
 *
 * The segmented control is the category a resident subscribes to, which is the
 * one decision this screen actually asks them to make — so switching it swaps
 * both the published alert and the subscriber ring above it, and the pane
 * answers "what would I get, and who else gets it" in a single tap.
 */
export function AlertsPane({ animated }: { animated: boolean }) {
  const [label, setLabel] = useState(ALERT_CATEGORIES[0]?.label ?? "Impersonation");
  const category = ALERT_CATEGORIES.find((entry) => entry.label === label) ?? ALERT_CATEGORIES[0];

  if (!category) {
    return null;
  }

  const reach = Math.round((category.subscribers / SUBSCRIBER_CEILING) * 100);

  return (
    <>
      <PaneHero
        rings={
          <>
            <HeroRing value={reach} caption="of subscribers" trackClassName="stroke-amber-500" />
            <HeroRing value={100} caption="de-identified" trackClassName="stroke-emerald-500" />
          </>
        }
      >
        <GlyphObject icon={Bell} gradient="from-amber-300 to-amber-500" size={62} />
        <GlyphObject icon={Mail} gradient="from-sky-400 to-sky-600" size={62} />
      </PaneHero>

      <div>
        <ControlLabel>Alert category</ControlLabel>
        <SegmentedControl
          segments={CATEGORY_SEGMENTS}
          value={label}
          onChange={setLabel}
          label="Choose an alert category"
        />
      </div>

      <SettingsGroup
        title="Latest published alert"
        action={<span className="text-[0.8125rem] text-ui-label-2">{category.reference}</span>}
        footer="Reports are reviewed by a Council officer and stripped of anything identifying before an alert is published."
      >
        <SettingsRows inset={52}>
          <SettingsRow
            icon={category.icon}
            iconClassName={category.tint}
            label={category.headline}
            detail={category.summary}
            chevron
          />
          <SettingsRow
            label={`Seen on ${category.channel}`}
            detail={category.published}
            value={
              <span className={cn("text-[0.9375rem]", SEVERITY_TEXT[category.severity])}>
                {SEVERITY_LABEL[category.severity]}
              </span>
            }
          />
        </SettingsRows>
      </SettingsGroup>

      <SettingsGroup title="Moderation queue">
        <ModerationStream animated={animated} />
      </SettingsGroup>
    </>
  );
}
