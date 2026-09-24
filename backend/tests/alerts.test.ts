import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { api, category, mail, person, submitReport } from "./helpers";

async function verifiedReport() {
  const resident = await person("RESIDENT", "Priya Sharma");
  const officer = await person("OFFICER");
  const reference = await submitReport(resident.auth, { description: "Hi Priya, your toll is overdue. Pay at linkt-pay.test or call 0412 345 678." });
  await api().post(`/api/council/reports/${reference}/decision`).set(officer.auth).send({ decision: "APPROVED", severity: "HIGH", reason: "Confirmed lookalike toll site." }).expect(200);
  return { reference, officer };
}

describe("community alerts (FR49–FR54)", () => {
  it("de-identifies a draft, needs a second officer, and severs the report link on publish", async () => {
    const { reference, officer } = await verifiedReport();
    const second = await person("OFFICER");

    const { suggestion } = (await api().get(`/api/council/alerts/suggest/${reference}`).set(officer.auth)).body.data;
    expect(suggestion.specimen).not.toMatch(/Priya|0412/);
    expect(suggestion.specimen).toContain("linkt-pay[.]test");

    const { redactions: _r, ...draft } = suggestion;
    const created = await api().post("/api/council/alerts").set(officer.auth).send(draft);
    const id = created.body.data.alert.id;
    await api().post(`/api/council/alerts/${id}/submit`).set(officer.auth).expect(200);

    expect((await api().post(`/api/council/alerts/${id}/approve`).set(officer.auth)).status).toBe(403);

    await api().patch(`/api/council/alerts/${id}`).set(officer.auth).send({ specimen: "Call 0412 345 678" }).expect(200);
    expect((await api().post(`/api/council/alerts/${id}/approve`).set(second.auth)).status).toBe(422);
    await api().patch(`/api/council/alerts/${id}`).set(officer.auth).send({ specimen: "Pay your toll at linkt-pay[.]test" }).expect(200);

    const published = await api().post(`/api/council/alerts/${id}/approve`).set(second.auth);
    expect(published.body.data.alert.status).toBe("PUBLISHED");
    expect((await prisma.alert.findUniqueOrThrow({ where: { id } })).sourceReportId).toBeNull();

    const feed = await api().get("/api/alerts?q=linkt-pay.test");
    const shown = feed.body.data.alerts.find((alert: { reference: string }) => alert.reference === published.body.data.alert.reference);
    expect(shown).toBeDefined();
    expect(shown).not.toHaveProperty("author");
    expect(shown).not.toHaveProperty("sourceReport");
  });

  it("emails matching subscribers once, with a working one-click unsubscribe", async () => {
    const toll = await category();
    const email = `sub.${Date.now()}@tests.cyberkent.test`;
    const subscribed = await api().post("/api/subscriptions").send({ email, scope: "CATEGORY", categoryId: toll.id });
    expect(subscribed.body.data.status).toBe("pending");
    const token = new URL(subscribed.body.data.devLink).searchParams.get("token");
    await api().post("/api/subscriptions/confirm").send({ token }).expect(200);
    await api().post("/api/subscriptions").send({ email, scope: "ALL" });

    const { reference, officer } = await verifiedReport();
    const second = await person("OFFICER");
    const { redactions: _r, ...draft } = (await api().get(`/api/council/alerts/suggest/${reference}`).set(officer.auth)).body.data.suggestion;
    const id = (await api().post("/api/council/alerts").set(officer.auth).send({ ...draft, categoryId: toll.id })).body.data.alert.id;
    await api().post(`/api/council/alerts/${id}/submit`).set(officer.auth);

    const before = mail().length;
    await api().post(`/api/council/alerts/${id}/approve`).set(second.auth).expect(200);
    const sent = mail().slice(before).filter((line) => line.includes(email));
    expect(sent).toHaveLength(1);

    const unsubscribe = /unsubscribe\?token=(\S+)/.exec(sent[0]!)![1]!;
    await api().post("/api/subscriptions/unsubscribe").send({ token: decodeURIComponent(unsubscribe) }).expect(200);
    const rows = await prisma.subscription.findMany({ where: { email, scope: "CATEGORY" } });
    expect(rows[0]!.unsubscribedAt).not.toBeNull();
  });
});
