import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ContentsRail, type OutlineEntry } from "@/components/documents/ContentsRail";
import { EASE_OUT_EXPO } from "@/lib/motion";

interface ContentsDrawerProps {
  open: boolean;
  onClose: () => void;
  entries: OutlineEntry[];
  active: string | null;
  percent: number;
  onNavigate: (id: string) => void;
}

/**
 * The contents rail, as a drawer, for the widths that have no room beside the
 * measure.
 *
 * Below 1180px the rail is not rendered at all, which left a phone reader of a
 * 130-heading specification with no way through it but scrolling. This is the
 * same rail — the same list, the same active entry, the same progress spine —
 * moved to a surface that can be summoned and dismissed: swipe left-to-right to
 * open, right-to-left to close, with a button for anyone who does not think to
 * swipe.
 *
 * Rendered into the body rather than in place, because the document page sits
 * inside `main`, which carries its own stacking context: a drawer nested in it
 * would be ordered against the masthead as though it shared the page's `z-10`,
 * and would slide out underneath it.
 */
export function ContentsDrawer({
  open,
  onClose,
  entries,
  active,
  percent,
  onNavigate,
}: ContentsDrawerProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="contents-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
          />

          <motion.nav
            key="contents-drawer"
            aria-label="Table of contents"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
            /* The page beneath is not held: the drawer is dismissed by the same
               gesture that opens it, and locking the body would mean a reader who
               swiped it open by accident could not simply scroll on. */
            className="liquid-glass-frost fixed inset-y-0 left-0 z-[61] flex w-[min(20rem,86vw)] flex-col border-r border-gray-200/80 px-4 pb-6 pt-16 dark:border-white/10"
          >
            {/* Clear of the rail's own header rather than over it: that header
                ends in the reading percentage, and the two share a corner. */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close the contents"
              className="interactive absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white/70 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-400 dark:hover:border-cyan-400/50 dark:hover:text-cyan-300"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Navigating is also dismissing: the reader asked for a place in the
                document, and leaving the drawer over the place they asked for
                would make them close it to see what they chose. */}
            <ContentsRail
              entries={entries}
              active={active}
              percent={percent}
              onNavigate={(id) => {
                onNavigate(id);
                onClose();
              }}
            />

            <p className="mt-auto pt-4 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Swipe left to close
            </p>
          </motion.nav>
        </>
      ) : null}
    </AnimatePresence>,
    window.document.body,
  );
}
