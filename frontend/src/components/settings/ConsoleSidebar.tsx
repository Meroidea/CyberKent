import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ShieldCheck } from "lucide-react";
import { CONSOLE_NAV } from "@/config/console";
import { CONSOLE_ICONS } from "@/components/settings/consoleIcons";
import { LogoMark } from "@/components/brand/LogoMark";
import { ROUTES, SITE } from "@/config/site";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/auth/useAuth";
import { useEmailConfirmation } from "@/components/auth/useEmailConfirmation";
import { initials } from "@/lib/report/labels";
import { isAdmin, isStaff } from "@/lib/roles";

/**
 * The master column: the index of every screen the service has.
 *
 * Filtering happens here rather than through a route, because the list is
 * short enough to filter in place and a settings index that navigates away to
 * show search results loses the reader's place in it. An empty result says so
 * rather than rendering nothing — a blank sidebar reads as a broken one.
 */
export function ConsoleSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = useState("");
  const { pathname } = useLocation();
  const { status, user } = useAuth();
  const { pending: confirmationPending } = useEmailConfirmation();

  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const staff = isStaff(user?.role);
    const shown = (audience: (typeof CONSOLE_NAV)[number]["items"][number]["audience"]) =>
      !audience ||
      audience === status ||
      (audience === "staff" && staff) ||
      (audience === "admin" && isAdmin(user?.role));

    /* Staff come to the console to work, so their section leads. */
    const lead = (title?: string) => (title === "Admin panel" ? 2 : title === "Council" ? 1 : 0);
    const ordered = staff ? [...CONSOLE_NAV].sort((a, b) => lead(b.title) - lead(a.title)) : CONSOLE_NAV;

    return ordered.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => shown(item.audience) && (!needle || item.label.toLowerCase().includes(needle)),
      ),
    })).filter((section) => section.items.length > 0);
  }, [query, status, user?.role]);

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block">
        <span className="sr-only">Search the service</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-[1.0625rem] w-[1.0625rem] -translate-y-1/2 text-ui-label-3"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          className="w-full rounded-[0.625rem] bg-ui-fill py-[0.4375rem] pl-9 pr-3 text-[1.0625rem] text-ui-label placeholder:text-ui-label-3 focus:outline-none focus:ring-2 focus:ring-ui-tint"
        />
      </label>

      {/* The account card. In Settings this is the person; here it is who the
          service belongs to, which is the fact a resident most needs to be
          sure of before they hand over a screenshot. */}
      <Link
        to={ROUTES.home}
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-ui bg-ui-card px-3 py-3 transition-colors duration-150 hover:bg-ui-card-hover"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ui-fill">
          <LogoMark className="h-7 w-auto" glint={false} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[1.0625rem] font-semibold leading-tight text-ui-label">
            {SITE.owner}
          </span>
          <span className="mt-0.5 block truncate text-[0.8125rem] leading-tight text-ui-label-2">
            {SITE.program}
          </span>
        </span>
      </Link>

      {/* The person, once there is one — the same card Settings opens with,
          and the shortest way back to their own reports from any screen. */}
      {user ? (
        <Link
          to={ROUTES.account}
          onClick={onNavigate}
          className="-mt-2 flex items-center gap-3 rounded-ui bg-ui-card px-3 py-2.5 transition-colors duration-150 hover:bg-ui-card-hover"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[0.8125rem] font-semibold text-white">
            {initials(user.fullName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.9375rem] font-semibold leading-tight text-ui-label">{user.fullName}</span>
            <span className="mt-0.5 block truncate text-[0.75rem] leading-tight text-ui-label-2">
              {confirmationPending ? "Confirm your email" : "Your dashboard"}
            </span>
          </span>
        </Link>
      ) : null}

      <nav aria-label="Service" className="flex flex-col gap-5">
        {sections.map((section, index) => (
          <div key={section.title ?? index}>
            {section.title ? (
              <h2 className="px-3 pb-1.5 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-ui-label-3">
                {section.title}
              </h2>
            ) : null}

            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = CONSOLE_ICONS[item.icon];
                /* The overview's address is the prefix of every Council
                   screen, so it only lights for itself; the queue also
                   lights while a report from it is open. */
                const active =
                  item.href === ROUTES.council
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`) ||
                      (item.href === ROUTES.councilQueue && pathname.startsWith(`${ROUTES.councilReport}/`));

                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-[0.625rem] px-3 py-[0.4375rem] transition-colors duration-150",
                        active ? "bg-ui-selected" : "hover:bg-ui-fill",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-[1.75rem] w-[1.75rem] shrink-0 items-center justify-center rounded-[0.4375rem] text-white",
                          item.tint,
                        )}
                      >
                        <Icon className="h-[1.0625rem] w-[1.0625rem]" />
                      </span>
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-[1.0625rem] leading-tight",
                          active ? "font-medium text-ui-label" : "text-ui-label",
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {sections.length === 0 ? (
          <p className="px-3 text-[0.9375rem] text-ui-label-2">
            Nothing here matches “{query.trim()}”.
          </p>
        ) : null}
      </nav>

      <p className="flex items-start gap-2 px-3 pb-2 text-[0.75rem] leading-snug text-ui-label-3">
        <ShieldCheck aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
        Checking runs on your device. Nothing you paste is sent anywhere.
      </p>
    </div>
  );
}
