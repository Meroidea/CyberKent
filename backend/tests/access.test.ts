import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { api, person } from "./helpers";

describe("staff access control (FR10, Rule 6.3)", () => {
  it("refuses Council routes without a session, and to residents", async () => {
    expect((await api().get("/api/council/reports")).status).toBe(401);
    const resident = await person("RESIDENT");
    expect((await api().get("/api/council/reports").set(resident.auth)).status).toBe(403);
    expect((await api().get("/api/admin/users").set(resident.auth)).status).toBe(403);
  });

  it("lets officers into the queue but not administration", async () => {
    const officer = await person("OFFICER");
    expect((await api().get("/api/council/reports").set(officer.auth)).status).toBe(200);
    expect((await api().get("/api/admin/users").set(officer.auth)).status).toBe(403);
  });

  it("revokes a demoted officer on the next request, not at token expiry", async () => {
    const officer = await person("OFFICER");
    const admin = await person("ADMIN");
    expect((await api().get("/api/council/staff").set(officer.auth)).status).toBe(200);

    const demoted = await api().patch(`/api/admin/users/${officer.user.id}/role`).set(admin.auth).send({ role: "RESIDENT" });
    expect(demoted.status).toBe(200);
    expect((await api().get("/api/council/staff").set(officer.auth)).status).toBe(403);
  });

  it("revokes a suspended account immediately and returns its reports to the queue", async () => {
    const officer = await person("OFFICER");
    const admin = await person("ADMIN");
    const resident = await person("RESIDENT");
    const report = await prisma.report.create({
      data: { reference: `HCC-T-${Date.now()}`, authorId: resident.user.id, reviewerId: officer.user.id, channel: "SMS", status: "UNDER_REVIEW", title: "t", description: "d", submittedAt: new Date() },
    });

    const suspended = await api().post(`/api/admin/users/${officer.user.id}/suspend`).set(admin.auth).send({ reason: "Left the team" });
    expect(suspended.status).toBe(200);
    expect(suspended.body.data.releasedReports).toBe(1);
    expect((await prisma.report.findUniqueOrThrow({ where: { id: report.id } })).reviewerId).toBeNull();
    expect((await api().get("/api/council/staff").set(officer.auth)).status).toBe(401);
  });

  it("stops an administrator removing their own access or the last administrator", async () => {
    const admin = await person("ADMIN");
    expect((await api().patch(`/api/admin/users/${admin.user.id}/role`).set(admin.auth).send({ role: "RESIDENT" })).status).toBe(409);
  });
});
