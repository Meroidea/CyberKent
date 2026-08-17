/**
 * The Final SRS Report, told in ten slides.
 *
 * Copy lives here rather than in the slide components for the same reason every
 * other page's copy does (R9 §3): the wording of a stakeholder-facing deck is
 * edited by whoever is presenting it, and they should not have to read JSX to
 * change a figure. Every number below is taken from `Documents/Final-SRS-Report.md`
 * v1.0 — if the document is reissued, this file is the one place to reconcile.
 *
 * Written for a room, not for a reader. A slide holds figures, identifiers and
 * labels; the sentences that explain them are the presenter's to speak, which is
 * why almost nothing here is a sentence. Where a full line does appear it is
 * because it is the point of the slide and worth reading aloud verbatim.
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

/* ── 2. The problem ───────────────────────────────────────────────────────── */

export const PROBLEM = {
  eyebrow: "Section 2",
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

/* ── 3. What the service does ─────────────────────────────────────────────── */

export const SERVICE = {
  eyebrow: "Sections 1.2 & 3.2",
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
  existing: ["Scamwatch", "Banks & telcos", "ACSC", "Council news"],
  fills: "The municipal layer",
  roles: ["Visitor", "RESIDENT", "BUSINESS", "OFFICER", "ADMIN"],
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
} as const;

/* ── 4. Ethics ────────────────────────────────────────────────────────────── */

export const ETHICS = {
  eyebrow: "Section 10",
  title: { lead: "Ethics as architecture,", accent: "not as a paragraph." },
  commitments: [
    { icon: "heart", title: "No fear" },
    { icon: "scale", title: "Never certification" },
    { icon: "eye", title: "Always explainable" },
  ],
  arithmetic: {
    label: "ETH-1 and ETH-2, as arithmetic",
    formula: "score = 100 × (1 − e^(−evidence ÷ 45))",
    detail: "Approaches 100. Never reaches it.",
  },
  register: [
    { id: "ETH-1", text: "No fear, no certification", state: "met" },
    { id: "ETH-2", text: "State the limits", state: "met" },
    { id: "ETH-3", text: "Non-discriminatory scoring", state: "met" },
    { id: "ETH-4", text: "Reporter anonymised", state: "open" },
    { id: "ETH-5", text: "AI human-reviewed", state: "met" },
    { id: "ETH-6", text: "Collect only what is needed", state: "partial" },
    { id: "ETH-7", text: "No machine output as fact", state: "team" },
    { id: "ETH-8", text: "A person may disagree", state: "team" },
    { id: "ETH-9", text: "Never name a scammer", state: "team" },
  ],
  audit: {
    label: "Database ethical risks, audited",
    segments: [
      { label: "Satisfied", value: 4, tone: "good" },
      { label: "Partial", value: 1, tone: "warn" },
      { label: "Absent", value: 10, tone: "bad" },
    ],
    critical: "4 of 6 Critical unmet — ER-2, ER-5, ER-7, ER-13",
  },
  guards: ["k ≥ 5", "Suburb, no finer", "Patterns, not people", "Audit passed"],
  asymmetry: "The people who bear the consequences hold the least power. That is why these are constraints, not aspirations.",
} as const;

/* ── 5. Conformance ───────────────────────────────────────────────────────── */

export const CONFORMANCE = {
  eyebrow: "Section 4",
  title: { lead: "We read the brief", accent: "instead of transcribing it." },
  match: { total: 72, label: "requirements, identifiers and intent intact" },
  defects: [
    { id: "D1", was: "Cybersecurity assessment portal", now: "Scam detection service", severity: "high" },
    { id: "D2", was: "Modular PHP with MVC", now: "Modular TypeScript, layered", severity: "low" },
    { id: "D3", was: "Used only for matchmaking", now: "Scam detection and reporting", severity: "high" },
    { id: "D4", was: "Single-server MySQL", now: "Single-server PostgreSQL", severity: "low" },
  ],
  findings: [
    { icon: "split", count: "2", title: "Coverage gaps" },
    { icon: "gauge", count: "9", title: "Untestable requirements" },
    { icon: "plus", count: "5", title: "Unapproved NFRs" },
    { icon: "shieldAlert", count: "1", title: "Control bypassed" },
  ],
  verdict: { headline: "CONFORMS", qualifier: "nine Council decisions outstanding" },
  line: "A requirement quietly reinterpreted is a requirement the client never agreed to.",
} as const;

/* ── 6. The baseline ──────────────────────────────────────────────────────── */

export const BASELINE = {
  eyebrow: "Sections 5, 7 & 9",
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
  nfr: {
    client: 25,
    added: 5,
    total: 30,
    additions: [
      { id: "NFR-11", text: "Role-based data restriction" },
      { id: "NFR-13", text: "WCAG 2.1 Level AA" },
      { id: "NFR-14", text: "iOS and Android, 320 px floor" },
      { id: "NFR-21", text: "20% annual growth" },
      { id: "NFR-22", text: "Horizontal scaling" },
    ],
    note: "NFR-6 also gains a 4-hour RTO",
  },
  scaffold: [
    { value: "19", label: "use cases" },
    { value: "17", label: "constraints" },
    { value: "12", label: "assumptions" },
    { value: "12", label: "data rules" },
    { value: "13", label: "acceptance criteria" },
    { value: "9", label: "ethical requirements" },
  ],
  moscow: "MoSCoW is the release valve — Should loses depth before any Must is compromised.",
} as const;

/* ── 7. Enhanced requirements ─────────────────────────────────────────────── */

export const ENHANCED = {
  eyebrow: "Section 6",
  title: { lead: "Twenty additions,", accent: "awaiting approval." },
  approval: "OI-4 · M7 passed 12 August · RK-02 — outside the baseline until approved",
  counts: [
    { value: "20", label: "proposed", tone: "accent" },
    { value: "8", label: "Must", tone: "idle" },
    { value: "10", label: "Should", tone: "idle" },
    { value: "1", label: "Could", tone: "idle" },
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
  headline: [
    { id: "FR84", title: "Multilingual", why: "English-only does not reach the residents most exposed" },
    { id: "FR91", title: "Retention", why: "A legal obligation the brief omits entirely" },
    { id: "FR77", title: "Server-side analysis", why: "FR24 and FR70 cannot work without it" },
    { id: "FR92", title: "Dispute process", why: "Correctable by the people it can harm" },
  ],
  reduction: "Defer FR87, FR88, FR81 if approval slips. Never FR84 or FR91.",
} as const;

/* ── 8. How it is built ───────────────────────────────────────────────────── */

export const BUILD = {
  eyebrow: "Sections 8, 11–13 & 15",
  title: { lead: "A modular monolith", accent: "with no shortcuts through it." },
  layers: [
    { name: "Presentation", detail: "React SPA · portable analyser" },
    { name: "Edge", detail: "CDN · CSP · security headers" },
    { name: "API entry", detail: "helmet · CORS · 256 KB · rate limit" },
    { name: "Routing", detail: "role declarations per route" },
    { name: "Validation", detail: "Zod replaces the body" },
    { name: "Controller", detail: "receive, delegate, respond" },
    { name: "Service", detail: "rules, transactions" },
    { name: "Repository", detail: "the only ORM caller" },
    { name: "Data", detail: "PostgreSQL · TLS · ap-southeast-2" },
  ],
  data: [
    { value: "25", label: "tables" },
    { value: "11", label: "enums" },
    { value: "34", label: "keys" },
    { value: "55", label: "indexes" },
    { value: "3NF", label: "normalised" },
  ],
  dataNote: "Draft under review",
  engine: {
    label: "Detection engine · verified 13 Aug 2026",
    formula: "score = round(100 × (1 − e^(−evidence ÷ 45)))",
    weights: "HIGH 30 · MEDIUM 16 · LOW 7",
    bands: "HIGH ≥ 65 · MEDIUM ≥ 35 · LOW ≥ 0 · UNCLEAR",
    rules: "11 text rules · 6 URL checks · 12 TLDs · 10 shorteners · 14 brands",
    cases: [
      { n: 1, label: "Toll scam", expected: "HIGH", score: 91 },
      { n: 2, label: "Rates refund", expected: "HIGH", score: 93 },
      { n: 3, label: "Gift card", expected: "HIGH", score: 86 },
      { n: 4, label: "Real Council notice", expected: "LOW", score: 0 },
      { n: 5, label: "Benign message", expected: "LOW", score: 0 },
      { n: 6, label: "Too short", expected: "UNCLEAR", score: 0 },
      { n: 7, label: "Raw-IP phish", expected: "HIGH", score: 88 },
    ],
    result: "7 / 7 correct · no false positives",
    insight: "A scam checker that flags Council's own mail destroys the trust it exists to build.",
  },
  hosting: {
    label: "Recommended production",
    items: ["CDN SPA", "API ×2", "Managed Postgres AU", "Private bucket", "SPF/DKIM/DMARC", "Uptime probe"],
    cost: "≈ AUD $4,400 / yr",
  },
  securityLayers: ["TLS · HSTS · CSP", "helmet · CORS", "10/15 min", "JWT + RBAC", "Zod", "ORM only", "bcrypt 12", "Audit log"],
} as const;

/* ── 9. Delivery position ─────────────────────────────────────────────────── */

export const POSITION = {
  eyebrow: "Section 14",
  title: { lead: "Honest,", accent: "and mixed." },
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
    { id: "G2", title: "Front end never calls back end", detail: "no API client exists" },
    { id: "G7", title: "Seed script absent", detail: "no reference data loads" },
    { id: "G11", title: "10 of 15 mitigations absent", detail: "window closes at first use" },
  ],
  gapsNote: "Eleven gaps, G1–G11, each with an owner",
  milestones: [
    { id: "M0", state: "done" }, { id: "M1", state: "done" }, { id: "M2", state: "done" },
    { id: "M3", state: "done" }, { id: "M4", state: "done" }, { id: "M5", state: "done" },
    { id: "M6", state: "done" }, { id: "M7", state: "blocked" }, { id: "M8", state: "blocked" },
    { id: "M9", state: "active" }, { id: "M10", state: "early" }, { id: "M11", state: "planned" },
    { id: "M12", state: "planned" }, { id: "M13", state: "planned" }, { id: "M14", state: "planned" },
    { id: "M15", state: "active" }, { id: "M16", state: "planned" },
  ],
  milestoneLegend: [
    { state: "done", label: "complete" },
    { state: "early", label: "early" },
    { state: "active", label: "in progress" },
    { state: "blocked", label: "blocked externally" },
    { state: "planned", label: "planned" },
  ],
  schedule: "22 weeks · 30 Jun – 27 Nov 2026",
  risks: {
    total: 17,
    materialised: [
      { id: "RK-02", text: "FR approval overdue" },
      { id: "RK-09", text: "Migration before sign-off" },
      { id: "RK-17", text: "Scope open since 8 Jul" },
      { id: "RK-04/12", text: "Schema controls absent" },
    ],
    line: "Every one is a decision waiting on someone outside the team.",
  },
  money: [
    { value: "$0", label: "spent" },
    { value: "$28.4k", label: "annual run" },
    { value: "13.9:1", label: "best-case BCR" },
    { value: "0.14%", label: "of losses to break even" },
  ],
} as const;

/* ── 10. Decisions ────────────────────────────────────────────────────────── */

export const DECISIONS = {
  eyebrow: "Sections 16–18",
  title: { lead: "Four blocking decisions,", accent: "and a GO." },
  blocking: [
    { id: "OI-1", text: "Confirm the scope", from: "CyberSafe manager" },
    { id: "OI-3", text: "Confirm the purpose-limitation wording", from: "Manager + privacy officer" },
    { id: "OI-4", text: "Approve the twenty enhanced requirements", from: "Supervisor + stakeholders" },
    { id: "OI-11", text: "Hold the database ethics review", from: "Privacy officer" },
  ],
  others: [
    { id: "OI-2", text: "Technology deviations" },
    { id: "OI-5", text: "Hardware & software" },
    { id: "OI-6", text: "Parameters & retention" },
    { id: "OI-7", text: "Rule-set owner" },
    { id: "OI-8", text: "Module 9 reading" },
    { id: "OI-9", text: "Five added NFRs" },
    { id: "OI-10", text: "PostgreSQL, not MySQL" },
  ],
  feasibility: [
    { dimension: "Technical", verdict: "High confidence", tone: "good" },
    { dimension: "Economic", verdict: "Compelling", tone: "good" },
    { dimension: "Operational", verdict: "0.4 FTE reviewer", tone: "warn" },
    { dimension: "Legal", verdict: "Privacy sign-off", tone: "warn" },
    { dimension: "Schedule", verdict: "Tight", tone: "warn" },
    { dimension: "Ethical", verdict: "Migration first", tone: "warn" },
  ],
  verdict: { headline: "GO", qualifier: "subject to six conditions" },
  closing: "The design work that mattered was never the code.",
  next: "Next: the corrective migration, then the API client.",
} as const;
