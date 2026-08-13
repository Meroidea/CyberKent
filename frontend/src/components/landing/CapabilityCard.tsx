import { Bell, LifeBuoy, Link2, MapPinned, ScanSearch, ShieldCheck, type LucideIcon } from "lucide-react";
import type { Capability } from "@/content/landing";
import { ACCENT_GRADIENT } from "@/components/landing/console/primitives";
import { cn } from "@/lib/cn";
import alertsImage from "@/assets/capabilities/alerts.webp";
import indicatorsImage from "@/assets/capabilities/indicators.webp";
import mapImage from "@/assets/capabilities/map.webp";
import messageImage from "@/assets/capabilities/message.webp";
import recoveryImage from "@/assets/capabilities/recovery.webp";
import reportImage from "@/assets/capabilities/report.webp";

const CAPABILITY_ICONS: Record<Capability["icon"], LucideIcon> = {
  scan: ScanSearch,
  link: Link2,
  shield: ShieldCheck,
  map: MapPinned,
  bell: Bell,
  "life-buoy": LifeBuoy,
};

/**
 * Photography is keyed by capability rather than declared in `content/landing`:
 * the content module stays plain data that any renderer can consume, and the
 * bundler-resolved asset URLs stay in the component that paints them.
 *
 * The images carry no information the heading and body do not already state,
 * so they are decorative — `alt=""` keeps them out of the accessibility tree
 * instead of making a screen reader listen to a description of a stock photo.
 */
const CAPABILITY_IMAGES: Record<string, string> = {
  message: messageImage,
  indicators: indicatorsImage,
  report: reportImage,
  map: mapImage,
  alerts: alertsImage,
  recovery: recoveryImage,
};

/**
 * Liquid-glass panel over a photograph: the image fills the card, an accent
 * wash tints it, and a scrim rising from the bottom edge carries the text.
 * Contents are lifted in Z so they separate from the card face as the
 * coverflow rotates.
 *
 * The scrim is the load-bearing part. Body copy sits over roughly the lower
 * half of a photograph whose tone is not known in advance, in two themes with
 * opposite text colours — so each theme paints its own page-coloured wash,
 * near-opaque under the text and clearing only in the top third where nothing
 * but the icon sits.
 */
export function CapabilityCard({ capability }: { capability: Capability }) {
  const Icon = CAPABILITY_ICONS[capability.icon];
  const image = CAPABILITY_IMAGES[capability.id];

  return (
    <article
      className="glass-surface group relative flex h-full flex-col justify-end overflow-hidden rounded-3xl p-7 shadow-xl shadow-slate-900/5 dark:shadow-black/40"
      style={{ transformStyle: "preserve-3d" }}
    >
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full scale-100 object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.06] dark:opacity-75"
        />
      ) : null}

      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br blur-3xl opacity-40",
          ACCENT_GRADIENT[capability.accent],
        )}
      />
      {/*
       * Stops rather than the default 0/50/100: opaque up to 42% of the card
       * height clears the tallest body copy, and the ramp is spent by 70% so
       * the photograph stays a photograph across the top third instead of
       * fading uniformly into fog.
       */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white from-[42%] via-white/85 via-[70%] to-transparent dark:from-[#0d0d0d] dark:via-[#111111]/80 dark:to-transparent"
      />
      {/*
       * The sheen is halved over a photograph. At its full weight it stacks
       * with the scrim across the top of the card, which is exactly where the
       * image is meant to be clearest.
       */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent to-transparent dark:from-white/10",
          image ? "from-white/25" : "from-white/50",
        )}
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
