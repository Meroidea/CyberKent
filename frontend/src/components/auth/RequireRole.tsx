import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/useAuth";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import type { Role } from "@/lib/account/types";

/**
 * A screen for some roles only.
 *
 * The interface's half of FR10: it saves someone a screen of failed requests,
 * and says plainly why they cannot see it. The control itself is the API, which
 * re-checks the role from the database on every staff request — so a stale
 * role in this device's session can show a screen, but never its data.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();

  return (
    <RequireAuth>
      {user && roles.includes(user.role) ? (
        children
      ) : (
        <ConsoleLayout title="Council staff only">
          <ConsoleHero icon={ShieldAlert} tint="bg-slate-500">
            <p>
              {roles.includes("OFFICER")
                ? "This screen is for Hume City Council CyberSafe officers. If you work for Council and need access, ask an administrator to give your account the officer role."
                : "This screen is for Council administrators."}
            </p>
          </ConsoleHero>
        </ConsoleLayout>
      )}
    </RequireAuth>
  );
}
