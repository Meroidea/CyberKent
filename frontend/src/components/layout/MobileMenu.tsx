import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { NAV_RESOURCES, PRIMARY_NAV, ROUTES } from "@/config/site";
import { RESOURCE_ICONS } from "@/components/layout/resourceIcons";
import { ActionLink } from "@/components/ui/ActionLink";
import { Wordmark } from "@/components/layout/Wordmark";
import { springSoft } from "@/lib/motion";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.75, rotateX: -35 },
  visible: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    transition: { ...springSoft, staggerChildren: 0.05, delayChildren: 0.08 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    rotateX: -20,
    transition: { duration: 0.2, staggerChildren: 0.03, staggerDirection: -1 },
  },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

/** Full-screen navigation for small viewports and for the scrolled state. */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const [servicesOpen, setServicesOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="mobile-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          /* Centring stays on this static flex wrapper: framer replaces the
             animated card's own transform, so a translate-based centre would
             be overwritten mid-animation. */
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-md sm:p-6"
          onClick={onClose}
        >
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformPerspective: 1400 }}
            onClick={(event) => event.stopPropagation()}
            className="glass-surface mt-16 w-full max-w-md rounded-3xl p-6 shadow-2xl"
          >
            <motion.div variants={rowVariants} className="flex items-center justify-between">
              <Wordmark />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-slate-600 transition-colors duration-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-300 dark:hover:text-cyan-400"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </motion.div>

            <nav className="mt-6 flex flex-col gap-1">
              {PRIMARY_NAV.map((link) => (
                <motion.a
                  key={link.href}
                  variants={rowVariants}
                  href={link.href}
                  onClick={onClose}
                  className="rounded-xl px-4 py-3 text-base font-medium text-slate-700 transition-colors duration-200 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-cyan-300"
                >
                  {link.label}
                </motion.a>
              ))}

              <motion.div variants={rowVariants}>
                <button
                  type="button"
                  aria-expanded={servicesOpen}
                  onClick={() => setServicesOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-medium text-slate-700 transition-colors duration-200 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-cyan-300"
                >
                  Services
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                <AnimatePresence initial={false}>
                  {servicesOpen ? (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      {NAV_RESOURCES.map((resource) => {
                        const Icon = RESOURCE_ICONS[resource.icon];

                        return (
                          <li key={resource.href}>
                            <a
                              href={resource.href}
                              onClick={onClose}
                              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-slate-600 transition-colors duration-200 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-white/5"
                            >
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 text-white dark:from-indigo-500 dark:to-cyan-400">
                                <Icon className="h-4 w-4" aria-hidden="true" />
                              </span>
                              {resource.label}
                            </a>
                          </li>
                        );
                      })}
                    </motion.ul>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            </nav>

            <motion.div variants={rowVariants} className="mt-6 flex flex-col gap-3">
              <ActionLink href={ROUTES.checkMessage} onClick={onClose}>
                Check a message
              </ActionLink>
              <ActionLink href={ROUTES.reportScam} variant="secondary" onClick={onClose}>
                Report a scam
              </ActionLink>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
