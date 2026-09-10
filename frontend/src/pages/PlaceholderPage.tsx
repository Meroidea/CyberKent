import { useLocation } from "react-router-dom";
import { CircleDashed, Database, FileCode2, Hammer, ScanSearch } from "lucide-react";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { ProgressRing } from "@/components/settings/ProgressRing";
import { CONSOLE_ICONS } from "@/components/settings/consoleIcons";
import { CONSOLE_ITEMS } from "@/config/console";
import { ROUTES, SITE } from "@/config/site";
import { useCheckModal } from "@/components/check/useCheckModal";

interface PlaceholderPageProps {
  title: string;
  /** What this page will do, in the present tense, so the promise is concrete. */
  summary: string;
  /** The requirement modules this page will implement, for traceability. */
  requirements: string;
  /** How far the module has got, 0–100. Drawn as the header's ring. */
  progress?: number;
}

/**
 * Stands in for a module that is designed but not yet built.
 *
 * Avoid.md §14 forbids exposing unfinished features, and the site links to
 * these paths from its navigation and its primary calls to action. A hard 404
 * is the worst of the options — it reads as a broken site rather than an
 * unfinished one.
 *
 * Set as a settings pane rather than as an apology. The reader arrived at a
 * screen and should be told, in the same register the finished screens use,
 * what it will do, what part of it exists today, and what to do in the
 * meantime. A build state is a status, and a status belongs in a row with a
 * value on the right — which is also why the header carries a ring: it is the
 * one honest number on the page.
 */
export function PlaceholderPage({
  title,
  summary,
  requirements,
  progress = 40,
}: PlaceholderPageProps) {
  const { open } = useCheckModal();
  const { pathname } = useLocation();

  /* The sidebar already knows this destination's glyph and tile colour. Taking
     them from there rather than restating them is what keeps the header and
     the index showing the same thing for the same screen. Read from the router
     rather than from `window.location`, so the header follows a client-side
     navigation the same way the sidebar's selected row does. */
  const entry = CONSOLE_ITEMS.find((item) => item.href === pathname);
  const Icon = entry ? CONSOLE_ICONS[entry.icon] : CircleDashed;

  return (
    <ConsoleLayout title={title} subtitle={SITE.program}>
      <header className="-mt-2 flex flex-col items-center pb-1 text-center">
        <span
          aria-hidden="true"
          className={`flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.375rem] text-white ${entry?.tint ?? "bg-slate-500"}`}
        >
          <Icon className="h-9 w-9" />
        </span>

        {/* The title is not repeated here. It is already the pane's own
            heading above, exactly as an accessory's name sits over its graphic
            rather than beside it — saying it twice on one screen is what makes
            a settings pane read as a marketing page. */}
        <p className="mt-4 max-w-[30rem] text-[0.9375rem] leading-relaxed text-ui-label-2">
          {summary}
        </p>

        <ProgressRing
          value={progress}
          caption="module built"
          className="mt-6"
          trackClassName="stroke-amber-500"
        />
      </header>

      <SettingsGroup
        title="Build status"
        footer="This screen is listed rather than hidden so the navigation stays honest about what the service can and cannot do today."
      >
        <SettingsRows>
          <SettingsRow
            icon={Hammer}
            iconClassName="bg-amber-500"
            label="Screens"
            value="In development"
          />
          <SettingsRow
            icon={Database}
            iconClassName="bg-emerald-500"
            label="Database tables"
            value="Built"
          />
          <SettingsRow
            icon={FileCode2}
            iconClassName="bg-violet-500"
            label="Specified in"
            value={requirements}
          />
        </SettingsRows>
      </SettingsGroup>

      <SettingsGroup
        title="What you can do now"
        footer="The scam checker is finished and needs no account. It runs entirely on your device, so nothing you paste into it is transmitted."
      >
        <SettingsRows>
          <SettingsRow
            icon={ScanSearch}
            iconClassName="bg-indigo-500"
            label="Check a message"
            detail="Paste a text, link, email or number for an instant read."
            onClick={open}
            chevron
          />
          <SettingsRow to={ROUTES.learn} label="Read the awareness guides" />
          <SettingsRow to={ROUTES.documents} label="Read the project documents" />
        </SettingsRows>
      </SettingsGroup>

      <SettingsGroup title="Get help from Council">
        <SettingsRows>
          <SettingsRow
            label="Email"
            href={`mailto:${SITE.supportEmail}`}
            value={SITE.supportEmail}
            chevron={false}
          />
          <SettingsRow
            label="Phone"
            href={`tel:${SITE.supportPhone.replace(/\s/g, "")}`}
            value={SITE.supportPhone}
            chevron={false}
          />
          <SettingsRow label="Address" detail={SITE.address} />
        </SettingsRows>
      </SettingsGroup>
    </ConsoleLayout>
  );
}
