import type { CSSProperties } from "react";
import {
  MARK_BLADE_PATH,
  MARK_BLADE_TRANSFORM,
  MARK_HEIGHT,
  MARK_WIDTH,
} from "@/components/brand/markGeometry";
import { SITE } from "@/config/site";
import { useTheme } from "@/theme/useTheme";

/** One rotating group: duration in seconds, and which way it turns. */
function ring(seconds: number, reverse = false): CSSProperties {
  return {
    animation: `${reverse ? "hud-spin-reverse" : "hud-spin"} ${seconds}s linear infinite`,
    transformOrigin: "200px 200px",
  };
}

interface HudPalette {
  /** Brightest arcs — the lit element of the dial. */
  lit: string;
  /** Structural rings and ticks. */
  line: string;
  accent: string;
  amber: string;
  rose: string;
  coreFrom: string;
  coreMid: string;
  coreTo: string;
  coreText: string;
  coreSub: string;
  /** Bloom radius. Glow is what separates a lit stroke from black; over white
      it only smears the edge, so the light dial barely uses it. */
  bloom: number;
  /**
   * Multiplier on every stroke opacity.
   *
   * The dark dial can sit at a fraction of full strength and still read,
   * because it glows out of near-black. The same values over near-white are
   * ghosts — light needs the strokes carrying their own contrast instead.
   */
  strength: number;
}

const HUD_PALETTES: Record<"light" | "dark", HudPalette> = {
  dark: {
    lit: "#22d3ee",
    line: "#38bdf8",
    accent: "#818cf8",
    amber: "#f59e0b",
    rose: "#f43f5e",
    coreFrom: "#0f766e",
    coreMid: "#0d9488",
    coreTo: "#134e4a",
    coreText: "#5eead4",
    coreSub: "#99f6e4",
    bloom: 3,
    strength: 1,
  },
  light: {
    lit: "#0891b2",
    line: "#0284c7",
    accent: "#4f46e5",
    amber: "#b45309",
    rose: "#be123c",
    coreFrom: "#14b8a6",
    coreMid: "#0d9488",
    coreTo: "#0f766e",
    coreText: "#ffffff",
    coreSub: "#ccfbf1",
    bloom: 1.1,
    strength: 1.9,
  },
};

/**
 * How large the brand mark sits inside the core, as a multiple of its own
 * 65 × 100 box. At 0.46 the mark is 46 units tall in a well of radius 56, which
 * leaves room under it for the wordmark without either crowding the rim.
 */
const CORE_MARK_SCALE = 0.46;

/** Evenly spaced radial ticks, drawn once and rotated as a group. */
function Ticks({
  count,
  inner,
  outer,
  width = 1,
  color,
  opacity = 0.45,
}: {
  count: number;
  inner: number;
  outer: number;
  width?: number;
  color: string;
  opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2;
        const sin = Math.sin(angle);
        const cos = -Math.cos(angle);

        return (
          <line
            key={index}
            x1={200 + sin * inner}
            y1={200 + cos * inner}
            x2={200 + sin * outer}
            y2={200 + cos * outer}
            stroke={color}
            strokeWidth={width}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

/**
 * Heads-up boot dial, in the manner of the Iron Man interface.
 *
 * Entirely vector and CSS — a dozen concentric groups, each turning at its own
 * rate and direction, layered from a faint outer graticule through segmented
 * arcs and bead rings to a lit core. Nothing here is an image, so it stays sharp
 * at any size and costs one composited transform per group.
 *
 * The centre carries this service's own name rather than the one from the film:
 * the visual language is worth borrowing, the trademark is not.
 */
export function JarvisLoader({ className }: { className?: string }) {
  const { theme } = useTheme();
  const c = HUD_PALETTES[theme] ?? HUD_PALETTES.dark;

  /** Stroke opacity scaled for the theme, never past solid. */
  const o = (value: number) => Math.min(1, value * c.strength);

  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label="Starting the CyberSafe interface"
    >
      <defs>
        <filter id="hud-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={c.bloom} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <radialGradient id="hud-core">
          <stop offset="0%" stopColor={c.coreFrom} stopOpacity="0.95" />
          <stop offset="70%" stopColor={c.coreMid} stopOpacity={c.strength > 1 ? 0.95 : 0.8} />
          <stop offset="100%" stopColor={c.coreTo} stopOpacity={c.strength > 1 ? 0.9 : 0.5} />
        </radialGradient>
      </defs>

      {/* Outer graticule — the fixed frame everything else turns inside. */}
      <g style={ring(120)}>
        <circle cx="200" cy="200" r="192" fill="none" stroke={c.line} strokeWidth="0.5" opacity={o(0.18)} />
        <Ticks count={96} inner={184} outer={190} width={0.75} color={c.line} opacity={o(0.22)} />
        <Ticks count={12} inner={176} outer={191} width={1.5} color={c.line} opacity={o(0.45)} />
      </g>

      {/* Broken outer arcs. */}
      <g style={ring(64, true)}>
        <circle
          cx="200"
          cy="200"
          r="176"
          fill="none"
          stroke={c.line}
          strokeWidth="2"
          opacity={o(0.35)}
          strokeDasharray="150 46 72 120 30 90"
          strokeLinecap="round"
        />
        <circle cx="200" cy="200" r="168" fill="none" stroke={c.rose} strokeWidth="2.5" opacity={o(0.5)} strokeDasharray="14 300 8 200" />
        <circle cx="200" cy="200" r="168" fill="none" stroke={c.amber} strokeWidth="2.5" opacity={o(0.45)} strokeDasharray="10 500 20 120" />
      </g>

      {/* Dense read-out band. */}
      <g style={ring(48)}>
        <circle cx="200" cy="200" r="156" fill="none" stroke={c.line} strokeWidth="7" opacity={o(0.16)} strokeDasharray="2 7" />
        <circle
          cx="200"
          cy="200"
          r="146"
          fill="none"
          stroke={c.accent}
          strokeWidth="1.5"
          opacity={o(0.4)}
          strokeDasharray="90 40 160 60"
        />
      </g>

      {/* Bead ring. */}
      <g style={ring(36, true)}>
        <circle
          cx="200"
          cy="200"
          r="132"
          fill="none"
          stroke={c.line}
          strokeWidth="5"
          opacity={o(0.75)}
          strokeDasharray="0.1 13"
          strokeLinecap="round"
        />
      </g>

      {/* Lit primary arcs — the brightest element, and the fastest. */}
      <g style={ring(14)} filter="url(#hud-glow)">
        <circle
          cx="200"
          cy="200"
          r="118"
          fill="none"
          stroke={c.lit}
          strokeWidth="3.5"
          opacity={o(0.95)}
          strokeDasharray="180 90 60 110"
          strokeLinecap="round"
        />
      </g>
      <g style={ring(20, true)} filter="url(#hud-glow)">
        <circle
          cx="200"
          cy="200"
          r="108"
          fill="none"
          stroke={c.line}
          strokeWidth="2"
          opacity={o(0.9)}
          strokeDasharray="40 30 200 60"
          strokeLinecap="round"
        />
      </g>

      {/*
       * Chevron band. The under-layer is white on dark, where it lifts the band
       * off black; on light that would erase it, so it takes the accent instead.
       */}
      <g style={ring(26)}>
        <circle
          cx="200"
          cy="200"
          r="94"
          fill="none"
          stroke={c.strength > 1 ? c.accent : "#ffffff"}
          strokeWidth="9"
          opacity={o(0.14)}
          strokeDasharray="10 6"
        />
        <circle cx="200" cy="200" r="94" fill="none" stroke={c.lit} strokeWidth="9" opacity={o(0.22)} strokeDasharray="26 130" />
      </g>

      {/* Inner bead ring. */}
      <g style={ring(30, true)}>
        <circle
          cx="200"
          cy="200"
          r="78"
          fill="none"
          stroke={c.line}
          strokeWidth="4"
          opacity={o(0.7)}
          strokeDasharray="0.1 10"
          strokeLinecap="round"
        />
      </g>

      {/* Core. */}
      <g>
        <circle cx="200" cy="200" r="62" fill="none" stroke={c.lit} strokeWidth="1" opacity={o(0.5)} />
        <circle cx="200" cy="200" r="56" fill="url(#hud-core)" />
        <circle
          cx="200"
          cy="200"
          r="56"
          fill="none"
          stroke={c.lit}
          strokeWidth="1.5"
          opacity={o(0.85)}
          style={{ animation: "hud-pulse 2.2s ease-in-out infinite" }}
        />

        {/*
          * The mark, held at the centre of the dial.
          *
          * It is the one part of the drawing that is not invented for the
          * loader: everything around it is HUD furniture, and what the dial is
          * assembling towards is the brand. Painted in the core's own text
          * colours rather than the site tokens — inside a lit teal well the
          * indigo blade goes muddy, and the mark reads better as one lit form
          * than as two colours fighting the glow behind them.
          */}
        <g transform={`translate(${200 - (MARK_WIDTH * CORE_MARK_SCALE) / 2} ${190 - (MARK_HEIGHT * CORE_MARK_SCALE) / 2}) scale(${CORE_MARK_SCALE})`}>
          <path
            d={MARK_BLADE_PATH}
            transform={MARK_BLADE_TRANSFORM}
            fill={c.coreSub}
            opacity={o(0.75)}
          />
          <path d={MARK_BLADE_PATH} fill={c.coreText} />
        </g>

        <text
          x="200"
          y="230"
          textAnchor="middle"
          fill={c.coreSub}
          fontSize="9"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          letterSpacing="3"
          opacity="0.85"
        >
          {SITE.name.toUpperCase()}
        </text>
      </g>

      {/* Sweeping pointer, tying the dial to one moving datum. */}
      <g style={ring(8)}>
        <path d="M200 26 l6 12 h-12 z" fill={c.lit} opacity={o(0.9)} />
        <line x1="200" y1="40" x2="200" y2="62" stroke={c.lit} strokeWidth="1" opacity={o(0.4)} />
      </g>
    </svg>
  );
}
