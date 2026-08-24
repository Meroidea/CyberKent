import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface ProgressRingProps {
  /** 0–100. Values outside are clamped rather than drawn past the ring. */
  value: number;
  /** Sits inside the ring. Defaults to the value as a percentage. */
  children?: React.ReactNode;
  /**
   * Where the percentage is drawn.
   *
   * Apple draws it both ways and the choice is about size: inside when the
   * ring is large enough to hold it, below when the ring is small and the
   * number would crowd the stroke. The accessory panel's battery rings are the
   * second kind, which is why this exists.
   */
  valuePlacement?: "inside" | "below";
  /** Caption under the ring, below the value. */
  caption?: React.ReactNode;
  /** Tailwind `stroke-*` for the filled arc. Defaults to the accent. */
  trackClassName?: string;
  size?: number;
  className?: string;
}

const R = 42;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * The circular readout the accessory panel uses for battery.
 *
 * Drawn as a dash offset on one circle rather than as an arc path, so the
 * value animates along the stroke instead of the geometry being recomputed —
 * and so the ring can be a single element with a rounded cap that travels.
 *
 * The number inside is the accessible value; the ring is marked decorative.
 * A progressbar role would announce a percentage that the text already says.
 */
export function ProgressRing({
  value,
  children,
  valuePlacement = "inside",
  caption,
  trackClassName,
  size = 72,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const reduced = useReducedMotion();
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={R} fill="none" strokeWidth="7" className="stroke-ui-fill" />
          <motion.circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            className={cn("stroke-ui-tint", trackClassName)}
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: reduced ? offset : CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: reduced ? 0 : 0.9, ease: EASE_OUT_EXPO }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children ??
            (valuePlacement === "inside" ? (
              <span className="text-[0.9375rem] font-semibold tabular-nums text-ui-label">
                {Math.round(clamped)}%
              </span>
            ) : null)}
        </div>
      </div>

      {valuePlacement === "below" ? (
        <span className="text-[1.0625rem] font-medium leading-none tabular-nums text-ui-label">
          {Math.round(clamped)}%
        </span>
      ) : null}

      {caption ? (
        <span className="text-[0.8125rem] leading-tight text-ui-label-2">{caption}</span>
      ) : null}
    </div>
  );
}
