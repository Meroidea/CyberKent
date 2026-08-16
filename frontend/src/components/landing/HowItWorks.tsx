import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ClipboardPaste, Gauge, Handshake, Radar, type LucideIcon } from "lucide-react";
import { DETECTION_STEPS, type DetectionStep } from "@/content/landing";
import { GradientText } from "@/components/ui/GradientText";
import { DecryptedText } from "@/components/ui/DecryptedText";
import { Pill } from "@/components/ui/Pill";
import { SECTION_IDS } from "@/config/site";

const STEP_ICONS: Record<DetectionStep["icon"], LucideIcon> = {
  clipboard: ClipboardPaste,
  radar: Radar,
  gauge: Gauge,
  handshake: Handshake,
};

/** Share of the scroll window each step waits before starting its own reveal. */
const STEP_STAGGER = 0.15;
/** How long a single step takes to travel in, as a share of the window. */
const STEP_TRAVEL = 0.5;
/** Distance a step is offset along the rail before it settles. */
const STEP_OFFSET_PX = 40;

interface StepProps {
  step: DetectionStep;
  index: number;
  progress: MotionValue<number>;
  still: boolean;
}

/**
 * One node on the rail.
 *
 * A component rather than inline markup because each step needs its own
 * `useTransform` calls, and hooks cannot be created inside a map.
 */
function Step({ step, index, progress, still }: StepProps) {
  const Icon = STEP_ICONS[step.icon];
  const start = index * STEP_STAGGER;

  /*
   * Each step travels along the rail rather than up it, and each starts from a
   * slightly different point in the window — so they arrive in sequence and at
   * visibly different rates. That difference is the parallax; a uniform offset
   * would read as one block sliding in.
   */
  const x = useTransform(progress, [start, start + STEP_TRAVEL], [STEP_OFFSET_PX, 0]);
  const opacity = useTransform(progress, [start, start + STEP_TRAVEL * 0.55], [0, 1]);

  return (
    <motion.li
      style={still ? undefined : { x, opacity }}
      className="relative flex flex-col items-center text-center"
    >
      {/* Node marker. Sits on the rail, so its size fixes the rail's offset. */}
      <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/25 ring-4 ring-slate-50 md:h-9 md:w-9 dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950 dark:ring-[#0A0A0A]">
        <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden="true" />
      </span>

      <span className="mt-3 font-mono text-[0.625rem] font-semibold tabular-nums text-indigo-600/70 md:mt-4 md:text-caption dark:text-cyan-400/70">
        {String(index + 1).padStart(2, "0")}
      </span>

      <h3 className="mt-1 text-balance font-display text-[0.6875rem] font-semibold leading-tight text-slate-900 sm:text-sm md:mt-1.5 md:text-display-3 dark:text-white">
        {step.title}
      </h3>

      {/*
       * The summary needs a column it can form a line in. Below `md` a quarter
       * of the screen is roughly fifteen characters, where it would set as a
       * ragged stack of single words — so the step reduces to its title and the
       * section reads as a tracker rather than a paragraph in four pieces.
       */}
      <p className="mt-2 hidden text-pretty text-[0.6875rem] leading-relaxed text-slate-600 md:block lg:text-copy dark:text-slate-400">
        {step.summary}
      </p>
    </motion.li>
  );
}

/**
 * The four detection steps as a connected rail.
 *
 * Supporting material, not a destination — so it is deliberately compact: a
 * two-line header, one row, and no card chrome. The rail carries the sequence
 * that four separate panels previously had to imply.
 *
 * Four abreast at every width, phones included, with the type stepping down to
 * suit the column rather than the layout reflowing. Nodes are centred in their
 * columns, which is what lets the rail span a clean 12.5% to 87.5% and stay
 * correct at any gap.
 */
export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 85%", "center center"],
  });

  const smoothed = useSpring(scrollYProgress, {
    stiffness: 190,
    damping: 32,
    restDelta: 0.001,
  });

  const progress = prefersReducedMotion ? scrollYProgress : smoothed;
  const draw = useTransform(progress, [0, 0.92], [0, 1]);

  return (
    <section id={SECTION_IDS.how} ref={sectionRef} className="relative z-10 py-section-tight">
      <div className="container">
        <header className="flex max-w-2xl flex-col items-start gap-4">
          <Pill>How it works</Pill>
          <h2 className="display-depth text-balance font-display text-display-2 font-bold text-slate-900 dark:text-white">
            <DecryptedText text="Four steps, and none of them" />{" "}
            <GradientText>
              <DecryptedText text="take long." delay={230} />
            </GradientText>
          </h2>
        </header>

        {/*
         * Clipped sideways, because the steps enter from 40px along the rail
         * and the container has 24px of gutter to give them: until this section
         * is scrolled to, the last step sits 16px outside the viewport and the
         * whole page can be dragged sideways by that much. `clip` rather than
         * `hidden` — hidden on one axis forces the other to scroll, which would
         * turn a decorative rail into a scroll container and cut the ring drawn
         * around each node.
         */}
        <div className="relative mt-section-gap overflow-x-clip">
          {/* Unlit rail, then the lit one drawn over it by scroll progress. */}
          <span
            aria-hidden="true"
            className="absolute left-[12.5%] right-[12.5%] top-[14px] h-px bg-slate-200 md:top-[18px] dark:bg-white/10"
          />
          <motion.span
            aria-hidden="true"
            style={{ scaleX: prefersReducedMotion ? 1 : draw }}
            className="absolute left-[12.5%] right-[12.5%] top-[14px] h-px origin-left bg-gradient-to-r from-indigo-600 to-cyan-500 md:top-[18px] dark:from-indigo-400 dark:to-cyan-400"
          />

          <ol className="relative grid grid-cols-4 gap-x-3 md:gap-x-5 lg:gap-x-6">
            {DETECTION_STEPS.map((step, index) => (
              <Step
                key={step.id}
                step={step}
                index={index}
                progress={progress}
                still={prefersReducedMotion ?? false}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
