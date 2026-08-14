import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import { PRIMARY_NAV, ROUTES } from "@/config/site";
import { ActionLink } from "@/components/ui/ActionLink";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { NavDropdown } from "@/components/layout/NavDropdown";
import { DOCUMENT_MENU, SERVICE_MENU } from "@/components/layout/navMenus";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { RollingText } from "@/components/ui/RollingText";
import { UNDERLINE } from "@/components/layout/navMotion";
import { Wordmark } from "@/components/layout/Wordmark";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { springSnappy } from "@/lib/motion";

/**
 * Two-state header. Above the fold it is a full glass bar; past 100px it
 * retracts to a floating hamburger and theme toggle.
 *
 * The retracted bar is marked inert (`aria-hidden` + `pointer-events-none`) so
 * keyboard users cannot tab into links they cannot see — the same links stay
 * reachable through the menu the hamburger opens.
 */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrollThreshold(100);

  return (
    <>
      <motion.header
        animate={scrolled ? { y: -100, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        aria-hidden={scrolled}
        /*
         * A lens, not a panel. The landing page's gradient, its letter-glitch
         * field and every section that passes underneath stay visible through
         * the bar — blurred, so they read as depth behind the navigation rather
         * than as competition with it.
         */
        className={`liquid-glass-bar fixed inset-x-0 top-0 z-50 border-b border-white/25 transition-colors duration-300 dark:border-white/10 ${
          scrolled ? "pointer-events-none" : ""
        }`}
      >
        <div className="container flex h-16 items-center justify-between gap-6">
          <Wordmark />

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 lg:flex"
          >
            {PRIMARY_NAV.map((link) => (
              <motion.a
                key={link.href}
                href={link.href}
                initial="rest"
                animate="rest"
                whileHover="hover"
                whileFocus="hover"
                className="relative px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-700 transition-colors duration-200 hover:text-indigo-700 dark:text-slate-200 dark:hover:text-cyan-300"
              >
                <RollingText text={link.label} />

                {/* Sweeps out from the centre under the word it belongs to,
                    rather than the shared pill that used to slide between
                    links — the underline commits to one item, which is what a
                    pointer travelling along a row of them needs it to do. */}
                <motion.span
                  aria-hidden="true"
                  variants={UNDERLINE}
                  transition={springSnappy}
                  className="absolute inset-x-3 -bottom-0.5 h-[2px] origin-center rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400"
                />
              </motion.a>
            ))}

            <NavDropdown label="Documents" items={DOCUMENT_MENU} />
            <NavDropdown label="Services" items={SERVICE_MENU} />
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle className="hidden sm:flex" />
            <ActionLink
              href={ROUTES.reportScam}
              className="hidden px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] md:inline-flex"
            >
              Report a scam
            </ActionLink>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
              className="interactive flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 lg:hidden dark:border-white/10 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:text-cyan-400"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {scrolled ? (
          <motion.div
            key="floating-controls"
            initial={{ opacity: 0, y: -20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.85 }}
            transition={springSnappy}
            className="fixed right-4 top-4 z-50 flex items-center gap-2 sm:right-6 sm:top-6"
          >
            <span className="glass-surface flex items-center rounded-full p-1">
              <ThemeToggle className="h-9 w-9 border-0 bg-transparent dark:bg-transparent" />
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
              className="interactive flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-105 hover:shadow-xl hover:shadow-indigo-600/40 dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
