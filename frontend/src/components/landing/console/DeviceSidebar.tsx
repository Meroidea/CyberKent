import { useRef, useState, type ComponentType, type KeyboardEvent, type ReactNode } from "react";
import { Mic, Search } from "lucide-react";
import { LogoMark } from "@/components/brand/LogoMark";
import { Switch } from "@/components/settings/Switch";
import { SECTIONS, SIDEBAR_GROUPS, type SectionId } from "@/components/landing/console/deviceData";
import { SITE } from "@/config/site";
import { cn } from "@/lib/cn";

interface DeviceSidebarProps {
  activeId: SectionId;
  onSelect: (id: SectionId) => void;
  /** Drops the search field and the second group where the screen is narrow. */
  compact: boolean;
}

/**
 * The two densities the sidebar is drawn at.
 *
 * Not a scale factor. The console is already scaled onto its frame, so
 * shrinking it again would only make a 17px row into a blurry 15px one — what
 * the narrow box actually needs is the type set a step down and the tiles
 * drawn a step smaller, so the labels fit at full sharpness. Held as one
 * object because every measurement in it has to move together: a 15px label
 * beside a 28px tile is a row with a hole in it.
 */
const DENSITY = {
  regular: {
    row: "gap-3 px-2.5 py-[0.375rem]",
    tile: "h-[1.75rem] w-[1.75rem] rounded-[0.4375rem]",
    glyph: "h-[1.0625rem] w-[1.0625rem]",
    label: "text-[1.0625rem]",
    value: "text-[0.9375rem]",
  },
  compact: {
    row: "gap-2.5 px-2 py-[0.3125rem]",
    tile: "h-6 w-6 rounded-[0.375rem]",
    glyph: "h-[0.875rem] w-[0.875rem]",
    label: "text-[0.9375rem]",
    value: "text-[0.8125rem]",
  },
} as const;

type Density = (typeof DENSITY)[keyof typeof DENSITY];

interface RowProps {
  icon: ComponentType<{ className?: string }>;
  tint: string;
  label: string;
  value?: string;
  trailing?: ReactNode;
  selected?: boolean;
  density: Density;
  /** Present only on the rows that select a pane. Absent makes the row static. */
  onSelect?: () => void;
  tab?: { id: string; controls: string; onKeyDown: (event: KeyboardEvent) => void };
  buttonRef?: (node: HTMLButtonElement | null) => void;
}

/**
 * One row of the sidebar.
 *
 * A row is a `button` only when activating it does something. The state rows
 * below the sections do not navigate — and one of them contains a switch, so
 * making every row a button would nest a control inside a control, which is
 * both invalid and unusable with a screen reader.
 */
function Row({
  icon: Icon,
  tint,
  label,
  value,
  trailing,
  selected,
  density,
  onSelect,
  tab,
  buttonRef,
}: RowProps) {
  const body = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center text-white",
          density.tile,
          tint,
        )}
      >
        <Icon className={density.glyph} />
      </span>

      <span
        className={cn(
          "min-w-0 flex-1 truncate leading-tight",
          density.label,
          selected ? "font-medium text-ui-tint" : "text-ui-label",
        )}
      >
        {label}
      </span>

      {trailing}

      {value ? (
        <span className={cn("shrink-0 leading-tight text-ui-label-2", density.value)}>{value}</span>
      ) : null}
    </>
  );

  const shell = cn(
    "flex w-full items-center rounded-[0.625rem] text-left",
    density.row,
    selected ? "bg-ui-selected" : onSelect && "transition-colors duration-150 hover:bg-ui-fill",
  );

  if (!onSelect) {
    return <div className={shell}>{body}</div>;
  }

  return (
    <button
      type="button"
      ref={buttonRef}
      role={tab ? "tab" : undefined}
      id={tab?.id}
      aria-selected={tab ? selected : undefined}
      aria-controls={tab?.controls}
      tabIndex={tab && !selected ? -1 : undefined}
      onClick={onSelect}
      onKeyDown={tab?.onKeyDown}
      className={shell}
    >
      {body}
    </button>
  );
}

/**
 * The master column of the split view.
 *
 * A vertical tablist rather than a list of links. The device is one screen on
 * the landing page and nothing inside it navigates — but the rows do select
 * the pane beside them, which is precisely what a tab does, and saying so is
 * what lets a keyboard user arrow between the sections and then tab straight
 * into the pane, rather than tabbing through the whole index to reach it.
 *
 * The panel floats over the grouped background rather than sitting flush to
 * the bezel, which is how iPadOS draws a sidebar now, and is also what lets the
 * detail pane's ground run edge to edge behind it.
 *
 * The list is deliberately allowed to run past the bottom of the screen and be
 * clipped. A device is a window onto a longer list, and one whose index stops
 * exactly at the bottom edge reads as a drawing of a device.
 */
export function DeviceSidebar({ activeId, onSelect, compact }: DeviceSidebarProps) {
  /* The one control on the device that actually does something. It changes
     nothing but itself — but a switch that cannot be flipped is the detail
     that gives a mockup away, and this one costs a boolean. */
  const [subscribed, setSubscribed] = useState(true);
  const density = compact ? DENSITY.compact : DENSITY.regular;
  const groups = compact ? SIDEBAR_GROUPS.slice(0, 1) : SIDEBAR_GROUPS;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /*
   * A tablist takes one tab stop and the arrow keys move within it, which is
   * why the unselected rows carry `tabIndex={-1}`. That half alone would trap
   * a keyboard user on whichever section happens to be open — the roving
   * index and this handler are one mechanism and neither works without the
   * other.
   *
   * Selection follows focus, as it should where switching panes is free: the
   * panes are already rendered and nothing is fetched, so making someone press
   * Enter on each one would only add a keystroke per section.
   */
  const onTabKeyDown = (index: number) => (event: KeyboardEvent) => {
    const delta =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? -1
          : 0;

    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? SECTIONS.length - 1
          : delta
            ? (index + delta + SECTIONS.length) % SECTIONS.length
            : -1;

    if (next < 0) {
      return;
    }

    event.preventDefault();
    const section = SECTIONS[next];

    if (section) {
      onSelect(section.id);
      tabRefs.current[next]?.focus();
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden rounded-[1.375rem] bg-ui-sidebar p-2.5 backdrop-blur-xl">
      {!compact ? (
        <div className="flex items-center gap-2 rounded-[0.625rem] bg-ui-fill px-2.5 py-[0.4375rem]">
          <Search className="h-[1.0625rem] w-[1.0625rem] shrink-0 text-ui-label-3" aria-hidden="true" />
          <span className="flex-1 text-[1.0625rem] leading-tight text-ui-label-3">Search</span>
          <Mic className="h-[1.0625rem] w-[1.0625rem] shrink-0 text-ui-label-3" aria-hidden="true" />
        </div>
      ) : null}

      {/* The account card. In Settings this is the person; here it is who the
          service belongs to, which is the fact a resident most needs to be
          sure of before they hand over a screenshot of their bank texts. */}
      <div className={cn("flex items-center rounded-ui bg-ui-card py-2.5", density.row)}>
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-ui-fill",
            compact ? "h-6 w-6" : "h-9 w-9",
          )}
        >
          <LogoMark className={compact ? "h-[0.9375rem] w-auto" : "h-[1.375rem] w-auto"} glint={false} />
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "block truncate font-semibold leading-tight text-ui-label",
              compact ? "text-[0.75rem]" : "text-[0.9375rem]",
            )}
          >
            {SITE.owner}
          </span>
          <span
            className={cn(
              "mt-0.5 block truncate leading-tight text-ui-label-2",
              compact ? "text-[0.6875rem]" : "text-[0.8125rem]",
            )}
          >
            {SITE.program}
          </span>
        </span>
      </div>

      <div
        role="tablist"
        aria-orientation="vertical"
        aria-label="Console sections"
        className="flex flex-col gap-0.5"
      >
        {SECTIONS.map((section, index) => {
          const selected = section.id === activeId;

          return (
            <Row
              key={section.id}
              tab={{
                id: `console-tab-${section.id}`,
                controls: `console-panel-${section.id}`,
                onKeyDown: onTabKeyDown(index),
              }}
              buttonRef={(node) => {
                tabRefs.current[index] = node;
              }}
              onSelect={() => onSelect(section.id)}
              icon={section.icon}
              tint={section.tint}
              label={section.label}
              selected={selected}
              density={density}
            />
          );
        })}
      </div>

      {groups.map((group) => (
        <div
          key={group.title}
          role="group"
          aria-label={group.title}
          className="flex flex-col gap-0.5"
        >
          {group.rows.map((row) => (
            <Row
              key={row.label}
              icon={row.icon}
              tint={row.tint}
              label={row.label}
              value={row.value}
              density={density}
              trailing={
                row.toggle ? (
                  <Switch
                    checked={subscribed}
                    onChange={setSubscribed}
                    label="Subscribe to community alerts"
                  />
                ) : undefined
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}
