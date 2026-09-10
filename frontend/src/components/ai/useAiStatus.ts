import { useEffect, useState } from "react";
import { fetchAiStatus } from "@/lib/ai/api";
import type { AiStatus } from "@/lib/ai/types";

/**
 * Whether the AI layer can answer right now.
 *
 * Asked once per visit and shared: every AI surface needs the same answer, and
 * the status endpoint touches the AI service, so asking per component would
 * multiply a health check into a small load test.
 */
let shared: Promise<AiStatus> | null = null;

const UNKNOWN: AiStatus = { available: false, provider: "openai", model: null };

export function useAiStatus(): { status: AiStatus | null } {
  const [status, setStatus] = useState<AiStatus | null>(null);

  useEffect(() => {
    let active = true;

    shared ??= fetchAiStatus().catch(() => {
      /* Forget a failure so the next surface can try again. */
      shared = null;
      return UNKNOWN;
    });

    void shared.then((value) => {
      if (active) {
        setStatus(value);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return { status };
}
