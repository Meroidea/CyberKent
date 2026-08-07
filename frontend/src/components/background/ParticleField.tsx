import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useTheme } from "@/theme/useTheme";

interface Particle {
  x: number;
  y: number;
  radius: number;
  drift: number;
  fall: number;
  alpha: number;
}

interface ParticleFieldProps {
  /** Particles per million device-independent pixels. */
  density?: number;
}

const LIGHT_COLOR = "99, 102, 241";
const DARK_COLOR = "129, 140, 248";

function createParticles(width: number, height: number, density: number): Particle[] {
  const count = Math.round((width * height * density) / 1_000_000);

  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 0.6 + Math.random() * 1.4,
    drift: (Math.random() - 0.5) * 0.12,
    fall: 0.06 + Math.random() * 0.18,
    alpha: 0.25 + Math.random() * 0.5,
  }));
}

/**
 * Ambient particle wash on a single canvas — one animation frame loop instead
 * of hundreds of animated DOM nodes. The theme colour is read through a ref so
 * a theme toggle repaints on the next frame without restarting the field.
 */
export function ParticleField({ density = 90 }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(DARK_COLOR);
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    colorRef.current = theme === "dark" ? DARK_COLOR : LIGHT_COLOR;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    let particles: Particle[] = [];
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
      particles = createParticles(width, height, density);
    };

    const paint = () => {
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        context.beginPath();
        context.fillStyle = `rgba(${colorRef.current}, ${particle.alpha})`;
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }
    };

    const step = () => {
      for (const particle of particles) {
        particle.x += particle.drift;
        particle.y += particle.fall;

        if (particle.y - particle.radius > height) {
          particle.y = -particle.radius;
          particle.x = Math.random() * width;
        }

        if (particle.x < -particle.radius) {
          particle.x = width + particle.radius;
        } else if (particle.x > width + particle.radius) {
          particle.x = -particle.radius;
        }
      }

      paint();
      frame = window.requestAnimationFrame(step);
    };

    resize();

    if (prefersReducedMotion) {
      paint();
    } else {
      frame = window.requestAnimationFrame(step);
    }

    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [density, prefersReducedMotion]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
