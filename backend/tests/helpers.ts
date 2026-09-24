import crypto from "node:crypto";
import type { Role } from "@prisma/client";
import request from "supertest";
import { createApp } from "@/app";
import { prisma } from "@/lib/prisma";
import { issueAccessToken } from "@/modules/auth/auth.service";

export const app = createApp();
export const api = () => request(app);

/** A person with a role and a signed session, created directly — no sign-in, so no rate limit. */
export async function person(role: Role = "RESIDENT", name = "Test Person") {
  const user = await prisma.user.create({
    data: {
      email: `${role.toLowerCase()}.${crypto.randomUUID()}@tests.cyberkent.test`,
      passwordHash: "x",
      fullName: name,
      role,
      emailVerified: new Date(),
      notificationPrefs: { create: {} },
    },
  });
  return { user, token: issueAccessToken(user), auth: { Authorization: `Bearer ${issueAccessToken(user)}` } };
}

export async function category(slug = "toll-and-fines") {
  return prisma.scamCategory.findUniqueOrThrow({ where: { slug } });
}

/** A report submitted through the API, as a resident would. */
export async function submitReport(auth: Record<string, string>, overrides: Record<string, unknown> = {}) {
  const response = await api()
    .post("/api/reports")
    .set(auth)
    .send({
      channel: "SMS",
      title: "Text about an unpaid toll",
      description: "A text said I owed a toll and linked to a payment page asking for my card number.",
      indicators: [{ type: "URL", value: `https://toll-${crypto.randomUUID().slice(0, 8)}.test/pay` }],
      ...overrides,
    });
  if (response.status !== 201) throw new Error(`report failed: ${response.status} ${JSON.stringify(response.body)}`);
  return response.body.data.reference as string;
}

export function mail(): string[] {
  return (globalThis as { __mail?: string[] }).__mail ?? [];
}
