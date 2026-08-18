/**
 * The Final SRS Report, told in fifteen slides.
 *
 * Copy lives here rather than in the slide components for the same reason every
 * other page's copy does (R9 §3): the wording of a stakeholder-facing deck is
 * edited by whoever is presenting it, and they should not have to read JSX to
 * change a figure. Every number below is taken from `Documents/Final-SRS-Report.md`
 * v1.0 and `Project-Features-and-Deliverables.md` — if either is reissued, this
 * file is the one place to reconcile.
 *
 * Written for a room, not for a reader. A slide holds figures, identifiers and
 * labels; the sentences that explain them are the presenter's to speak, which is
 * why almost nothing here is a sentence. Where a full line does appear it is
 * because it is the point of the slide and worth reading aloud verbatim.
 *
 * Six of the artefacts the assessment asks for are not drawn anywhere in the
 * project documents — the WBS, the schedule as a Gantt, the use-case diagram,
 * the ERD, the DFD and the storyboard. Each is derived here from what the
 * documents *do* record (the twelve modules and sixteen milestones, §7's actors
 * and use cases, §11.2's entity groups, §3.1.1's system context, UC-01's main
 * flow), so the deck draws the project rather than inventing it. Where a
 * criterion has no source at all — the lecturer's feedback — the slide says so
 * instead of filling the space.
 *
 * Icon fields are string keys resolved to components in `present/icons.ts`, so
 * this module stays free of JSX like the rest of `content/`.
 */

export const DECK_META = {
  title: "CyberKent",
  subtitle: "Online Scam Detection and Reporting System",
  reference: "D11 · Milestone M15",
  version: "1.0",
  issued: "13 August 2026",
} as const;

/* ── 1. Cover ─────────────────────────────────────────────────────────────── */

export const COVER = {
  eyebrow: "Final Software Requirements Specification",
  /** Two halves so the headline can resolve plain, then in the accent. */
  headline: { lead: "Cyber", accent: "Kent" },
  meta: ["Hume City Council · CyberSafe Services", "Project 31 · T2 2026", "CPRO306 · Kent Institute"],
  group: "Group CyberKent",
  team: [
    { initials: "SD", name: "Sujan Darji", role: "Project Manager" },
    { initials: "AR", name: "Anthony Regalado", role: "Team member" },
    { initials: "SK", name: "Saurav Khadka", role: "Team member" },
  ],
  status: "Issued for review",
  spine: [
    { value: "72", label: "requirements" },
    { value: "20", label: "enhancements" },
    { value: "9", label: "decisions" },
  ],
} as const;

/* ── 2. Background and the problem ────────────────────────────────────────── */

export const PROBLEM = {
  eyebrow: "Criterion 1 · Background",
  title: { lead: "A local harm with", accent: "no local answer." },
  place: [
    { value: "262k", label: "residents" },
    { value: "20 km", label: "north of Melbourne" },
    { value: "0", label: "local ways to check" },
  ],
  whyHume: [
    { icon: "languages", title: "Multilingual", note: "→ FR84" },
    { icon: "store", title: "Micro-business", note: "invoice fraud, BEC" },
    { icon: "users", title: "Targeted groups", note: "older · 10–24 · financial stress" },
  ],
  problems: [
    { id: "P1", text: "No way to verify a message", maps: "FR13–24" },
    { id: "P2", text: "Reporting returns nothing", maps: "FR25–30" },
    { id: "P3", text: "Warnings arrive too late", maps: "FR49–54" },
    { id: "P4", text: "Council has no local intelligence", maps: "FR70–71" },
    { id: "P5", text: "Victims do not know what next", maps: "FR55–60" },
    { id: "P6", text: "No security capability at all", maps: "FR13–24" },
  ],
  consequence: ["Financial loss", "Psychological harm", "Under-reporting", "Repeat victimisation"],
} as const;

/* ── 3. Objectives and purpose ────────────────────────────────────────────── */

export const OBJECTIVES = {
  eyebrow: "Criterion 1 · Objectives & purpose",
  title: { lead: "Reduce the harm.", accent: "Give Council its evidence." },
  purpose:
    "Reduce the financial and psychological harm of online scams in Hume — without creating fear, without collecting more data than the service needs, and without presenting an automated result as professional certification.",
  product: [
    { id: "PO-1", text: "Explained scam checking", state: "partial" },
    { id: "PO-2", text: "End-to-end reporting", state: "planned" },
    { id: "PO-3", text: "Staff review & verification", state: "planned" },
    { id: "PO-4", text: "Moderated community alerts", state: "planned" },
    { id: "PO-5", text: "Awareness & recovery", state: "planned" },
    { id: "PO-6", text: "Admin, analytics & audit", state: "planned" },
    { id: "PO-7", text: "15–20 enhanced FRs approved", state: "partial" },
  ],
  quality: [
    { id: "QO-1", text: "Performance targets", state: "risk" },
    { id: "QO-2", text: "WCAG 2.1 AA", state: "partial" },
    { id: "QO-3", text: "Security verification", state: "partial" },
    { id: "QO-4", text: "3NF with enforced integrity", state: "met" },
    { id: "QO-5", text: "Full traceability", state: "partial" },
  ],
  ethical: [
    { id: "EO-1", text: "Collect only what is needed", state: "partial" },
    { id: "EO-2", text: "No re-identification", state: "planned" },
    { id: "EO-3", text: "Non-discriminatory scoring", state: "met" },
    { id: "EO-4", text: "Never certification", state: "met" },
    { id: "EO-5", text: "Erasure without losing audit", state: "partial" },
  ],
  delivery: [
    { id: "DO-1", text: "Milestones on schedule", state: "met" },
    { id: "DO-2", text: "Zero cash cost", state: "met" },
    { id: "DO-3", text: "Forum record complete", state: "partial" },
    { id: "DO-4", text: "Stakeholder cadence", state: "partial" },
    { id: "DO-5", text: "Maintainable handover", state: "planned" },
  ],
  commitments: ["No fear", "Never certification", "Always explainable"],
} as const;

/* ── 4. Scope and deliverables ────────────────────────────────────────────── */

export const SCOPE = {
  eyebrow: "Criterion 2 · Scope & deliverables",
  title: { lead: "Four verbs for the community.", accent: "Four for Council." },
  community: [
    { icon: "scan", verb: "Check", maps: "FR13–24" },
    { icon: "flag", verb: "Report", maps: "FR25–36" },
    { icon: "bell", verb: "Stay informed", maps: "FR49–66" },
    { icon: "heart", verb: "Recover", maps: "FR55–60" },
  ],
  council: [
    { icon: "searchCheck", verb: "Review", maps: "FR37–48" },
    { icon: "siren", verb: "Alert", maps: "FR49–54" },
    { icon: "settings", verb: "Administer", maps: "FR67–69" },
    { icon: "trend", verb: "Analyse", maps: "FR70–72" },
  ],
  outOfScope: [
    "Certification",
    "Takedown or blocking",
    "Handling money",
    "Naming scammers",
    "Bank / telco integration",
    "Native apps",
    "AI — OCR, NLP, vision",
    "Threat-intel APIs",
  ],
  deliverables: [
    { id: "D1", text: "Interim SRS Report", milestone: "M4", state: "done" },
    { id: "D2", text: "Technology stack", milestone: "M2", state: "done" },
    { id: "D3", text: "System architecture", milestone: "M2", state: "done" },
    { id: "D4", text: "UI/UX design system", milestone: "M3", state: "done" },
    { id: "D5", text: "Engineering standards", milestone: "M2", state: "done" },
    { id: "D6", text: "Interim Project Report", milestone: "M6", state: "done" },
    { id: "D7", text: "Enhanced FRs", milestone: "M7", state: "blocked" },
    { id: "D8", text: "DB design & ethics review", milestone: "M8", state: "blocked" },
    { id: "D9", text: "Implemented system", milestone: "M9–13", state: "active" },
    { id: "D10", text: "Test strategy & evidence", milestone: "M14", state: "planned" },
    { id: "D11", text: "Final SRS Report", milestone: "M15", state: "done" },
    { id: "D12", text: "Deployment & handover", milestone: "M16", state: "planned" },
  ],
} as const;

/* ── 5. Team and performance ──────────────────────────────────────────────── */

export const TEAM = {
  eyebrow: "Criterion 3 · Team & performance",
  title: { lead: "Six capabilities,", accent: "three people, no single thread." },
  note: "The Interim Report defines six roles; the charter names three members. Each holds a primary and a backup, so no capability is single-threaded.",
  capabilities: [
    { capability: "Project management", primary: "Project Manager", backup: "Business Analyst", delivered: "M0–M6 on plan" },
    { capability: "Requirements & traceability", primary: "Business Analyst", backup: "Project Manager", delivered: "FR1–92, conformance §4" },
    { capability: "Architecture & security", primary: "Solution Architect", backup: "Database Designer", delivered: "8 endpoints, security base" },
    { capability: "Database & retention", primary: "Database Designer", backup: "Solution Architect", delivered: "25 tables, 34 FKs, 3NF" },
    { capability: "Frontend & accessibility", primary: "Frontend / UI-UX Lead", backup: "QA Lead", delivered: "~7,400 lines, WCAG practices" },
    { capability: "Test & verification", primary: "QA Lead", backup: "Frontend Lead", delivered: "7/7 engine cases" },
  ],
  skills: [
    { skill: "React, TypeScript, Tailwind", level: "Strong", state: "met" },
    { skill: "Node, Express, REST", level: "Good", state: "met" },
    { skill: "PostgreSQL & normalisation", level: "Good", state: "met" },
    { skill: "Prisma ORM", level: "Moderate", state: "met" },
    { skill: "Security engineering", level: "Significant gap", state: "risk" },
    { skill: "Privacy law", level: "Significant gap", state: "risk" },
    { skill: "WCAG auditing", level: "Moderate", state: "partial" },
    { skill: "AI / ML", level: "Deferred", state: "planned" },
  ],
  transfer:
    "The two significant gaps are governed by prescribed rules and external review rather than team judgement — a deliberate risk transfer, recorded as RK-08 and RK-09.",
} as const;

/* ── 6. Work breakdown and schedule ───────────────────────────────────────── */

export const PLAN = {
  eyebrow: "Criterion 4 · WBS, schedule & Gantt",
  title: { lead: "Six work packages,", accent: "sixteen milestone gates." },
  /** Level 1 packages, each with its level-2 tasks and the gate that closes it. */
  wbs: [
    {
      id: "1",
      name: "Project management",
      tasks: ["Planning & schedule", "Risk register", "Stakeholder liaison", "Forum submissions"],
      gate: "M0",
    },
    {
      id: "2",
      name: "Requirements",
      tasks: ["Brief analysis", "Baseline FR1–72", "Enhanced FR73–92", "Conformance check"],
      gate: "M1 · M7",
    },
    {
      id: "3",
      name: "Design",
      tasks: ["Technology stack", "Architecture", "UI/UX system", "Schema & ethics"],
      gate: "M2 · M3 · M8",
    },
    {
      id: "4",
      name: "Implementation",
      tasks: ["Modules 1–2", "Modules 3–4", "Modules 5–6", "Modules 7–8", "Modules 9–12"],
      gate: "M9–M13",
    },
    {
      id: "5",
      name: "Verification",
      tasks: ["Unit & integration", "Accessibility", "Performance & load", "Security & privacy"],
      gate: "M14",
    },
    {
      id: "6",
      name: "Deployment",
      tasks: ["Deploy", "Documentation", "Handover pack", "Final presentation"],
      gate: "M16",
    },
  ],
  /** Gantt bars, positioned in weeks from project start. 22 weeks total. */
  gantt: [
    { id: "1", name: "Project management", start: 0, span: 22, state: "active" },
    { id: "2", name: "Requirements", start: 0, span: 7, state: "done" },
    { id: "3", name: "Design", start: 1.5, span: 6, state: "done" },
    { id: "3b", name: "Schema & ethics review", start: 5.5, span: 3, state: "blocked" },
    { id: "4", name: "Implementation", start: 8, span: 9, state: "active" },
    { id: "5", name: "Verification", start: 15, span: 4, state: "planned" },
    { id: "6", name: "Deployment & handover", start: 19, span: 3, state: "planned" },
  ],
  weeks: 22,
  /** Quarter marks, so a bar can be read against a date rather than a fraction. */
  ticks: ["30 Jun", "Aug", "Sep", "Oct", "27 Nov"],
  float: "≈2.5 weeks of float distributed across the iterations, not held as a block at the end",
  gateNote: "A milestone is a gate, not an activity: a verifiable state that must be reached before the next phase begins.",
} as const;

/* ── 7. Use-case model ────────────────────────────────────────────────────── */

export const USECASES = {
  eyebrow: "Criterion 5 · Requirement analysis",
  title: { lead: "Nineteen use cases,", accent: "five actors, one boundary." },
  actors: {
    left: [
      { name: "Visitor", note: "no account" },
      { name: "Resident", note: "inherits Visitor" },
      { name: "Organisation", note: "inherits Resident" },
    ],
    right: [
      { name: "Officer", note: "inherits Resident" },
      { name: "Administrator", note: "inherits Officer" },
      { name: "Scheduler", note: "supporting" },
    ],
  },
  /** Grouped as they sit inside the system boundary, with their driving actor. */
  groups: [
    {
      name: "Check & learn",
      side: "left",
      cases: [
        { id: "UC-01", text: "Check a suspicious message" },
        { id: "UC-12", text: "Browse & search alerts" },
        { id: "UC-13", text: "View map & trends" },
        { id: "UC-14", text: "Learn from resources" },
        { id: "UC-16", text: "Subscribe / unsubscribe" },
        { id: "UC-19", text: "Dispute an indicator" },
      ],
    },
    {
      name: "Account & report",
      side: "left",
      cases: [
        { id: "UC-02", text: "Register" },
        { id: "UC-03", text: "Sign in / out" },
        { id: "UC-04", text: "Recover a password" },
        { id: "UC-05", text: "Manage profile" },
        { id: "UC-06", text: "Request deletion" },
        { id: "UC-07", text: "Submit a report" },
        { id: "UC-08", text: "Track & withdraw" },
        { id: "UC-15", text: "Recovery checklist" },
      ],
    },
    {
      name: "Review & administer",
      side: "right",
      cases: [
        { id: "UC-09", text: "Review & verify a report" },
        { id: "UC-10", text: "Resolve duplicates" },
        { id: "UC-11", text: "Publish an alert" },
        { id: "UC-17", text: "Administer users & roles" },
        { id: "UC-18", text: "Statistics & export" },
      ],
    },
  ],
  supporting: ["Email service", "Object storage", "Scheduler"],
  detail: {
    label: "UC-01 — the one that is built",
    flow: ["Select channel", "Paste message", "Extract artefacts", "Apply rules", "Score & band", "Show indicators"],
    alternates: ["A1 too short → UNCLEAR", "A2 empty → field error", "A3 reduced motion", "A4 artefact seen before"],
  },
} as const;

/* ── 8. Requirements ──────────────────────────────────────────────────────── */

export const REQUIREMENTS = {
  eyebrow: "Criterion 6 · Case definition & requirements",
  title: { lead: "Twelve modules.", accent: "Every requirement testable." },
  modules: [
    { n: 1, name: "Registration & auth", range: "FR1–6", priority: "Must" },
    { n: 2, name: "Profile & access", range: "FR7–12", priority: "Must" },
    { n: 3, name: "Content analysis", range: "FR13–18", priority: "Must" },
    { n: 4, name: "URL & contact", range: "FR19–24", priority: "Must" },
    { n: 5, name: "Report management", range: "FR25–30", priority: "Must" },
    { n: 6, name: "Evidence", range: "FR31–36", priority: "Must" },
    { n: 7, name: "Review & verify", range: "FR37–42", priority: "Must" },
    { n: 8, name: "Duplicate detection", range: "FR43–48", priority: "Should" },
    { n: 9, name: "Community alerts", range: "FR49–54", priority: "Should" },
    { n: 10, name: "Awareness & recovery", range: "FR55–60", priority: "Should" },
    { n: 11, name: "Notify & subscribe", range: "FR61–66", priority: "Should" },
    { n: 12, name: "Admin & audit", range: "FR67–72", priority: "Must" },
  ],
  /** The non-functional attributes, as the brief groups them. */
  nfr: [
    { attribute: "Performance", ids: "NFR-1–3", note: "3 s load · 1000 users · 2 s at 100k" },
    { attribute: "Reliability", ids: "NFR-4–6", note: "99% · daily backup · RTO 4 h" },
    { attribute: "Security", ids: "NFR-7–11", note: "TLS · bcrypt 12 · RBAC" },
    { attribute: "Usability", ids: "NFR-12–17", note: "WCAG 2.1 AA · 320 px" },
    { attribute: "Maintainability", ids: "NFR-18–20", note: "layered · 3NF" },
    { attribute: "Scalability", ids: "NFR-21–24", note: "20%/yr · horizontal" },
    { attribute: "Availability", ids: "NFR-25–26", note: "24×7 · auto recovery" },
    { attribute: "Integrity & privacy", ids: "NFR-27–30", note: "FKs · APP / VPDSS" },
  ],
  reconciliation: { client: 25, added: 5, total: 30 },
  ethics: [
    { id: "ETH-1", text: "No fear, no certification" },
    { id: "ETH-2", text: "State the limits" },
    { id: "ETH-3", text: "Non-discriminatory scoring" },
    { id: "ETH-4", text: "Reporter anonymised" },
    { id: "ETH-5", text: "AI human-reviewed" },
    { id: "ETH-6", text: "Collect only what is needed" },
    { id: "ETH-7", text: "No machine output as fact" },
    { id: "ETH-8", text: "A person may disagree" },
    { id: "ETH-9", text: "Never name a scammer" },
  ],
  moscow: "MoSCoW is the release valve — Should loses depth before any Must is compromised.",
} as const;

/* ── 9. Enhanced requirements and conformance ─────────────────────────────── */

export const ENHANCED = {
  eyebrow: "Criterion 6 · Enhanced FRs & conformance",
  title: { lead: "Twenty additions,", accent: "and four defects in the brief." },
  approval: "OI-4 · M7 passed 12 August · RK-02 — outside the baseline until approved",
  counts: [
    { value: "20", label: "proposed", tone: "accent" },
    { value: "8", label: "Must", tone: "idle" },
    { value: "10", label: "Should", tone: "idle" },
    { value: "6", label: "already built", tone: "good" },
    { value: "13", label: "net new", tone: "warn" },
  ],
  items: [
    { id: "FR73", text: "MFA for privileged roles", pri: "Must", done: false },
    { id: "FR74", text: "Throttling & lockout", pri: "Must", done: false },
    { id: "FR75", text: "Session revocation", pri: "Should", done: false },
    { id: "FR76", text: "Uniform auth failure", pri: "Must", done: true },
    { id: "FR77", text: "Server-side analysis", pri: "Must", done: false },
    { id: "FR78", text: "Evidence-carrying result", pri: "Must", done: true },
    { id: "FR79", text: "Confidence, separately", pri: "Must", done: true },
    { id: "FR80", text: "Channel-aware rules", pri: "Should", done: true },
    { id: "FR81", text: "Screenshot OCR", pri: "Should", done: false },
    { id: "FR82", text: "Feedback loop", pri: "Should", done: false },
    { id: "FR83", text: "Rule-set versioning", pri: "Should", done: false },
    { id: "FR84", text: "Multilingual", pri: "Must", done: false },
    { id: "FR85", text: "Anonymous checking", pri: "Must", done: true },
    { id: "FR86", text: "Assistive-tech results", pri: "Must", done: true },
    { id: "FR87", text: "Printable summary", pri: "Could", done: false },
    { id: "FR88", text: "Alert digest", pri: "Should", done: false },
    { id: "FR89", text: "Review SLA timers", pri: "Should", done: false },
    { id: "FR90", text: "Anomaly detection", pri: "Should", done: false },
    { id: "FR91", text: "Retention & purge", pri: "Must", done: false },
    { id: "FR92", text: "Third-party dispute", pri: "Should", done: false },
  ],
  defects: [
    { id: "D1", was: "Cybersecurity assessment portal", now: "Scam detection service", severity: "high" },
    { id: "D2", was: "Modular PHP with MVC", now: "Modular TypeScript, layered", severity: "low" },
    { id: "D3", was: "Used only for matchmaking", now: "Scam detection and reporting", severity: "high" },
    { id: "D4", was: "Single-server MySQL", now: "Single-server PostgreSQL", severity: "low" },
  ],
  verdict: { headline: "CONFORMS", qualifier: "72 / 72 · nine decisions outstanding" },
  line: "A requirement quietly reinterpreted is a requirement the client never agreed to.",
} as const;

/* ── 10. Architecture, ERD and DFD ────────────────────────────────────────── */

export const ARCHITECTURE = {
  eyebrow: "Criterion 8 · Database structures, ERD & DFD",
  title: { lead: "Twenty-five tables,", accent: "and no shortcut through them." },
  /** Level-0 data-flow: external entities, the process, and its stores. */
  dfd: {
    external: [
      { name: "Resident", flow: "message · report" },
      { name: "Officer", flow: "decision · alert" },
      { name: "Email service", flow: "notification" },
    ],
    processes: [
      { id: "P1", name: "Analyse", store: "ScamCheck" },
      { id: "P2", name: "Report & evidence", store: "Report" },
      { id: "P3", name: "Review & publish", store: "Alert" },
    ],
    stores: [
      { id: "D1", name: "Identity" },
      { id: "D2", name: "Analysis" },
      { id: "D3", name: "Reports & evidence" },
      { id: "D4", name: "Audit" },
    ],
  },
  /** ERD groups, with the relationships that matter between them. */
  erd: {
    groups: [
      { id: "identity", name: "Identity", entities: ["User", "EmailVerificationToken", "PasswordResetToken", "NotificationPreference", "AccountDeletionRequest"] },
      { id: "analysis", name: "Analysis", entities: ["ScamCheck", "ScamCheckIndicator", "Indicator"] },
      { id: "reports", name: "Reports & evidence", entities: ["Report", "ReportIndicator", "ReportRelation", "Evidence", "EvidenceAccessLog"] },
      { id: "review", name: "Review", entities: ["ReportReview", "InformationRequest"] },
      { id: "alerts", name: "Alerts", entities: ["Alert"] },
      { id: "recovery", name: "Awareness & recovery", entities: ["AwarenessResource", "RecoveryChecklist", "RecoveryStep", "RecoveryProgress"] },
      { id: "notify", name: "Notification", entities: ["Notification", "Subscription"] },
      { id: "audit", name: "Audit", entities: ["AuditLog"] },
      { id: "reference", name: "Reference", entities: ["ScamCategory", "Suburb"] },
    ],
    relations: [
      { from: "identity", to: "reports", label: "1..*  authors" },
      { from: "identity", to: "analysis", label: "0..*  nullable" },
      { from: "analysis", to: "reports", label: "*..*  indicators" },
      { from: "reports", to: "review", label: "1..*  decisions" },
      { from: "reports", to: "alerts", label: "0..1  severable" },
      { from: "identity", to: "audit", label: "SetNull  severs" },
    ],
  },
  stats: [
    { value: "25", label: "tables" },
    { value: "11", label: "enums" },
    { value: "34", label: "keys" },
    { value: "55", label: "indexes" },
    { value: "3NF", label: "normalised" },
  ],
  layers: ["Presentation", "Edge", "API entry", "Routing", "Validation", "Controller", "Service", "Repository", "Data"],
  decisions: [
    "Artefacts normalised — one row with a count, not fifty rows",
    "Factors persisted individually, so a score stays explainable",
    "Reviews stored as a sequence, so a decision survives the next one",
    "Audit actor severs on deletion, never cascades",
    "Money in whole cents; aggregation stops at suburb",
  ],
  governance: "Draft under review — privacy officer sign-off outstanding",
} as const;

/* ── 11. User storyboard ──────────────────────────────────────────────────── */

export const STORYBOARD = {
  eyebrow: "Criterion 9 · User storyboard",
  title: { lead: "A frightened person,", accent: "six screens, no account." },
  frames: [
    { n: 1, screen: "Landing", does: "Arrives from a link a relative sent", art: "landing" },
    { n: 2, screen: "Checker", does: "Chooses how it reached them", art: "channel" },
    { n: 3, screen: "Paste", does: "Pastes the message, or drops a screenshot", art: "paste" },
    { n: 4, screen: "Scanning", does: "Watches the check run — a bounded wait", art: "scan" },
    { n: 5, screen: "Result", does: "Reads band, score and every indicator", art: "result" },
    { n: 6, screen: "Next", does: "Reports it, or opens the recovery checklist", art: "next" },
  ],
  guarantees: ["No account", "Nothing stored against them", "Runs on their own device", "Disclaimer at the verdict"],
  note: "Frames 1–5 are built and live today; frame 6's onward routes are placeholders until Modules 5 and 10 land.",
} as const;

/* ── 12. Test plan and test cases ─────────────────────────────────────────── */

export const TESTING = {
  eyebrow: "Criterion 10 · Test plan & test cases",
  title: { lead: "Seven cases run.", accent: "Seven correct." },
  strategy: [
    { level: "Static", method: "TypeScript strict · oxlint", owner: "All", state: "met" },
    { level: "Unit", method: "Rules, scoring, schemas", owner: "QA Lead", state: "partial" },
    { level: "Integration", method: "API against a test database", owner: "QA Lead", state: "planned" },
    { level: "End-to-end", method: "Browser journeys per §7", owner: "QA Lead", state: "planned" },
    { level: "Accessibility", method: "Automated + keyboard + reader", owner: "Frontend", state: "planned" },
    { level: "Performance", method: "Load to NFR-2 / NFR-3", owner: "Architect", state: "planned" },
    { level: "Security", method: "OWASP Top 10 · external pen test", owner: "Architect", state: "partial" },
    { level: "Privacy", method: "Re-identification · EXIF · erasure", owner: "DB Designer", state: "planned" },
  ],
  cases: [
    { n: 1, label: "Toll scam, lookalike domain", channel: "SMS", expected: "HIGH", score: 91, confidence: 0.83, pass: true },
    { n: 2, label: "Rates refund, bank details", channel: "Email", expected: "HIGH", score: 93, confidence: 0.97, pass: true },
    { n: 3, label: "Gift card + secrecy", channel: "Email", expected: "HIGH", score: 86, confidence: 0.7, pass: true },
    { n: 4, label: "Genuine Council notice", channel: "Email", expected: "LOW", score: 0, confidence: 0.39, pass: true },
    { n: 5, label: "Benign personal message", channel: "SMS", expected: "LOW", score: 0, confidence: 0.24, pass: true },
    { n: 6, label: "Too short to assess", channel: "SMS", expected: "UNCLEAR", score: 0, confidence: 0, pass: true },
    { n: 7, label: "Credential phish, raw IP", channel: "Email", expected: "HIGH", score: 88, confidence: 0.82, pass: true },
  ],
  formula: "score = round(100 × (1 − e^(−evidence ÷ 45)))",
  result: "7 / 7 band classifications correct · zero false positives",
  acceptance: "13 release acceptance criteria, AC-1 to AC-13 — every implemented FR under test, security and WCAG signed off, load and restore demonstrated, re-identification and erasure proven",
  gap: "No test framework installed yet (G3) — the behavioural harness becomes a Vitest suite in Phase 1.",
  insight: "Case 4 — a real Council notice naming a council and carrying a link — scored 0. A checker that flags Council's own mail destroys the trust it exists to build.",
} as const;

/* ── 13. Budget and financial breakdown ───────────────────────────────────── */

export const BUDGET = {
  eyebrow: "Criterion 7 · Budget & financial breakdown",
  title: { lead: "Nothing spent.", accent: "A very low bar to clear." },
  headline: [
    { value: "$0", label: "cash spent to development", tone: "good" },
    { value: "$64.8k", label: "notional labour value", tone: "idle" },
    { value: "$43.4k", label: "year one, all in", tone: "warn" },
    { value: "$100.2k", label: "three-year TCO", tone: "warn" },
  ],
  /** Annual run cost, broken into the two lines that make it up. */
  operating: [
    { item: "Infrastructure — hosting, database, storage, email", amount: 4400 },
    { item: "Maintenance — 0.2 FTE Council effort", amount: 24000 },
  ],
  operatingTotal: 28400,
  infrastructure: [
    { item: "CDN static hosting", note: "paid tier before promotion" },
    { item: "Managed PostgreSQL", note: "ap-southeast-2, PITR" },
    { item: "Object storage", note: "private, encrypted" },
    { item: "Transactional email", note: "SPF · DKIM · DMARC" },
    { item: "Monitoring & uptime", note: "probe + alerting" },
  ],
  benefit: [
    { label: "Break-even", value: "$28.4k / yr" },
    { label: "As a share of local reported losses", value: "0.14%" },
    { label: "Benefit–cost ratio", value: "3.5:1 – 13.9:1" },
  ],
  condition: "Paid-tier hosting must be approved before public promotion, not discovered after — feasibility condition 1, risk RK-01.",
  line: "The service does not need to be highly effective to be worth doing. It needs to prevent a small handful of significant losses a year.",
} as const;

/* ── 14. Risks and communication ──────────────────────────────────────────── */

export const GOVERNANCE = {
  eyebrow: "Criteria 11 & 12 · Risk & communication",
  title: { lead: "Seventeen risks.", accent: "Four already materialised." },
  critical: [
    { id: "RK-04", text: "Evidence exposes personal data", score: 15, owner: "DB Designer", state: "open" },
    { id: "RK-08", text: "Vulnerability through inexperience", score: 15, owner: "Architect", state: "partial" },
    { id: "RK-09", text: "Migration ran before sign-off", score: 15, owner: "DB Designer", state: "fired" },
    { id: "RK-12", text: "A third party wrongly implicated", score: 16, owner: "Analyst", state: "partial" },
  ],
  materialised: [
    { id: "RK-02", text: "Enhanced FR approval overdue" },
    { id: "RK-17", text: "Scope ambiguity open since 8 Jul" },
  ],
  treatment: [
    { approach: "Avoid", example: "No public indicator listing — ER-13" },
    { approach: "Reduce", example: "Rules over judgement where skills are thin" },
    { approach: "Transfer", example: "External security & privacy review" },
    { approach: "Accept", example: "Free-tier limits until promotion" },
  ],
  triggerNote: "Every risk carries a trigger — the observable signal it is materialising — because a mitigation activated after the damage shows is not a mitigation.",
  communication: [
    { audience: "Supervisor / lecturer", cadence: "Fortnightly", channel: "Meeting + written summary" },
    { audience: "CyberSafe manager", cadence: "Monthly", channel: "Status report" },
    { audience: "Council stakeholders", cadence: "Each gate", channel: "Deliverable + sign-off" },
    { audience: "Privacy officer", cadence: "M8, then on change", channel: "Review pack" },
    { audience: "Reviewers & admins", cadence: "M12 · M14 · M16", channel: "Workshop" },
    { audience: "Team stand-up", cadence: "3× weekly", channel: "15 min video" },
  ],
  escalation: [
    { level: "L1", scope: "Blocks one member", time: "Same day" },
    { level: "L2", scope: "Blocks an iteration", time: "1 day" },
    { level: "L3", scope: "Outside team authority", time: "2 days" },
    { level: "L4", scope: "Scope, schedule or budget", time: "3 days" },
    { level: "L5", scope: "Privacy, legal or breach", time: "Same day, direct" },
  ],
  escalationNote: "L5 bypasses the sequence deliberately: a privacy concern that waits two days for a checkpoint is a privacy concern left unaddressed for two days.",
} as const;

/* ── 15. Position, feedback and verdict ───────────────────────────────────── */

export const CLOSE = {
  eyebrow: "Criteria 13 · Position & feedback",
  title: { lead: "Honest, mixed,", accent: "and a GO." },
  donut: [
    { label: "Implemented", value: 16, tone: "good" },
    { label: "Partial", value: 4, tone: "warn" },
    { label: "Specified only", value: 52, tone: "idle" },
  ],
  complete: [
    { icon: "database", title: "Data layer", detail: "25 tables migrated" },
    { icon: "scan", title: "Detection engine", detail: "verified, early" },
    { icon: "lock", title: "Security base", detail: "auth, RBAC, limits" },
  ],
  missing: [
    { id: "G2", title: "Front end never calls back end" },
    { id: "G7", title: "Seed script absent" },
    { id: "G11", title: "10 of 15 mitigations absent" },
  ],
  blocking: [
    { id: "OI-1", text: "Confirm the scope" },
    { id: "OI-3", text: "Confirm the purpose-limitation wording" },
    { id: "OI-4", text: "Approve the twenty enhanced FRs" },
    { id: "OI-11", text: "Hold the database ethics review" },
  ],
  /**
   * The one criterion with no source in any project document.
   *
   * Left as prompts rather than filled with plausible-sounding answers: the
   * lecturer will know what they said, and a slide that invents their feedback
   * is worse than one that admits it is waiting for it.
   */
  feedback: {
    label: "Responses to lecturer feedback",
    todo: "To complete before the presentation — from the marked Interim SRS and Interim Project Report",
    prompts: [
      { on: "Feedback received", answer: "…" },
      { on: "What changed in response", answer: "…" },
      { on: "Where it shows in this document", answer: "…" },
    ],
  },
  verdict: { headline: "GO", qualifier: "subject to six conditions" },
  closing: "The design work that mattered was never the code.",
} as const;
