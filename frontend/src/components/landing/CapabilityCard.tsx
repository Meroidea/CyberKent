import { Bell, LifeBuoy, Link2, MapPinned, ScanSearch, ShieldCheck, type LucideIcon } from "lucide-react";
import type { Capability } from "@/content/landing";
import { ACCENT_GRADIENT } from "@/components/landing/console/primitives";
import { cn } from "@/lib/cn";

const CAPABILITY_ICONS: Record<Capability["icon"], LucideIcon> = {
  scan: ScanSearch,
  link: Link2,
  shield: ShieldCheck,
  map: MapPinned,
  bell: Bell,
  "life-buoy": LifeBuoy,
};

/**
 * Liquid-glass panel: a blurred accent wash behind a scrim, a sheen gradient
 * and an inset ring. Contents are lifted in Z so they separate from the card
 * face as the coverflow rotates.
 */
export function CapabilityCard({ capability }: { capability: Capability }) {
  const Icon = CAPABILITY_ICONS[capability.icon];

  return (
    <article
      className="glass-surface relative flex h-full flex-col justify-end overflow-hidden rounded-3xl p-7 shadow-xl shadow-slate-900/5 dark:shadow-black/40"
      style={{ transformStyle: "preserve-3d" }}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br blur-3xl opacity-40",
          ACCENT_GRADIENT[capability.accent],
        )}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-transparent dark:from-white/10"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/40 dark:ring-white/10"
      />

      <div className="relative flex flex-col gap-4" style={{ transform: "translateZ(40px)" }}>
        <span
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
            ACCENT_GRADIENT[capability.accent],
          )}
          style={{ transform: "translateZ(20px)" }}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-cyan-400">
            {capability.eyebrow}
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold leading-tight text-slate-900 dark:text-white">
            {capability.title}
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {capability.body}
        </p>
      </div>
    </article>
  );
}
