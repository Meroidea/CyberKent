import { useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, BookOpen, MapPinned, ScanSearch, ShieldAlert, type LucideIcon } from "lucide-react";
import { DetectTab } from "@/components/landing/console/DetectTab";
import { ReportTab } from "@/components/landing/console/ReportTab";
import { AlertsTab } from "@/components/landing/console/AlertsTab";
import { MapTab } from "@/components/landing/console/MapTab";
import { LearnTab } from "@/components/landing/console/LearnTab";
import { LiveDot, ACCENT_GRADIENT, type Accent } from "@/components/landing/console/primitives";
import { blurSwap } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface ConsoleTab {
  id: string;
  label: string;
  icon: LucideIcon;
  accent: Accent;
  title: string;
  subtitle: string;
  status: string;
  Body: ComponentType<{ animated: boolean }>;
}

const TABS: ConsoleTab[] = [
  {
    id: "detect",
    label: "Detect",
    icon: ScanSearch,
    accent: "indigo",
    title: "Scam checker",
    subtitle: "Content and indicator analysis with the reasoning shown",
    status: "analysing",
    Body: DetectTab,
  },
  {
    id: "report",
    label: "Report",
    icon: ShieldAlert,
    accent: "emerald",
    title: "Report management",
    subtitle: "From draft to reviewed, with a reference you can track",
    status: "queue open",
    Body: ReportTab,
  },
  {
    id: "alerts",
    label: "Alerts",
    icon: Bell,
    accent: "amber",
    title: "Community alerts",
    subtitle: "Reviewed, de-identified, then published to subscribers",
    status: "publishing",
    Body: AlertsTab,
  },
  {
    id: "map",
    label: "Map",
    icon: MapPinned,
    accent: "violet",
    title: "Scam map and trends",
    subtitle: "Aggregated to suburb level so patterns show, people do not",
    status: "aggregated",
    Body: MapTab,
  },
  {
    id: "learn",
    label: "Recover",
    icon: BookOpen,
    accent: "cyan",
    title: "Awareness and recovery",
    subtitle: "Checklists ordered by what matters in the first hour",
    status: "guides live",
    Body: LearnTab,
  },
];

/**
 * The product console. Every figure on screen is illustrative of the service
 * being built — it is labelled DEMO in the window chrome and is not live data.
 */
export function ConsoleWindow() {
  const [activeId, setActiveId] = useState(TABS[0]?.id ?? "detect");
  const prefersReducedMotion = useReducedMotion();
  const animated = !prefersReducedMotion;

  const active = TABS.find((tab) => tab.id === activeId) ?? TABS[0];

  if (!active) {
    return null;
  }

  const { Body, icon: ActiveIcon } = active;

  return (
    <div className="flex h-full flex-col bg-white/90 transition-colors duration-300 dark:bg-[#0d0d0f]">
      <div className="flex items-center gap-3 border-b border-slate-200 px-3 py-2 dark:border-white/10">
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>

        <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
          CyberSafe control plane
        </p>

        <span
          title="Illustrative demo of the CyberSafe service — not live data."
          className="ml-auto rounded-md border border-slate-200 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-slate-500 dark:border-white/10 dark:text-slate-400"
        >
          Demo
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Console sections"
        className="no-scrollbar flex gap-1 overflow-x-auto border-b border-slate-200 px-2 dark:border-white/10"
      >
        {TABS.map((tab) => {
          const selected = tab.id === activeId;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`console-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`console-panel-${tab.id}`}
              onClick={() => setActiveId(tab.id)}
              className={cn(
                "relative shrink-0 px-3 py-2 text-[11px] font-medium transition-colors duration-200",
                selected
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
              )}
            >
              <span className="flex items-center gap-1.5">
                <tab.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {tab.label}
              </span>
              {selected ? (
                <motion.span
                  layoutId="console-tab-underline"
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r",
                    ACCENT_GRADIENT[tab.accent],
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Blueprint grid, masked so it fades before the panel edge. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.12)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]"
        />

        {/* Clipped, never scrollable: the device is scaled to fit its frame,
            and an inner scroll container would swallow page scroll over it. */}
        <div className="relative h-full overflow-hidden p-3">
          <header className="mb-3 flex items-center gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                ACCENT_GRADIENT[active.accent],
              )}
            >
              <ActiveIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {active.title}
              </h3>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {active.subtitle}
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-500 dark:border-white/10 dark:text-slate-400">
              <LiveDot accent={active.accent} />
              {active.status}
            </span>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              id={`console-panel-${active.id}`}
              role="tabpanel"
              aria-labelledby={`console-tab-${active.id}`}
              variants={blurSwap}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <Body animated={animated} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
