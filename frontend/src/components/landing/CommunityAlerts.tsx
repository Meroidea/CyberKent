import { motion } from "framer-motion";
import { ArrowUpRight, BellRing } from "lucide-react";
import { COMMUNITY_ALERTS, type AlertSeverity, type CommunityAlert } from "@/content/landing";
import { ROUTES, SECTION_IDS } from "@/config/site";
import { ActionLink } from "@/components/ui/ActionLink";
import { Marquee } from "@/components/ui/Marquee";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, REVEAL_VIEWPORT } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** Severity colours match the console: emerald low, amber medium, rose high. */
const SEVERITY_STYLES: Record<AlertSeverity, { badge: string; dot: string; label: string }> = {
  high: {
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    label: "High",
  },
  medium: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    label: "Medium",
  },
  low: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    label: "Low",
  },
};

function AlertCard({ alert }: { alert: CommunityAlert }) {
  const severity = SEVERITY_STYLES[alert.severity];

  return (
    <figure className="liquid-glass flex w-[14.5rem] shrink-0 flex-col gap-1.5 rounded-xl p-3 transition-transform duration-300 ease-out-expo hover:-translate-y-1 sm:w-[16rem]">
      <header className="flex items-center gap-2">
        <span className="truncate font-mono text-[0.625rem] text-slate-500 dark:text-slate-400">
          {alert.reference}
        </span>
        <span
          className={cn(
            "ml-auto inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-px text-[0.5625rem] font-semibold",
            severity.badge,
          )}
        >
          <span className={cn("h-1 w-1 rounded-full", severity.dot)} aria-hidden="true" />
          {severity.label}
        </span>
      </header>

      <div>
        <p className="truncate text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-cyan-400">
          {alert.category}
        </p>
        <h3 className="mt-1 line-clamp-2 font-display text-[0.8125rem] font-semibold leading-snug text-slate-900 dark:text-white">
          {alert.headline}
        </h3>
      </div>

      {/*
       * The reported wording, set apart as evidence rather than prose. Monospace
       * and a tinted well keep it visibly quoted — nobody should mistake the
       * specimen for the Council speaking.
       *
       * The card carries the specimen and not `alert.summary`: at this size only
       * one of the two fits, and the wording is what a resident recognises on
       * their own screen, where the advice is what they go to the alerts page
       * for. Clamped, so a long specimen cannot set the height of the rail.
       */}
      <blockquote className="rounded-lg border border-slate-900/[0.06] bg-slate-900/[0.03] px-2 py-1.5 dark:border-white/10 dark:bg-black/20">
        <p className="line-clamp-2 font-mono text-[0.625rem] leading-relaxed text-slate-700 dark:text-slate-300">
          {alert.specimen}
        </p>
      </blockquote>

      <figcaption className="mt-auto truncate border-t border-slate-900/[0.06] pt-1.5 font-mono text-[0.625rem] text-slate-500 dark:border-white/10 dark:text-slate-400">
        {alert.suburb} · {alert.channel}
      </figcaption>
    </figure>
  );
}

const HALF = Math.ceil(COMMUNITY_ALERTS.length / 2);
const TOP_ROW = COMMUNITY_ALERTS.slice(0, HALF);
const BOTTOM_ROW = COMMUNITY_ALERTS.slice(HALF);

export function CommunityAlerts() {
  return (
    <section id={SECTION_IDS.alerts} className="relative z-10 py-section">
      <div className="container">
        <SectionHeading
          icon={BellRing}
          title="Circulating in Hume"
          accent="right now."
          lede="Published only after a Council officer has reviewed the report and removed anything that could identify the person who sent it in."
        />
      </div>

      {/*
       * Full-bleed, outside the container: a rail that stops at the text column
       * announces its own ends and stops reading as continuous.
       *
       * The edges are faded with a mask rather than the gradient overlays this
       * pattern usually uses. An overlay has to match the colour behind it, and
       * behind this sit a gradient wash, a tile grid and a particle canvas —
       * nothing a flat `from-background` could ever line up with.
       */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        className="mt-section-gap flex flex-col gap-4 [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]"
      >
        <Marquee pauseOnHover repeat={4} className="[--duration:56s] [--gap:0.875rem]">
          {TOP_ROW.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </Marquee>

        {/* Reversed, so the two rows shear past each other instead of reading
            as one block sliding sideways. */}
        <Marquee reverse pauseOnHover repeat={4} className="[--duration:64s] [--gap:0.875rem]">
          {BOTTOM_ROW.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </Marquee>
      </motion.div>

      <div className="container">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          className="mt-12 flex justify-center"
        >
          <ActionLink href={ROUTES.alerts} variant="secondary">
            See all community alerts
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </ActionLink>
        </motion.div>
      </div>
    </section>
  );
}
