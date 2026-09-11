import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { authApi } from "@/lib/account/api";
import { ApiError, connectSession } from "@/lib/api/client";
import { loadSession, saveSession } from "@/lib/account/session";
import type { Session, User } from "@/lib/account/types";
import { clearReportDraft } from "@/lib/report/draft";

export interface AuthValue {
  /** `member` as soon as a stored session is found; revalidated in the background. */
  status: "guest" | "member";
  user: User | null;
  /** Set when the API ended the session, so the sign-in screen can say why. */
  expired: boolean;
  signIn: (session: Session) => void;
  signOut: () => Promise<void>;
  /** Replace the user after an edit, keeping the token. */
  setUser: (user: User) => void;
  /** Replace the token as well, after a password change. */
  setSession: (session: Session) => void;
}

export const AuthContext = createContext<AuthValue | null>(null);

/**
 * Who is signed in, for every screen.
 *
 * Mounted once above the router. It starts from the session stored on the
 * device so the first paint is already correct, asks the API to confirm, and
 * installs itself into the API client so a refused token anywhere ends the
 * session everywhere.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState(loadSession);
  const [expired, setExpired] = useState(false);
  const tokenRef = useRef(session?.token ?? null);

  const apply = useCallback((next: { token: string; user: User } | null) => {
    tokenRef.current = next?.token ?? null;
    saveSession(next);
    setSessionState(next);
  }, []);

  /*
   * Installed during render rather than in an effect. Effects run children
   * first, so a page that fetches on mount would otherwise go out before the
   * client knew there was a token to send — and come back as "sign in".
   * Idempotent: it only points the client at this component's refs.
   */
  const endedRef = useRef(() => {});
  endedRef.current = () => {
    apply(null);
    setExpired(true);
  };
  connectSession(
    () => tokenRef.current,
    () => endedRef.current(),
  );

  /* Confirm the stored session once per load. A failure that is not the
     server refusing the token — offline, say — keeps the session: being
     offline is not being signed out. */
  useEffect(() => {
    if (!tokenRef.current) {
      return;
    }

    const controller = new AbortController();

    authApi
      .me(controller.signal)
      .then(({ user }) => {
        if (tokenRef.current) {
          apply({ token: tokenRef.current, user });
        }
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          apply(null);
        }
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Another tab signing in or out is this tab signing in or out. */
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "cyberkent-session") {
        const next = loadSession();
        tokenRef.current = next?.token ?? null;
        setSessionState(next);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      status: session ? "member" : "guest",
      user: session?.user ?? null,
      expired,
      signIn: (next) => {
        setExpired(false);
        apply({ token: next.token, user: next.user });
      },
      signOut: async () => {
        /* Best effort: the token is stateless and discarding it is what signs
           the device out. A report draft goes with the session — on a shared
           computer it is the next person's to find otherwise. */
        await authApi.logout().catch(() => undefined);
        clearReportDraft();
        setExpired(false);
        apply(null);
      },
      setUser: (user) => {
        if (tokenRef.current) {
          apply({ token: tokenRef.current, user });
        }
      },
      setSession: (next) => apply({ token: next.token, user: next.user }),
    }),
    [session, expired, apply],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
