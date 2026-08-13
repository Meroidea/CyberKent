import type { ResolvedTheme } from "@/theme/ThemeProvider";

export interface Arc {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
}

export interface GlobePalette {
  globeColor: string;
  emissive: string;
  emissiveIntensity: number;
  shininess: number;
  atmosphereColor: string;
  atmosphereAltitude: number;
  hexPolygonColor: string;
  /** Key light — the one that carves the terminator across the sphere. */
  keyLight: string;
  keyIntensity: number;
  /** Fill, lifting the dark side so it reads as shaded rather than clipped. */
  fillLight: string;
  fillIntensity: number;
  ambientLight: string;
  ambientIntensity: number;
  rimLight: string;
  rimIntensity: number;
  /** Ground shadow cast beneath the sphere. */
  shadowColor: string;
  shadowOpacity: number;
  /** Arc and ring colours, cycled in order. */
  arcColors: [string, string, string];
}

/**
 * Two genuinely different globes, each built to separate from its own page.
 *
 * The governing constraint is contrast against the background, not fidelity to
 * a reference screenshot. A near-black ocean on a near-black page and a chalky
 * one on a white page both disappear — so dark runs a luminous mid-blue body
 * with a wide cyan halo, and light runs a deep indigo body with pale
 * landmasses. Same object, opposite side of its background in each theme.
 */
export const GLOBE_PALETTES: Record<ResolvedTheme, GlobePalette> = {
  dark: {
    globeColor: "#1e4fa8",
    emissive: "#0d2f6e",
    emissiveIntensity: 0.55,
    shininess: 1.4,
    atmosphereColor: "#22d3ee",
    atmosphereAltitude: 0.23,
    hexPolygonColor: "rgba(191,240,255,0.9)",
    keyLight: "#ffffff",
    keyIntensity: 3.4,
    fillLight: "#38bdf8",
    fillIntensity: 1.5,
    ambientLight: "#3b82f6",
    ambientIntensity: 1.8,
    rimLight: "#67e8f9",
    rimIntensity: 4,
    shadowColor: "#000000",
    shadowOpacity: 0.6,
    arcColors: ["#67e8f9", "#93c5fd", "#a5b4fc"],
  },
  light: {
    globeColor: "#111c44",
    emissive: "#0a1330",
    emissiveIntensity: 0.14,
    shininess: 3,
    atmosphereColor: "#6366f1",
    atmosphereAltitude: 0.17,
    hexPolygonColor: "rgba(224,238,255,0.98)",
    keyLight: "#ffffff",
    keyIntensity: 3.1,
    fillLight: "#a5b4fc",
    fillIntensity: 1.1,
    ambientLight: "#dbeafe",
    ambientIntensity: 1.5,
    rimLight: "#818cf8",
    rimIntensity: 2.4,
    shadowColor: "#1e1b4b",
    shadowOpacity: 0.35,
    arcColors: ["#06b6d4", "#2563eb", "#4f46e5"],
  },
};

/**
 * Melbourne. Hume sits on its northern edge, and every route is drawn as an
 * approach toward it: the arcs are meant to read as "this is where the traffic
 * reaching you comes from", not as decorative flight paths.
 */
export const HUME: { lat: number; lng: number } = { lat: -37.6, lng: 144.92 };

/**
 * Origins for the scan arcs.
 *
 * These are ordinary population and infrastructure centres, chosen only to
 * spread the arcs evenly around the sphere. They are NOT claims about where
 * scams come from — attributing an origin to a message from its content is
 * exactly the kind of inference this service does not make, and a map that
 * appeared to accuse particular countries would be worse than no map.
 */
const ORIGINS: { lat: number; lng: number; alt: number }[] = [
  { lat: 51.5072, lng: -0.1276, alt: 0.42 }, // London
  { lat: 40.7128, lng: -74.006, alt: 0.5 }, // New York
  { lat: 1.3521, lng: 103.8198, alt: 0.22 }, // Singapore
  { lat: 35.6762, lng: 139.6503, alt: 0.26 }, // Tokyo
  { lat: 28.6139, lng: 77.209, alt: 0.34 }, // Delhi
  { lat: -33.8688, lng: 151.2093, alt: 0.12 }, // Sydney
  { lat: -1.2921, lng: 36.8219, alt: 0.44 }, // Nairobi
  { lat: -23.5505, lng: -46.6333, alt: 0.56 }, // São Paulo
  { lat: 52.52, lng: 13.405, alt: 0.4 }, // Berlin
  { lat: 25.2048, lng: 55.2708, alt: 0.3 }, // Dubai
  { lat: 37.7749, lng: -122.4194, alt: 0.48 }, // San Francisco
  { lat: 22.3193, lng: 114.1694, alt: 0.24 }, // Hong Kong
  { lat: 55.7558, lng: 37.6173, alt: 0.38 }, // Moscow
  { lat: -34.6037, lng: -58.3816, alt: 0.58 }, // Buenos Aires
  { lat: 43.6532, lng: -79.3832, alt: 0.46 }, // Toronto
  { lat: 14.5995, lng: 120.9842, alt: 0.28 }, // Manila
  { lat: -26.2041, lng: 28.0473, alt: 0.36 }, // Johannesburg
  { lat: 19.076, lng: 72.8777, alt: 0.32 }, // Mumbai
];

/**
 * Every arc converges on Hume, in ascending `order` so `three-globe` staggers
 * their dash animations into waves rather than firing all eighteen at once.
 */
export const SCAN_ARCS = (palette: GlobePalette): Arc[] =>
  ORIGINS.map((origin, index) => ({
    order: 1 + (index % 6),
    startLat: origin.lat,
    startLng: origin.lng,
    endLat: HUME.lat,
    endLng: HUME.lng,
    arcAlt: origin.alt,
    /* Indexed, not random: a re-render must not repaint the arcs. */
    color: palette.arcColors[index % palette.arcColors.length] as string,
  }));
