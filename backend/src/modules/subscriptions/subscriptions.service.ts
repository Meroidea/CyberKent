import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { Prisma, SubscriptionScope } from "@prisma/client";
import { env } from "@/config/env";
import { audit } from "@/lib/audit";
import { hashToken } from "@/lib/crypto";
import { AppError } from "@/lib/http";
import { emailDeliveryAvailable, sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { SITE_NAME } from "@/lib/site";
import { onAlertPublished } from "@/modules/alerts/alerts.service";
import type { PublicAlertRow } from "@/modules/alerts/alerts.repository";

/**
 * Module 11 — alert subscriptions (FR64–FR66) and the alert notice they
 * trigger.
 *
 * No account is needed (FR85's spirit): a resident gives an address and a
 * scope — a scam type, a suburb, or everything. An address that is not
 * provably the subscriber's own is confirmed by a link first, so nobody can
 * sign someone else up for mail.
 *
 * Two tokens, neither stored in plain form:
 *
 * - **Confirm** — a signed, week-long token naming the subscription.
 * - **Unsubscribe** — an HMAC of the subscription's natural key under the
 *   signing secret. Derivable, so every alert email can carry it without the
 *   token ever being kept; only its SHA-256 is stored, in the column the
 *   schema reserves for it. One click, no login (FR66).
 */

const CONFIRM_PURPOSE = "alert-subscription-confirm";

function unsubscribeToken(key: { email: string; scope: SubscriptionScope; categoryId: string | null; suburbId: string | null }) {
  return crypto
    .createHmac("sha256", env.JWT_SECRET)
    .update(["unsubscribe", key.email, key.scope, key.categoryId ?? "", key.suburbId ?? ""].join("\u0000"))
    .digest("base64url");
}

function confirmToken(subscriptionId: string) {
  return jwt.sign({ sub: subscriptionId, purpose: CONFIRM_PURPOSE }, env.JWT_SECRET, { expiresIn: "7d" });
}

const select = {
  id: true,
  email: true,
  scope: true,
  confirmedAt: true,
  unsubscribedAt: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
  suburb: { select: { id: true, name: true } },
} satisfies Prisma.SubscriptionSelect;

type Row = Prisma.SubscriptionGetPayload<{ select: typeof select }>;

function toView(row: Row) {
  return {
    id: row.id,
    email: row.email,
    scope: row.scope,
    category: row.category,
    suburb: row.suburb,
    confirmed: row.confirmedAt !== null,
    createdAt: row.createdAt.toISOString(),
  };
}

function scopeLabel(row: { scope: SubscriptionScope; category: { name: string } | null; suburb: { name: string } | null }) {
  return row.scope === "ALL" ? "every alert in Hume" : row.scope === "CATEGORY" ? `${row.category?.name ?? "one type of"} scams` : `alerts for ${row.suburb?.name ?? "one suburb"}`;
}

export interface SubscribeInput {
  email: string;
  scope: SubscriptionScope;
  categoryId?: string;
  suburbId?: string;
}

export const subscriptionsService = {
  /**
   * FR64, FR65. Idempotent: subscribing twice to the same thing is the same
   * subscription, re-activated if it had lapsed.
   */
  async subscribe(input: SubscribeInput, caller?: { id: string }, ipAddress?: string) {
    const email = input.email.trim().toLowerCase();
    const categoryId = input.scope === "CATEGORY" ? (input.categoryId ?? null) : null;
    const suburbId = input.scope === "SUBURB" ? (input.suburbId ?? null) : null;

    if (input.scope === "CATEGORY" && (!categoryId || !(await prisma.scamCategory.count({ where: { id: categoryId, archivedAt: null } })))) {
      throw new AppError(422, "Choose a type of scam from the list.", [{ field: "categoryId", message: "Choose a type of scam." }]);
    }
    if (input.scope === "SUBURB" && (!suburbId || !(await prisma.suburb.count({ where: { id: suburbId } })))) {
      throw new AppError(422, "Choose a suburb from the list.", [{ field: "suburbId", message: "Choose a suburb." }]);
    }

    /* The subscriber's own, proved address needs no confirmation link. */
    const account = caller ? await prisma.user.findFirst({ where: { id: caller.id, deletedAt: null }, select: { id: true, email: true, emailVerified: true } }) : null;
    const ownAddress = account !== null && account.email === email && (account.emailVerified !== null || !emailDeliveryAvailable());

    const key = { email, scope: input.scope, categoryId, suburbId };
    const tokenHash = hashToken(unsubscribeToken(key));

    /* NULLs are distinct to the unique index, so the lookup is explicit. */
    const existing = await prisma.subscription.findFirst({ where: { email, scope: input.scope, categoryId, suburbId }, select: { id: true, confirmedAt: true, unsubscribedAt: true } });

    const row = existing
      ? await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            unsubscribedAt: null,
            userId: account?.email === email ? account.id : undefined,
            ...(ownAddress && !existing.confirmedAt ? { confirmedAt: new Date() } : {}),
          },
          select,
        })
      : await prisma.subscription.create({
          data: {
            email,
            scope: input.scope,
            categoryId,
            suburbId,
            userId: account?.email === email ? account.id : null,
            confirmedAt: ownAddress ? new Date() : null,
            unsubscribeTokenHash: tokenHash,
          },
          select,
        });

    await audit({ userId: account?.id ?? null, action: "subscription.created", entityType: "Subscription", entityId: row.id, ipAddress, metadata: { scope: input.scope, confirmed: row.confirmedAt !== null } });

    if (row.confirmedAt) {
      return { subscription: toView(row), status: "confirmed" as const };
    }

    if (!emailDeliveryAvailable()) {
      /* Honest about it: without mail, an unconfirmed address can never be
         confirmed, and pretending a link is on its way would be a lie. */
      return { subscription: toView(row), status: "unavailable" as const };
    }

    const link = `${env.appUrl}/alerts/subscribe/confirm?token=${encodeURIComponent(confirmToken(row.id))}`;
    await sendMail({
      to: email,
      subject: `Confirm your ${SITE_NAME} alerts`,
      text: `Hello,\n\nSomeone — hopefully you — asked to receive ${scopeLabel(row)} from ${SITE_NAME}, Hume City Council's scam alert service.\n\nConfirm here:\n${link}\n\nIf this was not you, ignore this email and nothing will be sent.\n\n— ${SITE_NAME}`,
    });

    return {
      subscription: toView(row),
      status: "pending" as const,
      /* Local development only, where the log is the inbox. */
      ...(!env.isProduction && !env.RESEND_API_KEY ? { devLink: link } : {}),
    };
  },

  async confirm(token: string) {
    let id: string;
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string; purpose?: string };
      if (payload.purpose !== CONFIRM_PURPOSE || !payload.sub) throw new Error("wrong purpose");
      id = payload.sub;
    } catch {
      throw new AppError(400, "That confirmation link has expired or is not valid. Subscribe again to get a new one.");
    }

    const row = await prisma.subscription.findUnique({ where: { id }, select });
    if (!row) throw new AppError(404, "That subscription no longer exists.");

    const confirmed = row.confirmedAt ? row : await prisma.subscription.update({ where: { id }, data: { confirmedAt: new Date(), unsubscribedAt: null }, select });
    await audit({ action: "subscription.confirmed", entityType: "Subscription", entityId: id });
    return toView(confirmed);
  },

  /** FR66 — from the link in any alert email. */
  async unsubscribe(token: string) {
    const row = await prisma.subscription.findUnique({ where: { unsubscribeTokenHash: hashToken(token) }, select });
    if (!row) throw new AppError(404, "That unsubscribe link is not valid. You may already be unsubscribed.");

    if (!row.unsubscribedAt) {
      await prisma.subscription.update({ where: { id: row.id }, data: { unsubscribedAt: new Date() } });
      await audit({ action: "subscription.cancelled", entityType: "Subscription", entityId: row.id, metadata: { via: "link" } });
    }
    return { ...toView(row), description: scopeLabel(row) };
  },

  async mine(userId: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: { email: true } });
    if (!user) throw new AppError(401, "Sign in to continue.");
    const rows = await prisma.subscription.findMany({
      where: { OR: [{ userId }, { email: user.email }], unsubscribedAt: null },
      select,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toView);
  },

  async cancelMine(userId: string, id: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: { email: true } });
    if (!user) throw new AppError(401, "Sign in to continue.");
    const result = await prisma.subscription.updateMany({ where: { id, OR: [{ userId }, { email: user.email }], unsubscribedAt: null }, data: { unsubscribedAt: new Date() } });
    if (result.count !== 1) throw new AppError(404, "That subscription is not on your account.");
    await audit({ userId, action: "subscription.cancelled", entityType: "Subscription", entityId: id, metadata: { via: "account" } });
    return this.mine(userId);
  },

  /**
   * FR64, FR65 — who hears about a newly published alert.
   *
   * Everyone subscribed to everything, to its category, or to its suburb;
   * each address once, however many of their subscriptions match. Account
   * holders get a dashboard notification too, and are emailed only if their
   * preferences allow it (FR11).
   */
  async announce(alert: PublicAlertRow & { id?: string }) {
    const match: Prisma.SubscriptionWhereInput[] = [{ scope: "ALL" }];
    if (alert.category) match.push({ scope: "CATEGORY", categoryId: alert.category.id });
    if (alert.suburb) match.push({ scope: "SUBURB", suburbId: alert.suburb.id });

    const rows = await prisma.subscription.findMany({
      where: { confirmedAt: { not: null }, unsubscribedAt: null, OR: match },
      select: {
        email: true,
        scope: true,
        categoryId: true,
        suburbId: true,
        user: { select: { id: true, deletedAt: true, notificationPrefs: { select: { emailOnAlerts: true } } } },
      },
    });

    const byEmail = new Map<string, (typeof rows)[number]>();
    for (const row of rows) if (!byEmail.has(row.email)) byEmail.set(row.email, row);

    const link = `${env.appUrl}/alerts/${alert.reference}`;
    const notified = new Set<string>();
    let emailed = 0;

    for (const row of byEmail.values()) {
      const user = row.user && !row.user.deletedAt ? row.user : null;

      if (user && !notified.has(user.id)) {
        notified.add(user.id);
        await prisma.notification.create({
          data: { userId: user.id, kind: "ALERT_PUBLISHED", title: alert.headline, body: `New ${alert.severity.toLowerCase()} severity alert${alert.suburb ? ` for ${alert.suburb.name}` : " for Hume"}.`, linkPath: `/alerts/${alert.reference}` },
        });
      }

      if (user && user.notificationPrefs && !user.notificationPrefs.emailOnAlerts) continue;

      const unsubscribe = `${env.appUrl}/alerts/unsubscribe?token=${encodeURIComponent(unsubscribeToken(row))}`;
      const sent = await sendMail({
        to: row.email,
        subject: `Scam alert: ${alert.headline}`,
        text: `${alert.headline}\n\n${alert.specimen ? `What the scam says:\n    ${alert.specimen.replace(/\n/g, "\n    ")}\n\n` : ""}${alert.summary}\n\nRead the alert: ${link}\n\nIf you have paid or shared details, call your bank on the number on your card now.\n\n— ${SITE_NAME}, Hume City Council\n\nYou get this because you subscribed to scam alerts. Unsubscribe with one click: ${unsubscribe}`,
      });
      if (sent) emailed += 1;
    }

    await audit({ action: "alert.announced", entityType: "Alert", entityId: alert.id ?? alert.reference, metadata: { reference: alert.reference, subscribers: byEmail.size, emailed, notified: notified.size } });
  },
};

/* Registered once, when the module loads — see alerts.service. */
onAlertPublished((alert) => subscriptionsService.announce(alert));
