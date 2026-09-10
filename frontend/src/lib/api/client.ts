/**
 * The one way the interface talks to the CyberKent API.
 *
 * Every endpoint answers in the same envelope (backend Rule 4.2), so this is the
 * only place that unpacks it — a component receives either its data or an
 * `ApiError` carrying a message already written for a person to read.
 *
 * The base URL comes from the build environment, never from a literal in a
 * component (Avoid.md §3).
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:4000";

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: { field?: string; message: string }[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields: { field?: string; message: string }[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const OFFLINE = "The service could not be reached. Check your connection and try again.";

export async function apiRequest<T>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: init.method ?? "GET",
      headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(OFFLINE, 0);
  }

  let envelope: Envelope<T> | null = null;

  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    envelope = null;
  }

  if (!response.ok || !envelope?.success || envelope.data === null) {
    throw new ApiError(envelope?.message ?? OFFLINE, response.status, envelope?.errors ?? []);
  }

  return envelope.data;
}
