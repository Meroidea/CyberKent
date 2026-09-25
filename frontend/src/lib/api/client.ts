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

  /** The message for one field, for showing beside the input it concerns. */
  field(name: string): string | undefined {
    return this.fields.find((entry) => entry.field === name)?.message;
  }
}

const OFFLINE = "The service could not be reached. Check your connection and try again.";

/**
 * Where the session's token comes from, and what to do when the API says it is
 * no longer good. Installed by `AuthProvider`, so this module stays free of
 * React and of storage.
 */
let readToken: () => string | null = () => null;
let onSessionEnded: () => void = () => {};

export function connectSession(getToken: () => string | null, ended: () => void): void {
  readToken = getToken;
  onSessionEnded = ended;
}

/** Waits before a retry, and stops waiting if the caller has gone. */
function pause(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(resolve, ms + Math.random() * ms);
    signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
  });
}

export async function apiRequest<T>(
  path: string,
  init: { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  let response: Response;
  const token = readToken();
  const headers: Record<string, string> = {};

  if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  /* A read that fails on the server's side — a pooler momentarily full, a cold
     instance timing out — is tried once more before the screen shows an error.
     Only reads: repeating a write could do it twice. */
  const method = init.method ?? "GET";
  const attempts = method === "GET" ? 2 : 1;

  for (let attempt = 1; ; attempt += 1) {
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: init.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      if (attempt < attempts) {
        await pause(500, init.signal);
        continue;
      }

      throw new ApiError(OFFLINE, 0);
    }

    if (response.status >= 500 && attempt < attempts) {
      await pause(500, init.signal);
      continue;
    }
    break;
  }

  let envelope: Envelope<T> | null = null;

  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    envelope = null;
  }

  /* A token the API refuses is a session that has ended — expired, or its
     account deleted. Said once, here, rather than by every screen that happens
     to be the first to notice. */
  if (response.status === 401 && token) {
    onSessionEnded();
  }

  if (!response.ok || !envelope?.success || envelope.data === null) {
    throw new ApiError(envelope?.message ?? OFFLINE, response.status, envelope?.errors ?? []);
  }

  return envelope.data;
}

/**
 * Downloads a file endpoint — the one kind of response that is not an
 * envelope — and hands it to the browser as a save.
 *
 * Fetched with the session's token rather than opened as a link: a plain link
 * cannot carry the Authorization header, and putting the token in the URL
 * would write it into history and server logs. A failure still arrives as an
 * envelope, and is thrown as an `ApiError` like any other.
 */
export async function apiDownload(path: string): Promise<void> {
  const token = readToken();
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    throw new ApiError(OFFLINE, 0);
  }

  if (!response.ok) {
    const envelope = (await response.json().catch(() => null)) as Envelope<never> | null;
    if (response.status === 401 && token) onSessionEnded();
    throw new ApiError(envelope?.message ?? OFFLINE, response.status, envelope?.errors ?? []);
  }

  const name = /filename="([^"]+)"/.exec(response.headers.get("Content-Disposition") ?? "")?.[1] ?? "download";
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  /* Revoked on the next tick: some browsers start the save asynchronously. */
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Sends a file as the raw request body — no base64, no multipart — so the
 * byte count the API limits is the file's own. Name and description travel as
 * URI-encoded headers; the API decides the type from the bytes regardless.
 */
export async function apiUpload<T>(path: string, file: Blob, headers: Record<string, string> = {}): Promise<T> {
  const token = readToken();
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
      body: file,
    });
  } catch {
    throw new ApiError(OFFLINE, 0);
  }

  const envelope = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (response.status === 401 && token) onSessionEnded();
  if (!response.ok || !envelope?.success || envelope.data === null) {
    throw new ApiError(envelope?.message ?? (response.status === 413 ? "That file is too large." : OFFLINE), response.status, envelope?.errors ?? []);
  }
  return envelope.data;
}

/** A file endpoint's bytes, for showing in the page rather than saving. */
export async function apiBlob(path: string): Promise<Blob> {
  const token = readToken();
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    throw new ApiError(OFFLINE, 0);
  }

  if (!response.ok) {
    const envelope = (await response.json().catch(() => null)) as Envelope<never> | null;
    if (response.status === 401 && token) onSessionEnded();
    throw new ApiError(envelope?.message ?? OFFLINE, response.status, envelope?.errors ?? []);
  }
  return response.blob();
}
