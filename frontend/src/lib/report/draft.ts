import type { IndicatorType, ReportChannel } from "@/lib/account/types";
import type { Analysis, Channel, Submission } from "@/lib/scam/types";

/**
 * A report being written, kept on this device until it is sent.
 *
 * The journey from "this is a scam" to "Council has it" can pass through
 * creating an account and opening a verification email — possibly on another
 * tab. Everything the person has already given the checker has to survive that
 * detour, or the account wall costs them the report.
 *
 * localStorage rather than sessionStorage, because the verification link opens
 * a new tab and sessionStorage does not follow it. Cleared on submit, on sign
 * out, and after a week — a draft is not a place to keep a message forever.
 */
const KEY = "cyberkent-report-draft";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface DraftIndicator {
  type: IndicatorType;
  value: string;
}

export interface ReportDraft {
  channel: ReportChannel | null;
  categoryId: string;
  suburbId: string;
  title: string;
  description: string;
  occurredOn: string;
  lostMoney: boolean;
  amountLost: string;
  indicators: DraftIndicator[];
  fromCheck?: { score: number; band: Analysis["band"] };
  savedAt: number;
}

export const EMPTY_DRAFT: ReportDraft = {
  channel: null,
  categoryId: "",
  suburbId: "",
  title: "",
  description: "",
  occurredOn: "",
  lostMoney: false,
  amountLost: "",
  indicators: [],
  savedAt: 0,
};

export function loadReportDraft(): ReportDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return null;
    }

    const draft = { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<ReportDraft>) };

    if (Date.now() - draft.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }

    return draft;
  } catch {
    return null;
  }
}

export function saveReportDraft(draft: ReportDraft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    /* Storage blocked: the draft lives only as long as the form does. */
  }
}

export function clearReportDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* Nothing to clear. */
  }
}

/** True when the draft holds something worth telling the person about. */
export function draftHasContent(draft: ReportDraft | null): draft is ReportDraft {
  return Boolean(draft && (draft.description.trim() || draft.title.trim() || draft.indicators.length > 0));
}

const CHANNEL_FROM_CHECK: Record<Channel, ReportChannel> = {
  sms: "SMS",
  email: "EMAIL",
  phone: "PHONE",
  website: "WEBSITE",
  social: "SOCIAL",
  other: "OTHER",
};

const TITLE_FROM_CHECK: Record<Channel, string> = {
  sms: "Suspicious text message",
  email: "Suspicious email",
  phone: "Suspicious phone call",
  website: "Suspicious website",
  social: "Suspicious social media message",
  other: "Suspicious message",
};

const NOUN_FROM_CHECK: Record<Channel, string> = {
  sms: "text message",
  email: "email",
  phone: "phone call",
  website: "website",
  social: "social media message",
  other: "message",
};

/**
 * Turns a finished check into a report draft.
 *
 * Everything the checker already extracted — the links, numbers and addresses
 * — becomes the report's list of details, which is the part Council's matching
 * runs on and the part people are least likely to retype correctly.
 */
export function draftFromCheck(analysis: Analysis, submission: Submission): ReportDraft {
  const seen = new Set<string>();
  const indicators: DraftIndicator[] = [];

  const add = (type: IndicatorType, value: string) => {
    const key = `${type}:${value.toLowerCase()}`;
    if (value.trim().length >= 3 && !seen.has(key) && indicators.length < 25) {
      seen.add(key);
      indicators.push({ type, value: value.trim() });
    }
  };

  analysis.extracted.urls.forEach((url) => add("URL", url));
  (submission.media ?? []).flatMap((file) => file.qrCodes ?? []).forEach((url) => add("URL", url));
  analysis.extracted.phones.forEach((phone) => add("PHONE", phone));
  analysis.extracted.emails.forEach((email) => add("EMAIL", email));

  const text = submission.text.trim();
  const files = submission.media ?? [];
  const noun = NOUN_FROM_CHECK[submission.channel];

  const description = text
    ? `I received this ${noun}:\n\n${text}\n\n`
    : `I received a ${noun}. I have checked ${files.length === 1 ? "a screenshot" : `${files.length} files`} of it with the scam checker.\n\n`;

  return {
    ...EMPTY_DRAFT,
    channel: CHANNEL_FROM_CHECK[submission.channel],
    title: TITLE_FROM_CHECK[submission.channel],
    description,
    indicators,
    fromCheck: { score: analysis.score, band: analysis.band },
    savedAt: Date.now(),
  };
}
