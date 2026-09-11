import type { User } from "@/lib/account/types";

/**
 * The signed-in session, as kept on this device.
 *
 * The user is stored beside the token so a returning visitor sees their own
 * name the moment the page paints, rather than a signed-out header that
 * corrects itself a request later. The API is still asked who they are on load
 * (AuthProvider); the stored copy is a first guess, never the authority.
 */
const KEY = "cyberkent-session";

export interface StoredSession {
  token: string;
  user: User;
}

/** Seconds since the epoch at which the token stops being accepted, if it says. */
function expiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw) as StoredSession;
    const exp = expiry(session.token);

    /* A token already past its expiry would only earn a 401 on first use. */
    if (!session.token || !session.user || (exp !== null && exp * 1000 <= Date.now())) {
      localStorage.removeItem(KEY);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession | null): void {
  try {
    if (session) {
      localStorage.setItem(KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {
    /* Private browsing with storage blocked: the session lives for the tab. */
  }
}

/**
 * Only same-site paths are followed after sign-in.
 *
 * `next` arrives in the address bar, where anyone can write anything; following
 * `//evil.example` or `https://…` from it would make the sign-in form an open
 * redirect that looks like Council.
 */
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
