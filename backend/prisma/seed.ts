import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

/**
 * Seed data — reference data plus a small synthetic dataset.
 *
 *   npm run db:seed
 *
 * Closes gap G7 and ER-12 in the Final SRS: without a sanctioned synthetic
 * source, the path of least resistance for a developer who needs data is to
 * copy production, which is exactly how personal information ends up in places
 * it should never be. Everything below is either public reference data (the
 * Scamwatch categories, Hume's suburbs and postcodes, Council's own awareness
 * material) or invented, and every invented person uses the reserved `.test`
 * domain so no row can be mistaken for a real resident.
 *
 * Idempotent: every write is an upsert keyed on a natural identifier, so the
 * script can be re-run after a schema change without duplicating anything.
 */

const RULE_SET_VERSION = "2026-09-10";

/** Scamwatch / National Anti-Scam Centre taxonomy (R21). */
const CATEGORIES = [
  ["phishing", "Phishing", "Messages impersonating a trusted organisation to capture passwords, codes or card details."],
  ["parcel-delivery", "Parcel delivery", "Fake missed-delivery, customs-fee and redelivery messages."],
  ["toll-and-fines", "Tolls and fines", "Fake unpaid toll, parking fine and infringement notices."],
  ["government-impersonation", "Government impersonation", "Messages claiming to be myGov, the ATO, Services Australia or Council."],
  ["bank-impersonation", "Bank impersonation", "Fake fraud alerts and security calls claiming to be from a bank."],
  ["family-impersonation", "Hi Mum / family impersonation", "Someone claiming to be a relative on a new number, asking for money."],
  ["payment-redirection", "Payment redirection", "Invoice and business email compromise — changed bank details."],
  ["investment", "Investment", "Fake trading platforms, crypto schemes and guaranteed-return offers."],
  ["romance", "Romance", "Relationships built online to extract money over time."],
  ["jobs", "Jobs and employment", "Task-based, work-from-home and money-mule job offers."],
  ["remote-access", "Remote access and tech support", "Requests to install remote-access software to 'fix' a problem."],
  ["online-shopping", "Online shopping and marketplace", "Fake stores, fake sellers and overpayment scams."],
  ["prize-and-lottery", "Prizes and lotteries", "Unexpected winnings that require a fee to release."],
  ["identity-theft", "Identity theft", "Attempts to obtain identity documents or personal details."],
] as const;

/** Suburbs of the City of Hume, with postcodes (Australia Post). */
const SUBURBS = [
  ["Attwood", "3049"], ["Broadmeadows", "3047"], ["Bulla", "3428"], ["Campbellfield", "3061"],
  ["Coolaroo", "3048"], ["Craigieburn", "3064"], ["Dallas", "3047"], ["Donnybrook", "3064"],
  ["Gladstone Park", "3043"], ["Greenvale", "3059"], ["Jacana", "3047"], ["Kalkallo", "3064"],
  ["Meadow Heights", "3048"], ["Melbourne Airport", "3045"], ["Mickleham", "3064"],
  ["Oaklands Junction", "3063"], ["Roxburgh Park", "3064"], ["Somerton", "3062"], ["Sunbury", "3429"],
  ["Tullamarine", "3043"], ["Westmeadows", "3049"], ["Wildwood", "3429"], ["Yuroke", "3063"],
] as const;

/** Mirrors the awareness library published on the site (frontend/src/content/learn.ts). */
const RESOURCES = [
  {
    slug: "first-hour",
    title: "The first hour after you have been scammed",
    category: "Recovery",
    summary: "Who to call first, what to freeze, and what evidence to keep before anything is deleted from your phone.",
    readingTime: "4 min",
  },
  {
    slug: "small-business",
    title: "Payment redirection: a checklist for small teams",
    category: "Small business",
    summary: "How invoice fraud reaches a business inbox, and the two verification habits that stop almost all of it.",
    readingTime: "6 min",
  },
  {
    slug: "older-residents",
    title: "Talking to family about phone scams",
    category: "Community",
    summary: "A conversation guide for supporting older relatives without taking away their independence or confidence.",
    readingTime: "5 min",
  },
  {
    slug: "not-for-profit",
    title: "Protecting a volunteer-run organisation",
    category: "Organisations",
    summary: "Practical account, donation and record-keeping controls that work when nobody on the committee is technical.",
    readingTime: "7 min",
  },
];

/** FR58 — the first-hour checklist, in the order that matters. */
const FIRST_HOUR_STEPS = [
  ["Ring the number on the back of your card", "Not a number from the message. Ask for the transaction to be stopped or recalled and write down the reference number."],
  ["Change the password that was exposed", "Start with email, then banking. Use a new passphrase you have not used anywhere else."],
  ["Turn on multi-factor authentication", "On email and banking first, so a stolen password alone is no longer enough."],
  ["Keep the evidence", "Screenshot the messages, the sender's number or address and any payment receipts before anything is deleted."],
  ["Report it", "ReportCyber if money or documents were lost, Scamwatch for the national picture, and CyberKent so Council can warn Hume."],
  ["Contact IDCARE if identity documents were taken", "Free national support on 1800 595 160, with a response plan for a stolen licence, passport or Medicare card."],
] as const;

async function seedAccounts() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin.synthetic@cyberkent.test").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  const unusable = () => bcrypt.hash(crypto.randomBytes(24).toString("base64url"), 12);

  /*
   * The seed holds the administrator to the same 12-character floor every
   * account is held to (auth.schema.ts). A shorter configured password is not
   * silently accepted: the account is created with a random, discarded one,
   * and re-running with a valid SEED_ADMIN_PASSWORD sets it.
   */
  const usable = password.length >= 12;

  if (!usable) {
    console.warn("SEED_ADMIN_PASSWORD is missing or shorter than 12 characters; the administrator was given a random password. Set a valid one and re-run to sign in.");
  }

  const admin = await prisma.user.upsert({
    where: { email },
    update: usable ? { role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) } : { role: "ADMIN" },
    create: {
      email,
      passwordHash: usable ? await bcrypt.hash(password, 12) : await unusable(),
      fullName: "CyberKent Administrator",
      role: "ADMIN",
      emailVerified: new Date(),
      notificationPrefs: { create: {} },
    },
  });

  /* Synthetic staff and resident. Their passwords are random and discarded:
     they exist to populate relations, not to be signed in to. */

  const officer = await prisma.user.upsert({
    where: { email: "officer.synthetic@cyberkent.test" },
    update: {},
    create: {
      email: "officer.synthetic@cyberkent.test",
      passwordHash: await unusable(),
      fullName: "Synthetic Officer",
      role: "OFFICER",
      emailVerified: new Date(),
      notificationPrefs: { create: {} },
    },
  });

  const resident = await prisma.user.upsert({
    where: { email: "resident.synthetic@cyberkent.test" },
    update: {},
    create: {
      email: "resident.synthetic@cyberkent.test",
      passwordHash: await unusable(),
      fullName: "Synthetic Resident",
      role: "RESIDENT",
      emailVerified: new Date(),
      notificationPrefs: { create: { emailOnAlerts: false } },
    },
  });

  return { admin, officer, resident };
}

async function seedReference() {
  for (const [slug, name, description] of CATEGORIES) {
    await prisma.scamCategory.upsert({ where: { slug }, update: { name, description }, create: { slug, name, description } });
  }

  for (const [name, postcode] of SUBURBS) {
    await prisma.suburb.upsert({ where: { name }, update: { postcode }, create: { name, postcode } });
  }

  for (const resource of RESOURCES) {
    await prisma.awarenessResource.upsert({
      where: { slug: resource.slug },
      update: resource,
      create: { ...resource, body: `${resource.summary} Read the full guide at /learn/${resource.slug}.` },
    });
  }

  const checklist = await prisma.recoveryChecklist.upsert({
    where: { slug: "first-hour" },
    update: {},
    create: {
      slug: "first-hour",
      title: "The first hour after you have been scammed",
      situation: "You have paid, tapped a link, or shared details you should not have.",
    },
  });

  for (const [index, [title, detail]] of FIRST_HOUR_STEPS.entries()) {
    await prisma.recoveryStep.upsert({
      where: { checklistId_position: { checklistId: checklist.id, position: index + 1 } },
      update: { title, detail },
      create: { checklistId: checklist.id, position: index + 1, title, detail },
    });
  }
}

/** One of each workflow object, so every table with a relation has a row to show it. */
async function seedSynthetic(people: Awaited<ReturnType<typeof seedAccounts>>) {
  const toll = await prisma.scamCategory.findUniqueOrThrow({ where: { slug: "toll-and-fines" } });
  const craigieburn = await prisma.suburb.findUniqueOrThrow({ where: { name: "Craigieburn" } });

  const indicator = await prisma.indicator.upsert({
    where: { type_value: { type: "DOMAIN", value: "pay-toll.online" } },
    update: {},
    create: {
      type: "DOMAIN",
      value: "pay-toll.online",
      reportCount: 1,
      verificationStatus: "VERIFIED",
      confidence: 0.95,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    },
  });

  const report = await prisma.report.upsert({
    where: { reference: "HCC-SYN-0001" },
    update: {},
    create: {
      reference: "HCC-SYN-0001",
      authorId: people.resident.id,
      reviewerId: people.officer.id,
      categoryId: toll.id,
      suburbId: craigieburn.id,
      channel: "SMS",
      status: "APPROVED",
      severity: "MEDIUM",
      title: "SYNTHETIC — fake toll text asking for $4.20",
      description: "Synthetic record for development. A text claiming an unpaid toll with a link to a lookalike payment page.",
      occurredAt: new Date("2026-09-01T09:30:00+10:00"),
      submittedAt: new Date("2026-09-01T10:05:00+10:00"),
      retentionUntil: new Date("2033-09-01T00:00:00+10:00"),
      indicators: { create: { indicatorId: indicator.id } },
      reviews: {
        create: {
          reviewerId: people.officer.id,
          decision: "APPROVED",
          severity: "MEDIUM",
          notes: "Synthetic review: lookalike domain confirmed; alert drafted with reporter details removed.",
        },
      },
    },
  });

  const specimen = "SYNTHETIC — LINKT: You have an unpaid toll of $4.20. Settle now: linkt-au.pay-toll.online";

  if (await prisma.scamCheck.findFirst({ where: { content: specimen } })) {
    return;
  }

  await prisma.scamCheck.create({
    data: {
      channel: "SMS",
      content: specimen,
      score: 96,
      band: "HIGH",
      confidence: 0.86,
      ruleSetVersion: RULE_SET_VERSION,
      retentionUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      indicators: {
        create: [
          { ruleId: "urgency", label: "Urgency language", detail: "Pressure to act inside a deadline.", weight: "HIGH", evidence: "Settle now" },
          { ruleId: "link-lookalike", label: "Lookalike domain", detail: "Names linkt but is registered to pay-toll.online.", weight: "HIGH", evidence: "linkt-au.pay-toll[.]online" },
        ],
      },
    },
  });

  /* ER-2: a published alert carries no link to its report — the CHECK
     constraint added in migration 20260910100000 would refuse one that did. */
  await prisma.alert.upsert({
    where: { reference: "ALERT-SYN-0001" },
    update: {},
    create: {
      reference: "ALERT-SYN-0001",
      categoryId: toll.id,
      suburbId: craigieburn.id,
      channel: "SMS",
      status: "PUBLISHED",
      severity: "MEDIUM",
      headline: "SYNTHETIC — Fake toll texts circulating in Craigieburn",
      specimen: "LINKT: You have an unpaid toll of $4.20 … Settle now: [link removed]",
      summary: "Texts claiming an unpaid toll link to a fake payment page. Linkt does not send payment links by text; check your account at linkt.com.au.",
      authorId: people.officer.id,
      approvedById: people.admin.id,
      publishedAt: new Date("2026-09-02T08:00:00+10:00"),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: people.admin.id,
      action: "ALERT_PUBLISHED",
      entityType: "Alert",
      entityId: "ALERT-SYN-0001",
      metadata: { synthetic: true, sourceReportSevered: true, report: report.reference },
      retentionUntil: new Date("2033-09-02T00:00:00+10:00"),
    },
  });
}

async function main() {
  await seedReference();
  const people = await seedAccounts();
  await seedSynthetic(people);

  const counts = await Promise.all([
    prisma.scamCategory.count(),
    prisma.suburb.count(),
    prisma.awarenessResource.count(),
    prisma.recoveryStep.count(),
    prisma.user.count(),
  ]);

  console.log(`Seeded: ${counts[0]} categories, ${counts[1]} suburbs, ${counts[2]} resources, ${counts[3]} recovery steps, ${counts[4]} users.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
