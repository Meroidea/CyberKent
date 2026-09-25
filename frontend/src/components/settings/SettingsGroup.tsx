import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SettingsGroupProps {
  /** Sits above the card, in the secondary label colour. Sentence case. */
  title?: ReactNode;
  /** Explanatory text under the card. This is where the caveats go. */
  footer?: ReactNode;
  /** Trailing control on the title line — a "See all", a count, an action. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A grouped-list card: the unit every settings screen is built from.
 *
 * The whole idiom is one shape used consistently — a white card on a grey
 * ground, with related rows inside it and the explanation underneath. There
 * are no borders anywhere: separation comes from the ground showing between
 * cards, which is why the surface colour matters more here than any line.
 *
 * `overflow-hidden` is what lets a row paint its own pressed state to the
 * card's edge and still be clipped to the corner radius, so a tap highlight
 * never squares off a rounded card.
 */
export function SettingsGroup({
  title,
  footer,
  action,
  children,
  className,
}: SettingsGroupProps) {
  return (
    <section className={cn("flex flex-col", className)}>
      {title ? (
        <div className="flex items-end justify-between gap-4 px-1 pb-2.5">
          <h2 className="text-[0.75rem] font-semibold uppercase leading-tight tracking-[0.12em] text-ui-label-2">{title}</h2>
          {action}
        </div>
      ) : null}

      <div className="ck-card overflow-hidden rounded-[1.125rem] bg-ui-card">{children}</div>

      {footer ? (
        <p className="px-1 pt-2.5 text-[0.8125rem] leading-[1.45] text-ui-label-2">{footer}</p>
      ) : null}
    </section>
  );
}

/**
 * A hairline between rows, inset to the left of the label.
 *
 * Inset rather than full bleed, and drawn by the row above rather than as a
 * `divide-y` on the card: a row that carries a leading icon starts its text
 * further in, and its separator has to start there too or the list reads as a
 * table with a stray column rule down it.
 */
export function RowSeparator({ inset = 16 }: { inset?: number }) {
  return (
    <div
      aria-hidden="true"
      className="h-px bg-ui-separator"
      style={{ marginLeft: `${inset}px` }}
    />
  );
}
