import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ConsoleWindow } from "@/components/landing/console/ConsoleWindow";
import { GradientText } from "@/components/ui/GradientText";
import { DecryptedText } from "@/components/ui/DecryptedText";
import { SECTION_IDS } from "@/config/site";
import { HERO_PEEK_FRACTION, REFERENCE_VIEWPORT_HEIGHT } from "@/config/layout";
import { useDeviceTier, type DeviceTier } from "@/hooks/useDeviceTier";
import { useElementWidth } from "@/hooks/useElementWidth";
import { useViewportHeight } from "@/hooks/useViewportHeight";

interface TierSettings {
  /** Rotation before the section is scrolled through. */
  restRotation: number;
  restScale: number;
  /**
   * Upward lift at rest, as a share of the frame's own height.
   *
   * Two corrections are folded into one transform. Rotation happens about the
   * centre, so a steeply tilted frame's visual top sits far below its layout
   * top. And the frame has to clear the headline that precedes it in flow,
   * because at rest the device is what crests the fold while the headline is
   * still faded out behind it.
   */
  restLift: number;
  frameWidth: string;
  /** Vertical padding of the bezel, needed to derive the frame's laid-out height. */
  bezelPadding: number;
  /**
   * Width the console is laid out at before being scaled onto the frame.
   *
   * This is the frame's depth control. The screen carries a fixed
   * `designWidth / CONSOLE_DESIGN_HEIGHT` aspect ratio, so at a given on-screen
   * width a narrower design box is a taller frame — and because the console is
   * scaled by `screenWidth / designWidth`, a narrower box also renders larger.
   * Depth and legibility move together.
   *
   * Deepening via `CONSOLE_DESIGN_HEIGHT` instead would not work: the tab
   * bodies are sized by their content, so the extra room would land as a blank
   * panel under a console stranded at the top of the frame.
   */
  consoleDesignWidth: number;
}

/** Design height of the console, shared by every tier. */
const CONSOLE_DESIGN_HEIGHT = 690;

const TIER_SETTINGS: Record<DeviceTier, TierSettings> = {
  /*
   * Every tier sits inside the page container, so the frame keeps the same
   * gutter as the copy above it and stays aligned with the rest of the page
   * rather than running to the bezel. The room a phone's frame needs is found
   * by narrowing its design box instead, which buys depth and scale without
   * spending the margin.
   */
  mobile: {
    restRotation: 46,
    restScale: 0.94,
    restLift: -0.71,
    frameWidth: "100%",
    consoleDesignWidth: 612,
    bezelPadding: 8,
  },
  tablet: {
    restRotation: 46,
    restScale: 0.92,
    restLift: -0.42,
    frameWidth: "100%",
    consoleDesignWidth: 931,
    bezelPadding: 12,
  },
  desktop: {
    restRotation: 48,
    restScale: 0.9,
    restLift: -0.57,
    frameWidth: "78%",
    consoleDesignWidth: 931,
    bezelPadding: 12,
  },
};

/**
 * Length of the unfold, as a share of viewport height.
 *
 * Expressed against the viewport rather than the section so the gesture costs
 * the same amount of scrolling on a laptop and a phone — the frame itself is a
 * fifth of the height on one that it is on the other, so anything derived from
 * the section's own box unfolds the phone in a fraction of the travel and reads
 * as a jump cut.
 */
const UNFOLD_VIEWPORT_FRACTION = 0.55;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Scroll-revealed device. The section is pulled up by exactly the 30svh the
 * hero reserved, so the tilted frame always crests the fold in the same
 * proportion regardless of viewport height.
 *
 * The section is sized by its own content rather than a fixed `svh` runway,
 * which is what removed the dead band that used to sit under the device. The
 * scroll window is measured off the viewport instead (see `useScroll` below),
 * so shrinking the section no longer shortens the animation with it.
 */
export function ConsoleShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const screenWidth = useElementWidth(screenRef);
  const tier = useDeviceTier();
  const settings = TIER_SETTINGS[tier];
  const prefersReducedMotion = useReducedMotion();

  /*
   * Driven off absolute page scroll, not the section's own position.
   *
   * Any element-relative offset only reaches progress 0 once the section has
   * travelled to some point in the viewport, which spends the first few hundred
   * pixels of scroll doing nothing — the frame rides up the screen untouched
   * and only then begins to turn. Anchoring the window at scrollY 0 means the
   * very first wheel notch already straightens it.
   */
  const { scrollY } = useScroll();
  const viewportHeight = useViewportHeight();
  const unfoldDistance = Math.max(1, viewportHeight * UNFOLD_VIEWPORT_FRACTION);

  const raw = useTransform(scrollY, [0, unfoldDistance], [0, 1], { clamp: true });

  /*
   * Wheel and trackpad scroll arrives in coarse jumps, and mapping it straight
   * onto a 48° rotation shows every one of them. Tuned to roughly critical
   * damping (ζ ≈ 1): no overshoot to read as wobble, and it settles fast enough
   * that the frame never feels detached from the gesture driving it.
   */
  const smoothed = useSpring(raw, {
    stiffness: 210,
    damping: 30,
    restDelta: 0.001,
  });

  const progress = prefersReducedMotion ? raw : smoothed;

  /*
   * Under reduced motion the frame is simply presented flat. The global CSS
   * rule only neutralises transitions and keyframes, and a 64° scroll-linked
   * rotation is precisely the kind of movement the preference is asking us to
   * drop — so the scene is opted out here rather than merely un-sprung.
   */
  const staticFrame = { rotateX: 0, scale: 1, y: 0 } as const;

  /*
   * Eased rather than linear: most of the rotation is spent early, so the frame
   * reads as falling into place and decelerating rather than turning at a
   * constant rate for the whole section.
   */
  const rotateX = useTransform(
    progress,
    [0, 0.35, 0.7, 1],
    [settings.restRotation, settings.restRotation * 0.52, settings.restRotation * 0.16, 0],
  );
  const scale = useTransform(progress, [0, 1], [settings.restScale, 1]);

  /*
   * Rest lift resolved to pixels rather than left as a share of the frame.
   *
   * A share of the frame is a constant on any given screen width, but the zone
   * it has to sit in is `HERO_PEEK_FRACTION` of the viewport — so the taller
   * the screen, the more of the device the same share exposes. Measured across
   * the range that was 39% of the frame on a short tablet against 94% on a
   * 1080p desktop, which is the difference between a device cresting the fold
   * and one simply sitting on the page.
   *
   * Correcting by the peek zone's own growth cancels the term exactly, so the
   * frame crests by the same proportion at any height.
   *
   * One-sided on purpose. The correction assumes the zone really is
   * `HERO_PEEK_FRACTION` of the viewport, which holds only while the hero's
   * copy fits above it. On a short screen the copy overruns instead, the zone
   * is whatever is left, and a negative correction would haul the frame up
   * into the copy — 13px off it at 1280x800. Below the reference the frame
   * simply keeps its tuned rest position.
   */
  const frameHeight = screenWidth
    ? screenWidth * (CONSOLE_DESIGN_HEIGHT / settings.consoleDesignWidth) +
      settings.bezelPadding * 2
    : 0;

  const restLiftPx =
    settings.restLift * frameHeight +
    clamp(HERO_PEEK_FRACTION * (viewportHeight - REFERENCE_VIEWPORT_HEIGHT), 0, 190);

  const y = useTransform(progress, [0, 1], [restLiftPx, 0]);

  /* The headline resolves well before the frame does, so it stays readable for
     the whole of the unfold rather than arriving alongside it. */
  const titleY = useTransform(progress, [0, 0.55], [70, 0]);
  const titleOpacity = useTransform(progress, [0, 0.35], [0, 1]);

  return (
    <section
      id={SECTION_IDS.detect}
      ref={sectionRef}
      /*
       * The frame is allowed to bleed past the container gutters on small
       * screens, so the section clips horizontally to stop that ever becoming a
       * sideways scrollbar. `clip` rather than `hidden` keeps `overflow-y`
       * genuinely visible, and the margin lets the backlight bloom spill.
       */
      className="console-pull-up relative z-10 pb-16 [overflow-x:clip] [overflow-clip-margin:2rem] sm:pb-20"
    >
      <div className="container flex flex-col items-center" style={{ perspective: "1200px" }}>
        {/* h2, not h1: the hero owns the page's only h1. */}
        <motion.div
          style={prefersReducedMotion ? undefined : { y: titleY, opacity: titleOpacity }}
          className="relative z-10 max-w-3xl pb-10 text-center"
        >
          <h2 className="display-depth text-balance font-display text-display-2 font-bold text-slate-900 dark:text-white">
            <DecryptedText text="One place to check, report and" />{" "}
            <GradientText>
              <DecryptedText text="follow what’s circulating." delay={240} />
            </GradientText>
          </h2>
          <p className="mt-5 text-balance text-lede text-slate-600 dark:text-slate-400">
            The same console Council officers use to triage reports, shown here
            with illustrative data.
          </p>
        </motion.div>

        <motion.div
          style={{
            ...(prefersReducedMotion ? staticFrame : { rotateX, scale, y }),
            width: settings.frameWidth,
            transformStyle: "preserve-3d",
          }}
          /*
           * Centred by the parent's `items-center`, deliberately not by
           * `mx-auto`. Once the frame is wider than the container — which it is
           * on phones — the over-constrained rules resolve both auto margins to
           * zero, pinning it left and pushing the whole overflow off the right
           * edge. Flex centring splits the overflow evenly instead.
           */
          className="relative z-20 will-change-transform"
        >
          {/* Backlight tilts with the frame. */}
          <span
            aria-hidden="true"
            className="absolute -inset-x-8 -bottom-6 h-16 rounded-full bg-gradient-to-r from-indigo-500/30 to-cyan-400/30 blur-3xl"
          />

          <div className="relative rounded-[2.1rem] bg-gradient-to-b from-slate-700 to-slate-950 p-2 shadow-2xl shadow-slate-900/30 sm:p-3">
            <div
              ref={screenRef}
              /* The screen's own ground, not the page's: the console is a
                 grouped-list surface and the card colours only read as cards
                 against it. */
              className="relative overflow-hidden rounded-[1.5rem] bg-ui-grouped"
              style={{ aspectRatio: `${settings.consoleDesignWidth} / ${CONSOLE_DESIGN_HEIGHT}` }}
            >
              {/*
               * Scaling a fixed design size beats reflowing: the console never
               * collapses into an unreadable stack, and because it never needs
               * an inner scrollbar, a wheel or swipe over the device always
               * scrolls the page instead of being swallowed.
               */}
              <div
                style={{
                  width: settings.consoleDesignWidth,
                  height: CONSOLE_DESIGN_HEIGHT,
                  transform: `scale(${screenWidth ? screenWidth / settings.consoleDesignWidth : 1})`,
                  transformOrigin: "top left",
                }}
              >
                <ConsoleWindow designWidth={settings.consoleDesignWidth} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
