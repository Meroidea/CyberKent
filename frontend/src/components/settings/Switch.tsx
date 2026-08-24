import { cn } from "@/lib/cn";

interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  /** Names the control. Required: the row's label is a sibling, not a `<label>`. */
  label: string;
  /** Renders the track without a handler, for a state that is stated, not set. */
  readOnly?: boolean;
  className?: string;
}

/**
 * The platform toggle.
 *
 * A real `input[type=checkbox]` under a drawn track, rather than a `button`
 * with `role="switch"`: the native control already announces itself, already
 * takes a space bar, and already sits in the tab order, and the only thing it
 * cannot do is look like this. Hiding it and painting over it keeps all of
 * that and costs nothing.
 *
 * The knob is moved with a transform rather than by switching `left`, so the
 * travel is composited and the 22px slide stays smooth on the low-powered
 * tablets a council audience actually reads this on.
 */
export function Switch({ checked, onChange, label, readOnly = false, className }: SwitchProps) {
  return (
    <label className={cn("relative inline-flex shrink-0 cursor-pointer items-center", className)}>
      <span className="sr-only">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        readOnly={readOnly || !onChange}
        onChange={onChange ? (event) => onChange(event.target.checked) : undefined}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex h-[1.5625rem] w-[2.5625rem] items-center rounded-full p-[0.125rem] transition-colors duration-200",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ui-tint",
          checked ? "bg-emerald-500" : "bg-ui-fill-strong",
        )}
      >
        <span
          className={cn(
            "h-[1.3125rem] w-[1.3125rem] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-200",
            checked ? "translate-x-[1rem]" : "translate-x-0",
          )}
        />
      </span>
    </label>
  );
}
