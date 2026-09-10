/**
 * Single source of truth for brand, routing and contact details.
 * Nothing user-facing should hardcode these values inline.
 */

export const THEME_STORAGE_KEY = "cyberkent-theme";

export const SITE = {
  /** Wordmark is rendered in two type treatments: `cyber` + `KENT`. */
  wordmarkLead: "cyber",
  wordmarkTail: "KENT",
  name: "CyberKent",
  owner: "Hume City Council",
  program: "CyberSafe Services",
  tagline: "Online Scam Detection and Reporting System",
  description:
    "Check a suspicious message, link, phone number or email, report a scam to Council, and follow verified community alerts across Hume.",
  address: "1079 Pascoe Vale Road, Broadmeadows VIC 3047",
  supportEmail: "cybersafe@hume.vic.gov.au",
  supportPhone: "9205 2200",
  residents: "262,000+",
} as const;

export const ROUTES = {
  home: "/",
  checkMessage: "/check",
  reportScam: "/report",
  alerts: "/alerts",
  scamMap: "/map",
  learn: "/learn",
  assistant: "/assistant",
  recover: "/recover",
  documents: "/documents",
  signIn: "/sign-in",
  register: "/register",
  privacy: "/privacy",
  accessibility: "/accessibility",
  terms: "/terms",
} as const;

export const SECTION_IDS = {
  detect: "detect",
  how: "how-it-works",
  alerts: "alerts",
  learn: "learn",
  trust: "trust",
  contact: "contact",
} as const;

export interface NavLink {
  label: string;
  href: string;
}

export interface NavResource extends NavLink {
  description: string;
  /** Key into RESOURCE_ICONS so config stays free of JSX. */
  icon: "scan" | "flag" | "bell" | "map" | "book" | "bot";
}

/**
 * Top-level navigation links. These are in-page anchors on the landing page;
 * the `Documents` and `Services` dropdowns are rendered separately by the
 * header from `components/layout/navMenus`.
 */
export const PRIMARY_NAV: NavLink[] = [
  { label: "Detect", href: `#${SECTION_IDS.detect}` },
  { label: "How it works", href: `#${SECTION_IDS.how}` },
  { label: "Alerts", href: `#${SECTION_IDS.alerts}` },
  { label: "Learn", href: `#${SECTION_IDS.learn}` },
];

export const NAV_RESOURCES: NavResource[] = [
  {
    label: "Scam checker",
    href: ROUTES.checkMessage,
    description: "Paste a text, link or number for an instant risk read.",
    icon: "scan",
  },
  {
    label: "CyberSafe Assistant",
    href: ROUTES.assistant,
    description: "Ask the AI assistant what to do about a scam.",
    icon: "bot",
  },
  {
    label: "Report a scam",
    href: ROUTES.reportScam,
    description: "Send it to Council with evidence, get a reference number.",
    icon: "flag",
  },
  {
    label: "Community alerts",
    href: ROUTES.alerts,
    description: "Verified scams circulating in Hume right now.",
    icon: "bell",
  },
  {
    label: "Scam map",
    href: ROUTES.scamMap,
    description: "Where reports are clustering across the municipality.",
    icon: "map",
  },
  {
    label: "Recovery guides",
    href: ROUTES.recover,
    description: "Step-by-step checklists for after you have been hit.",
    icon: "book",
  },
];

export const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
  {
    title: "Use the service",
    links: [
      { label: "Check a message", href: ROUTES.checkMessage },
      { label: "Ask the AI assistant", href: ROUTES.assistant },
      { label: "Report a scam", href: ROUTES.reportScam },
      { label: "Track a report", href: ROUTES.signIn },
      { label: "Scam map", href: ROUTES.scamMap },
    ],
  },
  {
    title: "Stay informed",
    links: [
      { label: "Community alerts", href: ROUTES.alerts },
      { label: "Awareness library", href: ROUTES.learn },
      { label: "Recovery checklists", href: ROUTES.recover },
      { label: "Subscribe to alerts", href: `#${SECTION_IDS.contact}` },
    ],
  },
];

export const LEGAL_LINKS: NavLink[] = [
  { label: "Privacy", href: ROUTES.privacy },
  { label: "Accessibility", href: ROUTES.accessibility },
  { label: "Terms", href: ROUTES.terms },
];
