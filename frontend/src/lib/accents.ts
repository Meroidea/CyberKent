/**
 * The accent ramp, as Tailwind gradient pairs.
 *
 * One map rather than a class string per component, because the accents are an
 * identity: a capability card, its coverflow dot and the console row for the
 * same feature have to be demonstrably the same colour, and six literals
 * scattered across three files is how that stops being true.
 *
 * The keys match the `accent` union in `content/landing`.
 */
export type Accent = "indigo" | "cyan" | "emerald" | "amber" | "rose" | "violet";

export const ACCENT_GRADIENT: Record<Accent, string> = {
  indigo: "from-indigo-500 to-indigo-400",
  cyan: "from-cyan-500 to-sky-400",
  emerald: "from-emerald-500 to-teal-400",
  amber: "from-amber-500 to-orange-400",
  rose: "from-rose-500 to-pink-400",
  violet: "from-violet-500 to-fuchsia-400",
};
