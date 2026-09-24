import { describe, expect, it } from "vitest";
import { deidentify } from "@/lib/deidentify";
import { sniff, stripMetadata } from "@/lib/files";
import { decrypt, encrypt } from "@/lib/storage";
import { councilStats, K_ANONYMITY } from "@/modules/council/council.stats";
import { api, person, submitReport } from "./helpers";

describe("de-identification (FR50)", () => {
  it("removes names, contact details, numbers and addresses, and defangs links", () => {
    const { text } = deidentify("Hi Priya, card 4564 1234 5678 9012. Call +61 412 345 678 or help@bank-secure.test. 12 Pascoe Vale Road. Visit https://bank-secure.top/verify.", { names: ["Priya Sharma"] });
    expect(text).not.toMatch(/Priya|4564|412 345|help@|Pascoe/);
    expect(text).toContain("bank-secure[.]top/verify.");
  });
});

describe("evidence handling (FR32, ER-5)", () => {
  it("reads a file's type from its bytes", () => {
    expect(sniff(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))?.mime).toBe("image/jpeg");
    expect(sniff(Buffer.from("MZ\x90\x00", "latin1"))).toBeNull();
    expect(sniff(Buffer.from("<script>alert(1)</script>"))).toBeNull();
  });

  it("strips EXIF from a JPEG and encrypts at rest", async () => {
    const { readFile } = await import("node:fs/promises");
    const photo = await readFile(new URL("../../frontend/src/lib/scam/__check__/fixtures/phone-photo-with-gps.jpg", import.meta.url));
    const kind = sniff(photo)!;
    const cleaned = stripMetadata(kind, photo);
    expect(photo.includes("Exif")).toBe(true);
    expect(cleaned.bytes.includes("Exif")).toBe(false);
    const sealed = encrypt(cleaned.bytes);
    expect(sealed.includes(cleaned.bytes.subarray(100, 140))).toBe(false);
    expect(decrypt(sealed).equals(cleaned.bytes)).toBe(true);
  });

  it("accepts a real photo on a report and refuses a disguised executable", async () => {
    const resident = await person();
    const reference = await submitReport(resident.auth);
    const { readFile } = await import("node:fs/promises");
    const photo = await readFile(new URL("../../frontend/src/lib/scam/__check__/fixtures/phone-photo-with-gps.jpg", import.meta.url));

    const ok = await api().post(`/api/reports/${reference}/evidence`).set(resident.auth).set("Content-Type", "application/octet-stream").set("X-File-Name", "photo.jpg").send(photo);
    expect(ok.status).toBe(201);
    expect(ok.body.data.file.metadataStripped).toBe(true);

    const bad = await api().post(`/api/reports/${reference}/evidence`).set(resident.auth).set("Content-Type", "application/octet-stream").set("X-File-Name", "photo.jpg").send(Buffer.from("MZ\x90\x00 not a photo", "latin1"));
    expect(bad.status).toBe(415);

    const stranger = await person();
    expect((await api().get(`/api/reports/${reference}/evidence/${ok.body.data.file.id}`).set(stranger.auth)).status).toBe(404);
  });
});

describe("published numbers are k-anonymous (FR71, ETH-4)", () => {
  it("never exports a cell smaller than k with its count", async () => {
    const { rows } = await councilStats.exportRows(730);
    for (const row of rows) {
      if (!row.reports.startsWith("<")) expect(Number(row.reports)).toBeGreaterThanOrEqual(K_ANONYMITY);
    }
  });

  it("never publishes a suburb count under k on the map", async () => {
    const map = await api().get("/api/insights/map?days=365");
    for (const area of map.body.data.areas) {
      if (area.reports !== null && area.reports !== 0) expect(area.reports).toBeGreaterThanOrEqual(K_ANONYMITY);
    }
  });
});

describe("indicator matching (FR24)", () => {
  it("matches a reported number in another format, and a URL by its domain", async () => {
    const resident = await person();
    await submitReport(resident.auth, { indicators: [{ type: "PHONE", value: "0491 570 199" }, { type: "URL", value: "https://match-me.test/a" }] });
    const response = await api().post("/api/indicators/lookup").send({ items: [{ type: "PHONE", value: "+61491570199" }, { type: "URL", value: "http://www.match-me.test/other?x=1" }] });
    const [phone, link] = response.body.data.results;
    expect(phone.reportCount).toBeGreaterThanOrEqual(1);
    expect(link.matchedOn).toBe("domain");
  });
});
