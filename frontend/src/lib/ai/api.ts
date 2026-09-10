import { apiRequest } from "@/lib/api/client";
import type {
  AiImageAnalysis,
  AiResult,
  AiStatus,
  AiTextAnalysis,
  ChatMessage,
  ChatReply,
} from "@/lib/ai/types";
import type { Analysis, Channel } from "@/lib/scam/types";

/**
 * Calls to the AI Gateway (`/api/ai`). The browser never talks to OpenAI or to
 * the AI service directly: the key lives on the server, and the gateway is what
 * masks, limits and audits every request.
 */

export function fetchAiStatus(signal?: AbortSignal): Promise<AiStatus> {
  return apiRequest<AiStatus>("/api/ai/status", { signal });
}

/** NLP second opinion. The rule result travels with it as context. */
export function requestTextAnalysis(
  text: string,
  channel: Channel,
  analysis: Analysis,
  signal?: AbortSignal,
): Promise<AiResult<AiTextAnalysis>> {
  return apiRequest("/api/ai/analyse-text", {
    method: "POST",
    signal,
    body: {
      text,
      channel,
      rules: {
        score: analysis.score,
        band: analysis.band,
        indicators: analysis.indicators.slice(0, 40).map((indicator) => indicator.label.slice(0, 120)),
      },
    },
  });
}

/** Vision second opinion on one image, already stripped of its metadata. */
export function requestImageAnalysis(
  image: string,
  context: string | undefined,
  signal?: AbortSignal,
): Promise<AiResult<AiImageAnalysis>> {
  return apiRequest("/api/ai/analyse-image", { method: "POST", signal, body: { image, context } });
}

export function sendAssistantMessage(messages: ChatMessage[], signal?: AbortSignal): Promise<ChatReply> {
  return apiRequest("/api/ai/assistant", { method: "POST", signal, body: { messages } });
}
