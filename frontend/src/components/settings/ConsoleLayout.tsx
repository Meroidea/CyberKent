import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeft, X } from "lucide-react";
import { ConsoleSidebar } from "@/components/settings/ConsoleSidebar";
import { HEADER_CLEARANCE } from "@/config/layout";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface ConsoleLayoutProps {
  /** Shown centred above the detail pane, as the accessory's name is. */
  title: string;
  /** One line under the title. Keep it to what the screen is for. */
  subtitle?: string;
  /** The graphic block between the title and the first card. */
  hero?: ReactNode;
  children: ReactNode;
  /**
   * A wider detail column, for Council's working screens — a queue, a
   * dashboard, a table — whose rows carry several values across rather than
   * one label and one value.
   */
  wide?: boolean;
}

/**
 * The split view every screen behind the landing page is laid out in.
 *
 * Master on the left, detail on the right. The sidebar is the index of the
 * service and does not change between screens; the detail pane is the screen.
 * Keeping the index permanently on show is the point of the pattern — a
 * resident who came to report a scam can see, without navigating, that there
 * is also a recovery checklist and an alerts feed.
 *
 * Below the two-column breakpoint the sidebar becomes a sheet rather than
 * collapsing into the page. Stacking it above the detail would put the whole
 * index between the reader and the screen they asked for on every single
 * navigation, which on a phone is the entire viewport.
 *
 * The detail column is capped and centred rather than filling the width: these
 * are lists of rows, and a row whose label and value are 1200px apart is not
 * one row any more. The cap is the same measure Settings uses on an iPad.
 */
export function ConsoleLayout({ title, subtitle, hero, children, wide = false }: ConsoleLayoutProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="font-system text-ui-label">
      {/* Cleared of the fixed masthead. The bar is 4rem and retracts past
          100px of scroll, but the pane's own title sits at the very top of the
          column and would spend the first screenful underneath it. */}
      <div
        className="mx-auto flex w-full max-w-[80rem] gap-6 px-4 pb-20 sm:px-6 lg:gap-8"
        style={{ paddingTop: HEADER_CLEARANCE }}
      >
        {/* Master. Sticky under the masthead rather than scrolling with the
            detail: the index is a fixed frame of reference, and one that
            scrolls away is a menu, not a sidebar. */}
        <aside
          className="hidden w-[17.5rem] shrink-0 self-start lg:block"
          style={{ position: "sticky", top: HEADER_CLEARANCE }}
        >
          <div className="max-h-[calc(100svh-7.5rem)] overflow-y-auto overscroll-contain rounded-ui bg-ui-sidebar p-3 backdrop-blur-xl [scrollbar-width:thin]">
            <ConsoleSidebar />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className={cn("mx-auto w-full", wide ? "max-w-[64rem]" : "max-w-[46rem]")}>
            <header className="relative pb-6 text-center">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-[0.625rem] text-ui-tint transition-colors duration-150 hover:bg-ui-fill lg:hidden"
                aria-label="Open the service index"
              >
                <PanelLeft className="h-[1.25rem] w-[1.25rem]" aria-hidden="true" />
              </button>

              <h1 className="text-[1.0625rem] font-semibold leading-tight text-ui-label">
                {title}
              </h1>
              {subtitle ? (
                <p className="mx-auto mt-1 max-w-[34rem] text-[0.8125rem] leading-snug text-ui-label-2">
                  {subtitle}
                </p>
              ) : null}
            </header>

            {hero ? <div className="pb-7">{hero}</div> : null}

            <div className="flex flex-col gap-7">{children}</div>
          </div>
        </main>
      </div>

      {/*
       * Portalled to the body.
       *
       * `main` carries `z-10`, which makes it a stacking context — inside it
       * the sheet's own z-index is measured against its siblings, not against
       * the masthead, so a sheet at z-61 still renders under a header at z-50.
       * Escaping the context is the fix; raising the number is not.
       */}
      {createPortal(
        <AnimatePresence>
          {sheetOpen ? (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSheetOpen(false)}
                aria-label="Close the service index"
                className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
                role="dialog"
                aria-modal="true"
                aria-label="Service index"
                className={cn(
                  "fixed inset-y-0 left-0 z-[91] w-[min(20rem,88vw)] overflow-y-auto",
                  "bg-ui-grouped p-3 lg:hidden",
                )}
              >
                <div className="flex justify-end pb-1">
                  <button
                    type="button"
                    onClick={() => setSheetOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ui-label-2 transition-colors duration-150 hover:bg-ui-fill"
                    aria-label="Close"
                  >
                    <X className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                  </button>
                </div>
                <ConsoleSidebar onNavigate={() => setSheetOpen(false)} />
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
