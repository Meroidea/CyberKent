import { ROUTES } from "@/config/site";

/**
 * The console's own navigation — the sidebar behind the landing page.
 *
 * Separate from `PRIMARY_NAV` and `NAV_RESOURCES` because it answers a
 * different question. Those are a marketing masthead: they point at the
 * sections of the pitch and at the two things a first-time visitor is being
 * asked to do. This is the index of the service itself, and it has to list
 * every screen there is — including the legal pages and the ones still in
 * development, because a settings index that quietly omits a screen is how
 * someone concludes it does not exist.
 *
 * Icon fields are string keys resolved in `components/settings/consoleIcons`,
 * so this module stays free of JSX like the rest of `config/`.
 */

export type ConsoleIcon =
  | "scan"
  | "flag"
  | "bell"
  | "map"
  | "recover"
  | "learn"
  | "documents"
  | "signIn"
  | "register"
  | "privacy"
  | "accessibility"
  | "terms";

export interface ConsoleItem {
  label: string;
  href: string;
  icon: ConsoleIcon;
  /**
   * The icon tile's fill. Apple's system apps are recognised by tile colour
   * before the glyph is read, so the colours are fixed per destination and
   * carry meaning: the accent for the things this service does, rose for
   * reporting harm, amber for warnings, slate for reference.
   */
  tint: string;
  /** Right-aligned status, as a settings row shows a current value. */
  value?: string;
}

export interface ConsoleSection {
  /** Sits above the card. Omitted for the first group, as Settings does. */
  title?: string;
  items: ConsoleItem[];
}

export const CONSOLE_NAV: ConsoleSection[] = [
  {
    items: [
      {
        label: "Check a message",
        href: ROUTES.checkMessage,
        icon: "scan",
        tint: "bg-indigo-500",
      },
      {
        label: "Report a scam",
        href: ROUTES.reportScam,
        icon: "flag",
        tint: "bg-rose-500",
      },
      {
        label: "Community alerts",
        href: ROUTES.alerts,
        icon: "bell",
        tint: "bg-amber-500",
      },
      {
        label: "Scam map",
        href: ROUTES.scamMap,
        icon: "map",
        tint: "bg-emerald-500",
      },
    ],
  },
  {
    title: "Guidance",
    items: [
      {
        label: "Recovery checklists",
        href: ROUTES.recover,
        icon: "recover",
        tint: "bg-teal-500",
      },
      {
        label: "Awareness library",
        href: ROUTES.learn,
        icon: "learn",
        tint: "bg-sky-500",
      },
      {
        label: "Project documents",
        href: ROUTES.documents,
        icon: "documents",
        tint: "bg-violet-500",
      },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Sign in", href: ROUTES.signIn, icon: "signIn", tint: "bg-blue-500" },
      { label: "Create an account", href: ROUTES.register, icon: "register", tint: "bg-blue-500" },
    ],
  },
  {
    title: "About this service",
    items: [
      { label: "Privacy", href: ROUTES.privacy, icon: "privacy", tint: "bg-slate-500" },
      {
        label: "Accessibility",
        href: ROUTES.accessibility,
        icon: "accessibility",
        tint: "bg-slate-500",
      },
      { label: "Terms of use", href: ROUTES.terms, icon: "terms", tint: "bg-slate-500" },
    ],
  },
];

/** Flat lookup, for a screen that needs to describe where it sits. */
export const CONSOLE_ITEMS: ConsoleItem[] = CONSOLE_NAV.flatMap((section) => section.items);
