import { useAuth } from "@/components/auth/useAuth";
import { useEmailDelivery } from "@/components/auth/useEmailDelivery";

export interface EmailConfirmation {
  /** The address on the account has been proved. */
  confirmed: boolean;
  /**
   * Unproved, and a code could still arrive — so there is something here for
   * the person to finish. False where the deployment cannot send mail: an
   * unconfirmed address is then a fact about the service, not a task, and
   * prompting for it would be asking for work nobody can do.
   */
  pending: boolean;
  /**
   * Whether a report can be sent to Council now.
   *
   * Reporting waits on a confirmed address, because Council has to be able to
   * come back to whoever reported (UC-07). Where no address can ever be
   * confirmed, waiting would mean nobody in Hume can report anything, so the
   * wait is lifted — and the API decides the same way rather than taking the
   * client's word for it (`reports.service.create`).
   */
  canSendReport: boolean;
}

/**
 * What this deployment can say about the signed-in person's email address.
 *
 * Six screens ask some form of this question — the report form, the dashboard,
 * the sign-up journey, the masthead and both menus. They ask it here so they
 * cannot come to disagree.
 *
 * `useEmailDelivery` answers `null` until the deployment has said which it is.
 * Until then nothing is offered that might be withdrawn a moment later: the
 * address reads as still needing confirmation, which is the cautious of the
 * two answers and the one the journey was written around.
 */
export function useEmailConfirmation(): EmailConfirmation {
  const { user } = useAuth();
  const emailDelivery = useEmailDelivery();

  const confirmed = Boolean(user?.emailVerified);
  const deliverable = emailDelivery !== false;

  return {
    confirmed,
    pending: !confirmed && deliverable,
    canSendReport: confirmed || !deliverable,
  };
}
