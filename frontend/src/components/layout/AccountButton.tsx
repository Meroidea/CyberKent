import { Link } from "react-router-dom";
import { useAuth } from "@/components/auth/useAuth";
import { useEmailConfirmation } from "@/components/auth/useEmailConfirmation";
import { ROUTES } from "@/config/site";
import { initials } from "@/lib/report/labels";
import { cn } from "@/lib/cn";

/**
 * The masthead's account control: "Sign in" for a visitor, their initials for
 * a member. A dot marks an email still waiting to be confirmed — the one
 * account state that stops a report from being sent, and only where a code can
 * actually be sent to clear it.
 */
export function AccountButton({ className }: { className?: string }) {
  const { user } = useAuth();
  const { pending } = useEmailConfirmation();

  if (!user) {
    return (
      <Link
        to={ROUTES.signIn}
        className={cn(
          "px-2 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-700 transition-colors duration-200 hover:text-indigo-700 dark:text-slate-200 dark:hover:text-cyan-300",
          className,
        )}
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      to={ROUTES.account}
      aria-label={`Your dashboard — signed in as ${user.fullName}${pending ? ", email not yet confirmed" : ""}`}
      title={user.email}
      className={cn(
        "interactive relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[0.8125rem] font-semibold text-white shadow-md shadow-indigo-600/20",
        className,
      )}
    >
      {initials(user.fullName)}
      {pending ? (
        <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-amber-500 dark:border-slate-900" />
      ) : null}
    </Link>
  );
}
