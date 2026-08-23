import { Children, Fragment, type ComponentType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { RowSeparator } from "@/components/settings/SettingsGroup";
import { cn } from "@/lib/cn";

export interface SettingsRowProps {
  /** The primary label. */
  label: ReactNode;
  /** Second line under the label, in the secondary colour. */
  detail?: ReactNode;
  /** Right-aligned secondary text — the row's current value. */
  value?: ReactNode;
  /** A leading glyph in a tinted rounded tile, as the system apps use. */
  icon?: ComponentType<{ className?: string }>;
  /** Tailwind classes for the icon tile's fill. Defaults to the accent. */
  iconClassName?: string;
  /** Right-aligned control — a switch, a badge, a button. Replaces `value`. */
  trailing?: ReactNode;
  /** Internal route. Renders the row as a link and shows a chevron. */
  to?: string;
  /** External or non-router destination. */
  href?: string;
  onClick?: () => void;
  /** Force the chevron on or off. Defaults to on for anything navigable. */
  chevron?: boolean;
  /** Paints the label in the accent, for the one affirmative action in a card. */
  emphasis?: "default" | "tint" | "danger";
  disabled?: boolean;
  className?: string;
}

const EMPHASIS: Record<NonNullable<SettingsRowProps["emphasis"]>, string> = {
  default: "text-ui-label",
  tint: "text-ui-tint",
  danger: "text-rose-500",
};

/**
 * One row of a grouped list.
 *
 * Everything a settings screen does is a row: a value to read, a sub-screen to
 * open, a switch to flip, an action to take. Keeping them one component is
 * what holds the 44px rhythm, the inset, and the pressed state identical down
 * a card — four near-identical row markups is how a list starts to look
 * hand-assembled.
 *
 * The element is chosen by what the row does rather than passed in: a route
 * gets a `Link`, a handler gets a `button`, and a row that only states a value
 * stays a `div` so it is not announced as something to activate.
 */
export function SettingsRow({
  label,
  detail,
  value,
  icon: Icon,
  iconClassName,
  trailing,
  to,
  href,
  onClick,
  chevron,
  emphasis = "default",
  disabled = false,
  className,
}: SettingsRowProps) {
  const navigable = Boolean(to || href || onClick);
  const showChevron = chevron ?? Boolean(to || href);

  const body = (
    <>
      {Icon ? (
        <span
          aria-hidden="true"
          className={cn(
            "flex h-[1.75rem] w-[1.75rem] shrink-0 items-center justify-center rounded-[0.4375rem] bg-ui-tint text-white",
            iconClassName,
          )}
        >
          <Icon className="h-[1.0625rem] w-[1.0625rem]" />
        </span>
      ) : null}

      <span className="flex min-w-0 flex-1 flex-col">
        {/* Not truncated. Apple can clip a label because the value beside it
            is a word — "On", "Never", a percentage. Half the values here are a
            requirement range or an email address, so the pair is allowed to
            wrap instead and the row grows past 44px when it has to. */}
        <span className={cn("text-[1.0625rem] leading-tight", EMPHASIS[emphasis])}>{label}</span>
        {detail ? (
          <span className="mt-1 text-[0.8125rem] leading-snug text-ui-label-2">{detail}</span>
        ) : null}
      </span>

      {trailing ??
        (value ? (
          <span className="max-w-[55%] shrink-0 text-right text-[1.0625rem] leading-tight text-ui-label-2">
            {value}
          </span>
        ) : null)}

      {showChevron ? (
        <ChevronRight
          aria-hidden="true"
          className="h-[1.125rem] w-[1.125rem] shrink-0 text-ui-label-3"
        />
      ) : null}
    </>
  );

  const shell = cn(
    "flex w-full items-center gap-3 px-4 py-[0.6875rem] text-left min-h-[2.75rem]",
    navigable && !disabled && "transition-colors duration-150 hover:bg-ui-card-hover active:bg-ui-fill",
    disabled && "opacity-50",
    className,
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={shell}>
        {body}
      </Link>
    );
  }

  if (href && !disabled) {
    return (
      <a href={href} className={shell}>
        {body}
      </a>
    );
  }

  if (onClick && !disabled) {
    return (
      <button type="button" onClick={onClick} className={shell}>
        {body}
      </button>
    );
  }

  return <div className={shell}>{body}</div>;
}

/**
 * Stacks rows with a hairline between them, inset past any leading icon.
 *
 * The inset is a property of the list rather than of a row, because a card
 * where one row has an icon and the next does not still needs one straight
 * line down it — a row deciding its own inset would give a ragged edge.
 */
export function SettingsRows({
  children,
  inset = 16,
}: {
  children: ReactNode;
  inset?: number;
}) {
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? <RowSeparator inset={inset} /> : null}
          {row}
        </Fragment>
      ))}
    </>
  );
}
