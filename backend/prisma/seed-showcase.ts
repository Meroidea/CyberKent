import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { AlertStatus, Channel, IndicatorType, NoticeTone, ReportStatus, Role, Severity, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

/**
 * A lived-in Council workspace for demonstrations: a staffed team, six months
 * of reports shaped into campaigns, published and pending alerts, a working
 * task board, subscribers, checker traffic, guides and an activity trail —
 * enough for every admin screen (radar, analytics, team, tasks, content) to
 * show what it is for.
 *
 *   npm run db:seed            # reference data
 *   npm run db:seed:showcase   # then this
 *
 * Everything is invented (ER-12): people use the reserved `.test` domain,
 * phone numbers sit in ACMA's fictional 0491 570 range, links are on reserved
 * or obviously fake hosts. The generator is seeded, and the run is keyed on a
 * marker, so running it twice adds nothing the second time. Staff accounts get
 * unusable passwords — an administrator can send any of them an invitation.
 */

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = rng(20260925);
const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)]!;
const chance = (p: number) => random() < p;
const between = (lo: number, hi: number) => lo + random() * (hi - lo);
function weighted<T>(entries: readonly (readonly [T, number])[]): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [value, w] of entries) if ((roll -= w) < 0) return value;
  return entries[entries.length - 1]![0];
}

const MARKER = "HCC-DEMO-9000";

/* ─── Council staff ─────────────────────────────────────────────────────── */

const STAFF: { email: string; fullName: string; role: Role; department: string; jobTitle: string; phone: string; activeDaysAgo: number | null }[] = [
  { email: "priya.raman@hume.cyberkent.test", fullName: "Priya Raman", role: "ADMIN", department: "CyberSafe Services", jobTitle: "CyberSafe Program Lead", phone: "0491 570 301", activeDaysAgo: 0 },
  { email: "daniel.okafor@hume.cyberkent.test", fullName: "Daniel Okafor", role: "ADMIN", department: "Community Safety", jobTitle: "Community Safety Manager", phone: "0491 570 302", activeDaysAgo: 1 },
  { email: "sophie.tran@hume.cyberkent.test", fullName: "Sophie Tran", role: "OFFICER", department: "CyberSafe Services", jobTitle: "Scam Response Officer", phone: "0491 570 303", activeDaysAgo: 0 },
  { email: "mustafa.yildiz@hume.cyberkent.test", fullName: "Mustafa Yildiz", role: "OFFICER", department: "CyberSafe Services", jobTitle: "Scam Response Officer", phone: "0491 570 304", activeDaysAgo: 0 },
  { email: "hannah.mckenzie@hume.cyberkent.test", fullName: "Hannah McKenzie", role: "OFFICER", department: "Customer Service", jobTitle: "Customer Service Team Leader", phone: "0491 570 305", activeDaysAgo: 2 },
  { email: "arjun.mehta@hume.cyberkent.test", fullName: "Arjun Mehta", role: "OFFICER", department: "Communications", jobTitle: "Digital Communications Advisor", phone: "0491 570 306", activeDaysAgo: 1 },
  { email: "grace.liu@hume.cyberkent.test", fullName: "Grace Liu", role: "OFFICER", department: "Economic Development", jobTitle: "Small Business Liaison", phone: "0491 570 307", activeDaysAgo: 4 },
  { email: "tom.whitaker@hume.cyberkent.test", fullName: "Tom Whitaker", role: "OFFICER", department: "Libraries and Community Hubs", jobTitle: "Digital Literacy Coordinator", phone: "0491 570 308", activeDaysAgo: 6 },
  { email: "amira.haddad@hume.cyberkent.test", fullName: "Amira Haddad", role: "OFFICER", department: "Customer Service", jobTitle: "Customer Service Officer", phone: "0491 570 309", activeDaysAgo: null },
];

/* ─── Campaigns: how scams arrive in Hume, and when ────────────────────── */

type Artefact = { type: IndicatorType; value: string };

interface Campaign {
  key: string;
  category: string;
  channels: Channel[];
  artefacts: Artefact[];
  /** Reports in the run, and where in the last 180 days they fall. */
  count: number;
  window: [number, number];
  /** >1 bunches reports toward the recent end of the window — a surge. */
  surge: number;
  loss?: [number, number];
  lossRate?: number;
  business?: boolean;
  variants: { title: string; description: string }[];
}

const CAMPAIGNS: Campaign[] = [
  {
    key: "rates",
    category: "government-impersonation",
    channels: ["SMS", "EMAIL"],
    artefacts: [{ type: "DOMAIN", value: "hume-rates-payment.info" }, { type: "PHONE", value: "0491570188" }],
    count: 26, window: [0, 13], surge: 2.2, loss: [180, 2400], lossRate: 0.25,
    variants: [
      { title: "Text says my Council rates are overdue", description: "A text claiming to be from Hume City Council said my rates instalment was overdue and a $95 penalty would apply today unless I paid through the link. The link went to hume-rates-payment.info, not the Council website." },
      { title: "Email with a 'final rates notice' and a payment link", description: "Got an email with the Council logo saying final notice, rates unpaid, legal action in 48 hours. It asked me to pay by card on hume-rates-payment.info. My rates are paid by direct debit." },
      { title: "Paid fake Council rates notice", description: "I paid $1,240 through a link in a text about my rates, thinking it was the Council. My bank later flagged it as fraud. The text came from a mobile number, 0491 570 188." },
      { title: "Caller said he was from the Council rates team", description: "A man rang from 0491 570 188 saying he was from the Council rates team and I owed arrears. He wanted payment by bank transfer immediately. I hung up and called the Council's real number." },
    ],
  },
  {
    key: "toll",
    category: "toll-and-fines",
    channels: ["SMS"],
    artefacts: [{ type: "DOMAIN", value: "linkt-payment-au.top" }],
    count: 24, window: [0, 60], surge: 1.8, loss: [90, 900], lossRate: 0.2,
    variants: [
      { title: "Unpaid toll text with a link", description: "A text said I had an unpaid Linkt toll of $4.27 and a $180 fine would apply if not paid today. The link went to linkt-payment-au.top. I don't use toll roads much." },
      { title: "Paid a fake toll notice", description: "I paid a small toll amount through a text link. The same night there were three transactions overseas on my card. I've cancelled it with my bank." },
      { title: "Toll text sent to my elderly father", description: "My dad in Broadmeadows got a text about an overdue toll and nearly paid it. The site looked exactly like Linkt. Reporting so others are warned." },
    ],
  },
  {
    key: "energy",
    category: "government-impersonation",
    channels: ["SMS", "EMAIL", "SOCIAL"],
    artefacts: [{ type: "DOMAIN", value: "energy-bill-relief-vic.info" }],
    count: 14, window: [0, 30], surge: 1.4, loss: [50, 600], lossRate: 0.15,
    variants: [
      { title: "Message offering a $250 energy bill rebate", description: "A message said I was eligible for a $250 Victorian energy bill relief payment and needed to confirm my bank details at energy-bill-relief-vic.info." },
      { title: "Facebook ad for energy rebate asked for my licence", description: "Clicked a Facebook ad about an energy rebate. The form asked for my driver licence number and Medicare card to 'verify eligibility'. I stopped before submitting." },
    ],
  },
  {
    key: "jobs",
    category: "jobs",
    channels: ["SOCIAL", "SMS"],
    artefacts: [{ type: "PHONE", value: "0491570177" }],
    count: 16, window: [0, 45], surge: 1.9, loss: [300, 6500], lossRate: 0.45,
    variants: [
      { title: "WhatsApp job paying to 'rate hotels'", description: "Someone on WhatsApp (0491 570 177) offered me remote work rating hotels for $400 a day. After a few small payouts they asked me to deposit my own money to unlock 'premium tasks'. I deposited $2,000 and cannot withdraw it." },
      { title: "Job offer text from a recruiter I never contacted", description: "A text from a 'recruiter' offered part-time online work, $50–$800 a day, and moved me to WhatsApp. It is the task scam I read about. I blocked the number." },
      { title: "Task job asked for crypto top-ups", description: "The job was clicking 'optimise' on products in an app. Each level needed a larger top-up in USDT. I've lost my savings. Their number was 0491 570 177." },
    ],
  },
  {
    key: "parcel",
    category: "parcel-delivery",
    channels: ["SMS"],
    artefacts: [{ type: "URL", value: "https://auspost-redelivery.help/track" }],
    count: 14, window: [0, 170], surge: 1, loss: [3, 150], lossRate: 0.12,
    variants: [
      { title: "Missed delivery text asking for a redelivery fee", description: "A text said Australia Post could not deliver my parcel and asked for a $2.99 redelivery fee via auspost-redelivery.help. I'm not expecting anything." },
      { title: "Parcel text on the day I was expecting a delivery", description: "The timing made it convincing. I entered my card details for the $3 fee before realising. I called my bank straight away." },
    ],
  },
  {
    key: "mygov",
    category: "government-impersonation",
    channels: ["SMS", "EMAIL"],
    artefacts: [{ type: "DOMAIN", value: "mygov-refund-portal.info" }],
    count: 10, window: [20, 150], surge: 1,
    variants: [
      { title: "myGov refund email", description: "An email said I had a tax refund of $1,186.40 waiting and needed to sign in to myGov through a link to mygov-refund-portal.info. The real myGov never sends links like this." },
      { title: "myGov text asking me to update my details", description: "A text said my myGov account would be suspended unless I updated my details. The link went to a fake sign-in page." },
    ],
  },
  {
    key: "bank",
    category: "bank-impersonation",
    channels: ["PHONE", "SMS"],
    artefacts: [{ type: "PHONE", value: "0491570156" }],
    count: 14, window: [0, 120], surge: 1.2, loss: [800, 14000], lossRate: 0.4,
    variants: [
      { title: "Caller from my 'bank's fraud team'", description: "A caller said my account was compromised and I needed to move my savings to a 'safe account'. The number on caller ID looked like my bank. I transferred $4,800 before realising." },
      { title: "Text about a suspicious payment, then a call", description: "A text said a payment of $1,499 was pending and to call if it wasn't me. When I called, they asked for the code sent to my phone. I gave it and my account was emptied." },
    ],
  },
  {
    key: "himum",
    category: "family-impersonation",
    channels: ["SMS", "SOCIAL"],
    artefacts: [{ type: "PHONE", value: "0491570110" }],
    count: 11, window: [0, 150], surge: 1, loss: [400, 3800], lossRate: 0.35,
    variants: [
      { title: "'Hi Mum' text from a new number", description: "A text said 'Hi Mum, I dropped my phone, this is my new number' and then asked me to pay a bill for them urgently. My son's phone was fine." },
      { title: "Paid a bill for my 'daughter'", description: "They said they were my daughter and couldn't access their banking app. I paid $1,650 to an account for a 'rent bill' before I rang her old number." },
    ],
  },
  {
    key: "marketplace",
    category: "online-shopping",
    channels: ["SOCIAL", "WEBSITE"],
    artefacts: [],
    count: 12, window: [0, 170], surge: 1, loss: [60, 1400], lossRate: 0.7,
    variants: [
      { title: "Marketplace seller took a deposit and vanished", description: "I paid a $300 deposit for a fridge on Marketplace. The seller said they were away and would deliver. They then blocked me." },
      { title: "Fake online store for cheap power tools", description: "Bought power tools from a site with prices far below Bunnings. Nothing arrived and the site has gone." },
    ],
  },
  {
    key: "crypto",
    category: "investment",
    channels: ["SOCIAL", "WEBSITE"],
    artefacts: [{ type: "DOMAIN", value: "aussie-crypto-yield.test" }],
    count: 7, window: [40, 175], surge: 1, loss: [2000, 48000], lossRate: 0.8,
    variants: [
      { title: "Investment platform shows profits but won't pay out", description: "I invested through aussie-crypto-yield after seeing an ad with a celebrity. The dashboard shows big returns but withdrawals need a 'tax' payment first." },
    ],
  },
  {
    key: "invoice",
    category: "payment-redirection",
    channels: ["EMAIL"],
    artefacts: [{ type: "EMAIL", value: "accounts@hume-supplies-billing.test" }],
    count: 7, window: [5, 160], surge: 1, loss: [1500, 26000], lossRate: 0.6, business: true,
    variants: [
      { title: "Supplier invoice with changed bank details", description: "We received an invoice from what looked like our regular supplier saying their bank details had changed. We paid it. The supplier never sent it." },
    ],
  },
  {
    key: "tech",
    category: "remote-access",
    channels: ["PHONE", "WEBSITE"],
    artefacts: [{ type: "PHONE", value: "0491570006" }],
    count: 7, window: [10, 170], surge: 1, loss: [150, 3000], lossRate: 0.4,
    variants: [
      { title: "Pop-up said my computer was infected", description: "A pop-up with a siren said my computer was locked and to call 0491 570 006. They asked to install remote access software and then logged into my banking." },
    ],
  },
  {
    key: "romance",
    category: "romance",
    channels: ["SOCIAL"],
    artefacts: [],
    count: 4, window: [15, 175], surge: 1, loss: [5000, 62000], lossRate: 0.9,
    variants: [
      { title: "Online relationship asking for money", description: "I met someone on a dating app who says he's working on an oil rig overseas. After months of talking he needed money for customs fees. I've sent a lot." },
    ],
  },
  {
    key: "phishing",
    category: "phishing",
    channels: ["EMAIL"],
    artefacts: [{ type: "EMAIL", value: "security@streaming-account-verify.test" }],
    count: 8, window: [0, 170], surge: 1,
    variants: [
      { title: "Streaming service 'payment failed' email", description: "An email said my streaming subscription payment failed and to update my card details via a link. The sender was security@streaming-account-verify.test." },
    ],
  },
  {
    key: "prize",
    category: "prize-and-lottery",
    channels: ["PHONE", "SMS"],
    artefacts: [],
    count: 3, window: [30, 170], surge: 1,
    variants: [{ title: "Told I'd won a car in a shopping centre draw", description: "A caller said I'd won a car in a Broadmeadows shopping centre draw but had to pay a $400 'release fee' by gift cards." }],
  },
  {
    key: "identity",
    category: "identity-theft",
    channels: ["OTHER", "EMAIL"],
    artefacts: [],
    count: 3, window: [10, 170], surge: 1,
    variants: [{ title: "Someone opened a phone account in my name", description: "I received a bill for a phone plan I never opened. I think my licence details were taken in a data breach." }],
  },
];

/* Bigger suburbs report more. */
const SUBURB_WEIGHT: Record<string, number> = {
  Craigieburn: 10, "Roxburgh Park": 7, Broadmeadows: 7, Sunbury: 8, Mickleham: 6, Greenvale: 5, "Meadow Heights": 4, Kalkallo: 3, Donnybrook: 3,
  Coolaroo: 3, "Gladstone Park": 3, Westmeadows: 3, Campbellfield: 2, Dallas: 3, Tullamarine: 2, Jacana: 1.5, Attwood: 1.5, Somerton: 1,
  Bulla: 0.6, Yuroke: 0.6, "Oaklands Junction": 0.4, Wildwood: 0.3, "Melbourne Airport": 0.2,
};

const FIRST = ["Aaliyah", "Bilal", "Chloe", "Dimitri", "Esra", "Fatima", "George", "Hoang", "Ibrahim", "Jasmine", "Kirra", "Luca", "Maryam", "Nikhil", "Olivia", "Pedro", "Quynh", "Rahul", "Samira", "Tariq", "Uma", "Vikram", "Wei", "Yusuf", "Zara", "Ahmed", "Bella", "Connor", "Deepa", "Elias"];
const LAST = ["Abdullah", "Bui", "Costa", "Demir", "Evans", "Fernando", "Gill", "Hussain", "Ioannou", "Jovanovic", "Khan", "Le", "Murphy", "Nasser", "O'Brien", "Patel", "Quach", "Russo", "Sharma", "Toma"];

/** A time of day residents actually report at: evenings and lunchtimes, fewer overnight. */
function reportHour(): number {
  return weighted([[7, 2], [8, 4], [9, 5], [10, 5], [11, 5], [12, 7], [13, 6], [14, 5], [15, 5], [16, 5], [17, 6], [18, 8], [19, 9], [20, 9], [21, 7], [22, 4], [23, 2], [0, 1], [1, 0.5], [6, 1]] as const);
}

function melbourneAt(daysAgo: number, hour: number): Date {
  /* AEST is UTC+10; close enough for a heatmap, and it keeps the seed free of timezone libraries. */
  const now = Date.now();
  const day = new Date(now - daysAgo * DAY);
  const utc = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour - 10, Math.floor(random() * 60));
  return new Date(Math.min(utc, now - 5 * 60_000));
}

function settle(ageDays: number): ReportStatus {
  if (ageDays < 1) return weighted([["SUBMITTED", 8], ["UNDER_REVIEW", 2]] as const);
  if (ageDays < 4) return weighted([["SUBMITTED", 4], ["UNDER_REVIEW", 4], ["INFORMATION_REQUESTED", 1.5], ["APPROVED", 2], ["REJECTED", 0.4], ["WITHDRAWN", 0.3]] as const);
  if (ageDays < 15) return weighted([["SUBMITTED", 1], ["UNDER_REVIEW", 2.5], ["INFORMATION_REQUESTED", 1], ["APPROVED", 5], ["REJECTED", 1], ["WITHDRAWN", 0.5]] as const);
  return weighted([["UNDER_REVIEW", 0.3], ["APPROVED", 7], ["REJECTED", 1.8], ["WITHDRAWN", 0.6]] as const);
}

async function main() {
  if (await prisma.report.count({ where: { reference: MARKER } })) {
    console.log("Showcase data is already present — nothing added.");
    return;
  }

  const categories = new Map((await prisma.scamCategory.findMany({ select: { id: true, slug: true } })).map((row) => [row.slug, row.id]));
  const suburbs = await prisma.suburb.findMany({ select: { id: true, name: true } });
  if (categories.size === 0 || suburbs.length === 0) throw new Error("Run `npm run db:seed` first — the showcase needs categories and suburbs.");
  const suburbPool = suburbs.map((s) => [s, SUBURB_WEIGHT[s.name] ?? 1] as const);

  const root = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN", deletedAt: null }, orderBy: { createdAt: "asc" } });
  const unusable = await bcrypt.hash(crypto.randomBytes(24).toString("base64url"), 12);
  const now = Date.now();

  /* Staff */
  const staff: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
  for (const person of STAFF) {
    const lastLoginAt = person.activeDaysAgo === null ? null : new Date(now - person.activeDaysAgo * DAY - between(1, 8) * HOUR);
    const user = await prisma.user.create({
      data: {
        email: person.email, fullName: person.fullName, role: person.role, department: person.department, jobTitle: person.jobTitle,
        organisation: "Hume City Council", phone: person.phone, passwordHash: unusable, emailVerified: person.activeDaysAgo === null ? null : new Date(now - 90 * DAY),
        lastLoginAt, createdAt: new Date(now - between(60, 200) * DAY), notificationPrefs: { create: {} },
      },
    });
    staff.push(user);
    if (person.activeDaysAgo === null) {
      /* Invited yesterday, not yet signed up: the directory shows "invited". */
      await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: crypto.createHash("sha256").update(crypto.randomBytes(32)).digest("hex"), expiresAt: new Date(now + 6 * DAY), createdAt: new Date(now - DAY) } });
      if (root) await prisma.auditLog.create({ data: { userId: root.id, action: "user.invited", entityType: "User", entityId: user.id, metadata: { role: user.role, emailSent: true }, createdAt: new Date(now - DAY) } });
    }
  }
  const byEmail = (email: string) => staff.find((s) => s.email === email)!;
  const priya = byEmail("priya.raman@hume.cyberkent.test");
  const daniel = byEmail("daniel.okafor@hume.cyberkent.test");
  const sophie = byEmail("sophie.tran@hume.cyberkent.test");
  const mustafa = byEmail("mustafa.yildiz@hume.cyberkent.test");
  const hannah = byEmail("hannah.mckenzie@hume.cyberkent.test");
  const arjun = byEmail("arjun.mehta@hume.cyberkent.test");
  const grace = byEmail("grace.liu@hume.cyberkent.test");
  const tom = byEmail("tom.whitaker@hume.cyberkent.test");
  const reviewers = [[sophie, 5], [mustafa, 5], [hannah, 2], [priya, 1.5]] as const;

  /* Residents */
  const residents: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
  for (let i = 0; i < 48; i += 1) {
    const first = FIRST[i % FIRST.length]!;
    const last = LAST[(i * 7) % LAST.length]!;
    const business = i % 8 === 7;
    residents.push(
      await prisma.user.create({
        data: {
          email: `${first}.${last.replace(/'/g, "")}.${100 + i}`.toLowerCase() + "@residents.cyberkent.test",
          fullName: `${first} ${last}`,
          role: business ? "BUSINESS" : "RESIDENT",
          organisation: business ? pick(["Craigieburn Physio", "Sunbury Hardware Co.", "Broadmeadows Auto Care", "Mickleham Early Learning", "Hume Community Foodbank Inc."]) : null,
          phone: `0491 570 ${String(400 + i).padStart(3, "0")}`,
          passwordHash: unusable,
          emailVerified: chance(0.92) ? new Date(now - between(5, 170) * DAY) : null,
          lastLoginAt: new Date(now - between(0, 60) * DAY),
          createdAt: new Date(now - between(10, 200) * DAY),
          notificationPrefs: { create: {} },
        },
      }),
    );
  }
  const businesses = residents.filter((r) => r.role === "BUSINESS");

  /* Reports */
  const byCampaign = new Map<string, { id: string; reference: string; status: ReportStatus; submittedAt: Date; suburbId: string | null; amount: number | null; title: string }[]>();
  let n = 0;
  for (const campaign of CAMPAIGNS) {
    const list: NonNullable<ReturnType<typeof byCampaign.get>> = [];
    byCampaign.set(campaign.key, list);
    const indicators = [];
    for (const artefact of campaign.artefacts) {
      indicators.push(
        await prisma.indicator.upsert({
          where: { type_value: artefact },
          create: { ...artefact, reportCount: 0, firstSeenAt: new Date(now - campaign.window[1] * DAY), lastSeenAt: new Date(now - campaign.window[0] * DAY) },
          update: {},
        }),
      );
    }

    for (let k = 0; k < campaign.count; k += 1) {
      const reference = `HCC-DEMO-${9000 + n}`;
      n += 1;
      const [lo, hi] = campaign.window;
      const ageDays = lo + Math.pow(random(), campaign.surge) * (hi - lo);
      const submittedAt = melbourneAt(ageDays, reportHour());
      const variant = pick(campaign.variants);
      const state = settle(ageDays);
      const decided = state === "APPROVED" || state === "REJECTED";
      const touched = state !== "SUBMITTED" && state !== "WITHDRAWN";
      const reviewer = touched ? weighted(reviewers) : state === "SUBMITTED" && chance(0.2) ? weighted(reviewers) : null;
      const lost = campaign.loss && chance(campaign.lossRate ?? 0) ? Math.round(between(campaign.loss[0], campaign.loss[1])) : null;
      const severity: Severity | null = decided || (touched && chance(0.6)) ? (lost ? "HIGH" : pick(["MEDIUM", "MEDIUM", "LOW"] as const)) : null;
      const suburb = chance(0.93) ? weighted(suburbPool) : null;
      const author = campaign.business ? pick(businesses) : pick(residents);
      const firstTouch = new Date(Math.min(now - 30 * 60_000, submittedAt.getTime() + between(1, 30) * HOUR));
      const decisionAt = new Date(Math.min(now - 10 * 60_000, firstTouch.getTime() + between(2, 60) * HOUR));

      const report = await prisma.report.create({
        data: {
          reference, authorId: author.id, categoryId: categories.get(campaign.category) ?? null, suburbId: suburb?.id ?? null,
          channel: pick(campaign.channels), status: state, severity, title: variant.title, description: variant.description,
          amountLostCents: lost === null ? null : lost * 100, occurredAt: new Date(submittedAt.getTime() - Math.floor(random() * 2) * DAY),
          submittedAt, createdAt: submittedAt, updatedAt: decided ? decisionAt : touched ? firstTouch : submittedAt,
          withdrawnAt: state === "WITHDRAWN" ? new Date(submittedAt.getTime() + between(2, 30) * HOUR) : null, reviewerId: reviewer?.id ?? null,
        },
      });
      list.push({ id: report.id, reference, status: state, submittedAt, suburbId: report.suburbId, amount: lost, title: variant.title });

      for (const indicator of indicators) {
        if (indicators.length > 1 && chance(0.35)) continue;
        await prisma.reportIndicator.create({ data: { reportId: report.id, indicatorId: indicator.id } });
      }

      await prisma.auditLog.create({ data: { userId: author.id, action: "report.submitted", entityType: "Report", entityId: report.id, metadata: { synthetic: true }, createdAt: submittedAt } });
      if (touched && reviewer) {
        await prisma.reportReview.create({ data: { reportId: report.id, reviewerId: reviewer.id, decision: "UNDER_REVIEW", createdAt: firstTouch } });
        await prisma.auditLog.create({ data: { userId: reviewer.id, action: "report.review_started", entityType: "Report", entityId: report.id, createdAt: firstTouch } });
      }
      if (reviewer && (state === "INFORMATION_REQUESTED" || (decided && chance(0.25)))) {
        const answered = state !== "INFORMATION_REQUESTED";
        await prisma.reportReview.create({ data: { reportId: report.id, reviewerId: reviewer.id, decision: "INFORMATION_REQUESTED", createdAt: firstTouch } });
        await prisma.informationRequest.create({
          data: {
            reportId: report.id, requestedById: reviewer.id,
            message: pick([
              "Could you send a screenshot of the message, including the sender's number or address?",
              "Do you still have the link or the website address? Please don't open it again — just copy it from the message.",
              "Which bank did you pay from, and have you already reported this to them?",
            ]),
            response: answered ? pick(["Screenshot attached — it came from a mobile number.", "Yes, I've called my bank and they've frozen the card.", "The link was in the text, I've copied it into the report."]) : null,
            respondedAt: answered ? new Date(firstTouch.getTime() + between(1, 12) * HOUR) : null,
            createdAt: firstTouch,
          },
        });
        await prisma.auditLog.create({ data: { userId: reviewer.id, action: "report.information_requested", entityType: "Report", entityId: report.id, createdAt: firstTouch } });
      }
      if (decided && reviewer) {
        await prisma.reportReview.create({
          data: {
            reportId: report.id, reviewerId: reviewer.id, decision: state, severity,
            notes: state === "APPROVED" ? `Matches the active ${campaign.key} campaign seen across Hume; artefacts confirmed against other reports.` : "Not enough detail to confirm a scam; resident advised to contact their bank and ReportCyber.",
            createdAt: decisionAt,
          },
        });
        await prisma.auditLog.create({ data: { userId: reviewer.id, action: state === "APPROVED" ? "report.approved" : "report.rejected", entityType: "Report", entityId: report.id, createdAt: decisionAt } });
      }
    }

    /* Link reports of one campaign the way the duplicate detector does. */
    for (let i = 1; i < list.length; i += 1) {
      if (!chance(0.35)) continue;
      const source = list[i]!;
      const target = list[Math.floor(random() * i)]!;
      await prisma.reportRelation.create({ data: { sourceId: source.id, targetId: target.id, kind: chance(0.3) ? "DUPLICATE" : "RELATED", similarity: Number(between(0.62, 0.97).toFixed(2)), createdAt: source.submittedAt } });
    }
  }

  /* Indicator counts and verification follow from the reports. */
  for (const indicator of await prisma.indicator.findMany({ select: { id: true, value: true } })) {
    const links = await prisma.reportIndicator.findMany({ where: { indicatorId: indicator.id }, select: { report: { select: { submittedAt: true } } } });
    const times = links.map((l) => l.report.submittedAt?.getTime() ?? now);
    if (!times.length) continue;
    const verified = ["hume-rates-payment.info", "linkt-payment-au.top", "0491570156", "0491570110"].includes(indicator.value);
    await prisma.indicator.update({
      where: { id: indicator.id },
      data: { reportCount: links.length, firstSeenAt: new Date(Math.min(...times)), lastSeenAt: new Date(Math.max(...times)), ...(verified ? { verificationStatus: "VERIFIED", confidence: 0.95 } : {}) },
    });
  }

  /* Alerts: what Council has told residents, and what is still in the pipeline. */
  const period = (d: Date) => `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const alerts: { key: string; status: AlertStatus; severity: Severity; channel: Channel; headline: string; summary: string; specimen: string; daysAgo: number; suburb?: string }[] = [
    { key: "rates", status: "PUBLISHED", severity: "HIGH", channel: "SMS", daysAgo: 6, suburb: "Craigieburn", headline: "Fake Hume City Council rates notices are circulating", summary: "Texts and emails claim your rates are overdue and ask you to pay through a link. Council never sends payment links by text. Pay only through the Council website or your rates notice, and call Council on the number on our website if unsure.", specimen: "HUME CITY COUNCIL: Your rates instalment is overdue. A $95 penalty applies today. Pay now: hume-rates-payment[.]info" },
    { key: "toll", status: "PUBLISHED", severity: "HIGH", channel: "SMS", daysAgo: 19, headline: "Toll texts asking for small payments are a scam", summary: "Texts about unpaid tolls with a link to pay are circulating across Hume. Linkt does not send payment links by text. Check your account through the official app or website.", specimen: "Linkt: You have an unpaid toll of $4.27. Pay by today to avoid a $180 fee: linkt-payment-au[.]top" },
    { key: "energy", status: "PUBLISHED", severity: "MEDIUM", channel: "SOCIAL", daysAgo: 11, headline: "There is no $250 energy rebate you have to 'claim' through a link", summary: "Messages and social media ads offer energy bill relief in return for your bank or identity details. Government rebates are applied automatically or through official .gov.au sites.", specimen: "You're eligible for $250 Energy Bill Relief. Confirm your bank details within 24 hours: energy-bill-relief-vic[.]info" },
    { key: "bank", status: "PUBLISHED", severity: "HIGH", channel: "PHONE", daysAgo: 34, headline: "Your bank will never ask you to move money to a 'safe account'", summary: "Callers pretending to be bank fraud teams are asking Hume residents to transfer savings or read out security codes. Hang up and call your bank on the number on your card.", specimen: "This is the fraud team. Your account has been compromised; we need to move your funds to a secure account now." },
    { key: "himum", status: "PUBLISHED", severity: "MEDIUM", channel: "SMS", daysAgo: 52, headline: "'Hi Mum' messages from new numbers", summary: "Scammers pose as your child on a new number and ask for money urgently. Call your family member on the number you already have before paying anything.", specimen: "Hi Mum, I dropped my phone in the toilet, this is my new number. Can you help me pay a bill today?" },
    { key: "marketplace", status: "PENDING_APPROVAL", severity: "MEDIUM", channel: "SOCIAL", daysAgo: 1, headline: "Marketplace sellers asking for deposits before you see the item", summary: "Several Hume residents paid deposits for furniture and appliances that never arrived. Only pay in person when you collect the item.", specimen: "I'm away for work, pay a $300 deposit and I'll have it couriered to you tomorrow." },
    { key: "parcel", status: "DRAFT", severity: "LOW", channel: "SMS", daysAgo: 0, headline: "Redelivery fee texts are not from Australia Post", summary: "Texts ask for a small redelivery fee through a link. Australia Post does not charge redelivery fees by text.", specimen: "AusPost: We could not deliver your parcel. Pay $2.99 to rebook: auspost-redelivery[.]help" },
    { key: "crypto", status: "ARCHIVED", severity: "HIGH", channel: "SOCIAL", daysAgo: 120, headline: "Celebrity crypto ads lead to fake investment platforms", summary: "Ads using well-known faces promote platforms that show fake profits and demand fees to withdraw.", specimen: "Turn $250 into $6,000 a month — the platform everyone is talking about." },
  ];
  for (const alert of alerts) {
    const at = new Date(now - alert.daysAgo * DAY - between(2, 8) * HOUR);
    const source = byCampaign.get(alert.key)?.find((r) => r.status === "APPROVED");
    const published = alert.status === "PUBLISHED" || alert.status === "ARCHIVED";
    const row = await prisma.alert.create({
      data: {
        reference: `HCA-${period(at)}-${crypto.randomInt(1000, 10_000)}`, sourceReportId: alert.status === "PUBLISHED" || alert.status === "ARCHIVED" ? null : (source?.id ?? null),
        categoryId: categories.get(CAMPAIGNS.find((c) => c.key === alert.key)!.category) ?? null, suburbId: alert.suburb ? (suburbs.find((s) => s.name === alert.suburb)?.id ?? null) : null,
        channel: alert.channel, status: alert.status, severity: alert.severity, headline: alert.headline, summary: alert.summary, specimen: alert.specimen,
        authorId: pick([sophie, mustafa, arjun]).id, approvedById: published ? pick([priya, daniel]).id : null,
        publishedAt: published ? at : null, archivedAt: alert.status === "ARCHIVED" ? new Date(now - 60 * DAY) : null, createdAt: new Date(at.getTime() - 5 * HOUR), updatedAt: at,
      },
    });
    if (published) await prisma.auditLog.create({ data: { userId: row.approvedById, action: "alert.published", entityType: "Alert", entityId: row.id, createdAt: at } });
    if (alert.status === "PENDING_APPROVAL") await prisma.auditLog.create({ data: { userId: row.authorId, action: "alert.submitted", entityType: "Alert", entityId: row.id, createdAt: at } });
  }

  /* Tasks */
  const pickReport = (key: string, status?: ReportStatus) => byCampaign.get(key)?.find((r) => !status || r.status === status) ?? null;
  const biggestBankLoss = [...(byCampaign.get("bank") ?? [])].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0] ?? null;
  const unassignedNew = [...byCampaign.values()].flat().filter((r) => r.status === "SUBMITTED").sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()).slice(0, 3);
  const TASKS: { title: string; description?: string; status: TaskStatus; priority: TaskPriority; assignee: { id: string } | null; creator: { id: string } | null; dueInDays?: number; createdDaysAgo: number; labels: string[]; report?: { id: string } | null; comments?: [{ id: string } | null, string][] }[] = [
    { title: "Ask the registrar to take down hume-rates-payment.info", description: "Domain is impersonating Council. Abuse report lodged with the registrar and with Scamwatch; waiting for their response before escalating to the hosting provider.", status: "BLOCKED", priority: "URGENT", assignee: priya, creator: daniel, dueInDays: 1, createdDaysAgo: 5, labels: ["takedown", "rates"], report: pickReport("rates", "APPROVED"), comments: [[priya, "Lodged with the registrar's abuse desk, ticket reference in the shared drive."], [daniel, "Legal are happy for us to name the domain in the public alert."], [priya, "No reply after 48h — chasing again this morning."]] },
    { title: "Brief customer service on the fake rates notice script", description: "Customer Service is taking calls from worried ratepayers. Give them a two-line answer and the steps if someone has paid.", status: "IN_PROGRESS", priority: "HIGH", assignee: hannah, creator: priya, dueInDays: 0, createdDaysAgo: 4, labels: ["rates", "customer-service"], comments: [[hannah, "Draft script shared with team leaders. Adding the bank-contact step."]] },
    { title: "Verify 0491 570 188 with the telco scam reporting line", status: "TODO", priority: "HIGH", assignee: mustafa, creator: sophie, dueInDays: 2, createdDaysAgo: 3, labels: ["indicator", "rates"] },
    { title: "Publish the community alert for fake rates notices", status: "DONE", priority: "URGENT", assignee: sophie, creator: priya, dueInDays: -6, createdDaysAgo: 8, labels: ["alert", "rates"], comments: [[sophie, "Drafted with the de-identified specimen."], [daniel, "Approved and published."]] },
    { title: "Draft a community alert for the WhatsApp 'task job' scam", description: "Reports are rising fast and there is no alert yet. Losses are large: residents are topping up in crypto to 'unlock' tasks.", status: "TODO", priority: "HIGH", assignee: sophie, creator: root ?? priya, dueInDays: 1, createdDaysAgo: 1, labels: ["alert", "jobs"], report: pickReport("jobs", "APPROVED") },
    { title: `Call back the resident who lost $${biggestBankLoss?.amount?.toLocaleString("en-AU") ?? "4,800"} to a fake bank call`, description: "Resident is distressed. Confirm they have contacted their bank and IDCARE, and share the recovery checklist.", status: "IN_PROGRESS", priority: "URGENT", assignee: sophie, creator: mustafa, dueInDays: -1, createdDaysAgo: 3, labels: ["victim-support", "bank"], report: biggestBankLoss, comments: [[sophie, "Left a voicemail; will try again after 3pm."]] },
    { title: "Monthly scam trends report for the Community Safety committee", description: "Use the analytics page: top categories, suburbs, losses and the rates-notice spike. Export the de-identified CSV for the appendix.", status: "IN_PROGRESS", priority: "MEDIUM", assignee: daniel, creator: root ?? daniel, dueInDays: 5, createdDaysAgo: 6, labels: ["reporting"], comments: [[daniel, "Charts done. Need the losses-by-channel table."]] },
    { title: "Update the toll-text guide with the new domain", status: "IN_PROGRESS", priority: "MEDIUM", assignee: arjun, creator: sophie, dueInDays: 3, createdDaysAgo: 4, labels: ["content", "toll"] },
    { title: "Social post: the $250 energy rebate is not real", status: "DONE", priority: "MEDIUM", assignee: arjun, creator: priya, dueInDays: -10, createdDaysAgo: 12, labels: ["comms", "energy"], comments: [[arjun, "Posted on Facebook and Instagram; 14k reach so far."]] },
    { title: "Spotting fake texts: session at Craigieburn Library", description: "One-hour drop-in for seniors. Bring printed copies of the rates and toll specimens.", status: "TODO", priority: "MEDIUM", assignee: tom, creator: daniel, dueInDays: 9, createdDaysAgo: 7, labels: ["community", "education"] },
    { title: "Follow up with small businesses about invoice redirection", description: "Two Hume businesses paid fake supplier invoices this quarter. Offer the payment-verification checklist through the business newsletter.", status: "TODO", priority: "MEDIUM", assignee: grace, creator: priya, dueInDays: 12, createdDaysAgo: 2, labels: ["business", "payment-redirection"], report: pickReport("invoice") },
    { title: "Check the 'Hi Mum' cluster from Roxburgh Park", description: "Several linked reports share the same number. Confirm whether they should be merged as duplicates.", status: "TODO", priority: "LOW", assignee: mustafa, creator: sophie, dueInDays: 6, createdDaysAgo: 2, labels: ["duplicates", "himum"] },
    { title: "Escalate crypto investment losses to ReportCyber and ASIC", status: "BLOCKED", priority: "HIGH", assignee: priya, creator: sophie, dueInDays: -3, createdDaysAgo: 15, labels: ["escalation", "investment"], report: pickReport("crypto"), comments: [[priya, "Waiting on the resident's consent to share their details."]] },
    { title: "Approve the Marketplace deposit alert", description: "Submitted for second-officer approval.", status: "TODO", priority: "HIGH", assignee: daniel, creator: mustafa, dueInDays: 0, createdDaysAgo: 1, labels: ["alert", "online-shopping"] },
    { title: "Quarterly privacy check of the de-identified export", status: "DONE", priority: "MEDIUM", assignee: priya, creator: daniel, dueInDays: -20, createdDaysAgo: 30, labels: ["privacy"] },
    { title: "Set up accounts for the Customer Service rotation", status: "DONE", priority: "LOW", assignee: priya, creator: root ?? priya, dueInDays: -14, createdDaysAgo: 18, labels: ["team"] },
    { title: "Review the energy-rebate reports for identity theft risk", status: "TODO", priority: "MEDIUM", assignee: null, creator: sophie, dueInDays: 4, createdDaysAgo: 1, labels: ["energy", "identity"] },
    { title: "Translate the rates-notice alert into Arabic, Turkish and Vietnamese", description: "Hume's top community languages. Community Languages team to review.", status: "TODO", priority: "MEDIUM", assignee: arjun, creator: daniel, dueInDays: 7, createdDaysAgo: 2, labels: ["comms", "accessibility"] },
    ...unassignedNew.map((r, i) => ({ title: `Triage ${r.reference}: ${r.title}`, status: "TODO" as TaskStatus, priority: (i === 0 ? "HIGH" : "MEDIUM") as TaskPriority, assignee: null, creator: sophie, dueInDays: 1, createdDaysAgo: 0, labels: ["triage"], report: r })),
    { title: "Close out the parcel-text alert draft", status: "TODO", priority: "LOW", assignee: mustafa, creator: arjun, dueInDays: 10, createdDaysAgo: 0, labels: ["alert", "parcel"] },
    { title: "Share the rates-notice alert with neighbouring councils", status: "DONE", priority: "MEDIUM", assignee: daniel, creator: priya, dueInDays: -4, createdDaysAgo: 6, labels: ["partners"] },
    { title: "Review your first week of reports", description: "Welcome aboard! Pair with Sophie on five reports from the queue.", status: "TODO", priority: "LOW", assignee: root ?? null, creator: priya, dueInDays: 3, createdDaysAgo: 0, labels: ["onboarding"] },
  ];

  let position = 0;
  for (const [index, task] of TASKS.entries()) {
    const createdAt = new Date(now - task.createdDaysAgo * DAY - between(1, 6) * HOUR);
    const row = await prisma.task.create({
      data: {
        reference: `TASK-${String(index + 1).padStart(4, "0")}`, title: task.title, description: task.description ?? null, status: task.status, priority: task.priority,
        dueAt: task.dueInDays === undefined ? null : new Date(now + task.dueInDays * DAY + (17 - new Date(now).getUTCHours() - 10) * HOUR),
        labels: task.labels, position: (position += 1024), completedAt: task.status === "DONE" ? new Date(now + (task.dueInDays ?? -1) * DAY) : null,
        assigneeId: task.assignee?.id ?? null, createdById: task.creator?.id ?? null, reportId: task.report?.id ?? null, createdAt, updatedAt: createdAt,
      },
    });
    await prisma.auditLog.create({ data: { userId: task.creator?.id ?? null, action: "task.created", entityType: "Task", entityId: row.id, metadata: { reference: row.reference }, createdAt } });
    for (const [c, [author, body]] of (task.comments ?? []).entries()) {
      await prisma.taskComment.create({ data: { taskId: row.id, authorId: author?.id ?? null, body, createdAt: new Date(createdAt.getTime() + (c + 1) * between(3, 20) * HOUR) } });
    }
    if (root && task.assignee?.id === root.id) {
      await prisma.notification.create({ data: { userId: root.id, kind: "TASK_ASSIGNED", title: `${row.reference} assigned to you`, body: row.title, linkPath: `/council/tasks?task=${row.reference}`, createdAt } });
    }
  }

  /* Notifications for the super admin, so the console has something to say. */
  if (root) {
    const newest = [...byCampaign.values()].flat().sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()).slice(0, 3);
    for (const r of newest) {
      await prisma.notification.create({ data: { userId: root.id, kind: "REPORT_SUBMITTED", title: `New report ${r.reference}`, body: r.title, linkPath: `/council/reports/${r.reference}`, createdAt: r.submittedAt } });
    }
  }

  /* Subscribers to community alerts. */
  const subscribers = [...residents.slice(0, 30), ...Array.from({ length: 22 }, (_, i) => ({ id: null as string | null, email: `alerts.reader.${i + 1}@mail.cyberkent.test` }))];
  for (const [i, person] of subscribers.entries()) {
    const scope = weighted([["ALL", 5], ["SUBURB", 3], ["CATEGORY", 2]] as const);
    const createdAt = new Date(now - between(1, 170) * DAY);
    await prisma.subscription.create({
      data: {
        userId: person.id, email: person.email, scope,
        suburbId: scope === "SUBURB" ? weighted(suburbPool).id : null,
        categoryId: scope === "CATEGORY" ? categories.get(pick(["toll-and-fines", "government-impersonation", "bank-impersonation", "jobs", "online-shopping"]))! : null,
        confirmedAt: chance(0.9) ? new Date(createdAt.getTime() + between(0.1, 12) * HOUR) : null,
        unsubscribedAt: i % 13 === 12 ? new Date(now - between(1, 30) * DAY) : null,
        unsubscribeTokenHash: crypto.createHash("sha256").update(crypto.randomBytes(32)).digest("hex"),
        createdAt,
      },
    }).catch(() => undefined); // an unlucky duplicate scope for one address is simply skipped
  }

  /* Checker traffic: residents testing messages before they act. */
  const SAMPLES: [Channel, string][] = [
    ["SMS", "Your rates instalment is overdue. Pay now to avoid a penalty: hume-rates-payment.info"],
    ["SMS", "Linkt: unpaid toll of $4.27, pay today: linkt-payment-au.top"],
    ["SMS", "Hi Mum, new number, can you help with a bill?"],
    ["EMAIL", "Your tax refund is ready. Sign in to claim: mygov-refund-portal.info"],
    ["SMS", "AusPost: pay $2.99 redelivery fee"],
    ["SOCIAL", "Earn $400/day rating hotels from home, message me on WhatsApp"],
    ["SMS", "Your appointment at Craigieburn Medical is confirmed for Tuesday 10am"],
    ["EMAIL", "Hume City Council: your green waste collection day has changed"],
    ["PHONE", "Caller said they were from my bank's fraud team and asked me to move money"],
    ["SMS", "You're eligible for $250 energy bill relief, confirm bank details"],
  ];
  for (let i = 0; i < 320; i += 1) {
    const age = Math.pow(random(), 1.4) * 120;
    const createdAt = melbourneAt(age, reportHour());
    const [channel, content] = pick(SAMPLES);
    const benign = /appointment|green waste/.test(content);
    const score = benign ? Math.round(between(3, 22)) : Math.round(between(58, 97));
    await prisma.scamCheck.create({
      data: {
        userId: chance(0.3) ? pick(residents).id : null, channel, content, score,
        band: score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW", confidence: Number(between(0.6, 0.95).toFixed(2)), ruleSetVersion: "2026.09",
        retentionUntil: new Date(createdAt.getTime() + 90 * DAY), createdAt,
      },
    });
  }

  /* Guides: one published by the team, two in draft. */
  const guides: { slug: string; title: string; category: string; summary: string; status: "published" | "draft"; author: { id: string }; daysAgo: number; content: { kind: string; accent: string; audience: string; lede: string; takeaways: string[]; markup: string } }[] = [
    {
      slug: "fake-council-rates-notices", title: "Fake Council rates notices: how to tell", category: "Residents", status: "published", author: arjun, daysAgo: 5,
      summary: "Texts and emails are telling Hume ratepayers their rates are overdue. Here is how to tell a real notice from a fake one, and what to do if you paid.",
      content: {
        kind: "Tips & tricks", accent: "amber", audience: "Every Hume ratepayer",
        lede: "Scammers are sending texts and emails that look like they come from Hume City Council, warning that your rates are overdue and asking you to pay through a link today.",
        takeaways: ["Council never sends payment links by text.", "Check your balance through the Council website or your paper notice.", "If you paid, call your bank first, then report it to Council."],
        markup: "## What the fake notices look like\n\n- A text or email saying your rates instalment is overdue\n- A penalty that applies today unless you pay now\n- A link to a site that is not hume.vic.gov.au\n\n## How to check\n\n+ Stop: Don't tap the link or call the number in the message.\n+ Check: Look at your last rates notice, or sign in through the Council website you type in yourself.\n+ Ask: Call Council on the number on our website — not the one in the message.\n\n!do If you paid: Call your bank straight away, then report it on CyberKent so we can warn other ratepayers.",
      },
    },
    {
      slug: "task-job-scams", title: "Jobs that pay you to 'rate' or 'optimise' products", category: "Residents", status: "draft", author: sophie, daysAgo: 1,
      summary: "Messages offer easy online work, then ask you to top up your own money to unlock tasks. You won't get it back.",
      content: {
        kind: "Article", accent: "indigo", audience: "Anyone offered online work they didn't apply for",
        lede: "Task scams start with a friendly message and a few small payouts, then ask you to deposit more and more to keep going.",
        takeaways: ["Real jobs never ask you to pay to work.", "Small early payouts are bait.", "Stop and report before you top up again."],
        markup: "## Warning signs\n\n- Unexpected job offer by text or WhatsApp\n- Pay that seems too good for simple clicking\n- You must deposit money or crypto to unlock tasks\n\n## What to do\n\n+ Stop: Don't send any more money, even to 'withdraw' what you've earned.\n+ Report: Tell your bank and report it on CyberKent.",
      },
    },
    {
      slug: "energy-rebate-scams", title: "Energy bill relief: what's real and what's a scam", category: "Residents", status: "draft", author: arjun, daysAgo: 0,
      summary: "Genuine energy rebates are applied automatically. Messages asking you to 'claim' with your bank details are scams.",
      content: {
        kind: "Checklist", accent: "emerald", audience: "Households paying energy bills",
        lede: "With energy prices in the news, scammers are offering rebates that don't exist.",
        takeaways: ["Rebates are applied to your bill automatically or through a .gov.au site.", "Never give your bank or licence details to 'claim' a rebate."],
        markup: "## Before you click\n\n- Is the link on a .gov.au website?\n- Did you ask for this?\n\n!do Report the message on CyberKent.",
      },
    },
  ];
  for (const guide of guides) {
    const at = new Date(now - guide.daysAgo * DAY - between(1, 5) * HOUR);
    const words = `${guide.content.lede} ${guide.content.takeaways.join(" ")} ${guide.content.markup}`.split(/\s+/).filter(Boolean).length;
    const row = await prisma.awarenessResource.upsert({
      where: { slug: guide.slug },
      update: {},
      create: {
        slug: guide.slug, title: guide.title, category: guide.category, summary: guide.summary, body: guide.content.markup, readingTime: `${Math.max(1, Math.round(words / 200))} min`,
        content: guide.content, publishedAt: guide.status === "published" ? at : null, authorId: guide.author.id, createdAt: new Date(at.getTime() - DAY), updatedAt: at,
      },
    });
    await prisma.auditLog.create({ data: { userId: guide.author.id, action: guide.status === "published" ? "content.article_published" : "content.article_created", entityType: "AwarenessResource", entityId: row.id, metadata: { slug: row.slug }, createdAt: at } });
  }

  /* Site notices: one scheduled, one already taken down. Nothing is shown live. */
  const notices: { title: string; body: string; tone: NoticeTone; startsIn: number; endsIn: number | null; archived: boolean; linkUrl?: string; linkLabel?: string }[] = [
    { title: "Free scam awareness session at Craigieburn Library", body: "Drop in on Thursday at 10am to learn how to spot fake texts and calls.", tone: "INFO", startsIn: 3, endsIn: 9, archived: false, linkUrl: "/learn", linkLabel: "Learn more" },
    { title: "Fake toll texts are circulating in Hume", body: "Linkt never texts a payment link. Delete the message.", tone: "WARNING", startsIn: -20, endsIn: -12, archived: true },
  ];
  for (const notice of notices) {
    const row = await prisma.siteNotice.create({
      data: {
        title: notice.title, body: notice.body, tone: notice.tone, linkUrl: notice.linkUrl ?? null, linkLabel: notice.linkLabel ?? null,
        startsAt: new Date(now + notice.startsIn * DAY), endsAt: notice.endsIn === null ? null : new Date(now + notice.endsIn * DAY),
        archivedAt: notice.archived ? new Date(now + (notice.endsIn ?? 0) * DAY) : null, createdById: arjun.id, createdAt: new Date(now + Math.min(notice.startsIn, 0) * DAY - DAY),
      },
    });
    await prisma.auditLog.create({ data: { userId: arjun.id, action: "content.notice_created", entityType: "SiteNotice", entityId: row.id, metadata: { tone: row.tone }, createdAt: row.createdAt } });
  }

  /* Staff sign-ins and exports, for the activity trail and "last seen". */
  for (const person of staff) {
    if (!person.lastLoginAt) continue;
    for (let d = 0; d < 14; d += 1) {
      if (!chance(person.role === "ADMIN" ? 0.8 : 0.65)) continue;
      const at = melbourneAt(d, weighted([[8, 5], [9, 4], [13, 2], [16, 1]] as const));
      await prisma.auditLog.create({ data: { userId: person.id, action: "account.signed_in", entityType: "User", entityId: person.id, createdAt: at } });
    }
    await prisma.auditLog.create({ data: { userId: person.id, action: "account.signed_in", entityType: "User", entityId: person.id, createdAt: person.lastLoginAt } });
  }
  await prisma.auditLog.create({ data: { userId: daniel.id, action: "data.exported", entityType: "Report", metadata: { format: "csv", rows: n, deIdentified: true }, createdAt: new Date(now - 2 * DAY) } });

  console.log(`Showcase: ${staff.length} staff, ${residents.length} residents, ${n} reports in ${CAMPAIGNS.length} campaigns, ${alerts.length} alerts, ${TASKS.length} tasks, ${subscribers.length} subscribers, 320 checks, ${guides.length} guides, ${notices.length} notices.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
