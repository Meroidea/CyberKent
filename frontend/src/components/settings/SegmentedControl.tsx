import { useId, type ComponentType } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface Segment<T extends string> {
  value: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

interface SegmentedControlProps<T extends string> {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the control for assistive technology. */
  label: string;
  className?: string;
}

/**
 * The pill-shaped mode switch.
 *
 * A radio group, not a row of buttons: the choices are exclusive and one is
 * always taken, which is exactly what a radio group means and what a screen
 * reader needs to hear. `role="radiogroup"` with arrow-key movement comes free
 * from native radios, so the inputs are real and visually hidden rather than
 * simulated with `aria-*` on buttons.
 *
 * The thumb is a single shared element moved by `layoutId`, so it slides
 * between segments rather than one fading out while another fades in — the
 * movement is the affordance, and cross-fading loses it. Under reduced motion
 * framer resolves the layout change instantly, which is the right answer here.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  const name = useId();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex rounded-[0.625rem] bg-ui-fill p-[0.1875rem]", className)}
    >
      {segments.map((segment) => {
        const selected = segment.value === value;
        const Icon = segment.icon;

        return (
          <label
            key={segment.value}
            className={cn(
              "relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[0.5rem] px-3 py-[0.4375rem] text-center transition-colors duration-200",
              selected ? "text-ui-label" : "text-ui-label-2 hover:text-ui-label",
            )}
          >
            <input
              type="radio"
              name={name}
              value={segment.value}
              checked={selected}
              onChange={() => onChange(segment.value)}
              className="peer sr-only"
            />

            {selected ? (
              <motion.span
                layoutId={`${name}-thumb`}
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
                aria-hidden="true"
                className="absolute inset-0 rounded-[0.5rem] bg-ui-card shadow-[0_1px_3px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.04)]"
              />
            ) : null}

            {/* Above the thumb, and the focus ring lands here because the
                input itself is visually hidden. */}
            <span className="relative flex items-center gap-1.5 rounded-[0.375rem] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ui-tint">
              {Icon ? <Icon className="h-[1.0625rem] w-[1.0625rem]" aria-hidden="true" /> : null}
              <span className="text-[0.8125rem] font-medium leading-tight">{segment.label}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
