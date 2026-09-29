import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { JarvisLoader } from "@/components/boot/JarvisLoader";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * Lines printed under the dial as the sequence runs.
 *
 * They describe what the service actually is, so the wait carries a little
 * information rather than being pure theatre.
 */
const BOOT_LINES = [
  "Initialising CyberSafe interface",
  "Loading indicator library",
  "Synchronising community alerts",
  "Interface ready",
];

/**
 * Time each line holds before the next replaces it: the last line lands with
 * about a third of a second to spare inside the app's 1.2 s boot.
 */
const LINE_INTERVAL = 280;

export function BootScreen({ visible }: { visible: boolean }) {
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const id = window.setInterval(() => {
      setLine((current) => Math.min(BOOT_LINES.length - 1, current + 1));
    }, LINE_INTERVAL);

    return () => window.clearInterval(id);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
          /*
           * Fixed and above everything, but `pointer-events-none` — the sequence
           * is a curtain, not a modal. Nothing behind it is interactive yet
           * anyway, and this way a stray click can never be swallowed by a layer
           * that is on its way out.
           *
           * Deliberately only part-opaque with a shallow blur. The wireframe
           * assembling underneath is the other half of the sequence, and a
           * curtain heavy enough to hide it would leave the dial floating on a
           * blank screen.
           */
          className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-slate-50/55 backdrop-blur-[3px] dark:bg-[#050505]/60"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            className="w-[min(27.3vw,9.1rem)]"
          >
            <JarvisLoader className="h-auto w-full" />
          </motion.div>

          <div className="flex h-5 items-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28 }}
                className="font-mono text-[0.6875rem] uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-300/80"
              >
                {BOOT_LINES[line]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
