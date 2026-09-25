import { SITE } from "@/config/site";

/**
 * The service's privacy, accessibility and terms statements.
 *
 * Written against what the system actually does — every claim here is one the
 * code keeps — and against the Final SRS (retention at §11.8, the DPIA at
 * §10.4). Retention periods are the project's proposal and, like the
 * statements themselves, need sign-off by Council's privacy officer and
 * records management (OI-6) before public launch. The page says so.
 */

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface LegalDocument {
  slug: "privacy" | "accessibility" | "terms";
  title: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
}

const CONTACT = `Hume City Council CyberSafe Services — ${SITE.supportEmail}, ${SITE.supportPhone}, ${SITE.address}.`;

export const LEGAL: Record<LegalDocument["slug"], LegalDocument> = {
  privacy: {
    slug: "privacy",
    title: "Privacy",
    summary: "What this service collects, why, where it is kept, for how long, and how to have it corrected or erased.",
    updated: "2026-09-24",
    sections: [
      {
        heading: "The short version",
        list: [
          "Checking a message happens on your own device. What you paste is not sent to Council or stored.",
          "You need an account only to report a scam, so an officer can follow up with you.",
          "Nothing that identifies you is ever published. Community alerts and statistics are de-identified first.",
          "You can delete your account at any time from Settings.",
        ],
      },
      {
        heading: "What we collect, and why",
        list: [
          "Your account: name, email address and password (stored only as a one-way hash), and optionally a phone number and organisation — so Council can contact you about your reports.",
          "Your reports: what happened, when, the suburb, any money lost, and the links, numbers and addresses the scammer used — so Council can investigate, match reports and warn others.",
          "Evidence you attach: screenshots, photos and documents. Location and camera details are removed from photos before any officer opens them.",
          "Alert subscriptions: the email address and the kind of alerts you asked for.",
          "Recovery progress: which checklist steps you have ticked, if you are signed in.",
          "Security records: sign-ins, and a log of consequential actions (including who opened which report or file), with the network address they came from.",
        ],
      },
      {
        heading: "Optional AI features",
        paragraphs: [
          "The AI second opinion and the CyberSafe Assistant send the text you choose — and any screenshot you ask it to look at — to Google's Gemini service for analysis. Before anything is sent, card numbers, account numbers and similar sensitive numbers are masked, and location and camera data are removed from images. Google processes it outside Australia, and on the free service it uses, Google may keep what is sent and use it to improve its products. Council keeps a record that the feature was used and what it concluded, but never the text itself — only a fingerprint of it.",
          "You never have to use these features, and you should not send anything you would not want kept. The rule-based check works without them.",
        ],
      },
      {
        heading: "Who can see your information",
        list: [
          "You can see your own reports, files and history.",
          "Council's CyberSafe officers and administrators can see reports and evidence to review them. Every time they open a report or a file it is recorded against their name.",
          "Nobody else. Your details are never sold, never used for marketing, and never published.",
          "Council may share information with police or another agency where the law requires or allows it, for example to investigate a crime.",
        ],
      },
      {
        heading: "Where it is kept",
        paragraphs: [
          "The database and the service's API run in Tokyo, Japan, with providers bound to protect it to a standard comparable to Victoria's Information Privacy Principles. Evidence files are encrypted before they are stored. Email is sent through a transactional email provider. These providers act on Council's behalf and may not use your information for their own purposes.",
        ],
      },
      {
        heading: "How long we keep it",
        list: [
          "Reports, evidence and the audit trail: seven years, as a community-safety record, then deleted or permanently de-identified.",
          "Your account: until you delete it. When you do, your name, email and phone are erased straight away; reports you made stay as Council's record of the scam, with nothing linking them to you.",
          "Alert subscriptions: until you unsubscribe.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "You can see and correct your profile in Settings, and delete your account there. To ask for a copy of the information Council holds about you, or to correct a report, contact the CyberSafe team.",
          "If you are unhappy with how your information has been handled, contact Council first. You can also complain to the Office of the Victorian Information Commissioner (OVIC).",
          "Council handles personal information under the Privacy and Data Protection Act 2014 (Vic) and its Information Privacy Principles.",
        ],
      },
      { heading: "Contact", paragraphs: [CONTACT] },
    ],
  },

  accessibility: {
    slug: "accessibility",
    title: "Accessibility",
    summary: "How this service aims to meet WCAG 2.1 Level AA, what we know is not yet right, and how to tell us.",
    updated: "2026-09-24",
    sections: [
      {
        heading: "Our commitment",
        paragraphs: [
          "Everyone in Hume should be able to check a message, report a scam and read an alert, whatever device they use and however they use it. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA across the whole service.",
        ],
      },
      {
        heading: "What we have done",
        list: [
          "Every page works from 320 pixels wide, on phones, tablets and desktops, and with the text enlarged.",
          "Everything can be reached and used with a keyboard, with a visible focus indicator and a skip link at the top of each page.",
          "Risk levels, severities and statuses are always written in words and never shown by colour alone.",
          "Check results and form errors are announced to screen readers as they appear, and each error is tied to its field.",
          "Movement and animation are switched off for anyone whose device asks for reduced motion.",
          "Light and dark themes both meet contrast requirements.",
          "The scam map has a list beside it with the same numbers.",
        ],
      },
      {
        heading: "What we know is not yet right",
        list: [
          "The service is in English only. Translation into the most-spoken languages in Hume has been proposed (FR84).",
          "Answers from the optional AI features are generated text and may be harder to read than the rest of the service.",
          "Files you attach are shown to officers as they were uploaded, so a screenshot's text is not available to a screen reader.",
        ],
      },
      {
        heading: "Tell us about a problem",
        paragraphs: [
          `If something on this site is hard to use, tell us what you were trying to do and on what device, and we will fix it or get you the information another way. ${CONTACT}`,
          "If you are deaf, hard of hearing or have a speech impairment, you can contact Council through the National Relay Service.",
        ],
      },
    ],
  },

  terms: {
    slug: "terms",
    title: "Terms of use",
    summary: "The basis on which this service is offered, including that its results are advisory and not a professional assessment.",
    updated: "2026-09-24",
    sections: [
      {
        heading: "What this service is",
        paragraphs: [
          "CyberKent is a free advisory service from Hume City Council CyberSafe Services. It helps you judge whether a message might be a scam, report scams to Council, and stay informed about scams circulating in Hume.",
        ],
      },
      {
        heading: "Results are guidance, not a guarantee",
        list: [
          "A check result is based only on what you provide, and is general guidance. It is not a professional cybersecurity assessment or certification.",
          "A low-risk result does not mean a message is safe. Carefully written scams can pass every check.",
          "The service does not guarantee protection from scams or cyberattacks.",
          "Serious incidents may need help from your bank, the police, IDCARE or another qualified professional. If you are in danger, call 000.",
        ],
      },
      {
        heading: "Using the service fairly",
        list: [
          "Report honestly and to the best of your knowledge.",
          "Only attach evidence you are entitled to share, and avoid including other people's personal details where you can.",
          "Do not use the service to harass, accuse or expose anyone, to test attacks, or to overload it.",
          "Council may remove content, limit access or suspend an account that breaks these terms.",
        ],
      },
      {
        heading: "What Council does with reports",
        paragraphs: [
          "An officer reviews every report. Council decides whether a report is verified and whether to publish a de-identified community alert. Council does not act for you with your bank or the police, but will tell you where to go.",
        ],
      },
      {
        heading: "Changes",
        paragraphs: [
          "Council may update the service and these terms. The date at the top of this page shows when they last changed.",
          `Questions: ${CONTACT}`,
        ],
      },
    ],
  },
};
