import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Channel, IndicatorType, ReportStatus, Severity } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

/**
 * A synthetic caseload for the Council console — the review queue, the
 * statistics and the export all need volume to be demonstrated or tested.
 *
 *   npm run db:seed          # reference data first
 *   npm run db:seed:demo     # then this
 *
 * Everything here is invented (ER-12): every person uses the reserved `.test`
 * domain, every phone number sits in ACMA's fictional 0491 570 range, every
 * link is on a reserved or obviously fake host. The generator is seeded, so
 * two runs produce the same caseload, and each report is keyed on its
 * reference, so a re-run adds nothing it already added.
 *
 * `SEED_OFFICER_PASSWORD` (12+ characters), when set, makes the synthetic
 * officer an account you can sign in to, to walk the officer's view rather
 * than the administrator's.
 */

const DAY = 24 * 60 * 60 * 1000;

/* mulberry32 — small, fast, and good enough to make a caseload look lived-in. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = rng(20260924);
const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)]!;
const chance = (p: number) => random() < p;

/* Campaign artefacts, reused across reports the way a real campaign reuses them. */
const CAMPAIGNS = {
  toll: { type: "DOMAIN" as IndicatorType, value: "linkt-payment-au.top" },
  parcel: { type: "URL" as IndicatorType, value: "https://auspost-redelivery.help/track" },
  mygov: { type: "DOMAIN" as IndicatorType, value: "mygov-refund-portal.info" },
  bankPhone: { type: "PHONE" as IndicatorType, value: "0491570156" },
  hiMum: { type: "PHONE" as IndicatorType, value: "0491570110" },
  invoice: { type: "EMAIL" as IndicatorType, value: "accounts@hume-supplies-billing.test" },
  crypto: { type: "DOMAIN" as IndicatorType, value: "aussie-crypto-yield.test" },
  techSupport: { type: "PHONE" as IndicatorType, value: "0491570006" },
};

const TEMPLATES: {
  category: string;
  channel: Channel;
  title: string;
  description: string;
  indicators: (keyof typeof CAMPAIGNS)[];
  loss?: [number, number];
}[] = [
  {
    category: "toll-and-fines",
    channel: "SMS",
    title: "Text about an unpaid Linkt toll",
    description: "Got a text saying I had an unpaid toll of $4.20 and would be fined $180 if I did not pay today. The link went to a site that looked like Linkt and asked for my card number. I did not enter it.",
    indicators: ["toll"],
  },
  {
    category: "toll-and-fines",
    channel: "SMS",
    title: "Paid a fake toll notice",
    description: "I paid what I thought was an overdue toll through a link in a text. Afterwards my bank called about two transactions I did not make overseas. I have cancelled the card.",
    indicators: ["toll"],
    loss: [150, 900],
  },
  {
    category: "parcel-delivery",
    channel: "SMS",
    title: "Missed delivery text with a redelivery fee",
    description: "A message said Australia Post could not deliver my parcel and I needed to pay a $2.99 redelivery fee. I am not expecting anything. The link does not go to auspost.com.au.",
    indicators: ["parcel"],
  },
  {
    category: "government-impersonation",
    channel: "EMAIL",
    title: "Email claiming a myGov tax refund",
    description: "Email says I am owed a tax refund of $612.40 and to log in to myGov to claim it. The login page asked for my myGov password and then my bank details. The sender address is not a gov.au address.",
    indicators: ["mygov"],
  },
  {
    category: "bank-impersonation",
    channel: "PHONE",
    title: "Call from 'bank fraud team' asking for a code",
    description: "A man called saying he was from my bank's fraud team and that someone was trying to take money from my account. He asked me to read out the code that had just been texted to me. I hung up and called the bank on the number on my card.",
    indicators: ["bankPhone"],
  },
  {
    category: "bank-impersonation",
    channel: "PHONE",
    title: "Moved savings to a 'safe account'",
    description: "Caller knew my name and the last digits of my card. Said my account was compromised and I had to move my savings to a safe account while they investigated. I transferred the money. The bank now says the call was not from them.",
    indicators: ["bankPhone"],
    loss: [4_000, 38_000],
  },
  {
    category: "family-impersonation",
    channel: "SMS",
    title: "'Hi Mum' message from a new number",
    description: "Message said 'Hi Mum, I dropped my phone, this is my new number' and then asked me to pay a bill urgently because their banking app was not working on the new phone. My son's phone is fine.",
    indicators: ["hiMum"],
  },
  {
    category: "family-impersonation",
    channel: "SOCIAL",
    title: "Paid a bill for someone pretending to be my daughter",
    description: "WhatsApp message from someone saying they were my daughter on a new phone. I paid two invoices for her before I realised. She never sent the messages.",
    indicators: ["hiMum"],
    loss: [800, 3_500],
  },
  {
    category: "payment-redirection",
    channel: "EMAIL",
    title: "Supplier invoice with changed bank details",
    description: "Our community group received an invoice from what looked like our usual supplier with a note that their bank details had changed. We paid it. The real supplier never sent it — the email address is one letter different.",
    indicators: ["invoice"],
    loss: [2_000, 14_000],
  },
  {
    category: "investment",
    channel: "SOCIAL",
    title: "Crypto trading platform that will not let me withdraw",
    description: "Saw an ad with a celebrity endorsing a crypto platform. Deposited money and the dashboard showed big gains, but now they want a 'release fee' before I can withdraw anything.",
    indicators: ["crypto"],
    loss: [1_500, 45_000],
  },
  {
    category: "remote-access",
    channel: "PHONE",
    title: "Tech support call asking to install software",
    description: "Caller said my internet had been hacked and asked me to install a program so they could fix it. They wanted me to log in to my banking while they were connected. I refused and hung up.",
    indicators: ["techSupport"],
  },
  {
    category: "jobs",
    channel: "SOCIAL",
    title: "Work-from-home 'task' job asking for deposits",
    description: "Offered a job rating products online. Paid small amounts at first, then asked me to deposit my own money to 'unlock' higher-paying tasks.",
    indicators: [],
    loss: [200, 2_500],
  },
  {
    category: "online-shopping",
    channel: "WEBSITE",
    title: "Marketplace seller took payment and disappeared",
    description: "Paid for a second-hand fridge on a marketplace after the seller insisted on bank transfer. Seller stopped replying and the listing was removed.",
    indicators: [],
    loss: [300, 1_200],
  },
  {
    category: "prize-and-lottery",
    channel: "EMAIL",
    title: "Email saying I won a prize I never entered",
    description: "Email said I had won a $1,000 shopping voucher and needed to pay a small processing fee and confirm my date of birth to claim it.",
    indicators: [],
  },
  {
    category: "phishing",
    channel: "EMAIL",
    title: "Email saying my email account will be closed",
    description: "Email said my mailbox was full and would be deleted unless I verified my password within 24 hours. The link asked for my email password.",
    indicators: [],
  },
];

const FIRST = ["Aisha", "Ben", "Chen", "Divya", "Elena", "Farid", "Grace", "Hamza", "Isla", "Jack", "Karan", "Leila", "Mehmet", "Nora", "Omar", "Priya"];
const LAST = ["Nguyen", "Smith", "Haddad", "Kaur", "Rossi", "Yilmaz", "Taylor", "Ali", "Brown", "Singh", "Papadopoulos", "Tran"];

const STATUS_MIX: [ReportStatus, number][] = [
  ["SUBMITTED", 0.34],
  ["UNDER_REVIEW", 0.2],
  ["INFORMATION_REQUESTED", 0.08],
  ["APPROVED", 0.24],
  ["REJECTED", 0.09],
  ["WITHDRAWN", 0.05],
];

/* A report that has been with Council for a fortnight has usually been decided. */
const SETTLED_MIX: [ReportStatus, number][] = [
  ["SUBMITTED", 0.04],
  ["UNDER_REVIEW", 0.1],
  ["INFORMATION_REQUESTED", 0.04],
  ["APPROVED", 0.55],
  ["REJECTED", 0.2],
  ["WITHDRAWN", 0.07],
];

function status(ageDays: number): ReportStatus {
  let roll = random();
  for (const [value, weight] of ageDays > 14 ? SETTLED_MIX : STATUS_MIX) {
    if ((roll -= weight) < 0) return value;
  }
  return "SUBMITTED";
}

async function main() {
  const categories = new Map((await prisma.scamCategory.findMany({ select: { id: true, slug: true } })).map((row) => [row.slug, row.id]));
  const suburbs = await prisma.suburb.findMany({ select: { id: true, name: true } });

  if (categories.size === 0 || suburbs.length === 0) {
    throw new Error("Run `npm run db:seed` first — the demo caseload needs categories and suburbs.");
  }

  const officerPassword = process.env.SEED_OFFICER_PASSWORD ?? "";
  const unusable = await bcrypt.hash(crypto.randomBytes(24).toString("base64url"), 12);

  const officers = [];
  for (const [email, fullName] of [
    ["officer.synthetic@cyberkent.test", "Synthetic Officer"],
    ["officer.two.synthetic@cyberkent.test", "Morgan Reviewer"],
  ] as const) {
    const signIn = email.startsWith("officer.synthetic") && officerPassword.length >= 12;
    officers.push(
      await prisma.user.upsert({
        where: { email },
        update: signIn ? { role: "OFFICER", passwordHash: await bcrypt.hash(officerPassword, 12) } : {},
        create: {
          email,
          fullName,
          role: "OFFICER",
          passwordHash: signIn ? await bcrypt.hash(officerPassword, 12) : unusable,
          emailVerified: new Date(),
          notificationPrefs: { create: {} },
        },
      }),
    );
  }

  const residents = [];
  for (let i = 0; i < 18; i += 1) {
    const first = FIRST[i % FIRST.length]!;
    const last = LAST[(i * 5) % LAST.length]!;
    const email = `${first}.${last}.${i}`.toLowerCase() + "@residents.cyberkent.test";
    residents.push(
      await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          fullName: `${first} ${last}`,
          role: i % 6 === 5 ? "BUSINESS" : "RESIDENT",
          organisation: i % 6 === 5 ? `${last} Community Services Inc.` : null,
          phone: `0491 570 ${String(200 + i).padStart(3, "0")}`,
          passwordHash: unusable,
          emailVerified: i % 7 === 3 ? null : new Date(),
          notificationPrefs: { create: {} },
        },
      }),
    );
  }

  const now = Date.now();
  let created = 0;

  for (let n = 0; n < 64; n += 1) {
    const reference = `HCC-DEMO-${String(8000 + n)}`;
    if (await prisma.report.count({ where: { reference } })) continue;

    const template = pick(TEMPLATES);
    /* Weighted toward the last fortnight, so the timeline shows a campaign building. */
    const ageDays = Math.floor(Math.pow(random(), 1.8) * 88);
    const submittedAt = new Date(now - ageDays * DAY - Math.floor(random() * DAY));
    const state = ageDays < 1 && chance(0.7) ? "SUBMITTED" : status(ageDays);
    const decided = state === "APPROVED" || state === "REJECTED";
    const touched = state !== "SUBMITTED" && state !== "WITHDRAWN";
    const officer = pick(officers);
    const reviewer = touched || (state === "SUBMITTED" && chance(0.25)) ? officer : null;
    const severity: Severity | null =
      decided || (touched && chance(0.5)) ? (template.loss ? pick(["HIGH", "HIGH", "MEDIUM"] as const) : pick(["MEDIUM", "LOW", "LOW"] as const)) : null;
    const loss = template.loss && chance(0.85) ? Math.round(template.loss[0] + random() * (template.loss[1] - template.loss[0])) : null;
    const author = pick(residents);
    const firstTouch = new Date(submittedAt.getTime() + (2 + random() * 40) * 60 * 60 * 1000);
    const decisionAt = new Date(Math.min(now - 60_000, firstTouch.getTime() + (4 + random() * 70) * 60 * 60 * 1000));

    await prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          reference,
          authorId: author.id,
          categoryId: chance(0.88) ? (categories.get(template.category) ?? null) : null,
          suburbId: chance(0.9) ? pick(suburbs).id : null,
          channel: template.channel,
          status: state,
          severity,
          title: template.title,
          description: template.description,
          amountLostCents: loss === null ? null : loss * 100,
          occurredAt: new Date(submittedAt.getTime() - Math.floor(random() * 3) * DAY),
          submittedAt,
          createdAt: submittedAt,
          withdrawnAt: state === "WITHDRAWN" ? new Date(submittedAt.getTime() + DAY) : null,
          reviewerId: reviewer?.id ?? null,
        },
      });

      for (const key of template.indicators) {
        const artefact = CAMPAIGNS[key];
        const indicator = await tx.indicator.upsert({
          where: { type_value: { type: artefact.type, value: artefact.value } },
          create: { type: artefact.type, value: artefact.value, reportCount: 1, firstSeenAt: submittedAt, lastSeenAt: submittedAt },
          update: { reportCount: { increment: 1 } },
        });
        await tx.reportIndicator.create({ data: { reportId: report.id, indicatorId: indicator.id } });
      }

      if (touched) {
        await tx.reportReview.create({ data: { reportId: report.id, reviewerId: officer.id, decision: "UNDER_REVIEW", createdAt: firstTouch } });
      }

      if (state === "INFORMATION_REQUESTED" || (decided && chance(0.3))) {
        const answered = state !== "INFORMATION_REQUESTED";
        await tx.reportReview.create({ data: { reportId: report.id, reviewerId: officer.id, decision: "INFORMATION_REQUESTED", createdAt: firstTouch } });
        await tx.informationRequest.create({
          data: {
            reportId: report.id,
            requestedById: officer.id,
            message: "Could you tell us the exact time the message arrived, and whether you still have it on your phone?",
            response: answered ? "It arrived about 9:40 in the morning. Yes, I still have it and can send a screenshot." : null,
            respondedAt: answered ? new Date(firstTouch.getTime() + 3 * 60 * 60 * 1000) : null,
            createdAt: firstTouch,
          },
        });
      }

      if (decided) {
        await tx.reportReview.create({
          data: {
            reportId: report.id,
            reviewerId: officer.id,
            decision: state,
            severity,
            notes:
              state === "APPROVED"
                ? "Synthetic review: wording and artefacts match an active campaign seen in other Hume reports."
                : "Synthetic review: insufficient detail to confirm; resident advised to contact their bank directly.",
            createdAt: decisionAt,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: author.id,
          action: "report.submitted",
          entityType: "Report",
          entityId: report.id,
          metadata: { synthetic: true, indicators: template.indicators.length, fromCheck: chance(0.5) ? { score: 55 + Math.floor(random() * 40), band: "high" } : null },
          createdAt: submittedAt,
        },
      });
    });

    created += 1;
  }

  console.log(`Demo caseload: ${created} report(s) added (${64 - created} already present), ${residents.length} synthetic residents, ${officers.length} officers.`);
  if (officerPassword.length >= 12) {
    console.log("officer.synthetic@cyberkent.test can now sign in with SEED_OFFICER_PASSWORD.");
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
