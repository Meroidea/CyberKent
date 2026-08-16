import { analyse } from "@/lib/scam/analyse";
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
  { name: "unsigned EXIF names a generator", expectId: "image-hinted-ai-shot.jpg",
    media: [{ ...base, provenance: { status: "hinted-ai", generator: "midjourney", detail: "exif hint" } }] },
  { name: "manifest present but invalid", expectId: "image-untrusted-manifest-shot.jpg",
    media: [{ ...base, provenance: { status: "untrusted", detail: "does not validate" } }] },
  { name: "no metadata at all", expectId: null,
    media: [{ ...base, provenance: { status: "absent", detail: "nothing to read" } }] },
  { name: "classifier confident", expectId: "image-synthetic-shot.jpg",
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
