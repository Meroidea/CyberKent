import { useState, type ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DeviceSidebar } from "@/components/landing/console/DeviceSidebar";
import { StatusBar } from "@/components/landing/console/StatusBar";
import { DetectPane } from "@/components/landing/console/DetectPane";
import { ReportPane } from "@/components/landing/console/ReportPane";
import { AlertsPane } from "@/components/landing/console/AlertsPane";
import { MapPane } from "@/components/landing/console/MapPane";
import { RecoverPane } from "@/components/landing/console/RecoverPane";
import { SECTIONS, type SectionId } from "@/components/landing/console/deviceData";
import { blurSwap } from "@/lib/motion";

const PANES: Record<SectionId, ComponentType<{ animated: boolean }>> = {
  detect: DetectPane,
  report: ReportPane,
  alerts: AlertsPane,
  map: MapPane,
  recover: RecoverPane,
};

/**
 * The width below which the sidebar has to give ground.
 *
 * The device is laid out at a fixed design width and then scaled onto the
 * frame, so this is a property of the design box rather than of the viewport:
 * a phone renders the console in a 612px box, where a 244px sidebar is a third
 * of the screen and the rows beside it stop being rows.
 */
const COMPACT_BELOW = 800;

/**
 * The product console, drawn as an iPadOS split view.
 *
 * Master on the left, detail on the right, which is the pattern the service's
 * own screens use — `components/settings/ConsoleLayout` is the same layout at
 * full size, built from the same rows, cards and controls. That is the reason
 * the device is worth having on the landing page at all: it is not a drawing
 * of a product, it is the product's own components at a ninth of the size.
 *
 * Everything on screen is illustrative. It is marked DEMO in the status bar,
 * every card says so in its footer, and the figures all live in one module
 * (`deviceData`) so there is a single place to check that claim.
 */
export function ConsoleWindow({ designWidth }: { designWidth: number }) {
  const [activeId, setActiveId] = useState<SectionId>("detect");
  const prefersReducedMotion = useReducedMotion();
  const animated = !prefersReducedMotion;

  const active = SECTIONS.find((section) => section.id === activeId) ?? SECTIONS[0];

  if (!active) {
    return null;
  }

  const compact = designWidth < COMPACT_BELOW;
  const Pane = PANES[active.id];

  return (
    <div className="flex h-full flex-col bg-ui-grouped font-system text-ui-label">
      <StatusBar />

      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <div style={{ width: compact ? 206 : 244 }} className="shrink-0">
          <DeviceSidebar activeId={activeId} onSelect={setActiveId} compact={compact} />
        </div>

        {/*
         * Clipped, never scrollable. The device is scaled to fit its frame and
         * an inner scroll container would swallow the page scroll that drives
         * the unfold — so each pane is written to fit, and the clip is the
         * backstop rather than the layout.
         */}
        <div className="relative min-w-0 flex-1 overflow-hidden px-2">
          <header className="pb-3 text-center">
            <h3 className="text-[1.0625rem] font-semibold leading-tight text-ui-label">
              {active.label}
            </h3>
            <p className="mx-auto mt-0.5 max-w-[26rem] text-[0.8125rem] leading-snug text-ui-label-2">
              {active.subtitle}
            </p>
          </header>

          {/*
           * Keyed, but deliberately not wrapped in `AnimatePresence`.
           *
           * `mode="wait"` holds the incoming pane until the outgoing one has
           * finished exiting, and a pane containing a segmented control that
           * has been touched never reports finishing: the control's thumb is a
           * shared-layout element, and once it has run a layout animation the
           * exit of the subtree around it stops resolving. The symptom is not
           * a dropped frame — the pane simply never swaps, so a reader who
           * filters the indicator list can no longer leave the checker.
           *
           * Nothing is lost by dropping it. React swaps the panes on the key,
           * and the new one blurs in over a ground that never changes colour,
           * which is what the transition was carrying anyway.
           */}
          <motion.div
            key={active.id}
            id={`console-panel-${active.id}`}
            role="tabpanel"
            aria-labelledby={`console-tab-${active.id}`}
            variants={blurSwap}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.28 }}
            className="flex flex-col gap-4"
          >
            <Pane animated={animated} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
