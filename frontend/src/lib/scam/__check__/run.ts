import { analyse } from "@/lib/scam/analyse";
import { readEdits } from "@/lib/scam/forensics";
import { readFile, readMetadata } from "@/lib/scam/metadata";
import { assessOrigin } from "@/lib/scam/origin";
import { inspectStructure, withResolution } from "@/lib/scam/links";
import type { Channel } from "@/lib/scam/types";

const cases: { name: string; text: string; channel: Channel; expect: string }[] = [
  { name: "toll scam", channel: "sms", expect: "high",
    text: "LINKT: You have an unpaid toll of $4.20. Late fees apply within 24 hours. Settle now: linkt-au.pay-toll.online" },
  { name: "rates refund + bank details", channel: "email", expect: "high",
    text: "Hume City Council: our records show you overpaid your rates by $283.60. Reply with your BSB and account number to release the refund immediately or it will be cancelled." },
  { name: "gift card request", channel: "email", expect: "high",
    text: "Urgent - I need you to buy 5 gift cards for a client today. Do not tell anyone, I am in a meeting. Send the codes." },
  { name: "genuine council notice", channel: "email", expect: "low",
    text: "Your green waste collection day is changing from Tuesday to Thursday starting next month. More details are available on our website at hume.vic.gov.au/waste" },
  { name: "benign personal note", channel: "sms", expect: "low",
    text: "Hi, running about ten minutes late for the meeting. See you shortly at the cafe on the corner." },
  { name: "too short", channel: "sms", expect: "unclear", text: "hello" },
  { name: "raw IP link", channel: "email", expect: "high",
    text: "Please verify your identity at http://192.168.44.9/login to avoid your account being suspended permanently." },
];

let pass = 0;
for (const c of cases) {
  const r = analyse({ text: c.text, channel: c.channel });
  const ok = r.band === c.expect;
  if (ok) pass += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name.padEnd(28)} band=${r.band.padEnd(8)} score=${String(r.score).padStart(3)} conf=${r.confidence.toFixed(2)} ind=${r.indicators.length}`);
  if (!ok) console.log(`      expected ${c.expect}; got: ${r.indicators.slice(0, 4).map((i) => i.id).join(", ")}`);
}
console.log(`\n${pass}/${cases.length} band classifications correct`);
const t = analyse({ text: cases[0]!.text, channel: "sms" });
console.log("Extraction:", JSON.stringify(t.extracted));
console.log("Indicators:", t.indicators.map((i) => `${i.id}(${i.weight})`).join(" · "));

/* --- Media envelope rules (no file contents, name and type only) --- */
const mediaCases: { name: string; media: Parameters<typeof analyse>[0]["media"]; expect: string }[] = [
  { name: "invoice that is really a program", expect: "high",
    media: [{ name: "Invoice_4821.pdf.exe", size: 91000, type: "application/octet-stream", kind: "document" }] },
  { name: "macro-enabled doc", expect: "medium",
    media: [{ name: "remittance.docm", size: 44000, type: "application/vnd.ms-word.document.macroEnabled.12", kind: "document" }] },
  { name: "ordinary screenshot, no text read", expect: "unclear",
    media: [{ name: "photo.png", size: 220000, type: "image/png", kind: "image", unreadable: "No readable text was found in this image." }] },
  { name: "screenshot with a scam read out of it", expect: "high",
    media: [{ name: "sms.png", size: 220000, type: "image/png", kind: "image",
      extractedText: "LINKT: unpaid toll of $4.20, late fees apply within 24 hours. Settle now: linkt-au.pay-toll.online" }] },
];

console.log("");
for (const c of mediaCases) {
  const r = analyse({ text: "", channel: "email", media: c.media });
  const ok = r.band === c.expect;
  if (ok) pass += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name.padEnd(34)} band=${r.band.padEnd(9)} score=${String(r.score).padStart(3)} conf=${r.confidence.toFixed(2)} ind=${r.indicators.length}`);
  if (!ok) console.log(`      expected ${c.expect}; got: ${r.indicators.map((i) => i.id).join(", ")}`);
  console.log(`      examined: ${r.examined.map((e) => `${e.label} [${e.status}]`).join(" | ")}`);
}

/* --- Image origin: C2PA provenance and the on-device classifier ---
   Asserted on the indicator raised rather than on the band. A generated image
   is not by itself a scam, so these deliberately do not move the score far —
   what matters is that the right finding is raised, and that silence and a
   missing model both stay silent. */
const base = { name: "shot.jpg", size: 180000, type: "image/jpeg", kind: "image" as const };

const originCases: { name: string; media: Parameters<typeof analyse>[0]["media"]; expectId: string | null }[] = [
  { name: "signed manifest says AI", expectId: "image-declared-ai-shot.jpg",
    media: [{ ...base, provenance: { status: "declared-ai", generator: "Firefly", detail: "signed: generated" } }] },
  { name: "signed manifest says camera", expectId: null,
    media: [{ ...base, provenance: { status: "declared-capture", detail: "signed: captured" } }] },
  { name: "unsigned EXIF names a generator", expectId: "image-origin-shot.jpg",
    media: [{ ...base, provenance: { status: "hinted-ai", generator: "midjourney", detail: "exif hint" } }] },
  { name: "manifest present but invalid", expectId: "image-untrusted-manifest-shot.jpg",
    media: [{ ...base, provenance: { status: "untrusted", detail: "does not validate" } }] },
  { name: "no metadata at all", expectId: null,
    media: [{ ...base, provenance: { status: "absent", detail: "nothing to read" } }] },
  { name: "classifier confident", expectId: "image-origin-shot.jpg",
    media: [{ ...base, provenance: { status: "absent", detail: "nothing" }, synthetic: { probability: 0.93, model: "m" } }] },
  { name: "classifier weak — stays silent", expectId: null,
    media: [{ ...base, provenance: { status: "absent", detail: "nothing" }, synthetic: { probability: 0.41, model: "m" } }] },
  { name: "classifier unavailable — stays silent", expectId: null,
    media: [{ ...base, provenance: { status: "absent", detail: "nothing" }, synthetic: { probability: 0, model: "m", unavailable: "did not run" } }] },
  { name: "signed AI + confident model counted once", expectId: "image-declared-ai-shot.jpg",
    media: [{ ...base, provenance: { status: "declared-ai", generator: "Firefly", detail: "signed" }, synthetic: { probability: 0.99, model: "m" } }] },
];

console.log("");
let originPass = 0;
for (const c of originCases) {
  const r = analyse({ text: "", channel: "email", media: c.media });
  const ids = r.indicators.map((i) => i.id);
  const origin = ids.filter((id) => id.startsWith("image-"));
  const ok = c.expectId === null ? origin.length === 0 : origin.length === 1 && origin[0] === c.expectId;
  if (ok) originPass += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${c.name.padEnd(40)} raised=[${origin.join(", ")}] band=${r.band}`,
  );
  if (!ok) console.log(`      expected ${c.expectId ?? "nothing"}`);
}
console.log(`\n${originPass}/${originCases.length} image-origin cases correct`);

/* A missing model must lower confidence, not pass the image off as cleared.
   Probed with a real message attached: the confidence penalty is multiplicative,
   so on a submission with no text and no indicators the base is zero and no
   penalty of any size could be observed. */
const withText = "Your parcel could not be delivered. Confirm your address to reschedule the delivery today.";
const cleared = analyse({ text: withText, channel: "sms",
  media: [{ ...base, provenance: { status: "absent", detail: "n" }, synthetic: { probability: 0.1, model: "m" } }] });
const gapped = analyse({ text: withText, channel: "sms",
  media: [{ ...base, provenance: { status: "absent", detail: "n" }, synthetic: { probability: 0, model: "m", unavailable: "did not run" } }] });
console.log(
  `${gapped.confidence < cleared.confidence ? "PASS" : "FAIL"}  unavailable model costs confidence` +
    `        ran=${cleared.confidence.toFixed(2)} vs missing=${gapped.confidence.toFixed(2)}`,
);

/* --- Edit detection (Layer 3): findings reach the score and the report --- */

const editCases: { name: string; expect: string[]; media: Parameters<typeof analyse>[0]["media"] }[] = [
  {
    name: "resized-after-capture raises low",
    expect: ["image-edit-jpeg-resized-shot.jpg"],
    media: [{ ...base, edits: { findings: [{ id: "jpeg-resized", label: "Resized after it was captured",
      detail: "smaller than captured", weight: "low", evidence: "4032x3024 captured, 800x600 here" }], examined: "JPEG segment structure" } }],
  },
  {
    name: "appended payload raises high",
    expect: ["image-edit-jpeg-trailing-data-shot.jpg"],
    media: [{ ...base, edits: { findings: [{ id: "jpeg-trailing-data", label: "Extra data after the image ends",
      detail: "tail", weight: "high", evidence: "40,000 bytes" }], examined: "JPEG segment structure" } }],
  },
  {
    name: "clean structure raises nothing",
    expect: [],
    media: [{ ...base, edits: { findings: [], examined: "JPEG segment structure" } }],
  },
  {
    name: "edit pass unavailable raises nothing",
    expect: [],
    media: [{ ...base, edits: { findings: [], unavailable: "could not be read" } }],
  },
  {
    name: "editor marker and ELA region both carried",
    expect: ["image-edit-jpeg-editor-marker-shot.jpg", "image-edit-ela-region-shot.jpg"],
    media: [{ ...base, edits: { findings: [
      { id: "jpeg-editor-marker", label: "Written by image-editing software", detail: "adobe", weight: "medium" },
      { id: "ela-region", label: "One area compresses unlike the rest", detail: "region", weight: "low" },
    ], examined: "JPEG segment structure and pixel error levels" } }],
  },
];

console.log("");
let editPass = 0;
for (const c of editCases) {
  const r = analyse({ text: "", channel: "email", media: c.media });
  const got = r.indicators.map((i) => i.id).filter((id) => id.startsWith("image-edit-"));
  const ok = got.length === c.expect.length && c.expect.every((id) => got.includes(id));
  if (ok) editPass += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name.padEnd(44)} raised=[${got.join(", ")}]`);
  if (!ok) console.log(`      expected [${c.expect.join(", ")}]`);
}
console.log(`\n${editPass}/${editCases.length} edit-detection cases correct`);

/* An edit finding must be able to move the band on its own: a real photograph
   of a real document with something painted over scores nothing on the text
   rules and nothing on the origin passes, and is the whole point of Layer 3. */
const untouched = analyse({ text: "", channel: "email",
  media: [{ ...base, edits: { findings: [], examined: "JPEG segment structure" } }] });
const tampered = analyse({ text: "", channel: "email",
  media: [{ ...base, edits: { findings: [
    { id: "jpeg-trailing-data", label: "Extra data after the image ends", detail: "d", weight: "high" },
    { id: "jpeg-editor-marker", label: "Written by image-editing software", detail: "d", weight: "medium" },
  ], examined: "JPEG segment structure" } }] });
console.log(
  `${tampered.score > untouched.score && tampered.band !== "unclear" ? "PASS" : "FAIL"}` +
    `  edits alone can move the verdict        clean=${untouched.score}/${untouched.band}` +
    ` vs edited=${tampered.score}/${tampered.band}`,
);

/* --- Structural parsing, over bytes rather than hand-made descriptors -------

   The cases above check that a finding reaches the score. These check that the
   parser produces the right finding from the right bytes, which is where the
   one real bug in this layer was found. An earlier revision raised "saved more
   than once" whenever a JPEG carried more than one DQT segment, on the
   reasoning that a camera writes one. An ordinary single-save JPEG carries two
   — luminance and chrominance — so the rule fired on untouched camera files.
   The rule is gone; the first case below is the guard that keeps it gone. */

const SOI = [0xff, 0xd8];
const EOI = [0xff, 0xd9];
const dqt = () => [0xff, 0xdb, 0x00, 0x43, 0x00, ...Array<number>(64).fill(0x10)];
const sof = () => [0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x58, 0x03, 0x20, 0x03, ...Array<number>(9).fill(0x01)];
const sos = () => [0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00];

function jpegFile(name: string, ...parts: number[][]): File {
  return new File([new Uint8Array(parts.flat())], name, { type: "image/jpeg" });
}

const byteCases: { name: string; file: File; expect: string[] }[] = [
  {
    name: "single-save JPEG, two DQT segments",
    file: jpegFile("camera.jpg", SOI, dqt(), dqt(), sof(), sos(), EOI),
    expect: [],
  },
  {
    name: "data appended after end-of-image",
    file: jpegFile("carrier.jpg", SOI, dqt(), sof(), sos(), EOI, Array<number>(4096).fill(0x41)),
    expect: ["jpeg-trailing-data"],
  },
  {
    name: "a few padding bytes are not a payload",
    file: jpegFile("padded.jpg", SOI, dqt(), sof(), sos(), EOI, Array<number>(16).fill(0x00)),
    expect: [],
  },
];

console.log("");
let bytePass = 0;
for (const c of byteCases) {
  const source = await readFile(c.file);
  const read = await readEdits(c.file, source.tags, source.bytes);
  const got = read.findings.map((f) => f.id).sort();
  const want = [...c.expect].sort();
  const ok = got.length === want.length && want.every((id, i) => got[i] === id);
  if (ok) bytePass += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name.padEnd(44)} -> [${got.join(", ")}]`);
  if (!ok) console.log(`      expected [${want.join(", ")}]`);
}
console.log(`\n${bytePass}/${byteCases.length} structural parsing cases correct`);

/* --- Metadata: the pass that always has something to say -------------------

   The defect this covers was reported from the live site. A reader attached a
   photograph, no text, and got "Not enough to assess. Paste the full message"
   with nothing about the file at all — no dimensions, no format, no statement
   that anything had been looked at. The file had in fact been read end to end.
   Three things were wrong: nothing captured the description, the exported
   report never mentioned files, and the verdict copy told the reader to do
   something they had already done. */

const jpegWithApp0 = () => [
  ...SOI,
  0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00,
  0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  ...dqt(), ...sof(), ...sos(), ...EOI,
];

const metaCases: { name: string; file: File; check: (m: NonNullable<Awaited<ReturnType<typeof readMetadata>>>) => boolean; want: string }[] = [
  {
    name: "JPEG geometry and format are read",
    file: jpegFile("photo.jpg", jpegWithApp0()),
    check: (m) => m.width === 800 && m.height === 600 && m.format === "JPEG, baseline" && m.bitDepth === 8,
    want: "800x600 baseline 8-bit",
  },
  {
    name: "container segments are listed",
    file: jpegFile("photo.jpg", jpegWithApp0()),
    check: (m) => (m.segments ?? []).includes("JFIF (APP0)"),
    want: "JFIF (APP0) listed",
  },
  {
    name: "bytes confirm the declared type",
    file: jpegFile("photo.jpg", jpegWithApp0()),
    check: (m) => m.sniffedLabel === "JPEG" && m.typeMatches === true,
    want: "sniffed JPEG, matches",
  },
  {
    name: "an executable named .jpg is caught",
    file: new File([new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03])], "invoice.jpg", { type: "image/jpeg" }),
    check: (m) => m.typeMatches === false && m.sniffedLabel === "Windows executable",
    want: "mismatch flagged",
  },
  {
    name: "absent EXIF is reported as absent, not as failure",
    file: jpegFile("photo.jpg", jpegWithApp0()),
    check: (m) => m.exif?.present === false && m.exif.fields === 0,
    want: "present:false",
  },
];

console.log("");
let metaPass = 0;
for (const c of metaCases) {
  const m = await readMetadata(c.file);
  const ok = c.check(m);
  if (ok) metaPass += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name.padEnd(48)} (${c.want})`);
}
console.log(`\n${metaPass}/${metaCases.length} metadata cases correct`);

/* The type mismatch is the one descriptive fact allowed to score. */
const disguised = analyse({ text: "", channel: "email", media: [{
  name: "invoice.jpg", size: 5, type: "image/jpeg", kind: "image",
  metadata: await readMetadata(new File([new Uint8Array([0x4d, 0x5a, 0x90])], "invoice.jpg", { type: "image/jpeg" })),
}] });
console.log(
  `${disguised.indicators.some((i) => i.id.startsWith("file-bytes-mismatch")) ? "PASS" : "FAIL"}` +
    `  disguised executable reaches the score   band=${disguised.band} score=${disguised.score}`,
);

/* A file that scores nothing must still be told it was examined, and must not
   be told to paste a message it already sent. */
const quiet = analyse({ text: "", channel: "email", media: [{
  name: "photo.jpg", size: 100, type: "image/jpeg", kind: "image",
  metadata: await readMetadata(jpegFile("photo.jpg", jpegWithApp0())),
  edits: { findings: [], examined: "JPEG segment structure" },
}] });
const speaksToTheFile = !quiet.summary.includes("Paste the full message") && /examined/i.test(quiet.summary);
console.log(
  `${speaksToTheFile ? "PASS" : "FAIL"}  quiet result names what was examined   headline="${quiet.headline}"`,
);


/* ─────────────────────────── determinism ──────────────────────────────────
   The complaint this whole revision answers: the same image checked twice
   came back described differently. The description is now built from one
   parse of the bytes with no clock, no network and no canvas in it, so the
   guard is simply that two reads of one file are identical — byte for byte,
   through JSON, so a differing key order fails too. */

const twiceCases: { name: string; file: File }[] = [
  { name: "JPEG with JFIF", file: jpegFile("photo.jpg", jpegWithApp0()) },
  { name: "JPEG with data appended", file: jpegFile("carrier.jpg", SOI, dqt(), sof(), sos(), EOI, Array<number>(4096).fill(0x41)) },
  { name: "executable named .jpg", file: new File([new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03])], "invoice.jpg", { type: "image/jpeg" }) },
  { name: "PDF with two revisions", file: new File([new TextEncoder().encode("%PDF-1.7\n/Type /Page \n/Producer (Acme 2.0)\ntrailer\n%%EOF\n1 0 obj\n%%EOF\n")], "statement.pdf", { type: "application/pdf" }) },
];

console.log("");
let twicePass = 0;
for (const c of twiceCases) {
  const first = JSON.stringify(await readMetadata(c.file));
  const second = JSON.stringify(await readMetadata(c.file));
  const ok = first === second;
  if (ok) twicePass += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  read twice, identical: ${c.name}`);
  if (!ok) console.log(`      first:  ${first.slice(0, 160)}\n      second: ${second.slice(0, 160)}`);
}
console.log(`\n${twicePass}/${twiceCases.length} files describe identically on a second read`);

/* ─────────────────────────── containers and hidden content ───────────────── */

const pdfBytes = (body: string) => new File([new TextEncoder().encode(body)], "doc.pdf", { type: "application/pdf" });

const containerCases: { name: string; file: File; check: (m: Awaited<ReturnType<typeof readMetadata>>) => boolean; want: string }[] = [
  {
    name: "PDF names its producer and author",
    file: pdfBytes("%PDF-1.6\n/Author (Jane Roe)\n/Producer (Microsoft Word)\n/Type /Page \n%%EOF"),
    check: (m) => m.container?.people.author === "Jane Roe" && m.container.people.producer === "Microsoft Word",
    want: "author and producer",
  },
  {
    name: "PDF page count is read",
    file: pdfBytes("%PDF-1.6\n/Type /Page \n/Type /Page \n/Type /Page \n%%EOF"),
    check: (m) => m.container?.count === 3 && m.container.countLabel === "pages",
    want: "3 pages",
  },
  {
    name: "a PDF saved twice is reported as revised",
    file: pdfBytes("%PDF-1.6\n/Type /Page \n%%EOF\n7 0 obj\n%%EOF"),
    check: (m) => (m.container?.findings ?? []).some((f) => f.id === "pdf-incremental-update"),
    want: "incremental update",
  },
  {
    name: "a single-revision PDF is not reported as revised",
    file: pdfBytes("%PDF-1.6\n/Type /Page \n%%EOF"),
    check: (m) => !(m.container?.findings ?? []).some((f) => f.id === "pdf-incremental-update"),
    want: "no finding",
  },
  {
    name: "a PDF that runs script on opening is caught",
    file: pdfBytes("%PDF-1.6\n/OpenAction 4 0 R\n/JavaScript 5 0 R\n/Type /Page \n%%EOF"),
    check: (m) => {
      const ids = (m.container?.findings ?? []).map((f) => f.id);
      return ids.includes("pdf-javascript") && ids.includes("pdf-openaction");
    },
    want: "javascript + openaction",
  },
  {
    name: "links inside a PDF are collected",
    file: pdfBytes("%PDF-1.6\n/Type /Page \n/URI (https://mygov-refund.top/claim)\n%%EOF"),
    check: (m) => (m.container?.urls ?? []).includes("https://mygov-refund.top/claim"),
    want: "URI extracted",
  },
  {
    name: "an archive appended to a JPEG is found",
    file: jpegFile("holiday.jpg", SOI, dqt(), sof(), sos(), EOI, [0x50, 0x4b, 0x03, 0x04], Array<number>(2048).fill(0x42)),
    check: (m) => (m.hidden?.findings ?? []).some((f) => f.id === "trailing-payload"),
    want: "trailing payload",
  },
  {
    name: "an ordinary JPEG carries nothing hidden",
    file: jpegFile("photo.jpg", jpegWithApp0()),
    check: (m) => (m.hidden?.findings ?? []).length === 0 && m.hidden?.trailingBytes === 0,
    want: "nothing found, and it says so",
  },
];

console.log("");
let containerPass = 0;
for (const c of containerCases) {
  const m = await readMetadata(c.file);
  const ok = c.check(m);
  if (ok) containerPass += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name.padEnd(48)} (${c.want})`);
}
console.log(`\n${containerPass}/${containerCases.length} container and hidden-content cases correct`);

/* ─────────────────────────── the origin verdict ──────────────────────────── */

const verdictCases: { name: string; file: Parameters<typeof assessOrigin>[0]; expect: string }[] = [
  {
    name: "nothing known at all",
    expect: "unclear",
    file: { name: "a.jpg", size: 1, type: "image/jpeg", kind: "image",
      provenance: { status: "absent", detail: "" } },
  },
  {
    name: "a signed generative declaration",
    expect: "generated",
    file: { name: "b.jpg", size: 1, type: "image/jpeg", kind: "image",
      provenance: { status: "declared-ai", detail: "signed", generator: "Firefly" } },
  },
  {
    name: "the classifier alone, at full confidence",
    expect: "leaning-generated",
    file: { name: "c.jpg", size: 1, type: "image/jpeg", kind: "image",
      provenance: { status: "absent", detail: "" },
      synthetic: { probability: 0.99, model: "test" } },
  },
  {
    name: "a full camera record",
    expect: "likely-captured",
    file: { name: "d.jpg", size: 1, type: "image/jpeg", kind: "image",
      provenance: { status: "absent", detail: "" },
      metadata: { name: "d.jpg", sizeBytes: 1, declaredType: "image/jpeg",
        exif: { present: true, fields: 40, make: "Apple", model: "iPhone 15", exposure: "f/1.8 · 1/120s · ISO 64" } } },
  },
  {
    name: "metadata naming a generator",
    expect: "leaning-generated",
    file: { name: "e.png", size: 1, type: "image/png", kind: "image",
      provenance: { status: "hinted-ai", generator: "midjourney", detail: "" } },
  },
  {
    name: "a camera record contradicting the model",
    expect: "unclear",
    file: { name: "f.jpg", size: 1, type: "image/jpeg", kind: "image",
      provenance: { status: "absent", detail: "" },
      synthetic: { probability: 0.9, model: "test" },
      metadata: { name: "f.jpg", sizeBytes: 1, declaredType: "image/jpeg",
        exif: { present: true, fields: 40, make: "Canon", model: "R6", exposure: "f/4 · 1/250s · ISO 200" } } },
  },
];

console.log("");
let verdictPass = 0;
for (const c of verdictCases) {
  const a = assessOrigin(c.file);
  const ok = a?.answer === c.expect;
  if (ok) verdictPass += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${c.name.padEnd(44)} ${String(a?.answer).padEnd(18)} p=${a ? a.probability.toFixed(2) : "-"}`,
  );
}
console.log(`\n${verdictPass}/${verdictCases.length} origin verdicts correct`);

/* The classifier must never reach the top band on its own, whatever it says. */
const modelOnly = assessOrigin({ name: "g.jpg", size: 1, type: "image/jpeg", kind: "image",
  provenance: { status: "absent", detail: "" }, synthetic: { probability: 0.9999, model: "test" } });
console.log(
  `${modelOnly && modelOnly.answer !== "likely-generated" && modelOnly.answer !== "generated" ? "PASS" : "FAIL"}` +
    `  the model alone cannot convict          answer=${modelOnly?.answer} p=${modelOnly?.probability.toFixed(2)}`,
);

/* ─────────────────────────── links ───────────────────────────────────────── */

const linkCases: { name: string; url: string; expect: string[] }[] = [
  { name: "credentials before the host", url: "https://mygov.au@203.0.113.9/login", expect: ["userinfo", "raw-ip"] },
  { name: "punycode host", url: "https://xn--myg0v-9za.com/refund", expect: ["punycode"] },
  { name: "open redirect carrying another URL", url: "https://trusted.com.au/go?next=https%3A%2F%2Fevil.top%2Fx", expect: ["embedded-url"] },
  { name: "link that downloads a program", url: "https://files.example.net/update.exe", expect: ["downloads-file"] },
  { name: "brand after the real domain", url: "https://pay-now.top/mygov/login", expect: ["suspicious-tld", "brand-in-path"] },
  { name: "an ordinary council link", url: "https://hume.vic.gov.au/waste", expect: [] },
];

console.log("");
let linkPass = 0;
for (const c of linkCases) {
  const report = inspectStructure(c.url);
  const got = report.findings.map((f) => f.id).sort();
  const want = [...c.expect].sort();
  const ok = got.length === want.length && want.every((id, i) => got[i] === id);
  if (ok) linkPass += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name.padEnd(44)} -> [${got.join(", ")}]`);
}
console.log(`\n${linkPass}/${linkCases.length} link structure cases correct`);

/* Following the link is what a shortener exists to defeat, so the resolved
   destination has to reach the findings and the summary. */
const shortened = withResolution(inspectStructure("https://bit.ly/3xKq9"), {
  finalUrl: "https://mygov-refund.top/login",
  finalHost: "mygov-refund.top",
  status: 200,
  hops: [
    { url: "https://bit.ly/3xKq9", status: 301, via: "start" },
    { url: "https://mygov-refund.top/login", status: 200, via: "http-redirect" },
  ],
  contentType: "text/html",
  title: "myGov | Sign in",
  asksForPassword: true,
  hasForm: true,
});
const followed =
  shortened.findings.some((f) => f.id === "cross-site-redirect") &&
  shortened.findings.some((f) => f.id === "asks-for-password") &&
  shortened.summary.includes("mygov-refund.top");
console.log(
  `${followed ? "PASS" : "FAIL"}  a shortened link is reported by destination\n      "${shortened.summary}"`,
);
