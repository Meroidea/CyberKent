/**
 * Masks sensitive numbers before anything is sent to the AI provider.
 *
 * A resident pasting a scam often pastes their own details with it — the card
 * number the scammer asked for, the BSB and account they nearly sent money to.
 * None of that helps the model judge the message, and all of it would otherwise
 * leave Australia for a third party. Masking keeps the *shape* ("a 16-digit card
 * number was requested") which is the signal, and drops the value, which is the
 * risk (ETH-6, APP 8 cross-border disclosure).
 *
 * Links, domains and sender addresses are deliberately left intact: they are
 * the scammer's, not the resident's, and they are what the analysis is about.
 */

interface Mask {
  label: string;
  pattern: RegExp;
}

/* Order matters: the longest, most specific shapes are masked first so a card
   number is not half-consumed by the account-number rule. */
const MASKS: Mask[] = [
  { label: "CARD NUMBER", pattern: /\b(?:\d[ -]?){12,18}\d\b/g },
  { label: "CVV", pattern: /(?<=\b(?:cvv|cvc|security code)[:\s]{0,3})\d{3,4}\b/gi },
  { label: "BSB", pattern: /\b\d{3}[- ]?\d{3}\b(?=[^\d]{0,24}(?:account|acc|a\/c))|(?<=\bbsb[:\s]{0,3})\d{3}[- ]?\d{3}\b/gi },
  { label: "ACCOUNT NUMBER", pattern: /(?<=\b(?:account|acc|a\/c)(?:\s*(?:number|no\.?|#))?[:\s]{0,3})\d[\d -]{5,12}\d\b/gi },
  { label: "TFN", pattern: /(?<=\b(?:tfn|tax file number)[:\s]{0,3})\d{3}[ -]?\d{3}[ -]?\d{3}\b/gi },
  { label: "MEDICARE NUMBER", pattern: /(?<=\bmedicare(?:\s*(?:number|no\.?))?[:\s]{0,3})\d{4}[ -]?\d{5}[ -]?\d\b/gi },
  { label: "ONE-TIME CODE", pattern: /(?<=\b(?:code|otp|pin)(?:\s*is)?[:\s]{0,3})\d{4,8}\b/gi },
];

export interface Redacted {
  text: string;
  /** How many values were masked — recorded, the values themselves never are. */
  count: number;
}

export function redact(input: string): Redacted {
  let count = 0;
  let text = input;

  for (const { label, pattern } of MASKS) {
    text = text.replace(pattern, () => {
      count += 1;
      return `[${label} REMOVED]`;
    });
  }

  return { text, count };
}
