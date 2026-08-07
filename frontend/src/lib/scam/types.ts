/**
 * Shared vocabulary for scam analysis.
 *
 * Deliberately free of React and of any transport concern: the same shapes are
 * intended to describe a result whether it was produced in the browser for an
 * instant read or by the API once server-side checks exist. Requirements.md
 * modules 3 and 4 (FR13–FR24) are expressed here.
 */

/** FR14 — the channel the message arrived through. */
export type Channel = "sms" | "email" | "phone" | "website" | "social" | "other";

/** FR17 — the band a score falls into. */
export type RiskBand = "high" | "medium" | "low" | "unclear";

/** How strongly an indicator argues for a scam. */
export type IndicatorWeight = "high" | "medium" | "low";

/**
 * One reason contributing to a score.
 *
 * `evidence` is the fragment of the submission that triggered it — Rule 8.3
 * requires every result to carry the evidence it used, and showing the user the
 * exact words is what lets them disagree with the machine.
 */
export interface Indicator {
  id: string;
  label: string;
  detail: string;
  weight: IndicatorWeight;
  evidence?: string;
}

/** FR13, FR14, FR19, FR22, FR23 — everything a submission can carry. */
export interface Submission {
  text: string;
  channel: Channel;
}

/** FR16, FR17, FR18 — the analysis handed back to the user. */
export interface Analysis {
  /** 0–100. Higher means more scam-like. */
  score: number;
  band: RiskBand;
  /** 0–1. How much signal the submission actually gave us. */
  confidence: number;
  headline: string;
  summary: string;
  indicators: Indicator[];
  /** Anything extracted that is worth showing back: URLs, numbers, addresses. */
  extracted: {
    urls: string[];
    emails: string[];
    phones: string[];
  };
}
