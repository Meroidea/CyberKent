import crypto from "node:crypto";
import type { AiFeature, AiOutcome } from "@prisma/client";
import { AppError } from "@/lib/http";
import { aiClient, AiUnavailableError, type AiUsage } from "@/modules/ai/ai.client";
import { aiRepository } from "@/modules/ai/ai.repository";
import { redact } from "@/modules/ai/ai.redact";
import type { AnalyseImageInput, AnalyseTextInput, AssistantInput } from "@/modules/ai/ai.schema";

/**
 * The AI Gateway's business rules (Rule 2.3).
 *
 * Three responsibilities, in order, on every call:
 *
 * 1. Minimise — sensitive numbers are masked before the request leaves.
 * 2. Delegate — the AI service does the analysis; this layer never builds a
 *    prompt or names a model (Avoid.md §8).
 * 3. Account — every call, successful or not, is written to `AiInteraction`
 *    without its content, so usage, cost and outages are all visible (FR72).
 *
 * A failure to write the audit line never fails the request: the resident asked
 * for a second opinion, and a logging problem is Council's to fix, not theirs
 * to wait on. It is reported to the server log instead.
 */

/* Only for the rows where nothing came back to say otherwise — a call that
   never reached the AI service has no provider to report. Every answered call
   records the provider that actually answered, which is the AI service's to
   name and not the gateway's to assume (Rule 8.2). */
const PROVIDER_UNKNOWN = "unknown";

/* Written per feature: the checker has a complete rule-based result to fall back
   on and says so; the assistant has none, so it points somewhere that helps. */
const UNAVAILABLE: Record<AiFeature, string> = {
  TEXT_ANALYSIS: "The AI second opinion is unavailable right now. The rule-based result is complete on its own.",
  IMAGE_ANALYSIS: "The AI image check is unavailable right now. Everything read on your device is still shown above.",
  ASSISTANT:
    "The assistant is unavailable right now. You can still check a message, and Scamwatch (scamwatch.gov.au) has guidance on every common scam.",
};

function digest(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

interface Outcome {
  outcome: AiOutcome;
  usage?: AiUsage;
  verdict?: string;
  riskScore?: number;
  confidence?: number;
}

async function account(feature: AiFeature, input: string, redactions: number, userId: string | undefined, result: Outcome) {
  try {
    await aiRepository.record({
      userId,
      feature,
      outcome: result.outcome,
      provider: result.usage?.provider ?? PROVIDER_UNKNOWN,
      model: result.usage?.model ?? "n/a",
      promptVersion: result.usage?.prompt_version ?? "n/a",
      inputSha256: digest(input),
      inputChars: input.length,
      redactions,
      verdict: result.verdict,
      riskScore: result.riskScore,
      confidence: result.confidence,
      latencyMs: result.usage?.latency_ms,
      inputTokens: result.usage?.input_tokens,
      outputTokens: result.usage?.output_tokens,
    });
  } catch (error) {
    console.error("[ai] could not record interaction", error instanceof Error ? error.message : error);
  }
}

function outcomeOf(error: unknown): AiOutcome {
  if (error instanceof AiUnavailableError) {
    return error.reason === "refused" ? "REFUSED" : "UNAVAILABLE";
  }

  return "FAILED";
}

function toAppError(error: unknown, feature: AiFeature): AppError {
  if (error instanceof AiUnavailableError && error.reason === "refused") {
    return new AppError(422, feature === "ASSISTANT" ? "The assistant could not answer that. Try asking it another way." : "The AI could not assess this content. The rule-based result still stands.");
  }

  return new AppError(503, UNAVAILABLE[feature]);
}

interface ScoredResult {
  verdict: string;
  risk_score: number;
  confidence: number;
}

export const aiService = {
  /** Whether the AI layer can answer, for the interface to decide what to offer. */
  async status() {
    try {
      const health = await aiClient.health();
      return { available: health.configured, provider: health.provider, model: health.model };
    } catch {
      return { available: false, provider: PROVIDER_UNKNOWN, model: null };
    }
  },

  /** NLP — classification, manipulation tactics and sentiment of a message. */
  async analyseText(input: AnalyseTextInput, userId?: string) {
    const { text, count } = redact(input.text);

    try {
      const response = await aiClient.analyseText<ScoredResult>({ ...input, text });
      const { result, usage } = response;

      await account("TEXT_ANALYSIS", input.text, count, userId, {
        outcome: "SUCCEEDED",
        usage,
        verdict: result.verdict,
        riskScore: result.risk_score,
        confidence: result.confidence,
      });

      return { ...response, redactions: count };
    } catch (error) {
      await account("TEXT_ANALYSIS", input.text, count, userId, { outcome: outcomeOf(error) });
      throw toAppError(error, "TEXT_ANALYSIS");
    }
  },

  /** Vision — image identification, brands and visual red flags. */
  async analyseImage(input: AnalyseImageInput, userId?: string) {
    const context = input.context ? redact(input.context) : { text: undefined, count: 0 };

    try {
      const response = await aiClient.analyseImage<ScoredResult>({ image: input.image, context: context.text });
      const { result, usage } = response;

      await account("IMAGE_ANALYSIS", input.image, context.count, userId, {
        outcome: "SUCCEEDED",
        usage,
        verdict: result.verdict,
        riskScore: result.risk_score,
        confidence: result.confidence,
      });

      return { ...response, redactions: context.count };
    } catch (error) {
      await account("IMAGE_ANALYSIS", input.image, context.count, userId, { outcome: outcomeOf(error) });
      throw toAppError(error, "IMAGE_ANALYSIS");
    }
  },

  /** The CyberSafe Assistant. Nothing of the conversation is stored. */
  async chat(input: AssistantInput, userId?: string) {
    let redactions = 0;

    const messages = input.messages.map((turn) => {
      if (turn.role !== "user") {
        return turn;
      }

      const masked = redact(turn.content);
      redactions += masked.count;
      return { ...turn, content: masked.text };
    });

    const latest = input.messages[input.messages.length - 1]?.content ?? "";

    try {
      const response = await aiClient.chat({ messages });

      await account("ASSISTANT", latest, redactions, userId, {
        outcome: response.blocked ? "BLOCKED" : "SUCCEEDED",
        usage: response.usage,
      });

      return { reply: response.reply, blocked: response.blocked, model: response.usage.model, redactions };
    } catch (error) {
      await account("ASSISTANT", latest, redactions, userId, { outcome: outcomeOf(error) });
      throw toAppError(error, "ASSISTANT");
    }
  },

  /** Usage over the last thirty days, for administrators. */
  async usage() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return { since, rows: await aiRepository.summarise(since) };
  },
};
