import { Link } from "react-router-dom";
import { LEGAL_LINKS, ROUTES, SITE } from "@/config/site";

const CURRENT_YEAR = new Date().getFullYear();

/**
 * The quiet strip under every console screen.
 *
 * The console does not use the marketing footer — its sidebar already lists
 * every destination that footer does, and two indexes on one screen is two
 * indexes that will eventually disagree. But the sidebar is not on every
 * console screen: the document reader and the article pages keep their own
 * reading layouts and have no sidebar to carry it, which left the legal pages
 * unreachable from the longest documents on the site.
 *
 * So the legal line is separated from the index and given to every console
 * route. It is the one part of the footer that is not navigation — an
 * accessibility statement has to be reachable from wherever someone is when
 * they discover they need it, and on a council service that is not a
 * nice-to-have.
 */
export function ConsoleFooter() {
  return (
    <footer className="relative z-10 font-system">
      <div className="mx-auto flex w-full max-w-[80rem] flex-col items-center gap-3 border-t border-ui-separator px-4 py-8 text-center sm:px-6">
        <nav aria-label="Legal">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-[0.8125rem] text-ui-tint transition-opacity duration-150 hover:opacity-70"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to={ROUTES.home}
                className="text-[0.8125rem] text-ui-tint transition-opacity duration-150 hover:opacity-70"
              >
                Home
              </Link>
            </li>
          </ul>
        </nav>

        <p className="max-w-[38rem] text-[0.75rem] leading-relaxed text-ui-label-3">
          © {CURRENT_YEAR} {SITE.owner}. {SITE.name} is an advisory service and does not guarantee
          protection from scams or cyberattacks.
        </p>
      </div>
    </footer>
  );
}
