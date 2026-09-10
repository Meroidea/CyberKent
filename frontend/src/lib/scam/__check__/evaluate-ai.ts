import { writeFileSync } from "node:fs";
import { analyse } from "@/lib/scam/analyse";
import { CORPUS, HELD_OUT, type LabelledCase } from "@/lib/scam/__check__/corpus";

/**
 * Scores the OpenAI second opinion on the same labelled sets as the rules, and
 * the combination the interface recommends ("act on the more cautious of the
 * two").
 *
 *   AI_SERVICE_URL=http://127.0.0.1:8000 tsx src/lib/scam/__check__/evaluate-ai.ts [out.json]
 *
 * Calls the AI service directly rather than through the gateway, so the
 * gateway's per-client rate limit does not throttle an evaluation run. The
 * internal token is sent when AI_SERVICE_TOKEN is set.
 */

const BASE = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000";
const TOKEN = process.env.AI_SERVICE_TOKEN;

type Band = "high" | "medium" | "low" | "unclear";

const VERDICT_BAND: Record<string, Band> = {
  likely_scam: "high",
  suspicious: "medium",
  likely_genuine: "low",
  unclear: "unclear",
};

const RANK: Record<Band, number> = { unclear: 0, low: 1, medium: 2, high: 3 };
const flagged = (band: Band) => band === "high" || band === "medium";

async function ask(item: LabelledCase, rules: ReturnType<typeof analyse>) {
  const response = await fetch(`${BASE}/v1/analyse/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(TOKEN ? { "X-Internal-Token": TOKEN } : {}) },
    body: JSON.stringify({
      text: item.text,
      channel: item.channel,
      rules: { score: rules.score, band: rules.band, indicators: rules.indicators.map((i) => i.label) },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI service answered ${response.status}`);
  }

  return (await response.json()) as { result: { verdict: string; risk_score: number; scam_type: string }; usage: { model: string; latency_ms: number } };
}

function correct(label: LabelledCase["label"], band: Band): boolean {
  return label === "scam" ? flagged(band) : label === "genuine" ? !flagged(band) && band !== "unclear" : band === "unclear";
}

interface Row {
  id: string;
  label: LabelledCase["label"];
  rules: Band;
  ai: Band;
  aiScore: number;
  aiType: string;
  combined: Band;
  model: string;
  latencyMs: number;
}

async function score(name: string, cases: LabelledCase[]) {
  const rows: Row[] = [];

  for (const item of cases.filter((entry) => entry.label !== "insufficient")) {
    const rules = analyse({ text: item.text, channel: item.channel });
    const ai = await ask(item, rules);
    const aiBand = VERDICT_BAND[ai.result.verdict] ?? "unclear";
    const combined = RANK[aiBand] > RANK[rules.band] ? aiBand : rules.band;

    rows.push({
      id: item.id,
      label: item.label,
      rules: rules.band as Band,
      ai: aiBand,
      aiScore: ai.result.risk_score,
      aiType: ai.result.scam_type,
      combined,
      model: ai.usage.model,
      latencyMs: ai.usage.latency_ms,
    });

    console.log(`${item.id}  ${item.label.padEnd(8)} rules=${rules.band.padEnd(7)} ai=${aiBand.padEnd(7)} (${ai.result.risk_score}) combined=${combined}`);
  }

  const metrics = (key: "rules" | "ai" | "combined") => {
    const scams = rows.filter((row) => row.label === "scam");
    const genuine = rows.filter((row) => row.label === "genuine");
    return {
      accuracy: `${rows.filter((row) => correct(row.label, row[key])).length}/${rows.length}`,
      detected: `${scams.filter((row) => flagged(row[key])).length}/${scams.length}`,
      falsePositives: `${genuine.filter((row) => flagged(row[key])).length}/${genuine.length}`,
    };
  };

  const latency = rows.map((row) => row.latencyMs).sort((a, b) => a - b);
  const summary = {
    set: name,
    model: rows[0]?.model,
    rules: metrics("rules"),
    ai: metrics("ai"),
    combined: metrics("combined"),
    medianLatencyMs: latency[Math.floor(latency.length / 2)],
  };

  console.log(summary, "\n");
  return { summary, rows };
}

const results = [await score("development", CORPUS), await score("held-out", HELD_OUT)];
const out = process.argv[2];

if (out) {
  writeFileSync(out, JSON.stringify(results, null, 2));
}
