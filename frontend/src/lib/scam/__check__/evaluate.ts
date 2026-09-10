import { writeFileSync } from "node:fs";
import { analyse } from "@/lib/scam/analyse";
import { CORPUS, HELD_OUT } from "@/lib/scam/__check__/corpus";

/**
 * Runs the labelled corpus through the analyser and reports how often it is
 * right.
 *
 *   tsx src/lib/scam/__check__/evaluate.ts [results.json] [--held-out]
 *
 * Four numbers matter, and they are reported separately because they fail in
 * different ways:
 *
 * - detection rate — scams flagged MEDIUM or HIGH. A miss here is a person
 *   told a scam looks fine.
 * - false-positive rate — genuine messages flagged MEDIUM or HIGH. A miss here
 *   is a person frightened away from their real bank, and a service people
 *   learn to ignore.
 * - exact band agreement — the band matches the reviewer's label.
 * - insufficient handled — too-short input answered "not enough to assess"
 *   rather than scored.
 */

const flagged = (band: string) => band === "high" || band === "medium";

const heldOut = process.argv.includes("--held-out");
const cases = heldOut ? HELD_OUT : CORPUS;

const rows = cases.map((item) => {
  const result = analyse({ text: item.text, channel: item.channel });

  const correct =
    item.label === "scam"
      ? flagged(result.band)
      : item.label === "genuine"
        ? !flagged(result.band) && result.band !== "unclear"
        : result.band === "unclear";

  return {
    id: item.id,
    family: item.family,
    label: item.label,
    expect: item.expect,
    band: result.band,
    score: result.score,
    confidence: result.confidence,
    correct,
    exact: result.band === item.expect,
    indicators: result.indicators.map((indicator) => indicator.id.replace(/-[^-]*\..*$/, "")),
  };
});

const scams = rows.filter((row) => row.label === "scam");
const genuine = rows.filter((row) => row.label === "genuine");
const insufficient = rows.filter((row) => row.label === "insufficient");

const detected = scams.filter((row) => flagged(row.band)).length;
const falsePositives = genuine.filter((row) => flagged(row.band)).length;
const correct = rows.filter((row) => row.correct).length;
const exact = rows.filter((row) => row.exact).length;

const percent = (part: number, whole: number) =>
  whole === 0 ? "—" : `${((part / whole) * 100).toFixed(1)}%`;

for (const row of rows) {
  console.log(
    `${row.correct ? "PASS" : "FAIL"}  ${row.id}  ${row.family.padEnd(26)} expect=${row.expect.padEnd(7)} got=${row.band.padEnd(7)} score=${String(row.score).padStart(3)}  ${row.indicators.join(", ")}`,
  );
}

const summary = {
  set: heldOut ? "held-out" : "development",
  cases: rows.length,
  correct,
  accuracy: percent(correct, rows.length),
  detectionRate: percent(detected, scams.length),
  detected: `${detected}/${scams.length}`,
  falsePositiveRate: percent(falsePositives, genuine.length),
  falsePositives: `${falsePositives}/${genuine.length}`,
  exactBandAgreement: percent(exact, rows.length),
  insufficientHandled: `${insufficient.filter((row) => row.band === "unclear").length}/${insufficient.length}`,
};

console.log("\n", summary);

const out = process.argv.slice(2).find((arg) => arg.endsWith(".json"));

if (out) {
  writeFileSync(out, JSON.stringify({ summary, rows }, null, 2));
}
