import type { IndicatorWeight } from "@/lib/scam/types";

/**
 * The wording rules the analyser runs.
 *
 * Kept as data rather than as branches in the analyser so a rule can be added,
 * reweighted or removed without touching the scoring code — and so the whole
 * set can be read by a non-developer, which matters for a service that has to
 * be able to explain itself to the people it scores.
 *
 * These rules read *prose only*. Links, email addresses and QR destinations are
 * taken out of the text before these run and are judged by `links.ts`, which
 * understands their structure. A rule here never sees a URL.
 *
 * Revised against the labelled corpus in `__check__/corpus.ts` after the
 * Lecturer asked the team to show the risk is analysed correctly. The changes
 * each trace to a measured failure:
 *
 * - `threat` was one high-weight rule matching "fine" and "cancelled", so "the
 *   flight was fine" and "training is cancelled" scored as threats. It is now
 *   two rules: coercive consequences (high) and ordinary ones (medium).
 * - `urgency` matched "within 30 days" on a returns policy. Deadlines are now
 *   hours and minutes — the scale a scam actually applies pressure on.
 * - `credentials` fired on a bank's own "we will never ask for your PIN". Rules
 *   can now carry `unless`, a pattern that voids a match in the same sentence.
 * - Five scam families had no rule at all and scored zero: family impersonation
 *   ("Hi Mum, new number"), payment redirection, investment, job offers and
 *   parcel redelivery. Each now has one.
 */

export interface TextRule {
  id: string;
  label: string;
  detail: string;
  weight: IndicatorWeight;
  /** Global so every occurrence can be counted, not just the first. */
  pattern: RegExp;
  /**
   * Voids a match when found in the same sentence. The reason this exists is a
   * genuine bank notice: "we will never ask for your password" names exactly
   * the words a phishing message uses, to the opposite end.
   */
  unless?: RegExp;
}

/** FR15 — wording patterns common to scam messages. */
export const TEXT_RULES: TextRule[] = [
  {
    id: "urgency",
    label: "Urgency language",
    detail: "Pressure to act inside a deadline is the most common lever in a scam.",
    weight: "high",
    pattern:
      /\b(within \d+\s*(hours?|hrs?|minutes?|mins?)|final (notice|warning|reminder)|immediately|urgent(ly)?|act (now|fast)|expires? (today|soon|tonight)|last chance|before it is too late|limited time|right away|spots are limited)\b/gi,
  },
  {
    id: "threat",
    label: "Threatened consequence",
    detail:
      "A coercive penalty for not responding — suspension, arrest, legal action, a locked account.",
    weight: "high",
    pattern:
      /\b(suspend(ed|ing|sion)?|deactivat(e|ed|ion)|legal action|court (action|summons|order)|warrant|arrest(ed)?|police will|permanent(ly)? (closure|closed|disabled|locked)|(account|access|card) (has been|will be|is) (locked|limited|restricted|blocked|frozen|closed)|locked for security)\b/gi,
  },
  {
    id: "consequence",
    label: "Warns of a penalty",
    detail:
      "Mentions a fee, a cancellation or a return if you do not act. Common in genuine notices too, so it counts for less on its own.",
    weight: "medium",
    pattern:
      /\b(late fees?|penalt(y|ies)|be returned|returned to sender|disconnect(ed|ion)|will be cancell?ed|be terminated|fined)\b/gi,
  },
  {
    id: "credentials",
    label: "Asks for credentials or banking details",
    detail:
      "Legitimate organisations do not ask for passwords, PINs or full account numbers by message.",
    weight: "high",
    pattern:
      /\b(bsb|account number|card (number|details)|cvv|pin\b|password|one[- ]?time (code|password)|verification code|otp|verify your identity|confirm your (bank|card|account))\b/gi,
    unless: /\b(never|will not|won't|do not|don't)\s+(ask|request|send|call)\b/i,
  },
  {
    id: "identity",
    label: "Asks for identity documents or details",
    detail:
      "A date of birth, licence, passport, Medicare or tax file number is what an identity thief needs to open accounts in your name.",
    weight: "high",
    pattern:
      /\b(date of birth|tax file number|tfn|driver'?s licen[cs]e (number|details)|passport (number|details)|medicare (number|card details)|send (us|me) (a )?(photo|copy) of your (id|licen[cs]e|passport))\b/gi,
    unless: /\b(never|will not|won't|do not|don't)\s+(ask|request)\b/i,
  },
  {
    id: "payment",
    label: "Unusual payment method",
    detail: "Gift cards, crypto and wire transfers are chosen because they cannot be reversed.",
    weight: "high",
    pattern:
      /\b(gift ?cards?|itunes|google play|steam card|bitcoin|crypto(currency)?|usdt|wire transfer|western union|money ?gram)\b/gi,
  },
  {
    id: "payment-request",
    label: "Requests a payment or fee",
    detail: "A small fee is often bait to capture card details rather than to collect the amount.",
    weight: "medium",
    /* The amount sits outside the word boundaries: `\b` before "$" requires a
       word character in front of it, so "\b\$4.20" never matched and no dollar
       figure was ever counted. The corpus found this. */
    pattern:
      /\$\s?\d[\d,]*(\.\d{2})?|\b(fee|payment|outstanding|owing|unpaid|overdue|invoice|refund|rebate|deposit)\b/gi,
  },
  {
    id: "payment-redirection",
    label: "Says the bank details have changed",
    detail:
      "A supplier or employer announcing new bank details is how invoice-redirection fraud works. Confirm by phone, on a number you already have.",
    weight: "high",
    pattern:
      /\b((bank|account|payment|banking) details (have|has) (changed|been (changed|updated))|new (bank(ing)? )?account details|(our|the) new (bank )?account|update (our|the) (bank|payment|banking) details|changed (our|the) (bank|account))\b/gi,
  },
  {
    id: "impersonation",
    label: "Impersonates a known organisation",
    detail: "Names a trusted body to borrow its authority. Check by contacting them yourself.",
    weight: "medium",
    pattern:
      /\b(mygov|ato|australia ?post|auspost|linkt|centrelink|medicare|nbn|telstra|optus|council|police|bank|paypal|netflix|amazon|apple|microsoft)\b/gi,
  },
  {
    id: "family-impersonation",
    label: "Claims to be family on a new number",
    detail:
      "\"Hi Mum, I've lost my phone\" is one of the most reported scams in Australia. Call the person on the number you already have for them.",
    weight: "high",
    pattern:
      /\b(this is my new (phone |mobile )?number|my new number is|(lost|broke|broken|dropped|smashed|cracked) my phone|texting (you )?from a (new|friend'?s|different) (phone|number))\b/gi,
  },
  {
    id: "security-alert",
    label: "Alarming account-security alert",
    detail:
      "Reports of unusual activity are used to make you act before you think. Open the organisation's app or website yourself to check.",
    weight: "medium",
    pattern:
      /\b(unusual (sign[- ]?in|login|log-in|activity)|suspicious (activity|transaction|login)|unauthori[sz]ed (access|transaction|payment)|new payee (was |has been )?added|new device (signed|logged) in)\b/gi,
  },
  {
    id: "delivery",
    label: "Parcel held or undelivered",
    detail:
      "Delivery companies do not charge fees or ask for details by text to release a parcel. Check the tracking number in the carrier's own app.",
    weight: "medium",
    pattern:
      /\b((parcel|package|delivery|shipment|item) (is |has been )?(on hold|held|pending|awaiting)|could not be delivered|unable to be delivered|re-?delivery|(update|confirm) your (delivery|shipping) (address|details)|incomplete address|customs (fee|charge|duty))\b/gi,
  },
  {
    id: "investment",
    label: "Promises guaranteed returns",
    detail:
      "No legitimate investment guarantees returns. Check any adviser or platform on ASIC's Moneysmart website before sending money.",
    weight: "high",
    pattern:
      /\b(guaranteed (returns?|profits?|income)|(double|triple) your (money|investment|crypto)|risk[- ]free( investment| returns?| profits?| trading)?|\d+(\.\d+)?% (daily|weekly|per day|a day)|trading (platform|bot|signals)|investment opportunit(y|ies))\b/gi,
  },
  {
    id: "job-offer",
    label: "Too-good-to-be-true job offer",
    detail:
      "High pay for little work, no experience and a chat app for contact are the shape of a task or money-mule scam.",
    weight: "medium",
    pattern:
      /\b(work(ing)? from home and earn|earn \$?\d[\d,]* (a|per) (day|hour|week)|no experience (needed|required|necessary)|(part[- ]time|online) job (offer|opportunity)|task[- ]based (job|work)|(contact|message) (us|me) on (whatsapp|telegram|signal))\b/gi,
  },
  {
    id: "link-bait",
    label: "Pushes you to a link",
    detail: "Directing you away from official channels is how the credential capture happens.",
    weight: "medium",
    pattern:
      /\b(click (here|the link|below|now)|follow the link|log ?in here|(tap|open|use) (here|this link|the link)|(listen|pay|settle|claim|verify|update|confirm|cancel|unlock|sign in) (here|now|at|via))\b/gi,
  },
  {
    id: "remote-access",
    label: "Asks to install software or grant access",
    detail: "No provider asks to install remote-access tools over an unsolicited contact.",
    weight: "high",
    pattern:
      /\b(anydesk|teamviewer|rustdesk|quick ?support|ultraviewer|remote ?(access|desktop|tool)|install (our|the|this) (app|tool|software)|support tool|grant access)\b/gi,
  },
  {
    id: "prize",
    label: "Unexpected prize or windfall",
    detail: "You cannot win a competition you did not enter.",
    weight: "medium",
    pattern:
      /\b(congratulations|you have won|you('ve| have) been selected|winner|prize|lottery|lucky (draw|winner)|claim your (reward|prize))\b/gi,
  },
  {
    id: "secrecy",
    label: "Asks you to keep it quiet",
    detail: "Discouraging you from checking with someone else is a deliberate isolation tactic.",
    weight: "high",
    pattern:
      /\b(do not (tell|discuss|share) (this|anyone|it)|keep (this|it) (confidential|secret|private|between us|to yourself)|don'?t tell (anyone|dad|mum|mom|your))\b/gi,
  },
  {
    id: "generic-greeting",
    label: "Generic greeting",
    detail:
      "An organisation you hold an account with normally knows your name. Weak on its own.",
    weight: "low",
    pattern: /\b(dear (customer|user|client|member|sir\/madam|account holder)|valued customer)\b/gi,
  },
];
