import { env } from "@/config/env";

/**
 * The only code in the API that talks to the AI service (Rule 10 — external
 * services through a dedicated class, never from a controller).
 *
 * Every call has a hard timeout and one retry on a connection failure, and
 * every failure is converted into `AiUnavailableError`. Nothing about why it
 * failed — hosts, stack traces, the provider's error body — is passed upward,
 * because the caller's only decision is whether to show a result or say the
 * second opinion is unavailable (Avoid.md §10).
 */

export class AiUnavailableError extends Error {
  constructor(readonly reason: "unreachable" | "timeout" | "rejected" | "refused") {
    super(`AI service ${reason}`);
    this.name = "AiUnavailableError";
  }
}

export interface AiUsage {
  /* Which provider answered, as the AI service reports it. */
  provider?: string | null;
  model: string;
  prompt_version: string;
  latency_ms: number;
  input_tokens?: number | null;
  output_tokens?: number | null;
}

async function call<T>(path: string, init: { method: "GET" | "POST"; body?: unknown }, attempt = 1): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);

  try {
    const response = await fetch(new URL(path, env.AI_SERVICE_URL), {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        ...(env.AI_SERVICE_TOKEN ? { "X-Internal-Token": env.AI_SERVICE_TOKEN } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
    });

    if (response.status === 422) {
      throw new AiUnavailableError("refused");
    }

    if (!response.ok) {
      throw new AiUnavailableError("rejected");
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof AiUnavailableError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new AiUnavailableError("timeout");
    }

    /* A refused connection is worth one more try — the service may be
       mid-restart. A timeout is not: it already used the whole budget. */
    if (attempt === 1) {
      return call<T>(path, init, 2);
    }

    throw new AiUnavailableError("unreachable");
  } finally {
    clearTimeout(timer);
  }
}

export const aiClient = {
  health: () =>
    call<{ status: "ok"; configured: boolean; provider: string; model: string }>("/health", { method: "GET" }),

  analyseText: <T>(body: unknown) => call<{ result: T; usage: AiUsage }>("/v1/analyse/text", { method: "POST", body }),

  analyseImage: <T>(body: unknown) => call<{ result: T; usage: AiUsage }>("/v1/analyse/image", { method: "POST", body }),

  chat: (body: unknown) =>
    call<{ reply: string; blocked: boolean; usage: AiUsage }>("/v1/assistant/chat", { method: "POST", body }),
};
