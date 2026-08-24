import type { ComponentType, ReactNode } from "react";
import { motion } from "framer-motion";
import { ProgressRing } from "@/components/settings/ProgressRing";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * The pieces every detail pane's header is built from.
 *
 * Apple's accessory pane opens with the hardware drawn at the top and a
 * battery ring under each piece. There is no hardware here — the thing being
 * configured is a service — so the renders are replaced by the object each
 * screen is actually about: the message that was checked, the map of the
 * municipality, a glyph on a plinth for the rest. The ring under each one is
 * kept exactly as it is, because it is doing the same job: one number that
 * says how the thing below it is going.
 */

interface GlyphObjectProps {
  icon: ComponentType<{ className?: string }>;
  /** Tailwind `from-*`/`to-*` pair. The plinth is lit from above like a render. */
  gradient: string;
  size?: number;
  label?: string;
}

/**
 * A glyph on a lit plinth, standing in for a product render.
 *
 * The highlight, the rim and the cast shadow are three separate layers rather
 * than one gradient: a single ramp reads as a coloured square, and what makes
 * a render look like an object is that its top edge catches the light while
 * its underside does not.
 */
export function GlyphObject({ icon: Icon, gradient, size = 76, label }: GlyphObjectProps) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/* Contact shadow, tucked under and narrower than the object. */}
      <span
        className="absolute inset-x-[18%] bottom-[-6px] h-3 rounded-[50%] bg-slate-900/20 blur-[6px] dark:bg-black/50"
        aria-hidden="true"
      />
      <span
        className={cn(
          "relative flex h-full w-full items-center justify-center rounded-[28%] bg-gradient-to-b text-white",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(0,0,0,0.12)]",
          gradient,
        )}
      >
        <Icon className="h-1/2 w-1/2" />
      </span>
    </span>
  );
}

interface HeroRingProps {
  value: number;
  caption: string;
  trackClassName?: string;
}

/** The battery-ring analogue: an empty ring, the figure, then what it measures. */
export function HeroRing({ value, caption, trackClassName }: HeroRingProps) {
  return (
    <ProgressRing
      value={value}
      size={46}
      valuePlacement="below"
      caption={caption}
      trackClassName={trackClassName}
      className="gap-1"
    />
  );
}

interface PaneHeroProps {
  /** The drawn objects, laid out in a row and centred. */
  children: ReactNode;
  /** The rings under them. */
  rings: ReactNode;
}

/**
 * The centred graphic block between the pane title and the first card.
 *
 * Objects and rings are separate rows rather than one column each, so the
 * rings line up with each other even when the objects beside them are
 * different heights — which they are, because a message card is not the same
 * shape as a plinth.
 */
export function PaneHero({ children, rings }: PaneHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="flex flex-col items-center gap-3"
    >
      <div className="flex items-end justify-center gap-6">{children}</div>
      <div className="flex items-start justify-center gap-10">{rings}</div>
    </motion.div>
  );
}

/**
 * The label above a segmented control.
 *
 * Grouped-list section headers sit in the secondary colour at the card's
 * inset, and the segmented control is a card for this purpose — so it gets the
 * same header rather than a bolder one, which is what stops the mode switch
 * competing with the pane's own title.
 */
export function ControlLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="px-4 pb-2 text-[0.9375rem] font-semibold leading-tight text-ui-label-2">
      {children}
    </h3>
  );
}
