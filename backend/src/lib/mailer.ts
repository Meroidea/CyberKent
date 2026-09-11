import { env } from "@/config/env";
import { SITE_NAME } from "@/lib/site";

/**
 * Transactional email.
 *
 * One function, one transport decision. With `RESEND_API_KEY` set, mail goes
 * through Resend's HTTP API — a `fetch`, so the API carries no SMTP dependency
 * into a serverless bundle. Without it, the message is written to the server
 * log, which is exactly what local development needs and nothing else.
 *
 * Sending never throws into the caller. An account that was created but whose
 * welcome email failed is still an account, and the person can ask for the code
 * again; failing the whole request over a mail outage would leave them unsure
 * whether they had registered at all.
 */
export interface Mail {
  to: string;
  subject: string;
  /** Plain text. Every message is written to be readable without HTML. */
  text: string;
}

export async function sendMail(mail: Mail): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    if (env.isProduction) {
      /* Named, loudly: in production a missing key means nobody is receiving
         their codes, and that must show in the log rather than pass quietly. */
      console.error(`[mailer] RESEND_API_KEY is not set; "${mail.subject}" was not delivered.`);
      return false;
    }

    console.info(`\n[mailer] ── to ${mail.to} ──\nSubject: ${mail.subject}\n\n${mail.text}\n[mailer] ────────────\n`);
    return true;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      /* Status only — the body can echo the recipient back (Rule 6.7). */
      console.error(`[mailer] delivery failed with HTTP ${response.status}.`);
      return false;
    }

    return true;
  } catch {
    console.error("[mailer] delivery failed: the mail provider could not be reached.");
    return false;
  }
}

const SIGN_OFF = `\n\n— ${SITE_NAME}\nIf you did not expect this email, you can ignore it. We will never ask for your password, a bank code or card details by email.`;

export const mailTemplates = {
  verify(name: string, code: string, link: string): Omit<Mail, "to"> {
    return {
      subject: `${code} is your ${SITE_NAME} verification code`,
      text: `Hi ${name},\n\nYour verification code is:\n\n    ${code}\n\nEnter it on the screen you signed up on, or open this link on any device:\n${link}\n\nThe code expires in 30 minutes; the link in 24 hours.${SIGN_OFF}`,
    };
  },

  passwordReset(name: string, link: string): Omit<Mail, "to"> {
    return {
      subject: `Reset your ${SITE_NAME} password`,
      text: `Hi ${name},\n\nSomeone — hopefully you — asked to reset the password on your account. Choose a new one here:\n${link}\n\nThe link works once and expires in one hour. If you did not ask for this, your password has not changed and you do not need to do anything.${SIGN_OFF}`,
    };
  },

  /* Sent after the fact, so someone whose account was taken over hears about
     it from us rather than discovering it later. */
  passwordChanged(name: string, resetLink: string): Omit<Mail, "to"> {
    return {
      subject: `Your ${SITE_NAME} password was changed`,
      text: `Hi ${name},\n\nThe password on your account was just changed. If that was you, there is nothing more to do.\n\nIf it was not, reset it now and call Council on 9205 2200:\n${resetLink}${SIGN_OFF}`,
    };
  },

  accountDeleted(name: string): Omit<Mail, "to"> {
    return {
      subject: `Your ${SITE_NAME} account has been deleted`,
      text: `Hi ${name},\n\nYour account has been deleted and your personal details removed. Reports you sent stay with Council as a record of the scams they describe, but they are no longer linked to your name or email.\n\nYou can still check messages on the site at any time — no account is needed for that.${SIGN_OFF}`,
    };
  },

  reportReceived(name: string, reference: string, link: string): Omit<Mail, "to"> {
    return {
      subject: `Report ${reference} received`,
      text: `Hi ${name},\n\nThank you — Council has received your report. Your reference is ${reference}.\n\nA CyberSafe officer will review it. You can follow its progress, answer any questions Council sends, or withdraw it here:\n${link}\n\nIf you have lost money, contact your bank now on the number printed on your card — do not wait for the review.${SIGN_OFF}`,
    };
  },
};
