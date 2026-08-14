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
