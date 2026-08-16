import { SITE } from "@/config/site";

/**
 * Marketing copy for the landing page. Kept out of components so wording can be
 * reviewed and translated without touching layout code.
 *
 * Figures shown here are illustrative of the service, not live telemetry — the
 * console section labels them as such on screen.
 */

export interface RotatingLine {
  lead: string;
  emphasis: string;
}

export const HERO_LINES: RotatingLine[] = [
  { lead: "If it rushes you, it is probably", emphasis: "rushing you for a reason." },
  { lead: "Real organisations will wait.", emphasis: "Scammers cannot afford to." },
  { lead: "Nobody legitimate is paid in", emphasis: "gift cards." },
  { lead: "A familiar name on your screen", emphasis: "is not proof of anything." },
  { lead: "Check it before you send it.", emphasis: "Thirty seconds is enough." },
  { lead: "Reporting it early protects", emphasis: "the next person too." },
];

export interface DetectionStep {
  id: string;
  title: string;
  summary: string;
  icon: "clipboard" | "radar" | "gauge" | "handshake";
}

export const DETECTION_STEPS: DetectionStep[] = [
  {
    id: "submit",
    title: "Paste what you received",
    summary:
      "A text message, email, link, phone number or account name. Nothing is shared publicly and you do not need an account to check.",
    icon: "clipboard",
  },
  {
    id: "analyse",
    title: "We analyse the indicators",
    summary:
      "Wording patterns, link structure, domain age and lookalike spelling are checked against indicators already reported in Hume.",
    icon: "radar",
  },
  {
    id: "score",
    title: "You get a plain-English read",
    summary:
      "A risk band with the reasons behind it — every signal is listed so you can judge it yourself rather than take a number on trust.",
    icon: "gauge",
  },
  {
    id: "act",
    title: "Report it, or get help",
    summary:
      "Turn the check into a report in one step, attach evidence, and follow the recovery checklist for your situation.",
    icon: "handshake",
  },
];

export interface Capability {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  icon: "scan" | "link" | "shield" | "map" | "bell" | "life-buoy";
  accent: "indigo" | "cyan" | "emerald" | "amber" | "violet" | "rose";
}

export const CAPABILITIES: Capability[] = [
  {
    id: "message",
    eyebrow: "Content analysis",
    title: "Message and email checks",
    body: "Paste the message you received. Pressure tactics, payment demands and impersonation cues are highlighted line by line, with the reasoning shown next to each one.",
    icon: "scan",
    accent: "indigo",
  },
  {
    id: "indicators",
    eyebrow: "Indicator analysis",
    title: "Links, numbers and addresses",
    body: "URLs are validated and inspected for lookalike domains and redirect chains. Phone numbers and email addresses are matched against indicators from previously verified reports.",
    icon: "link",
    accent: "cyan",
  },
  {
    id: "report",
    eyebrow: "Reporting",
    title: "Reports Council can act on",
    body: "Save a draft, attach screenshots and receipts, and submit when you are ready. Every report gets a reference number you can use to track its status.",
    icon: "shield",
    accent: "emerald",
  },
  {
    id: "map",
    eyebrow: "Trends",
    title: "Scam map for Hume",
    body: "De-identified reports are aggregated by suburb so residents and local businesses can see which approaches are circulating near them this month.",
    icon: "map",
    accent: "violet",
  },
  {
    id: "alerts",
    eyebrow: "Community",
    title: "Verified alerts, not rumours",
    body: "Alerts are published only after review, with reporter details removed. Subscribe by scam category or by region and unsubscribe from any message.",
    icon: "bell",
    accent: "amber",
  },
  {
    id: "recovery",
    eyebrow: "Support",
    title: "Recovery guidance",
    body: "If money or credentials have already gone, follow a checklist ordered by urgency — bank contact, account lockdown, and the agencies that need to know.",
    icon: "life-buoy",
    accent: "rose",
  },
];

export type AlertSeverity = "high" | "medium" | "low";

export interface CommunityAlert {
  id: string;
  reference: string;
  category: string;
  headline: string;
  /**
   * The wording actually reported, quoted verbatim and de-identified.
   *
   * Recognising the phrasing is most of what protects someone, so the specimen
   * is the point of the card — the summary explains it, the specimen is what a
   * resident will recognise at 7am on a phone screen.
   */
  specimen: string;
  summary: string;
  suburb: string;
  channel: string;
  severity: AlertSeverity;
  publishedLabel: string;
}

export const COMMUNITY_ALERTS: CommunityAlert[] = [
  {
    id: "toll-sms",
    reference: "HCC-2408-114",
    category: "Impersonation",
    headline: "Fake toll notice demanding immediate payment",
    specimen:
      "LINKT: You have an unpaid toll of $4.20. Late fees apply within 24 hours. Settle now: linkt-au.pay-toll.online",
    summary:
      "SMS claiming an unpaid toll, linking to a payment page on a lookalike domain. The link is not a government address and the fee is invented.",
    suburb: "Broadmeadows",
    channel: "SMS",
    severity: "high",
    publishedLabel: "Reviewed today",
  },
  {
    id: "rates-refund",
    reference: "HCC-2408-108",
    category: "Council impersonation",
    headline: "\"Council rates refund\" email asking for bank details",
    specimen:
      "Hume City Council: our records show you overpaid your rates by $283.60. Reply with your BSB and account number to release the refund.",
    summary:
      "Council never asks for bank details by email to issue a refund. The sender address is a free mailbox styled to look official.",
    suburb: "Craigieburn",
    channel: "Email",
    severity: "high",
    publishedLabel: "Reviewed yesterday",
  },
  {
    id: "invoice-swap",
    reference: "HCC-2408-097",
    category: "Business email compromise",
    headline: "Supplier invoice with altered bank account",
    specimen:
      "Please note our banking details have changed as of this month. Kindly remit the outstanding $8,940 to the new account below.",
    summary:
      "Small businesses report invoices arriving from a real supplier thread with the payment account swapped. Confirm changes by phone using a known number.",
    suburb: "Campbellfield",
    channel: "Email",
    severity: "medium",
    publishedLabel: "Reviewed 3 days ago",
  },
  {
    id: "marketplace",
    reference: "HCC-2408-091",
    category: "Marketplace",
    headline: "Rental bond requested before inspection",
    specimen:
      "The property has a lot of interest. I can hold it for you today if you transfer the two-week bond before the inspection.",
    summary:
      "Listings copied from genuine agencies, with a deposit requested to \"hold\" the property before anyone has seen it in person.",
    suburb: "Sunbury",
    channel: "Social media",
    severity: "medium",
    publishedLabel: "Reviewed 5 days ago",
  },
  {
    id: "mygov-suspend",
    reference: "HCC-2408-086",
    category: "Government impersonation",
    headline: "myGov account \"suspended\" until identity is confirmed",
    specimen:
      "myGov: Your account has been suspended due to unusual activity. Verify your identity within 2 hours to avoid permanent closure.",
    summary:
      "myGov does not suspend accounts by SMS or ask you to verify through a link. Reach the service by typing the address in yourself.",
    suburb: "Meadow Heights",
    channel: "SMS",
    severity: "high",
    publishedLabel: "Reviewed 2 days ago",
  },
  {
    id: "parcel-redelivery",
    reference: "HCC-2408-079",
    category: "Delivery impersonation",
    headline: "Parcel redelivery fee for a parcel nobody ordered",
    specimen:
      "AusPost: Your parcel is on hold at our depot. A $1.99 redelivery fee is required to release it. Pay here: auspost-redeliver.info",
    summary:
      "A token fee makes the request feel harmless — the amount is bait to capture card details, not the reason for the message.",
    suburb: "Roxburgh Park",
    channel: "SMS",
    severity: "medium",
    publishedLabel: "Reviewed 4 days ago",
  },
  {
    id: "energy-rebate",
    reference: "HCC-2408-072",
    category: "Rebate scam",
    headline: "Energy relief rebate that asks for a card to \"deposit\" it",
    specimen:
      "You are eligible for the $250 Energy Relief Payment. Enter your card details so the rebate can be deposited into your account.",
    summary:
      "A genuine rebate is applied to your bill or paid to an account you already hold. Nothing legitimate needs a card number to send you money.",
    suburb: "Craigieburn",
    channel: "Email",
    severity: "medium",
    publishedLabel: "Reviewed 6 days ago",
  },
  {
    id: "tech-support",
    reference: "HCC-2408-065",
    category: "Remote access",
    headline: "Caller claiming your internet has been compromised",
    specimen:
      "We have detected malicious traffic from your NBN connection. Install our support tool so a technician can secure the line remotely.",
    summary:
      "No provider asks to install remote-access software over an unsolicited call. Hang up and call the number on your own bill.",
    suburb: "Gladstone Park",
    channel: "Phone",
    severity: "high",
    publishedLabel: "Reviewed last week",
  },
];

/* The awareness guides previewed by the `Learn` section live in
   `content/learn`, where the card summary and the page body are one record. */

export const TRUST_POINTS: { title: string; body: string }[] = [
  {
    title: "Guidance, not certification",
    body: "Results are based on the information you provide and offer general guidance. They are not a professional cybersecurity assessment and do not guarantee protection from scams or cyberattacks.",
  },
  {
    title: "Every score is explained",
    body: "You always see which indicators contributed to a result and how confident the analysis is, so you can disagree with it. Reports are reviewed by people before any alert is published.",
  },
  {
    title: "The minimum personal data",
    body: "We collect only what a report needs. Alerts are published with reporter details removed, evidence access is restricted and logged, and you can request account deletion at any time.",
  },
  {
    title: "Fair to every organisation",
    body: "Scoring does not penalise an organisation for its size, industry or budget. Serious incidents are referred to qualified professionals and the relevant authorities.",
  },
];

export const IMPACT_STATS: { value: string; label: string; caption: string }[] = [
  { value: SITE.residents, label: "residents served", caption: "across Hume City Council" },
  { value: "14", label: "service modules", caption: "from checking to recovery" },
  { value: "24/7", label: "self-service checks", caption: "no appointment needed" },
  { value: "3 min", label: "median report time", caption: "target for a complete report" },
];
