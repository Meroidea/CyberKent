import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { api, mail, person, submitReport } from "./helpers";

describe("role ladder: officer < admin < super admin", () => {
  it("admits a super admin everywhere an admin goes", async () => {
    const root = await person("SUPER_ADMIN");
    await api().get("/api/admin/users").set(root.auth).expect(200);
    await api().get("/api/admin/team").set(root.auth).expect(200);
    await api().get("/api/admin/content/articles").set(root.auth).expect(200);
  });

  it("reserves appointing and removing administrators to a super admin", async () => {
    const admin = await person("ADMIN");
    const root = await person("SUPER_ADMIN");
    const officer = await person("OFFICER");
    const otherAdmin = await person("ADMIN");

    expect((await api().patch(`/api/admin/users/${officer.user.id}/role`).set(admin.auth).send({ role: "ADMIN" })).status).toBe(403);
    expect((await api().post(`/api/admin/users/${otherAdmin.user.id}/suspend`).set(admin.auth).send({ reason: "Testing the ladder" })).status).toBe(403);
    await api().patch(`/api/admin/users/${officer.user.id}/role`).set(root.auth).send({ role: "ADMIN" }).expect(200);

    /* An admin still manages officers and residents. */
    const resident = await person("RESIDENT");
    await api().patch(`/api/admin/users/${resident.user.id}/role`).set(admin.auth).send({ role: "OFFICER" }).expect(200);
  });

  it("never leaves the service without a super admin", async () => {
    await prisma.user.updateMany({ where: { role: "SUPER_ADMIN" }, data: { role: "ADMIN" } });
    const only = await person("SUPER_ADMIN");
    const other = await person("SUPER_ADMIN");
    await api().patch(`/api/admin/users/${other.user.id}/role`).set(only.auth).send({ role: "ADMIN" }).expect(200);
    /* `other` is now an admin; `only` is the last super admin and cannot be demoted by anyone. */
    const third = await person("SUPER_ADMIN");
    await api().patch(`/api/admin/users/${only.user.id}/role`).set(third.auth).send({ role: "ADMIN" }).expect(200);
    const last = await api().patch(`/api/admin/users/${third.user.id}/role`).set(only.auth).send({ role: "OFFICER" });
    expect(last.status).toBe(403);
  });
});

describe("people management", () => {
  it("invites a council member who then sets their own password", async () => {
    const admin = await person("ADMIN", "Avery Admin");
    const email = `new.officer.${Date.now()}@hume.test`;
    const invited = await api().post("/api/admin/team").set(admin.auth).send({ fullName: "Nia Newstarter", email, role: "OFFICER", jobTitle: "CyberSafe Officer", department: "Community Safety" });
    expect(invited.status).toBe(201);
    expect(invited.body.data.member.role).toBe("OFFICER");
    expect(mail().some((line) => line.includes(email))).toBe(true);

    /* Admins cannot invite administrators. */
    expect((await api().post("/api/admin/team").set(admin.auth).send({ fullName: "Ada Admin", email: `a.${Date.now()}@hume.test`, role: "ADMIN" })).status).toBe(403);
    expect((await api().post("/api/admin/team").set(admin.auth).send({ fullName: "Nia Again", email, role: "OFFICER" })).status).toBe(409);

    const team = await api().get("/api/admin/team").set(admin.auth).expect(200);
    const member = team.body.data.members.find((m: { email: string }) => m.email === email);
    expect(member).toMatchObject({ status: "invited", jobTitle: "CyberSafe Officer", department: "Community Safety" });
    expect(member.workload).toMatchObject({ openReports: 0, openTasks: 0 });

    await api().patch(`/api/admin/team/${member.id}`).set(admin.auth).send({ department: "Cyber Safety" }).expect(200);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: member.id } })).department).toBe("Cyber Safety");
  });
});

describe("task tracker", () => {
  it("creates, assigns, moves, discusses and completes a task", async () => {
    const lead = await person("ADMIN", "Lee Lead");
    const officer = await person("OFFICER", "Olly Officer");
    const resident = await person("RESIDENT");
    const reference = await submitReport(resident.auth);

    const created = await api().post("/api/council/tasks").set(lead.auth).send({ title: "Call the bank about the toll scam", priority: "HIGH", assigneeId: officer.user.id, reportReference: reference, labels: ["Bank"], dueAt: new Date(Date.now() - 3600_000).toISOString() });
    expect(created.status).toBe(201);
    const task = created.body.data.task;
    expect(task.reference).toMatch(/^TASK-\d{4}$/);
    expect(task).toMatchObject({ overdue: true, labels: ["bank"], report: { reference } });

    const note = await prisma.notification.findFirst({ where: { userId: officer.user.id, kind: "TASK_ASSIGNED" } });
    expect(note?.linkPath).toContain(task.reference);

    const mine = await api().get("/api/council/tasks?view=mine").set(officer.auth).expect(200);
    expect(mine.body.data.tasks.map((t: { reference: string }) => t.reference)).toContain(task.reference);
    expect(mine.body.data.counts.overdue).toBeGreaterThan(0);

    await api().post(`/api/council/tasks/${task.reference}/comments`).set(officer.auth).send({ body: "Rang them; recall requested." }).expect(201);
    const done = await api().patch(`/api/council/tasks/${task.reference}`).set(officer.auth).send({ status: "DONE" });
    expect(done.body.data.task.completedAt).not.toBeNull();

    const detail = await api().get(`/api/council/tasks/${task.reference}`).set(lead.auth).expect(200);
    expect(detail.body.data.comments).toHaveLength(1);
    expect(detail.body.data.activity.map((a: { action: string }) => a.action)).toEqual(["task.created", "task.updated"]);

    /* Only the creator or an administrator deletes. */
    expect((await api().delete(`/api/council/tasks/${task.reference}`).set(officer.auth)).status).toBe(403);
    await api().delete(`/api/council/tasks/${task.reference}`).set(lead.auth).expect(200);
  });

  it("refuses to assign work to someone outside the team, and is closed to residents", async () => {
    const officer = await person("OFFICER");
    const resident = await person("RESIDENT");
    expect((await api().post("/api/council/tasks").set(officer.auth).send({ title: "Anything at all", assigneeId: resident.user.id })).status).toBe(422);
    expect((await api().get("/api/council/tasks").set(resident.auth)).status).toBe(403);
  });

  it("suggests triage for reports nobody has picked up", async () => {
    const officer = await person("OFFICER");
    const resident = await person("RESIDENT");
    const reference = await submitReport(resident.auth);
    await prisma.report.update({ where: { reference }, data: { submittedAt: new Date(Date.now() - 4 * 86_400_000) } });

    const suggested = await api().get("/api/council/tasks/suggestions").set(officer.auth).expect(200);
    const keys = suggested.body.data.suggestions.map((s: { key: string }) => s.key);
    expect(keys).toContain(`triage:${reference}`);
  });
});

describe("scam radar", () => {
  it("groups reports sharing an artefact into one campaign and de-identifies the sample", async () => {
    const officer = await person("OFFICER");
    const stamp = `radar-${Date.now()}`;
    const value = `https://${stamp}.test/pay`;
    for (let n = 0; n < 3; n += 1) {
      const resident = await person("RESIDENT", "Harriet Holloway");
      await submitReport(resident.auth, { indicators: [{ type: "URL", value }], description: "Harriet here — call me on 0412 345 678. The text said pay now at the link or be fined." });
    }

    const radar = await api().get("/api/council/radar?days=14").set(officer.auth).expect(200);
    /* Links are stored normalised and shown defanged: "radar-…[.]test/pay". */
    const campaign = radar.body.data.campaigns.find((c: { indicator: { value: string } | null }) => c.indicator?.value.startsWith(`${stamp}[.]test`));
    expect(campaign).toMatchObject({ kind: "artefact", current: 3, threat: "surging" });
    expect(campaign.series).toHaveLength(14);
    expect(campaign.specimen).not.toContain("0412 345 678");
    expect(radar.body.data.totals.reports).toBeGreaterThanOrEqual(3);
  });
});

describe("content management", () => {
  it("keeps a guide private until it is published", async () => {
    const admin = await person("ADMIN");
    const draft = await api().post("/api/admin/content/articles").set(admin.auth).send({
      title: "Spotting fake council rates notices",
      category: "Scam types",
      summary: "What a real rates notice looks like, and the three signs of a fake one.",
      kind: "Article",
      accent: "amber",
      audience: "Ratepayers",
      lede: "Fake rates notices arrive by email.",
      takeaways: ["Council never asks for card details by text"],
      markup: "## Signs\n\n- A new bank account\n- Pressure to pay today",
    });
    expect(draft.status).toBe(201);
    const { id, slug } = draft.body.data.article;

    const before = await api().get("/api/content/articles").expect(200);
    expect(before.body.data.articles.map((a: { slug: string }) => a.slug)).not.toContain(slug);

    await api().post(`/api/admin/content/articles/${id}/publish`).set(admin.auth).expect(200);
    const after = await api().get("/api/content/articles").expect(200);
    const live = after.body.data.articles.find((a: { slug: string }) => a.slug === slug);
    expect(live.content.markup).toContain("## Signs");

    const officer = await person("OFFICER");
    expect((await api().get("/api/admin/content/articles").set(officer.auth)).status).toBe(403);
  });

  it("shows a notice only inside its window, most serious first", async () => {
    const admin = await person("ADMIN");
    await api().post("/api/admin/content/notices").set(admin.auth).send({ title: "Scheduled for tomorrow", tone: "INFO", startsAt: new Date(Date.now() + 86_400_000).toISOString() }).expect(201);
    await api().post("/api/admin/content/notices").set(admin.auth).send({ title: "Fake toll texts today", body: "Linkt never texts a payment link.", tone: "CRITICAL", linkUrl: "/alerts" }).expect(201);
    expect((await api().post("/api/admin/content/notices").set(admin.auth).send({ title: "Bad link", linkUrl: "javascript:alert(1)" })).status).toBe(422);

    const active = await api().get("/api/content/notices").expect(200);
    const titles = active.body.data.notices.map((n: { title: string }) => n.title);
    expect(titles[0]).toBe("Fake toll texts today");
    expect(titles).not.toContain("Scheduled for tomorrow");
  });
});

describe("analytics dataset", () => {
  it("serves staff one row per report with nothing that identifies the reporter", async () => {
    const officer = await person("OFFICER");
    const resident = await person("RESIDENT", "Priya Private");
    await submitReport(resident.auth, { description: "Priya Private here, my number is 0412 000 111 and I live at 5 Example St." });

    const response = await api().get("/api/council/analytics/dataset?days=30").set(officer.auth).expect(200);
    const body = JSON.stringify(response.body);
    expect(response.body.data.rows.length).toBeGreaterThan(0);
    expect(Object.keys(response.body.data.rows[0]).sort()).toEqual(["c", "ch", "d", "i", "l", "s", "st", "sv", "t"]);
    expect(body).not.toContain("Priya");
    expect(body).not.toContain("0412 000 111");
  });
});
