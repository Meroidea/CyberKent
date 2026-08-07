import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CAPABILITIES } from "@/content/landing";
import { CapabilityCard } from "@/components/landing/CapabilityCard";
import { useInterval } from "@/hooks/useInterval";
import { cn } from "@/lib/cn";

const AUTO_ADVANCE_MS = 4500;
const SWIPE_THRESHOLD_PX = 45;

/**
 * 3D coverflow over the capability set.
 *
 * Pointer swipe is supported, but the previous/next buttons and arrow keys are
 * the primary control: a drag-only carousel is unusable by keyboard, which this
 * service cannot accept.
 */
export function Coverflow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragStartX = useRef<number | null>(null);

  const go = useCallback((direction: 1 | -1) => {
    setActiveIndex((index) => (index + direction + CAPABILITIES.length) % CAPABILITIES.length);
  }, []);

  useInterval(() => go(1), paused ? null : AUTO_ADVANCE_MS);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStartX.current;
    dragStartX.current = null;

    if (start === null) {
      return;
    }

    const delta = event.clientX - start;

    if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
      go(delta < 0 ? 1 : -1);
    }
  };

  return (
    <div
      className="flex flex-col gap-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/*
       * The offset neighbours reach roughly half a card-width past each edge.
       * Unclipped they ran across the prose in the adjacent grid column, so the
       * track is clipped horizontally to its own column. `overflow: clip` with
       * a clip margin rather than `hidden`: it keeps the card's shadow and the
       * accent bloom bleeding past the box, and it establishes no scroll
       * container, so a swipe over the carousel still scrolls the page.
       */}
      <div className="relative [overflow:clip] [overflow-clip-margin:2.5rem]">
        <div
          role="group"
          aria-roledescription="carousel"
          aria-label="What the service covers"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              go(1);
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              go(-1);
            }
          }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          className="relative h-[26rem] touch-pan-y rounded-3xl"
          style={{ perspective: "1400px" }}
        >
          {CAPABILITIES.map((capability, index) => {
            const position = index - activeIndex;
            const isCentre = position === 0;
            const isNeighbour = Math.abs(position) <= 1;

            return (
              <div
                key={capability.id}
                aria-hidden={!isCentre}
                className="absolute inset-0 transition-all duration-500 ease-out-expo"
                style={{
                  transform: `translateX(${position * 58}%) scale(${isCentre ? 1 : 0.84}) rotateY(${position * -20}deg)`,
                  opacity: isCentre ? 1 : 0.4,
                  filter: isCentre ? "none" : "blur(6px)",
                  visibility: isNeighbour ? "visible" : "hidden",
                  pointerEvents: isCentre ? "auto" : "none",
                  zIndex: isCentre ? 20 : 10 - Math.abs(position),
                }}
              >
                <CapabilityCard capability={capability} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous capability"
          className="interactive flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/70 text-slate-600 backdrop-blur-xl hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:text-cyan-400"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {/*
         * The bar itself stays 6px tall, but a 6px control is well under any
         * reasonable touch target, so each button carries its own padding and
         * the visible bar is a child. Hit area 24px, visual weight unchanged.
         */}
        <div className="flex items-center">
          {CAPABILITIES.map((capability, index) => (
            <button
              key={capability.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${capability.title}`}
              aria-current={index === activeIndex}
              className="group flex h-6 items-center justify-center px-1"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-300 ease-out-expo",
                  index === activeIndex
                    ? "w-6 bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400"
                    : "w-1.5 bg-slate-300 group-hover:w-3 group-hover:bg-slate-400 dark:bg-white/20 dark:group-hover:bg-white/40",
                )}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next capability"
          className="interactive flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/70 text-slate-600 backdrop-blur-xl hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:text-cyan-400"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
