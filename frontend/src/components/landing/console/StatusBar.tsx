import { useMemo } from "react";
import { Wifi } from "lucide-react";

/** Drawn rather than taken from an icon set: the system glyph has a fill level. */
function BatteryGlyph({ level }: { level: number }) {
  const clamped = Math.max(0, Math.min(100, level));

  return (
    <svg viewBox="0 0 30 13" className="h-[0.8125rem] w-[1.875rem]" aria-hidden="true">
      <rect
        x="0.5"
        y="0.5"
        width="25"
        height="12"
        rx="3.5"
        fill="none"
        strokeWidth="1"
        className="stroke-ui-label-3"
      />
      <path d="M27.5 4.5v4a2.2 2.2 0 0 0 0-4Z" className="fill-ui-label-3" />
      <rect
        x="2"
        y="2"
        height="9"
        rx="2"
        width={Math.max(2, (clamped / 100) * 22)}
        className="fill-ui-label"
      />
    </svg>
  );
}

/**
 * The iPadOS status bar across the top of the screen.
 *
 * Read once at mount rather than ticked: a clock that updates is a timer
 * running for the whole time the page is open, on a decorative element that is
 * usually below the fold, and the only thing it buys is a minute hand nobody
 * is watching. Reading the real date at mount is still worth it — a hard-coded
 * one dates the mockup the moment the screenshot ages.
 *
 * The DEMO marker lives here, in the place a real device puts its own state,
 * because that is where someone looks to find out what they are looking at.
 */
export function StatusBar({ battery = 94 }: { battery?: number }) {
  const { time, date } = useMemo(() => {
    const now = new Date();

    return {
      time: new Intl.DateTimeFormat("en-AU", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
        .format(now)
        .replace(/\s/g, " ")
        .toLowerCase(),
      date: new Intl.DateTimeFormat("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(now),
    };
  }, []);

  return (
    <div className="flex shrink-0 items-center gap-2 px-5 pt-2 text-[0.75rem] font-semibold leading-none text-ui-label">
      <span className="tabular-nums">{time}</span>
      <span className="text-ui-label-2">{date}</span>

      <span
        title="An illustration of the CyberSafe service. Every figure on this screen is made up."
        className="ml-auto rounded-full bg-ui-fill px-2 py-[0.1875rem] text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-ui-label-2"
      >
        Demo
      </span>

      <Wifi className="h-[0.875rem] w-[0.875rem] text-ui-label" aria-hidden="true" />
      <span className="tabular-nums">{battery}%</span>
      <BatteryGlyph level={battery} />
    </div>
  );
}
