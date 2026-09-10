import type { AiFeature, AiOutcome } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Persistence for AI interactions (Rule 2.4).
 *
 * The record is an audit line, not a copy of the conversation: the input is
 * represented only by its digest and length. There is no field on the model
 * that could hold content, which is the strongest guarantee available that it
 * is never stored (ETH-6).
 */
export interface InteractionRecord {
  userId?: string;
  feature: AiFeature;
  outcome: AiOutcome;
  provider: string;
  model: string;
  promptVersion: string;
  inputSha256: string;
  inputChars: number;
  redactions: number;
  verdict?: string;
  riskScore?: number;
  confidence?: number;
  latencyMs?: number;
  inputTokens?: number | null;
  outputTokens?: number | null;
}

export const aiRepository = {
  record(entry: InteractionRecord) {
    return prisma.aiInteraction.create({ data: entry });
  },

  /** FR70 by analogy — usage by feature and outcome, for cost and quality review. */
  summarise(since: Date) {
    return prisma.aiInteraction.groupBy({
      by: ["feature", "outcome"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _avg: { latencyMs: true, riskScore: true },
      _sum: { inputTokens: true, outputTokens: true },
    });
  },
};
