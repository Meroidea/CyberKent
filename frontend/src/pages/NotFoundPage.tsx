import { SearchX } from "lucide-react";
import { ROUTES } from "@/config/site";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { CONSOLE_ICONS } from "@/components/settings/consoleIcons";
import { CONSOLE_NAV } from "@/config/console";
import { useCheckModal } from "@/components/check/useCheckModal";

/**
 * Genuine 404.
 *
 * The host rewrites every unmatched path to index.html so the router can own
 * routing, which means this component is the only thing standing between a
 * mistyped address and the landing page being served under it. Without it the
 * site would answer 200 for pages that do not exist.
 *
 * It offers the index rather than a way home. Someone who has mistyped an
 * address is looking for a specific screen, and the useful answer to that is
 * the list of screens there are — the same list the sidebar shows, restated
 * here because on a phone the sidebar is behind a button they have no reason
 * to press yet.
 */
export function NotFoundPage() {
  const { open } = useCheckModal();

  return (
    <ConsoleLayout title="Page not found" subtitle="Error 404">
      <header className="-mt-2 flex flex-col items-center pb-1 text-center">
        <span
          aria-hidden="true"
          className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.375rem] bg-slate-500 text-white"
        >
          <SearchX className="h-9 w-9" />
        </span>
        <p className="mt-4 max-w-[28rem] text-[0.9375rem] leading-relaxed text-ui-label-2">
          The address may have changed, or it may never have existed. Nothing you submitted has been
          lost — checks and reports are unaffected by this.
        </p>
      </header>

      <SettingsGroup title="Most people here wanted">
        <SettingsRows>
          <SettingsRow
            icon={CONSOLE_ICONS.scan}
            iconClassName="bg-indigo-500"
            label="Check a message"
            detail="Paste a text, link, email or number for an instant read."
            onClick={open}
            chevron
          />
        </SettingsRows>
      </SettingsGroup>

      {CONSOLE_NAV.map((section, index) => (
        <SettingsGroup key={section.title ?? index} title={section.title ?? "Everything else"}>
          <SettingsRows>
            {section.items
              .filter((item) => item.href !== ROUTES.checkMessage)
              .map((item) => (
                <SettingsRow
                  key={item.href}
                  to={item.href}
                  icon={CONSOLE_ICONS[item.icon]}
                  iconClassName={item.tint}
                  label={item.label}
                />
              ))}
          </SettingsRows>
        </SettingsGroup>
      ))}
    </ConsoleLayout>
  );
}
