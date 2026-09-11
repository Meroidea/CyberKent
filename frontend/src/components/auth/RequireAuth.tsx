import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/auth/useAuth";
import { ROUTES } from "@/config/site";

/**
 * Sends a guest to sign in, carrying where they were going so they land back
 * on it afterwards rather than on a generic dashboard.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "guest") {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`${ROUTES.signIn}?next=${encodeURIComponent(next)}`} replace />;
  }

  return <>{children}</>;
}
