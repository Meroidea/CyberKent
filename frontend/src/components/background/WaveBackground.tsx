import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useTheme } from "@/theme/useTheme";

const WAVES = [
  { amplitude: 26, wavelength: 420, speed: 0.00022, offset: 0.0, color: "99, 102, 241" },
  { amplitude: 20, wavelength: 320, speed: 0.00031, offset: 1.1, color: "56, 189, 248" },
  { amplitude: 32, wavelength: 560, speed: 0.00017, offset: 2.3, color: "6, 182, 212" },
  { amplitude: 16, wavelength: 260, speed: 0.00042, offset: 3.7, color: "129, 140, 248" },
  { amplitude: 24, wavelength: 480, speed: 0.00026, offset: 5.2, color: "45, 212, 191" },
];

/**
 * Layered wave field drawn on a canvas.
 *
 * Composed sine harmonics rather than a noise library: the visual result is
 * equivalent at this blur radius and it keeps a dependency out of the bundle.
 * The theme alpha lives in a ref so toggling repaints on the next frame.
 */
export function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const alphaRef = useRef(0.18);
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    alphaRef.current = theme === "dark" ? 0.16 : 0.22;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    let frame = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const paint = (time: number) => {
      context.clearRect(0, 0, width, height);
      context.filter = "blur(24px)";

      WAVES.forEach((wave, index) => {
        const baseline = height * (0.34 + index * 0.11);

        context.beginPath();
        context.moveTo(0, height);

        for (let x = 0; x <= width; x += 8) {
          const phase = x / wave.wavelength + time * wave.speed + wave.offset;
          const y = baseline + Math.sin(phase) * wave.amplitude + Math.sin(phase * 2.3) * (wave.amplitude / 3);
          context.lineTo(x, y);
        }

        context.lineTo(width, height);
        context.closePath();
        context.fillStyle = `rgba(${wave.color}, ${alphaRef.current})`;
        context.fill();
      });

      context.filter = "none";
    };

    const step = (time: number) => {
      paint(time);
      frame = window.requestAnimationFrame(step);
    };

    resize();

    if (prefersReducedMotion) {
      paint(0);
    } else {
      frame = window.requestAnimationFrame(step);
    }

    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [prefersReducedMotion]);

  return (
    /*
     * The scrim is opaque enough to sit content on, which made the section's
     * own rectangle visible as a hard band edge against the page background.
     * Masking the whole layer to nothing at the top and bottom edges dissolves
     * the seam, so the wave field reads as part of the page rather than as a
     * panel laid over it.
     */
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,black_14%,black_86%,transparent_100%)]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* A translucent sheet rather than backdrop-filter: a backdrop blur would
          freeze the moving canvas behind it in Chromium. */}
      <div className="absolute inset-0 bg-slate-50/70 dark:bg-[#0A0A0A]/75" />
    </div>
  );
}
