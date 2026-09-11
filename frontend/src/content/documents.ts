import register from "./documents.register.json";

/**
 * The public document register.
 *
 * The data itself lives in `documents.register.json`, because two consumers
 * need it and only one of them is TypeScript: this module feeds the Documents
 * page and the navigation dropdown, while `scripts/build-documents.mjs` runs in
 * plain Node and reads the same file to render each document's reader page. A
 * second copy of every version, date and status is precisely the duplication
 * Rule 1.3 rules out, and it is the kind that drifts silently — a version bump
 * made in one place and not the other.
 *
 * The types stay here. They are the contract the JSON is held to, and the
 * build script fails if a document's `href` has no matching generated file,
 * because a card that links nowhere is a broken promise on a page whose entire
 * purpose is access.
 */

export type DocumentStatus = "Published" | "Superseded" | "Awaiting approval";

export type DocumentFormat = "Web page" | "PDF";

/** Key into `DOCUMENT_ICONS`, so this module stays free of JSX. */
export type DocumentIcon = "requirements" | "architecture" | "interim" | "midproject" | "srs" | "features";

export interface ProjectDocument {
  id: string;
  title: string;
  icon: DocumentIcon;
  /** One line, for the navigation dropdown. The `summary` is too long there. */
  navDescription: string;
  summary: string;
  /** What a reader will find inside, so the click is an informed one. */
  contents: string[];
  /** Public path, served from `public/documents/`. */
  href: string;
  format: DocumentFormat;
  /** Deliverable identifier from the project plan, where one is assigned. */
  reference?: string;
  version: string;
  /** ISO date, formatted for display at render time. */
  date: string;
  status: DocumentStatus;
}

export const DOCUMENTS_PAGE = {
  eyebrow: "Project documentation",
  title: "Every document behind this service.",
  lede:
    "CyberKent is built for Hume City Council as a capstone project by Group CyberKent. The requirements, the architecture, the specification and the delivery record are published here in full — open to anyone, no account needed. A service that asks people to trust an automated judgement should be willing to show its own workings.",
  note:
    "These documents open in your browser and can be printed or saved as PDF. They describe an advisory service and are project records, not Council policy.",
} as const;

/**
 * JSON widens every string literal to `string`, so the union members above are
 * lost on import and the assertion is what restores them. It is safe in one
 * direction only — the register is the source of truth, and a value outside
 * these unions would render an unstyled status rather than fail — so the
 * unions must stay in step with what the JSON is allowed to contain.
 */
export const DOCUMENTS = register.documents as unknown as ProjectDocument[];
