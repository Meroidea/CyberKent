import { ROUTES, SITE } from "@/config/site";

/**
 * The awareness library: the four guides the landing page previews and the
 * pages they open into.
 *
 * Card and article are one record rather than two. A summary written for the
 * card and a body written for the page drift apart the moment either is edited,
 * and the card is the promise the page has to keep — so the reading time, the
 * category and the summary are read from the same object the sections are.
 *
 * Bodies are structured blocks rather than HTML strings. Nothing here is
 * authored by a visitor, but a block list is what lets the renderer set a
 * checklist as a checklist and a warning as a warning, instead of every guide
 * arriving as an undifferentiated wall of prose.
 */

/** What kind of thing the reader is opening. Shown on the card and the page. */
export type ArticleKind = "Article" | "Tutorial" | "Tips & tricks" | "Checklist";

/** Which of the two accent families a guide's chrome is tinted with. */
export type ArticleAccent = "amber" | "indigo" | "cyan" | "emerald";

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  /** Unordered by default; `ordered` numbers it. */
  | { type: "list"; items: string[]; ordered?: boolean }
  /** Numbered actions, each with a title and the reason behind it. */
  | { type: "steps"; items: { title: string; body: string }[] }
  /** A single point lifted out of the flow, coloured by how urgent it is. */
  | { type: "callout"; tone: "do" | "avoid" | "note"; title: string; body: string }
  /** A pull quote, used at most once per guide. */
  | { type: "quote"; text: string; attribution?: string };

export interface ArticleSection {
  /** Anchor and contents-rail key. Unique within one article. */
  id: string;
  heading: string;
  blocks: ArticleBlock[];
}

export interface LearnArticle {
  /** URL segment under `/learn`, and the key the cover art is looked up by. */
  id: string;
  kind: ArticleKind;
  category: string;
  accent: ArticleAccent;
  title: string;
  /** The faded line on the card, and the standfirst on the page. */
  summary: string;
  readingTime: string;
  /** ISO date, last substantive review. */
  updated: string;
  /** Who this one is written for, in the reader's own words. */
  audience: string;
  /** Opening paragraph of the page, before the first heading. */
  lede: string;
  /** What the reader leaves with. Rendered as the page's opening panel. */
  takeaways: string[];
  sections: ArticleSection[];
}

export const LEARN_ARTICLES: LearnArticle[] = [
  {
    id: "first-hour",
    kind: "Checklist",
    category: "Recovery",
    accent: "amber",
    title: "The first hour after you have been scammed",
    summary:
      "Who to call first, what to freeze, and what evidence to keep before anything is deleted from your phone.",
    readingTime: "4 min",
    updated: "2026-07-28",
    audience: "Anyone who has just paid, tapped or shared something they should not have",
    lede: "The hour after you realise is the hour that decides how much of this you get back. Money that has not left the receiving account can often be recalled; passwords changed before they are used cost the scammer their access. Work down this list in order and do not stop to be embarrassed — every person reading this page got here the same way.",
    takeaways: [
      "Call your bank before you do anything else, including reading the rest of this guide.",
      "Change the password on the account you used to pay, then the email behind it.",
      "Screenshot everything before you block, delete or unsubscribe.",
      "Expect a second approach offering to recover your money. That is the same scam, twice.",
    ],
    sections: [
      {
        id: "stop-the-money",
        heading: "Stop the money moving",
        blocks: [
          {
            type: "paragraph",
            text: "Banks can sometimes recall a transfer that has not yet been drawn down, and every Australian bank runs a 24-hour line for exactly this. Speed matters more than a tidy explanation — say the words \"I have been scammed\" and they will route you straight through.",
          },
          {
            type: "steps",
            items: [
              {
                title: "Ring the number on the back of your card",
                body: "Not a number from the message, an email, or a search result. Scammers buy search advertising against bank names, and a fake support line is how a single loss becomes several.",
              },
              {
                title: "Ask for the transaction to be stopped or recalled",
                body: "Give the amount, the time and the account it went to. Ask them to put a hold on the card or account if you shared card details or a one-time code.",
              },
              {
                title: "Write down the reference number they give you",
                body: "You will need it for the report, for any insurance claim, and for every follow-up call. Take the operator's name as well.",
              },
              {
                title: "If you paid by gift card, crypto or a money transfer service",
                body: "Call that provider directly and quote the receipt numbers. Recovery is much less likely, but gift cards in particular are sometimes still unspent, and the provider can freeze them.",
              },
            ],
          },
          {
            type: "callout",
            tone: "do",
            title: "Do this even if you are not sure yet",
            body: "A bank can release a hold in minutes if it turns out to be a false alarm. It cannot recover a transfer that has already been withdrawn. Uncertainty is a reason to call sooner, not later.",
          },
        ],
      },
      {
        id: "lock-the-account",
        heading: "Lock the account they reached you through",
        blocks: [
          {
            type: "paragraph",
            text: "If you entered a password or a verification code on a page that turned out to be fake, treat that account as being in someone else's hands right now. The order below matters: your email is the master key to everything else, because it is where every password reset lands.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Change the password on the account you actually used — the bank, the retailer, the delivery service.",
              "Change the password on the email address that account is registered to, even if the scam never touched your email.",
              "Turn on two-factor authentication on both, if it is not on already.",
              "Sign out of all other sessions or devices — most services have this in security settings, and it is what evicts someone who is already in.",
              "Check for changes someone else made: forwarding rules on your email, a new recovery phone number, a changed delivery address.",
            ],
          },
          {
            type: "callout",
            tone: "avoid",
            title: "Do not reuse a password you have used elsewhere",
            body: "A password taken in one scam is tried against every other service within days. If the new password is a variation of the old one, treat it as already known.",
          },
        ],
      },
      {
        id: "keep-the-evidence",
        heading: "Keep the evidence before you tidy up",
        blocks: [
          {
            type: "paragraph",
            text: "The instinct is to delete the message and block the number. Do it — but only after you have captured it. A report with evidence attached is one Council and the platforms can act on; a report without it is a statistic.",
          },
          {
            type: "list",
            items: [
              "Screenshot the message, the sender's number or address, and the timestamp.",
              "Screenshot the payment confirmation, including the receiving account name and any reference.",
              "Copy the full link before you delete it — long-press to copy rather than tapping it again.",
              "Note the times you were called, and the number shown, even if it looked like a legitimate one.",
              "Keep any voicemail. Do not delete a call recording to free up space.",
            ],
          },
          {
            type: "quote",
            text: "The number displayed on your phone proves nothing. Caller ID is trivially forged, and a call that shows your bank's real number is a common opening move.",
          },
        ],
      },
      {
        id: "report-it",
        heading: "Report it, in this order",
        blocks: [
          {
            type: "paragraph",
            text: "Each of these does something different. The bank moves money, the police create a record you may need for insurance or a credit dispute, and Council alerts the neighbours who are about to be approached with the same script.",
          },
          {
            type: "steps",
            items: [
              {
                title: "Your bank — done in the first step",
                body: "They act on the transaction itself and can flag the receiving account with the recipient bank.",
              },
              {
                title: "ReportCyber, if money or identity documents were lost",
                body: "Run by the Australian Signals Directorate and routed to your state police. This is the record insurers and credit bureaus ask for.",
              },
              {
                title: "Scamwatch, run by the National Anti-Scam Centre",
                body: "This is the national picture. It does not investigate individual reports, but it is what drives platform takedowns and warnings.",
              },
              {
                title: `${SITE.name} — report it to Council`,
                body: "A local report is what puts a verified alert in front of the rest of Hume, with your details removed. It is usually the fastest way to warn people on your street.",
              },
              {
                title: "IDCARE, if identity documents were taken",
                body: "A free national service that builds you a response plan for a stolen licence, passport or Medicare number. Replacing the document is not enough on its own.",
              },
            ],
          },
        ],
      },
      {
        id: "the-second-scam",
        heading: "Expect the second approach",
        blocks: [
          {
            type: "paragraph",
            text: "Within days to months, people who have been scammed are approached again — by a \"recovery agency\", a \"fraud investigator\", a lawyer who has heard about your case, or someone from the same bank you just called. Lists of victims are sold precisely because a person who has lost money is more likely to pay to get it back.",
          },
          {
            type: "callout",
            tone: "avoid",
            title: "No legitimate service charges an upfront fee to recover scammed money",
            body: "Not your bank, not the police, not any government agency, not a law firm working on your behalf. If someone contacts you first and asks for a fee, a deposit or your remaining account details to release funds, that is the second scam.",
          },
          {
            type: "paragraph",
            text: "Tell one other person what happened today. Not for advice — so that when a second call comes, there is someone who already knows the shape of it and can say the thing you will not be able to say to yourself.",
          },
        ],
      },
    ],
  },
  {
    id: "small-business",
    kind: "Tutorial",
    category: "Small business",
    accent: "indigo",
    title: "Payment redirection: a checklist for small teams",
    summary:
      "How invoice fraud reaches a business inbox, and the two verification habits that stop almost all of it.",
    readingTime: "6 min",
    updated: "2026-07-14",
    audience: "Anyone in a small business who can approve or make a payment",
    lede: "Payment redirection is the most expensive scam type Australian businesses face, and it is almost never technically clever. Someone reads a real email thread, waits for a real invoice, and changes the bank details. Nothing is hacked, nothing looks wrong, and the money goes out through your own approval process. Two habits — set up once — stop nearly all of it.",
    takeaways: [
      "Verify every change of bank details by phone, using a number you already had.",
      "Treat urgency in a payment request as a signal, not a reason to hurry.",
      "Lock down the mailbox: two-factor authentication, and an alert on forwarding rules.",
      "Write the rule down so it survives the person who knows it leaving.",
    ],
    sections: [
      {
        id: "how-it-reaches-you",
        heading: "How it reaches your inbox",
        blocks: [
          {
            type: "paragraph",
            text: "There are three routes, and they feel identical from the receiving end. Knowing which one you are looking at matters less than knowing that all three end in the same request: pay this account instead.",
          },
          {
            type: "steps",
            items: [
              {
                title: "The supplier's mailbox was compromised",
                body: "The email genuinely comes from your supplier's address, quoting a real job, on a real thread. Nothing about the header is wrong, because nothing about it is fake. This is the hardest version to catch and the most common.",
              },
              {
                title: "The domain is a near miss",
                body: "One character changed, a letter swapped, a .com where the real one is .com.au, or an \"rn\" where the original has an \"m\". Reply-to points somewhere else while the visible from-address looks right.",
              },
              {
                title: "The display name alone is spoofed",
                body: "The name shows as your director or your accounts contact, but the underlying address is a free mail account. Phones show the display name and hide the address, which is why this one lands.",
              },
            ],
          },
          {
            type: "callout",
            tone: "note",
            title: "The tell is the change, not the email",
            body: "Every version ends with new bank details, a new payee, or a request to pay a different way. That change is the thing to verify. You do not need to work out which of the three routes it took.",
          },
        ],
      },
      {
        id: "the-callback-rule",
        heading: "Habit one: the callback rule",
        blocks: [
          {
            type: "paragraph",
            text: "No change to payment details is actioned without a phone call to a number you already held — from a signed contract, a previous statement, or your own contact list. Never a number in the email requesting the change, and never a number on a document attached to it.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Find the supplier's number in your own records, not in the message.",
              "Call and ask a specific question: \"Have your account details changed this month?\"",
              "Confirm the last four digits of the new account with them, rather than reading the whole number out for them to agree with.",
              "Note the date, the number you called and who you spoke to, on the invoice record.",
              "Only then update the payee in your accounting system.",
            ],
          },
          {
            type: "callout",
            tone: "avoid",
            title: "Do not verify by replying to the email",
            body: "If the mailbox is compromised, the person answering your careful verification question is the scammer, and your reply is the confirmation they needed. A reply is not a second channel.",
          },
          {
            type: "paragraph",
            text: "Read the last four digits back to them rather than the other way around. If you read the whole number and ask \"is that right?\", you have handed over the answer, and a scammer already on the call will simply agree.",
          },
        ],
      },
      {
        id: "the-second-pair-of-eyes",
        heading: "Habit two: a second pair of eyes on new payees",
        blocks: [
          {
            type: "paragraph",
            text: "Any payment to an account you have not paid before is approved by a second person. This is not about trust — it is about the fact that the person who has been reading a thread all week is exactly the person primed not to notice it changed.",
          },
          {
            type: "list",
            items: [
              "Set a threshold you can actually live with, and apply it to first-time payees regardless of amount.",
              "Have the second approver check one thing only: was the callback made, and to which number.",
              "Make a small test payment to a genuinely new supplier and confirm receipt before the balance.",
              "Where your bank offers confirmation-of-payee name checking, turn it on and read what it tells you.",
            ],
          },
          {
            type: "quote",
            text: "Urgency is the tool, not the context. \"Before close of business\", \"the director is on a flight\", \"we will lose the contract\" — every one of them exists to get past the step you are reading about now.",
          },
        ],
      },
      {
        id: "harden-the-mailbox",
        heading: "Harden the mailbox behind it",
        blocks: [
          {
            type: "paragraph",
            text: "Your own accounts mailbox is the version of this that hits your customers. If it is taken, invoices go out from you with the wrong details, and the reputational cost is worse than the loss.",
          },
          {
            type: "steps",
            items: [
              {
                title: "Two-factor authentication on every mailbox, no exceptions",
                body: "Especially accounts@, admin@ and any shared mailbox. Shared mailboxes are usually the last to get it and the first to be targeted.",
              },
              {
                title: "Check for forwarding and inbox rules monthly",
                body: "A rule that quietly forwards anything containing \"invoice\" to an outside address is the standard footprint. It survives a password change, so changing the password alone does not evict them.",
              },
              {
                title: "Remove the accounts of people who have left",
                body: "Not just disabled — reviewed and removed, along with any app password or mail client still holding a token.",
              },
              {
                title: "Put your bank details on the invoice and nowhere else",
                body: "Then tell customers, in writing, that your details never change by email. It gives them permission to ring you, which is what you want them to do.",
              },
            ],
          },
        ],
      },
      {
        id: "if-it-has-happened",
        heading: "If a payment has already gone out",
        blocks: [
          {
            type: "paragraph",
            text: "Move in the first hour, in this order. The steps are the same as for a personal loss, with two additions that only apply to a business.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Call your bank's fraud line and ask for a recall on the transaction.",
              "Call the supplier on a known number and tell them — their mailbox may be the compromised one, and other customers are being sent the same invoice.",
              "Preserve the email with its full headers. Do not delete or forward-and-delete; your bank or the police may need the original.",
              "Report to ReportCyber, and to Council so an alert can go out to other Hume businesses.",
              "Check your own mailbox for rules and unfamiliar sign-ins before you assume the problem was at their end.",
            ],
          },
          {
            type: "callout",
            tone: "do",
            title: "Write the rule down before you need it",
            body: "One page, on the wall by the desk where payments are made: verify every change by phone, second approver on new payees, no exceptions for urgency. A habit that lives in one person's head leaves when they do.",
          },
        ],
      },
    ],
  },
  {
    id: "older-residents",
    kind: "Article",
    category: "Community",
    accent: "cyan",
    title: "Talking to family about phone scams",
    summary:
      "A conversation guide for supporting older relatives without taking away their independence or confidence.",
    readingTime: "5 min",
    updated: "2026-06-30",
    audience: "Anyone worried about a parent, grandparent or neighbour",
    lede: "Most of these conversations fail for the same reason: they sound like a warning about competence. The person hears \"you can't be trusted with your own phone\", and the next time something happens they handle it alone rather than tell you. What follows is a way to have it that leaves someone more confident than you found them.",
    takeaways: [
      "Lead with a story about someone else — including yourself — never with a warning.",
      "Give three sentences to say out loud, not a list of scams to memorise.",
      "Set up the practical protections together, in their hands, on their phone.",
      "Agree now what happens if it does go wrong, so shame does not become silence.",
    ],
    sections: [
      {
        id: "why-it-fails",
        heading: "Why the usual conversation fails",
        blocks: [
          {
            type: "paragraph",
            text: "Scams that target older people are not built around gullibility. They are built around authority and time pressure — a police officer, a bank's fraud team, the tax office, a grandchild in trouble — and they work on people of every age and background. Anyone told \"be careful, you're vulnerable\" hears an accusation and stops listening.",
          },
          {
            type: "paragraph",
            text: "There is a second cost. Someone who has been told they are at risk, and is then caught out, has a strong reason not to mention it. Silence is what turns a recoverable loss into an unrecoverable one, because the bank was never called.",
          },
          {
            type: "callout",
            tone: "avoid",
            title: "Three openings to avoid",
            body: "\"You need to be really careful with these calls.\" \"Just never answer an unknown number.\" \"Let me handle the banking from now on.\" Each of them trades a small amount of safety for a large amount of independence, and none of them survives contact with a convincing caller.",
          },
        ],
      },
      {
        id: "open-with-a-story",
        heading: "Open with a story, not a warning",
        blocks: [
          {
            type: "paragraph",
            text: "Start with something that happened to you, or to someone you both know. It moves the conversation from \"you are at risk\" to \"this is happening to everyone\", which is both truer and easier to hear.",
          },
          {
            type: "list",
            items: [
              "\"I nearly got caught by a text about a parcel last week — it came right when I was expecting one.\"",
              "\"Someone at work paid an invoice that turned out to be fake. It looked completely normal.\"",
              "\"There's a scam going around Hume at the moment where they ring pretending to be the bank. Have you had one of those?\"",
            ],
          },
          {
            type: "paragraph",
            text: "Then ask, and stop talking. Most people have already had one of these calls and have never told anyone. The conversation you are trying to have usually starts on its own from there.",
          },
        ],
      },
      {
        id: "three-sentences",
        heading: "The three sentences worth memorising",
        blocks: [
          {
            type: "paragraph",
            text: "Nobody can hold a list of scam types in their head under pressure, and the scripts change every month anyway. What works is a small number of sentences that end any call safely, whoever is on it.",
          },
          {
            type: "steps",
            items: [
              {
                title: "\"I'll call you back on the number I already have.\"",
                body: "This one sentence defeats almost every impersonation call, because the whole scam depends on staying on the line. A real bank, a real police officer and a real government office will all say yes to it without hesitating.",
              },
              {
                title: "\"I don't make decisions about money on the phone.\"",
                body: "Not a judgement about whether the caller is genuine — a standing rule that applies to everyone. Rules are easier to hold than judgements when someone is being pressured.",
              },
              {
                title: "\"Let me talk to my family first.\"",
                body: "Scammers work hard to make the call a secret — \"don't tell anyone, it's an active investigation\". Saying this out loud usually ends the call on the spot, which is itself the answer.",
              },
            ],
          },
          {
            type: "quote",
            text: "Nobody legitimate is harmed by being called back. Anyone who argues with being called back has told you what they are.",
          },
        ],
      },
      {
        id: "set-it-up-together",
        heading: "Set the protections up together",
        blocks: [
          {
            type: "paragraph",
            text: "Do this side by side, on their phone, with their hands on it. Something configured for someone while they watch is something they cannot undo, check or explain later — and the point is that they stay in control of their own accounts.",
          },
          {
            type: "list",
            items: [
              "Turn on silence-unknown-callers, and show them where the missed calls still appear, so it does not feel like losing the phone.",
              "Save the bank's real number as a contact, so a genuine call shows a name and a fake one does not.",
              "Register on the Do Not Call Register together — it will not stop scammers, but it makes the remaining cold calls more suspicious by default.",
              "Set up account alerts for transfers over a chosen amount, going to both of you if they want that.",
              "Agree on a family phrase that a real relative would know, for the \"it's me, I've lost my phone\" message.",
            ],
          },
          {
            type: "callout",
            tone: "do",
            title: "Leave them something to check with",
            body: "Write the scam checker address on a card by the phone, alongside your number and the bank's real one. Being able to check a message themselves, at the moment it arrives, is worth more than any conversation you can have in advance.",
          },
        ],
      },
      {
        id: "if-it-happens",
        heading: "Agree now what happens if it goes wrong",
        blocks: [
          {
            type: "paragraph",
            text: "This is the part people skip, and it is the part that matters most. Say plainly, before anything has happened: if you ever think you have been caught, ring me straight away and I will not be cross. We will call the bank together.",
          },
          {
            type: "paragraph",
            text: "If it does happen, the response is the whole conversation. No \"how did you not see it\", no going through the message line by line looking for what they missed. Call the bank, keep the evidence, report it — and say out loud that this happens to people who are sharp, careful and entirely capable of managing their own affairs, because it does.",
          },
        ],
      },
    ],
  },
  {
    id: "not-for-profit",
    kind: "Tips & tricks",
    category: "Organisations",
    accent: "emerald",
    title: "Protecting a volunteer-run organisation",
    summary:
      "Practical account, donation and record-keeping controls that work when nobody on the committee is technical.",
    readingTime: "7 min",
    updated: "2026-06-12",
    audience: "Committees, clubs, faith groups and community organisations in Hume",
    lede: "A community organisation has most of the exposure of a small business and none of the resources: shared logins, a treasurer who is also the secretary, a committee that turns over every year, and money moving through accounts nobody watches daily. None of what follows needs a technical person. All of it needs a decision minuted once.",
    takeaways: [
      "Accounts belong to the organisation, not to whoever set them up.",
      "Two people on every payment, written into the rules rather than left to habit.",
      "Publish one donation channel and say plainly that it is the only one.",
      "Keep less: the member data you do not hold cannot be lost.",
    ],
    sections: [
      {
        id: "why-targeted",
        heading: "What makes a small organisation a target",
        blocks: [
          {
            type: "paragraph",
            text: "It is not that anyone thinks a local club is wealthy. It is that the controls are predictable — one person with all the access, a public list of office bearers, published contact addresses, and a culture where doing a favour quickly is the whole point of volunteering.",
          },
          {
            type: "list",
            items: [
              "A public \"meet the committee\" page tells a scammer exactly who to impersonate and who to impersonate them to.",
              "The president's name and the treasurer's email are enough for the \"can you do something for me urgently\" message.",
              "Grant and fundraising periods are visible from outside, and unusual payments are expected during them.",
              "Handover season — new committee, new access, old accounts nobody closed — is the annual soft spot.",
            ],
          },
        ],
      },
      {
        id: "accounts-and-handover",
        heading: "Accounts: solve the handover problem first",
        blocks: [
          {
            type: "paragraph",
            text: "Most incidents in volunteer organisations start with an account still in a former member's name, or a password shared through a group chat three committees ago. Fix ownership before you fix anything else.",
          },
          {
            type: "steps",
            items: [
              {
                title: "Put every account in the organisation's name",
                body: "The email, the social media pages, the website, the accounting file, the domain. Registered to an organisation address that more than one person can reach — not to a personal Gmail.",
              },
              {
                title: "Use a password manager the committee shares",
                body: "One free vault, shared with the two or three roles that need it. It ends passwords in group chats and, more importantly, it means handover is a permission change rather than a hunt.",
              },
              {
                title: "Two-factor authentication on the email and the bank",
                body: "Where a phone number is the second factor, make sure it is a number the organisation controls or that two office bearers can reach, or the next handover locks you out of your own account.",
              },
              {
                title: "Make removal part of the handover checklist",
                body: "Outgoing office bearers lose access on the day, as a matter of routine and not of suspicion. Add it to the AGM checklist so nobody has to be the one to raise it.",
              },
            ],
          },
          {
            type: "callout",
            tone: "note",
            title: "Write down who holds what",
            body: "One page in the committee records listing every account, who owns it, and who has access. Not the passwords — just the map. It is the single most useful document a small organisation can keep, and almost none of them have one.",
          },
        ],
      },
      {
        id: "money",
        heading: "Money: two people, every time",
        blocks: [
          {
            type: "paragraph",
            text: "Dual authorisation is the one control that pays for itself, and it protects the treasurer as much as the funds — it means no single person can ever be blamed for a payment that went wrong.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Two signatories on the bank account, with dual authorisation switched on for transfers.",
              "New payees verified by phone on a number from your own records, exactly as a business would.",
              "A standing rule that the organisation never pays by gift card, crypto or a personal account — so any request to do so is refused without a discussion.",
              "Bank statements tabled at every meeting and read by someone other than the treasurer.",
              "Cash from events counted by two people and banked promptly, with the count minuted.",
            ],
          },
          {
            type: "callout",
            tone: "avoid",
            title: "The president-in-a-hurry message",
            body: "\"I'm in a meeting, can you sort out a payment for me — don't call, just do it.\" It arrives from a lookalike address or a new mobile number, and it is aimed squarely at a volunteer who wants to be helpful. The rule that defeats it is simple: no payment is ever approved by message alone, from anyone, including the president.",
          },
        ],
      },
      {
        id: "donations",
        heading: "Donations and fundraising pages",
        blocks: [
          {
            type: "paragraph",
            text: "Fake fundraising pages that copy a real organisation's name, logo and story are common and quick to set up, particularly after a local event that draws attention. You cannot stop them being created — you can make yours the one people can confirm.",
          },
          {
            type: "list",
            items: [
              "Run one donation channel, linked from your own website, and say on every post that it is the only one.",
              "Use the same wording each time, so supporters learn the shape of a genuine appeal from you.",
              "Never take donations through a direct message, and tell your supporters that you never will.",
              "Search your organisation's name occasionally on the major fundraising platforms and social networks, and report duplicates.",
              "If a fake appears, post a short factual notice with your real link, and report it to Council so a community alert can go out.",
            ],
          },
          {
            type: "quote",
            text: "Supporters do not verify organisations — they verify links. Give them one link that never changes, and the copies stop working.",
          },
        ],
      },
      {
        id: "records",
        heading: "Records: keep less of it",
        blocks: [
          {
            type: "paragraph",
            text: "Membership lists, working-with-children checks, medical notes for a junior team, bank details for reimbursements. A small organisation often holds more sensitive data than a small business, and stores it in one person's downloads folder.",
          },
          {
            type: "list",
            items: [
              "Collect only what the activity actually requires, and stop collecting fields nobody uses.",
              "Keep records in the organisation's shared drive, not on personal devices or in a mailbox.",
              "Delete what you no longer need — old registration forms, past seasons' lists, spreadsheets of bank details.",
              "Restrict who can see what: a canteen roster does not need access to member medical notes.",
              "Have one written line about what happens if data is lost, including telling the people affected.",
            ],
          },
        ],
      },
      {
        id: "one-page-plan",
        heading: "The one-page plan to adopt at the next meeting",
        blocks: [
          {
            type: "paragraph",
            text: "Move it as a motion, minute it, and put it in the handover pack. It takes a single meeting and it is most of the protection available to an organisation your size.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "All accounts registered to the organisation, listed on one page, reviewed at each AGM.",
              "Two-factor authentication on the email and the bank.",
              "Dual authorisation on every payment, and a phone check on every new or changed payee.",
              "No payments by gift card, crypto or personal account, ever.",
              "One published donation channel, named on every appeal.",
              "Access removed on the day an office bearer steps down.",
              "If something goes wrong: call the bank, keep the evidence, tell the committee, report it to Council and to ReportCyber.",
            ],
          },
          {
            type: "callout",
            tone: "do",
            title: "Name someone, not a role nobody holds",
            body: "Give one committee member the job of raising this once a year. Not a technical role — a calendar one. Controls that belong to everybody are maintained by nobody.",
          },
        ],
      },
    ],
  },
];

/** Path to a guide. Kept here so no caller builds the URL by hand. */
export function articleHref(article: Pick<LearnArticle, "id">): string {
  return `${ROUTES.learn}/${article.id}`;
}

export function findArticle(id: string | undefined): LearnArticle | undefined {
  return LEARN_ARTICLES.find((article) => article.id === id);
}
