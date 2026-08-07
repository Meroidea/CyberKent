import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { NAV_RESOURCES } from "@/config/site";
import { RESOURCE_ICONS } from "@/components/layout/resourceIcons";
import { springSoft } from "@/lib/motion";

/** Desktop dropdown: an 18rem glass panel of icon + title + one-line summary. */
export function ResourcesMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-cyan-300"
      >
        Services
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            initial={{ opacity: 0, y: -8, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: -8, rotateX: -10 }}
            transition={springSoft}
            style={{ transformPerspective: 1200 }}
            className="glass-surface absolute left-1/2 top-full z-50 mt-3 w-[18rem] -translate-x-1/2 rounded-2xl p-2 shadow-xl shadow-slate-900/5 dark:shadow-black/40"
          >
            {NAV_RESOURCES.map((resource) => {
              const Icon = RESOURCE_ICONS[resource.icon];

              return (
                <a
                  key={resource.href}
                  href={resource.href}
                  className="flex items-start gap-3 rounded-xl p-3 transition-colors duration-200 hover:bg-indigo-50 dark:hover:bg-white/5"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 text-white dark:from-indigo-500 dark:to-cyan-400">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {resource.label}
                    </span>
                    <span className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {resource.description}
                    </span>
                  </span>
                </a>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
