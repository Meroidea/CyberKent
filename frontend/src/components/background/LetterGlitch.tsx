import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useTheme } from "@/theme/useTheme";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Cell {
  char: string;
  /** Colour on screen right now. */
  color: Rgb;
  /** Colour it is easing towards. */
  target: Rgb;
  /** 0 → 1; at 1 the cell has arrived and stops being redrawn. */
  progress: number;
}

interface LetterGlitchProps {
  className?: string;
  /** Milliseconds between glitch ticks. */
  glitchSpeed?: number;
  /** Share of the field rewritten on each tick. */
  churn?: number;
  /** Ease colour between states instead of snapping. */
  smooth?: boolean;
  characters?: string;
}

/*
 * Cell metrics. Larger than the 10x20 of the original: this runs full-viewport
 * behind an entire page, and cell area is the only real lever on how much work
 * a frame costs.
 */
const CHAR_WIDTH = 12;
const CHAR_HEIGHT = 22;
const FONT_SIZE = 14;

/** Colour ramp per theme, kept in the brand's indigo/cyan range. */
const PALETTES: Record<"light" | "dark", string[]> = {
  light: ["#6366f1", "#06b6d4", "#94a3b8"],
  dark: ["#818cf8", "#22d3ee", "#334155"],
};

/**
 * Steps a transition takes to complete. Eight frames reads as a fade rather
 * than a snap while keeping the number of cells mid-transition — and therefore
 * the number redrawn each frame — bounded.
 */
const PROGRESS_STEP = 1 / 8;

function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

/**
 * Full-viewport field of glitching characters, drawn on one canvas.
 *
 * Purely decorative: it sits in the fixed backdrop behind every layer, takes no
 * pointer events, and is masked away from the middle of the screen so it never
 * competes with the column the content actually occupies.
 *
 * The redraw is per-cell rather than whole-canvas. The original repaints every
 * cell on every frame, which at this size is upwards of ten thousand `fillText`
 * calls at 60fps on top of the particle canvas and several scroll-driven
 * scenes. Here a cell is repainted only while it is actually changing, so a
 * frame costs a few hundred draws in the steady state instead of ten thousand.
 */
export function LetterGlitch({
  className,
  glitchSpeed = 60,
  churn = 0.015,
  smooth = true,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789",
}: LetterGlitchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteRef = useRef<Rgb[]>(PALETTES.dark.map(hexToRgb));
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  /* Read through a ref so a theme toggle recolours on the next frame rather
     than tearing down and rebuilding the whole field. */
  useEffect(() => {
    paletteRef.current = (PALETTES[theme] ?? PALETTES.dark).map(hexToRgb);
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const alphabet = Array.from(characters);
    let cells: Cell[] = [];
    let columns = 0;
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTick = 0;

    /* Indices awaiting a repaint. A Set keeps a cell from being drawn twice in
       one frame when it is both freshly glitched and mid-transition. */
    const dirty = new Set<number>();
    const transitioning = new Set<number>();

    const randomChar = () => alphabet[Math.floor(Math.random() * alphabet.length)] ?? "0";
    const randomColor = () => {
      const palette = paletteRef.current;
      return palette[Math.floor(Math.random() * palette.length)] ?? { r: 128, g: 128, b: 128 };
    };

    const applyFont = () => {
      context.font = `${FONT_SIZE}px ui-monospace, SFMono-Regular, monospace`;
      context.textBaseline = "top";
    };

    const drawCell = (index: number) => {
      const cell = cells[index];

      if (!cell) {
        return;
      }

      const x = (index % columns) * CHAR_WIDTH;
      const y = Math.floor(index / columns) * CHAR_HEIGHT;

      context.clearRect(x, y, CHAR_WIDTH, CHAR_HEIGHT);
      context.fillStyle = `rgb(${cell.color.r},${cell.color.g},${cell.color.b})`;
      context.fillText(cell.char, x, y);
    };

    const build = () => {
      const parent = canvas.parentElement;

      if (!parent) {
        return;
      }

      const rect = parent.getBoundingClientRect();
      /*
       * Capped below the device ratio on purpose. The field is a faint, masked
       * texture, so the sharpness a 3x buffer buys is invisible while its fill
       * cost is not.
       */
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);

      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      applyFont();

      columns = Math.ceil(width / CHAR_WIDTH);
      const rows = Math.ceil(height / CHAR_HEIGHT);

      cells = Array.from({ length: columns * rows }, () => {
        const color = randomColor();
        return { char: randomChar(), color, target: color, progress: 1 };
      });

      dirty.clear();
      transitioning.clear();
      context.clearRect(0, 0, width, height);
      cells.forEach((_, index) => drawCell(index));
    };

    const tick = () => {
      const count = Math.max(1, Math.floor(cells.length * churn));

      for (let i = 0; i < count; i += 1) {
        const index = Math.floor(Math.random() * cells.length);
        const cell = cells[index];

        if (!cell) {
          continue;
        }

        cell.char = randomChar();
        cell.target = randomColor();

        if (smooth) {
          cell.progress = 0;
          transitioning.add(index);
        } else {
          cell.color = cell.target;
          cell.progress = 1;
        }

        dirty.add(index);
      }
    };

    const advanceTransitions = () => {
      for (const index of transitioning) {
        const cell = cells[index];

        if (!cell) {
          transitioning.delete(index);
          continue;
        }

        cell.progress = Math.min(1, cell.progress + PROGRESS_STEP);
        const t = cell.progress;
        cell.color = {
          r: Math.round(cell.color.r + (cell.target.r - cell.color.r) * t),
          g: Math.round(cell.color.g + (cell.target.g - cell.color.g) * t),
          b: Math.round(cell.color.b + (cell.target.b - cell.color.b) * t),
        };

        dirty.add(index);

        if (cell.progress >= 1) {
          cell.color = cell.target;
          transitioning.delete(index);
        }
      }
    };

    const step = (now: number) => {
      if (now - lastTick >= glitchSpeed) {
        tick();
        lastTick = now;
      }

      if (smooth) {
        advanceTransitions();
      }

      for (const index of dirty) {
        drawCell(index);
      }

      dirty.clear();
      frame = window.requestAnimationFrame(step);
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(build, 120);
    };

    build();

    /* Under reduced motion the field is composed once and left alone — the
       texture stays, the flicker does not. */
    if (!prefersReducedMotion) {
      frame = window.requestAnimationFrame(step);
    }

    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [characters, churn, glitchSpeed, smooth, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("absolute inset-0 h-full w-full", className)}
    />
  );
}
