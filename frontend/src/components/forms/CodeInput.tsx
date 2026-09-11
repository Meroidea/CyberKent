import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired once all six digits are in — typed, pasted or autofilled. */
  onComplete?: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  describedBy?: string;
}

/**
 * Six boxes, one input.
 *
 * The boxes are drawn; the input is real and lies over them. Six separate
 * inputs break paste, break the phone's "code from Messages/Mail" suggestion,
 * and make a screen reader announce six unlabelled fields. One input with
 * `autocomplete="one-time-code"` gets all three right, and the boxes are just
 * how its value is shown.
 */
export function CodeInput({ value, onChange, onComplete, disabled, invalid, autoFocus, describedBy }: CodeInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative mx-auto w-fit">
      <div aria-hidden="true" className="flex gap-1.5 sm:gap-2">
        {Array.from({ length: 6 }, (_, index) => {
          const digit = value[index];
          const current = focused && (index === value.length || (index === 5 && value.length === 6));

          return (
            <span
              key={index}
              className={cn(
                "flex h-14 w-11 items-center justify-center rounded-xl bg-ui-fill text-[1.625rem] font-semibold tabular-nums text-ui-label transition-shadow duration-150 sm:h-16 sm:w-12",
                current && "shadow-[0_0_0_2px_var(--ui-tint)]",
                invalid && "shadow-[0_0_0_2px_rgb(244_63_94)]",
                index === 2 && "mr-2 sm:mr-3",
              )}
            >
              {digit ?? (current ? <span className="h-7 w-0.5 animate-pulse rounded-full bg-ui-tint" /> : "")}
            </span>
          );
        })}
      </div>

      <input
        ref={ref}
        value={value}
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, "").slice(0, 6);
          onChange(next);
          if (next.length === 6 && next !== value) {
            onComplete?.(next);
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        autoFocus={autoFocus}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        aria-label="Six-digit code"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        /* The boxes draw the focus; the site-wide ring around this invisible
           input would frame all six in a stray rectangle. */
        className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed"
      />
    </div>
  );
}
