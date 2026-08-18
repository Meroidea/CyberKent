/**
 * The project's five analysis diagrams, as data.
 *
 * These are transcriptions of the diagrams the team authored for the assessment
 * — the Level 1 DFD, the ERD, the use-case diagram, the WBS and the Gantt — held
 * as structure rather than as images so the deck can draw them at any size a
 * projector asks for, in the black and white the brief requires, and so a label
 * can be corrected without re-exporting a picture.
 *
 * Where the authored diagrams and the specification disagree, these follow the
 * *diagrams*: they are what was submitted, and a deck that quietly re-derived
 * them from §7 and §11 would be presenting something the marker has not seen.
 * The entity names here are therefore the ERD's own (`UserAccount`,
 * `EvidenceFileMetadata`), not the Prisma schema's.
 */

/* ── Level 1 data-flow diagram ────────────────────────────────────────────── */

export const DFD = {
  title: "Level 1 data-flow diagram",
  externals: [
    { id: "E1", name: "User (end-user)" },
    { id: "E2", name: "Administrator" },
  ],
  processes: [
    { id: "1.0", name: "User account management", detail: "Registration · credentials · profiles" },
    { id: "2.0", name: "Scam report submission & analysis", detail: "Report details · evidence · risk scores" },
    { id: "3.0", name: "Community scam alerts", detail: "Alerts · awareness · trends" },
    { id: "4.0", name: "Admin report review & audit", detail: "Verify · system reports · log activity" },
  ],
  stores: [
    { id: "D1", name: "User data store" },
    { id: "D2", name: "Scam reports data store" },
    { id: "D3", name: "Evidence file store" },
    { id: "D4", name: "Audit logs" },
  ],
  flows: [
    "Registration details, credentials",
    "Account confirmation, access token",
    "Scam report details, URLs, text, evidence",
    "Report reference number, status",
    "Scam alerts, awareness info",
    "Store report data, analysis scores",
    "Retrieve reports for duplicate check",
    "Check user privileges",
    "Upload evidence file",
    "Fetch recent scam trends",
    "Verification decision, admin request",
    "Verified status, system reports, audit data",
    "Update report status",
    "Fetch reports",
    "Log admin activity, query logs",
  ],
} as const;

/* ── Entity-relationship diagram ──────────────────────────────────────────── */

export const ERD = {
  title: "Entity-relationship diagram",
  clusters: [
    {
      id: "c1",
      name: "Cluster 1 — User management",
      entities: [
        {
          name: "User",
          fields: [
            { key: "PK", name: "UserID", type: "int" },
            { key: "", name: "FirstName", type: "varchar" },
            { key: "", name: "LastName", type: "varchar" },
            { key: "", name: "Email", type: "varchar, U" },
            { key: "", name: "DateOfBirth", type: "date" },
          ],
        },
        {
          name: "UserAccount",
          fields: [
            { key: "PK", name: "AccountID", type: "int" },
            { key: "FK", name: "UserID", type: "FK, U" },
            { key: "FK", name: "ProfileID", type: "FK, U" },
            { key: "FK", name: "RoleID", type: "FK" },
          ],
        },
        {
          name: "Credentials",
          fields: [
            { key: "PK", name: "CredentialID", type: "int" },
            { key: "FK", name: "AccountID", type: "FK, U" },
            { key: "", name: "PasswordHash", type: "varchar" },
            { key: "", name: "Salt", type: "varchar" },
          ],
        },
        {
          name: "Profile",
          fields: [
            { key: "PK", name: "ProfileID", type: "int" },
            { key: "", name: "Username", type: "varchar, U" },
            { key: "", name: "AvatarURL", type: "varchar" },
          ],
        },
        {
          name: "AccessRole",
          fields: [
            { key: "PK", name: "RoleID", type: "int" },
            { key: "", name: "RoleName", type: "'User', 'Admin'" },
          ],
        },
        {
          name: "Permissions",
          fields: [
            { key: "PK", name: "PermissionID", type: "int" },
            { key: "", name: "PermissionName", type: "varchar" },
          ],
        },
      ],
    },
    {
      id: "c2",
      name: "Cluster 2 — Scam reporting & analysis",
      entities: [
        {
          name: "ScamReport",
          fields: [
            { key: "PK", name: "ReportID", type: "int" },
            { key: "FK", name: "AccountID", type: "int" },
            { key: "", name: "SubmissionDate", type: "datetime" },
            { key: "", name: "ScamType", type: "varchar" },
            { key: "", name: "RiskScore", type: "int" },
            { key: "", name: "RiskBand", type: "varchar" },
            { key: "", name: "ReportStatus", type: "varchar" },
          ],
        },
        {
          name: "URLIndicator",
          fields: [
            { key: "PK", name: "URLID", type: "int" },
            { key: "FK", name: "ReportID", type: "int" },
            { key: "", name: "URL", type: "varchar" },
          ],
        },
        {
          name: "ContactIndicator",
          fields: [
            { key: "PK", name: "ContactID", type: "int" },
            { key: "FK", name: "ReportID", type: "int" },
            { key: "", name: "ContactInfo", type: "varchar" },
          ],
        },
        {
          name: "EvidenceFileMetadata",
          fields: [
            { key: "PK", name: "EvidenceID", type: "int" },
            { key: "FK", name: "ReportID", type: "int" },
            { key: "", name: "FileType", type: "varchar" },
            { key: "", name: "FileSize", type: "int" },
            { key: "", name: "CloudinaryURL", type: "varchar" },
          ],
        },
        {
          name: "DuplicateReportLink",
          fields: [
            { key: "PK", name: "DuplicateLinkID", type: "int" },
            { key: "FK", name: "OriginalReportID", type: "int" },
            { key: "FK", name: "DuplicateReportID", type: "int" },
          ],
        },
        {
          name: "AdminVerification",
          fields: [
            { key: "PK", name: "VerificationID", type: "int" },
            { key: "FK", name: "ReportID", type: "FK, U" },
            { key: "FK", name: "AdminAccountID", type: "FK" },
            { key: "", name: "VerifiedDate", type: "datetime" },
            { key: "", name: "VerificationDecision", type: "varchar" },
          ],
        },
      ],
    },
    {
      id: "c3",
      name: "Cluster 3 — Alerts & community",
      entities: [
        {
          name: "ScamAlert",
          fields: [
            { key: "PK", name: "AlertID", type: "int" },
            { key: "", name: "Title", type: "varchar" },
            { key: "", name: "AlertSeverity", type: "varchar" },
            { key: "", name: "TargetRegion", type: "varchar" },
            { key: "FK", name: "AdminAccountID", type: "int" },
          ],
        },
        {
          name: "AwarenessContent",
          fields: [
            { key: "PK", name: "AwarenessID", type: "int" },
            { key: "", name: "ContentTitle", type: "varchar" },
            { key: "", name: "ContentText", type: "text" },
          ],
        },
        {
          name: "RecoveryStep",
          fields: [
            { key: "PK", name: "RecoveryID", type: "int" },
            { key: "", name: "StepTitle", type: "varchar" },
            { key: "", name: "StepDescription", type: "text" },
          ],
        },
        {
          name: "Notification",
          fields: [
            { key: "PK", name: "NotificationID", type: "int" },
            { key: "FK", name: "AccountID", type: "int" },
            { key: "", name: "Message", type: "varchar" },
            { key: "", name: "Timestamp", type: "datetime" },
            { key: "FK", name: "LinkedReportID", type: "int, null" },
          ],
        },
      ],
    },
    {
      id: "c4",
      name: "Cluster 4 — Admin & audit",
      entities: [
        {
          name: "SystemReport",
          fields: [
            { key: "PK", name: "ReportInstanceID", type: "int" },
            { key: "", name: "ReportName", type: "varchar" },
            { key: "", name: "GeneratedDate", type: "datetime" },
            { key: "FK", name: "GeneratedByAdminID", type: "int" },
          ],
        },
        {
          name: "AuditLog",
          fields: [
            { key: "PK", name: "AuditLogID", type: "int" },
            { key: "FK", name: "AccountID", type: "int" },
            { key: "", name: "ActionType", type: "varchar" },
            { key: "", name: "Timestamp", type: "datetime" },
            { key: "", name: "OldValue", type: "varchar" },
            { key: "", name: "NewValue", type: "varchar" },
          ],
        },
      ],
    },
  ],
  relations: [
    "User 1—1 UserAccount",
    "UserAccount 1—1 Credentials · 1—1 Profile · *—1 AccessRole",
    "AccessRole 1—* Permissions",
    "UserAccount 1—* ScamReport",
    "ScamReport 1—* URLIndicator · ContactIndicator · EvidenceFileMetadata",
    "ScamReport 1—1 AdminVerification · 1—* DuplicateReportLink",
    "ScamAlert 1—* AwarenessContent · 1—* RecoveryStep",
    "UserAccount 1—* Notification · 1—* AuditLog",
  ],
} as const;

/* ── Use-case diagram ─────────────────────────────────────────────────────── */

interface UseCaseEntry {
  id: string;
  name: string;
  /** Which actor drives it — `both` draws a line from each. */
  actor: "user" | "admin" | "both";
  /** The parenthetical the diagram sets under the ellipse. */
  note?: string;
  /** The one case the diagram draws heavier, because everything includes it. */
  emphasis?: boolean;
}

export const USE_CASE: {
  title: string;
  boundary: string;
  actors: { id: string; name: string; role: string }[];
  cases: UseCaseEntry[];
  includes: { from: string; to: string; note: string }[];
} = {
  title: "Use-case diagram",
  boundary: "CyberKent system boundary",
  actors: [
    { id: "user", name: "User", role: "end-user" },
    { id: "admin", name: "Administrator", role: "council staff" },
  ],
  /** Primary use cases, with the actor that drives each. */
  cases: [
    { id: "uc1", name: "Register account", actor: "user" },
    { id: "uc2", name: "Login to system", actor: "user", note: "standard authentication" },
    { id: "uc3", name: "Manage user profile", actor: "user" },
    { id: "uc4", name: "View community scam alerts", actor: "user", note: "awareness info, trend data" },
    { id: "uc5", name: "Submit scam report", actor: "user", emphasis: true },
    { id: "uc6", name: "Track report status", actor: "both", note: "via reference number" },
    { id: "uc7", name: "Subscribe to notifications", actor: "user" },
    { id: "uc8", name: "Manage user accounts", actor: "admin" },
    { id: "uc9", name: "Review submitted scam reports", actor: "admin" },
    { id: "uc10", name: "Manage community scam alerts", actor: "admin" },
    { id: "uc11", name: "Detect duplicate / related reports", actor: "admin" },
    { id: "uc12", name: "Generate system reports", actor: "admin", note: "trend analysis, metrics" },
    { id: "uc13", name: "View audit logs", actor: "admin" },
  ],
  /** The included use cases, and what includes them. */
  includes: [
    { from: "Submit scam report", to: "Analyse scam content (text / URL)", note: "system automatic" },
    { from: "Submit scam report", to: "Upload evidence", note: "optional but supported" },
    { from: "Review submitted scam reports", to: "Verify scam report", note: "changes report status" },
    { from: "Manage user accounts", to: "View details / assign permissions", note: "" },
  ],
};

/* ── Work breakdown structure ─────────────────────────────────────────────── */

export const WBS = {
  title: "Work breakdown structure",
  root: { id: "1.0", name: "CyberKent project" },
  packages: [
    {
      id: "1.1",
      name: "Project management",
      children: [
        { id: "1.1.1", name: "Planning & scoping" },
        { id: "1.1.2", name: "Status reporting" },
        { id: "1.1.3", name: "Risk management" },
      ],
    },
    {
      id: "1.2",
      name: "System design & architecture",
      children: [
        { id: "1.2.1", name: "Architecture design" },
        { id: "1.2.2", name: "Database schema — PostgreSQL, Prisma, Neon" },
        { id: "1.2.3", name: "Security — WAF, JWT" },
      ],
    },
    {
      id: "1.3",
      name: "Core development",
      children: [
        { id: "1.3.1", name: "User account management", meta: "DFD 1.0 · Must" },
        { id: "1.3.2", name: "Scam report submission & analysis", meta: "DFD 2.0 · Must" },
        { id: "1.3.3", name: "Community scam alerts", meta: "DFD 3.0 · Should" },
        { id: "1.3.4", name: "Admin report review & audit", meta: "DFD 4.0 · Must" },
      ],
    },
    {
      id: "1.4",
      name: "Quality & testing",
      children: [
        { id: "1.4.1", name: "Unit & integration tests" },
        { id: "1.4.2", name: "System end-to-end tests" },
        { id: "1.4.3", name: "User acceptance testing — stakeholder approval" },
      ],
    },
    {
      id: "1.5",
      name: "Deployment",
      children: [
        { id: "1.5.1", name: "Production environment setup — cloud-hosted" },
        { id: "1.5.2", name: "Post-deployment review & maintenance" },
      ],
    },
  ],
  /** Level 3, shown beneath the development packages that have one. */
  detail: [
    { parent: "1.3.1", items: [{ id: "1.3.1.1", name: "Registration & authentication", fr: "4.1" }] },
    {
      parent: "1.3.2",
      items: [
        { id: "1.3.2.1", name: "Scam report management", fr: "4.5" },
        { id: "1.3.2.2", name: "Evidence management", fr: "4.6" },
        { id: "1.3.2.3", name: "Text content analysis", fr: "4.3" },
        { id: "1.3.2.4", name: "URL & contact analysis", fr: "4.8" },
      ],
    },
    {
      parent: "1.3.3",
      items: [
        { id: "1.3.3.1", name: "Community scam alerts", fr: "4.9" },
        { id: "1.3.3.2", name: "Scam awareness & recovery", fr: "4.10" },
        { id: "1.3.3.3", name: "Notification & subscription", fr: "4.11" },
      ],
    },
  ],
  note: "Based on the stakeholder-approved SRS and DFD",
} as const;

/* ── Gantt chart ──────────────────────────────────────────────────────────── */

interface GanttRow {
  id: string;
  name: string;
  /** Position and length in months from the chart's first month. */
  start: number;
  span: number;
  /** How the bar is filled — the monochrome stand-in for the original's colour. */
  weight: "solid" | "hatch" | "open" | "band";
  /** Set on the rows that head a section, which are set heavier. */
  group?: boolean;
  /** The DFD process this task implements, where it maps to one. */
  fr?: string;
}

export const GANTT: {
  title: string;
  months: string[];
  quarters: { label: string; span: number }[];
  rows: GanttRow[];
  milestones: { id: string; at: number; label: string }[];
  today: number;
  legend: { weight: GanttRow["weight"]; label: string }[];
} = {
  title: "Gantt chart schedule",
  /** Eleven months, Aug 2026 → Jun 2027. Bars are positioned in month units. */
  months: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  quarters: [
    { label: "2026 Q3", span: 2 },
    { label: "Q4", span: 3 },
    { label: "2027 Q1", span: 3 },
    { label: "Q2", span: 3 },
  ],
  /** `weight` sets the bar's fill: solid, hatched or open — the monochrome
      stand-in for the original's red / yellow / blue coding. */
  rows: [
    { id: "1.1", name: "Project management", start: 0, span: 10, weight: "open", group: true },
    { id: "1.2", name: "System design & architecture", start: 0, span: 5, weight: "hatch", group: true },
    { id: "1.2.3", name: "Security — WAF, JWT", start: 0, span: 1.5, weight: "hatch" },
    { id: "sprint12", name: "Sprint 1–2 · core platform", start: 0, span: 2, weight: "band", group: true },
    { id: "1.3.1", name: "User account management", start: 0, span: 2, weight: "solid", fr: "DFD 1.0" },
    { id: "1.3.4.3", name: "Audit log management", start: 2, span: 1, weight: "solid" },
    { id: "sprint34", name: "Sprint 3–4 · scam reporting", start: 2, span: 2, weight: "band", group: true },
    { id: "1.3.2.1", name: "Report management", start: 2, span: 1.5, weight: "solid", fr: "DFD 2.0" },
    { id: "1.3.2.2", name: "Evidence management", start: 3, span: 1.5, weight: "solid" },
    { id: "1.3.2.3", name: "Text content analysis", start: 3.5, span: 1.5, weight: "solid" },
    { id: "1.3.2.4", name: "URL & contact analysis", start: 4.5, span: 1, weight: "solid" },
    { id: "sprint56", name: "Sprint 5–6 · admin portal", start: 4, span: 2, weight: "band", group: true },
    { id: "1.3.4.1", name: "Report review & verification", start: 4.5, span: 1.5, weight: "solid", fr: "DFD 4.0" },
    { id: "1.3.4.2", name: "Admin reporting & analytics", start: 5, span: 1.5, weight: "solid" },
    { id: "1.3.2.5", name: "Duplicate detection", start: 5.5, span: 1, weight: "hatch" },
    { id: "sprint78", name: "Sprint 7–8 · community", start: 6, span: 2, weight: "band", group: true },
    { id: "1.3.3.1", name: "Community scam alerts", start: 6, span: 1.5, weight: "hatch", fr: "DFD 3.0" },
    { id: "1.3.3.2", name: "Awareness & recovery", start: 6.5, span: 1.5, weight: "hatch" },
    { id: "1.3.3.3", name: "Notification & subscription", start: 7, span: 1.5, weight: "hatch" },
    { id: "1.4.1", name: "Unit & integration tests", start: 0, span: 5, weight: "open", group: true },
    { id: "1.4.2", name: "System end-to-end tests", start: 7.5, span: 1, weight: "open" },
    { id: "1.4.3", name: "User acceptance testing", start: 8, span: 1.5, weight: "open" },
    { id: "1.5.1", name: "Production environment setup", start: 9, span: 1, weight: "solid", group: true },
    { id: "1.5.2", name: "Post-deployment review", start: 9.5, span: 1.5, weight: "solid" },
  ],
  milestones: [
    { id: "M1", at: 0.2, label: "Stakeholder approval — SRS interim" },
    { id: "M2", at: 2.2, label: "Sprint 1–2 go-live" },
    { id: "M3", at: 3.6, label: "Sprint 3–4 release" },
    { id: "M4", at: 5.6, label: "Sprint 5–6 release" },
    { id: "M5", at: 7.4, label: "Sprint 7–8 release" },
    { id: "M6", at: 10.6, label: "Project go-live" },
  ],
  today: 0.6,
  legend: [
    { weight: "solid", label: "Must" },
    { weight: "hatch", label: "Should" },
    { weight: "open", label: "Continuous / QA" },
    { weight: "band", label: "Sprint window" },
  ],
};
