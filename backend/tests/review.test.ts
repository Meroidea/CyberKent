import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { api, category, person, submitReport } from "./helpers";

describe("review workflow (FR37–FR42)", () => {
  it("takes a report from received to verified, telling the reporter at each step", async () => {
    const resident = await person("RESIDENT", "Rita Reporter");
    const officer = await person("OFFICER");
    const reference = await submitReport(resident.auth);

    const queue = await api().get("/api/council/reports?view=unassigned&pageSize=100").set(officer.auth);
    const item = queue.body.data.items.find((row: { reference: string }) => row.reference === reference);
    expect(item.priority.reasons).toContain("Not yet triaged");

    const started = await api().post(`/api/council/reports/${reference}/start`).set(officer.auth);
    expect(started.body.data.report.status).toBe("UNDER_REVIEW");
    expect(started.body.data.report.reviewer.id).toBe(officer.user.id);
    expect((await api().post(`/api/council/reports/${reference}/start`).set(officer.auth)).status).toBe(409);

    const toll = await category();
    await api().patch(`/api/council/reports/${reference}/triage`).set(officer.auth).send({ severity: "HIGH", categoryId: toll.id }).expect(200);

    const asked = await api().post(`/api/council/reports/${reference}/request-info`).set(officer.auth).send({ message: "Did you give them a one-time code?" });
    expect(asked.body.data.report.status).toBe("INFORMATION_REQUESTED");

    const mine = await api().get(`/api/reports/${reference}`).set(resident.auth);
    const question = mine.body.data.report.infoRequests[0];
    await api().post(`/api/reports/${reference}/requests/${question.id}/respond`).set(resident.auth).send({ response: "No, I did not." }).expect(200);

    expect((await api().post(`/api/council/reports/${reference}/decision`).set(officer.auth).send({ decision: "APPROVED", reason: "short" })).status).toBe(422);
    const decided = await api().post(`/api/council/reports/${reference}/decision`).set(officer.auth).send({ decision: "APPROVED", reason: "Lookalike domain confirmed against the campaign." });
    expect(decided.body.data.report.status).toBe("APPROVED");

    const notices = await prisma.notification.findMany({ where: { userId: resident.user.id }, select: { kind: true } });
    expect(notices.map((n) => n.kind)).toEqual(expect.arrayContaining(["REPORT_SUBMITTED", "INFORMATION_REQUESTED", "REPORT_STATUS_CHANGED"]));

    const audit = await prisma.auditLog.findMany({ where: { entityType: "Report", userId: officer.user.id }, select: { action: true } });
    expect(audit.map((a) => a.action)).toEqual(expect.arrayContaining(["report.review_started", "report.triaged", "report.approved"]));

    /* A decided report no longer takes answers. */
    const resent = await api().post(`/api/reports/${reference}/requests/${question.id}/respond`).set(resident.auth).send({ response: "again" });
    expect(resent.status).toBe(409);
  });

  it("refuses to verify without a severity", async () => {
    const resident = await person();
    const officer = await person("OFFICER");
    const reference = await submitReport(resident.auth);
    const response = await api().post(`/api/council/reports/${reference}/decision`).set(officer.auth).send({ decision: "APPROVED", reason: "Looks like the toll campaign." });
    expect(response.status).toBe(422);
  });

  it("suggests an identical second report as a duplicate, and links only when asked", async () => {
    const resident = await person();
    const officer = await person("OFFICER");
    const first = await submitReport(resident.auth, { indicators: [{ type: "PHONE", value: "0491 570 110" }] });
    const second = await submitReport(resident.auth, { indicators: [{ type: "PHONE", value: "+61 491 570 110" }] });

    const similar = await api().get(`/api/council/reports/${second}/similar`).set(officer.auth);
    const match = similar.body.data.candidates.find((row: { reference: string }) => row.reference === first);
    expect(match.suggestion).toBe("DUPLICATE");
    expect(match.linked).toBeNull();

    await api().post(`/api/council/reports/${second}/links`).set(officer.auth).send({ targetReference: first, kind: "DUPLICATE" }).expect(200);
    const detail = await api().get(`/api/council/reports/${first}`).set(officer.auth);
    expect(detail.body.data.report.links[0]).toMatchObject({ reference: second, kind: "DUPLICATE" });
  });
});
