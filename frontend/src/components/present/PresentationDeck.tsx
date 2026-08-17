import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from "lucide-react";
import { PageBackground } from "@/components/background/PageBackground";
import { SRS_SLIDES } from "@/components/present/slides";
import { STAGE_HEIGHT, STAGE_WIDTH } from "@/components/present/primitives";
import { DECK_META } from "@/content/presentation";
import { holdScroll } from "@/lib/smoothScroll";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * The Final SRS Report as a deck.
 *
 * A slide is a fixed 1280×720 composition that is scaled as a whole to whatever
 * box the screen offers, rather than a responsive layout that reflows. That is
 * the difference between a deck and a web page: a presenter needs to know that
 * what they rehearsed on a laptop is what appears on the projector, and reflow
 * cannot promise that — a two-column comparison becomes one column at the worst
 * possible moment. Everything inside a slide is therefore sized in absolute
 * lengths, and this component owns the only measurement in the deck.
 */
const clamp = (value: number, last: number) => Math.min(Math.max(value, 0), last);

export function PresentationDeck({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const shell = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  /* Where focus was before the deck took the screen, so it can be handed back. */
  const opener = useRef<HTMLElement | null>(null);

  const reduced = useReducedMotion();
  const last = SRS_SLIDES.length - 1;

  /** Jump to a slide. */
  const go = useCallback((next: number) => setIndex(clamp(next, last)), [last]);

  /**
   * Step by a slide.
   *
   * Expressed as a delta against the current value rather than as `go(index+1)`,
   * because two presses inside one render — a double tap of the arrow key, or a
   * remote that sends a pair — would otherwise both read the same `index` and
   * advance once between them.
   */
  const step = useCallback(
    (delta: number) => setIndex((current) => clamp(current + delta, last)),
    [last],
  );

  /* The page beneath is held still — through the smoothing rather than around
     it, so releasing cannot leave Lenis stopped. */
  useEffect(() => {
    opener.current = document.activeElement as HTMLElement | null;
    const release = holdScroll();

    /* The shell takes focus so the arrow keys reach the deck immediately,
       without the presenter having to click into it first. */
    shell.current?.focus();

    return () => {
      release();
      opener.current?.focus?.();
    };
  }, []);

  /* Scale is recomputed from the frame rather than the window: entering
     fullscreen, rotating a tablet and dragging the window all change the box
     the stage has to fit, and only one of those is a resize event. */
  useEffect(() => {
    const element = frame.current;

    if (!element) {
      return;
    }

    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setScale(Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === shell.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }

    /* Refused by policy on some platforms; the deck simply stays windowed
       rather than reporting a state it did not reach. */
    void shell.current?.requestFullscreen?.().catch(() => undefined);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          event.preventDefault();
          step(1);
          break;
        case "ArrowLeft":
        case "PageUp":
          event.preventDefault();
          step(-1);
          break;
        case "Home":
          event.preventDefault();
          go(0);
          break;
        case "End":
          event.preventDefault();
          go(last);
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "Escape":
          /* In fullscreen the browser consumes Escape to leave it; the deck
             closes only on the second press, which is what a presenter expects. */
          if (!document.fullscreenElement) {
            onClose();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go, last, onClose, step]);

  const slide = SRS_SLIDES[index]!;
  const Slide = slide.render;

  /*
   * Rendered into the body rather than in place.
   *
   * The document page sits inside `main`, which carries its own stacking
   * context — so a `z-95` deck nested in it would still be ordered against the
   * masthead's `z-50` as though it were `z-10`, and the projector would show a
   * navigation bar across the top of every slide. Fullscreen has the same
   * requirement from the other direction: `requestFullscreen` promotes only the
   * element it is called on and its subtree, and a transformed ancestor would
   * take the stage with it.
   */
  return createPortal(
    <motion.div
      ref={shell}
      role="dialog"
      aria-modal="true"
      aria-label={`${DECK_META.title} — Final SRS Report presentation`}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
      className="fixed inset-0 z-[95] flex flex-col bg-slate-50 outline-none dark:bg-[#0A0A0A]"
    >
      {/*
       * The same backdrop the rest of the site runs on — glitch field, tile
       * grid, particles and blooms — rather than a flat field of its own.
       *
       * The deck is the project's own service presenting itself, so it should
       * look like the service. It also does real work here: the stage is glass,
       * and glass over a still colour reads as a rectangle, while glass over
       * something moving reads as glass.
       */}
      <PageBackground />

      <header className="relative z-10 flex shrink-0 items-center gap-4 px-4 py-3 sm:px-6">
        <p className="min-w-0 truncate font-mono text-[0.625rem] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Final SRS Report
          <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
          <span className="text-indigo-600 dark:text-cyan-400">{slide.name}</span>
        </p>

        <p className="ml-auto shrink-0 font-mono text-[0.6875rem] tabular-nums text-slate-400 dark:text-slate-500">
          {String(index + 1).padStart(2, "0")} / {String(SRS_SLIDES.length).padStart(2, "0")}
        </p>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? "Leave fullscreen" : "Present fullscreen"}
          className="interactive flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-white/15 dark:text-slate-400 dark:hover:border-cyan-400/50 dark:hover:text-cyan-300"
        >
          {fullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close the presentation"
          className="interactive flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-rose-400 hover:text-rose-600 dark:border-white/15 dark:text-slate-400 dark:hover:border-rose-400/50 dark:hover:text-rose-400"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      {/* The stage. Centred by transform rather than by layout, because a scaled
          element still occupies its unscaled size and would otherwise overflow
          the box it is being fitted into. */}
      <div ref={frame} className="relative z-10 min-h-0 flex-1 overflow-hidden px-4 sm:px-6">
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transform: `translate(-50%, -50%) scale(${scale})`,
          }}
        >
          <div className="glass-surface h-full w-full overflow-hidden rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={reduced ? { opacity: 0 } : { opacity: 0, x: 40 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, x: -30 }}
                transition={{ duration: reduced ? 0.15 : 0.4, ease: EASE_OUT_EXPO }}
                className="h-full w-full"
              >
                <Slide />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <footer className="relative z-10 flex shrink-0 items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={index === 0}
          aria-label="Previous slide"
          className="interactive flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-600 enabled:hover:border-indigo-400 enabled:hover:text-indigo-600 disabled:opacity-30 dark:border-white/15 dark:text-slate-300 dark:enabled:hover:border-cyan-400/50"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* One target per slide, so a presenter answering a question can jump
            straight to the section it came from. */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {SRS_SLIDES.map((entry, position) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => go(position)}
              title={`${position + 1}. ${entry.name}`}
              aria-label={`Go to slide ${position + 1}: ${entry.name}`}
              aria-current={position === index ? "true" : undefined}
              className="group flex-1 py-2"
            >
              <span
                className={cn(
                  "block h-1 rounded-full transition-colors duration-200",
                  position === index
                    ? "bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400"
                    : position < index
                      ? "bg-slate-400/60 dark:bg-slate-500/60"
                      : "bg-slate-900/10 group-hover:bg-slate-900/25 dark:bg-white/10 dark:group-hover:bg-white/25",
                )}
              />
            </button>
          ))}
        </div>

        <p className="hidden shrink-0 font-mono text-[0.625rem] text-slate-400 sm:block dark:text-slate-500">
          ← → to move · F fullscreen · Esc to close
        </p>

        <button
          type="button"
          onClick={() => step(1)}
          disabled={index === last}
          aria-label="Next slide"
          className="interactive flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-30 dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </footer>
    </motion.div>,
    window.document.body,
  );
}
