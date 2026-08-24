import { useState } from "react";
import {
  Ban,
  Check,
  ChevronDown,
  CircleHelp,
  Info,
  Link2,
  TriangleAlert,
} from "lucide-react";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import type { CheckOutcome, UrlReport } from "@/lib/scam/url";
import { cn } from "@/lib/cn";

/**
 * One link, taken apart in public.
 *
 * The reason this is a component of its own rather than three more rows in the
 * indicator list is that the indicator list only ever contains findings. A
 * reader looking at it cannot distinguish a link that was examined in eleven
 * ways and came back sound from a link nothing looked at — both show nothing.
 * This shows every check, including the ones that passed and the ones that
 * could not run, because "we checked and it was fine" and "we did not check"
 * are completely different pieces of information and a report that blurs them
 * is the reason the checker felt like it was guessing.
 */

const OUTCOME: Record<
  CheckOutcome,
  { Icon: typeof Check; tint: string; ring: string; label: string; order: number }
> = {
  critical: {
    Icon: Ban,
    tint: "text-rose-600 dark:text-rose-400",
    ring: "bg-rose-500/12",
    label: "Serious",
    order: 0,
  },
  concern: {
    Icon: TriangleAlert,
    tint: "text-amber-600 dark:text-amber-400",
    ring: "bg-amber-500/12",
    label: "Concern",
    order: 1,
  },
  note: {
    Icon: Info,
    tint: "text-sky-600 dark:text-sky-400",
    ring: "bg-sky-500/12",
    label: "Worth knowing",
    order: 2,
  },
  unknown: {
    Icon: CircleHelp,
    tint: "text-ui-label-2",
    ring: "bg-ui-fill",
    label: "Not checked",
    order: 3,
  },
  clear: {
    Icon: Check,
    tint: "text-emerald-600 dark:text-emerald-400",
    ring: "bg-emerald-500/12",
    label: "Clear",
    order: 4,
  },
};

/** The parts of a URL, shown separately so the destination cannot hide in it. */
function Anatomy({ link }: { link: UrlReport }) {
  const parts: { label: string; value: string; emphasis?: boolean; muted?: boolean }[] = [];

  parts.push({ label: "scheme", value: `${link.scheme}://`, muted: link.scheme === "https" });

  if (link.userinfo) {
    parts.push({ label: "ignored by the browser", value: `${link.userinfo}@`, muted: true });
  }

  parts.push({ label: "goes to", value: link.displayHost, emphasis: true });

  if (link.port) {
    parts.push({ label: "port", value: `:${link.port}` });
  }
  if (link.path && link.path !== "/") {
    parts.push({ label: "path", value: link.path });
  }
  if (link.query) {
    parts.push({ label: "parameters", value: link.query });
  }

  return (
    <div className="flex flex-wrap items-end gap-x-1 gap-y-2 px-4 pb-3 pt-1">
      {parts.map((part, index) => (
        <span key={index} className="flex flex-col gap-0.5">
          <span className="text-[0.5625rem] uppercase tracking-[0.08em] text-ui-label-3">
            {part.label}
          </span>
          <span
            className={cn(
              "break-all rounded-md px-1.5 py-1 font-mono text-[0.75rem] leading-tight",
              part.emphasis
                ? "bg-ui-tint/12 font-semibold text-ui-tint"
                : part.muted
                  ? "bg-ui-fill text-ui-label-3 line-through decoration-1"
                  : "bg-ui-fill text-ui-label-2",
            )}
          >
            {part.value}
          </span>
        </span>
      ))}
    </div>
  );
}

function CheckRow({ check }: { check: UrlReport["checks"][number] }) {
  const style = OUTCOME[check.outcome];
  const { Icon } = style;

  return (
    <div className="flex items-start gap-3 px-4 py-[0.625rem]">
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full",
          style.ring,
        )}
      >
        <Icon className={cn("h-[0.875rem] w-[0.875rem]", style.tint)} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-baseline gap-2">
          <span className="text-[0.9375rem] font-medium leading-tight text-ui-label">
            {check.label}
          </span>
          {/* The outcome is spelled out, never carried by the icon's colour
              alone — WCAG 1.4.1, and the report is read on printouts. */}
          <span className={cn("text-[0.6875rem] font-semibold uppercase tracking-[0.06em]", style.tint)}>
            {style.label}
          </span>
        </span>
        <span className="mt-1 text-[0.8125rem] leading-[1.45] text-ui-label-2">{check.finding}</span>
      </span>
    </div>
  );
}

function Separator() {
  return <div aria-hidden="true" className="ml-[3.25rem] h-px bg-ui-separator" />;
}

/** A count of each outcome, so the shape of the result reads before the detail. */
function Tally({ link }: { link: UrlReport }) {
  const counts = (["critical", "concern", "note", "unknown", "clear"] as CheckOutcome[])
    .map((outcome) => ({
      outcome,
      count: link.checks.filter((check) => check.outcome === outcome).length,
    }))
    .filter((entry) => entry.count > 0);

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {counts.map(({ outcome, count }) => (
        <span
          key={outcome}
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[0.6875rem] font-semibold",
            OUTCOME[outcome].ring,
            OUTCOME[outcome].tint,
          )}
        >
          {count} {OUTCOME[outcome].label.toLowerCase()}
        </span>
      ))}
    </span>
  );
}

function LinkCard({ link, index, total }: { link: UrlReport; index: number; total: number }) {
  const worst = [...link.checks].sort(
    (a, b) => OUTCOME[a.outcome].order - OUTCOME[b.outcome].order,
  )[0];

  /* Opens on anything that found something, closed on a link that came back
     clean — the detail of a clean link is reassurance, and reassurance can
     wait behind a tap; the detail of a bad one is the point of the report. */
  const [open, setOpen] = useState(
    worst?.outcome === "critical" || worst?.outcome === "concern",
  );

  const ordered = [...link.checks].sort(
    (a, b) => OUTCOME[a.outcome].order - OUTCOME[b.outcome].order,
  );

  return (
    <SettingsGroup title={total > 1 ? `Link ${index + 1} of ${total}` : "The link, taken apart"}>
      {/* Inert text, never an anchor. A report that makes the address
          clickable hands the reader the click it is warning them about. */}
      <div className="px-4 pt-3">
        <p className="flex items-start gap-2">
          <Link2 aria-hidden="true" className="mt-[0.1875rem] h-4 w-4 shrink-0 text-ui-label-3" />
          <span className="min-w-0 break-all font-mono text-[0.8125rem] leading-snug text-ui-label">
            {link.raw}
          </span>
        </p>
      </div>

      {link.parsed ? <Anatomy link={link} /> : null}

      {/* The shape of the result before any of its detail: five clear and two
          serious is a different thing from seven clear, and a reader should be
          able to see which they are looking at without counting rows. */}
      <div className="px-4 pb-3">
        <Tally link={link} />
      </div>

      <Separator />

      {ordered.slice(0, open ? ordered.length : 3).map((check, position) => (
        <div key={check.id}>
          {position > 0 ? <Separator /> : null}
          <CheckRow check={check} />
        </div>
      ))}

      {ordered.length > 3 ? (
        <>
          <Separator />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="flex w-full items-center justify-center gap-1.5 px-4 py-[0.6875rem] text-[0.9375rem] text-ui-tint transition-colors duration-150 hover:bg-ui-card-hover"
          >
            {open ? "Show fewer checks" : `Show all ${ordered.length} checks`}
            <ChevronDown
              aria-hidden="true"
              className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
            />
          </button>
        </>
      ) : null}
    </SettingsGroup>
  );
}

export function LinkInspection({ links }: { links: UrlReport[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-7">
      {links.map((link, index) => (
        <LinkCard key={`${link.raw}-${index}`} link={link} index={index} total={links.length} />
      ))}
    </div>
  );
}
