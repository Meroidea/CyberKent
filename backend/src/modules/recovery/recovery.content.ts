/**
 * FR58 — the recovery checklists, as content in the repository.
 *
 * Kept here rather than only in the seed so the service carries its own
 * guidance: a fresh deployment has the checklists the moment it first serves
 * them (see `recoveryService.ensure`), and a change to the wording is a
 * reviewed code change with history, not an edit in a database console.
 *
 * Every step is ordered by what matters first. Contact details are national
 * services only, and only ones whose numbers are published by the service
 * itself; everything else points at the official site rather than a number
 * that could go stale.
 *
 * `categories` are the scam categories (by slug) a checklist is recommended
 * for (FR59).
 */
export interface ChecklistContent {
  slug: string;
  title: string;
  situation: string;
  categories: string[];
  steps: [title: string, detail: string][];
}

export const CHECKLISTS: ChecklistContent[] = [
  {
    slug: "first-hour",
    title: "The first hour after you have been scammed",
    situation: "You have paid, tapped a link, or shared details you should not have.",
    categories: ["phishing", "toll-and-fines", "parcel-delivery", "online-shopping", "prize-and-lottery"],
    steps: [
      ["Ring the number on the back of your card", "Not a number from the message. Ask for the transaction to be stopped or recalled and write down the reference number."],
      ["Change the password that was exposed", "Start with email, then banking. Use a new passphrase you have not used anywhere else."],
      ["Turn on multi-factor authentication", "On email and banking first, so a stolen password alone is no longer enough."],
      ["Keep the evidence", "Screenshot the messages, the sender's number or address and any payment receipts before anything is deleted."],
      ["Report it", "ReportCyber (cyber.gov.au) if money or documents were lost, Scamwatch for the national picture, and CyberKent so Council can warn Hume."],
      ["Contact IDCARE if identity documents were taken", "Free national support on 1800 595 160, with a response plan for a stolen licence, passport or Medicare card."],
    ],
  },
  {
    slug: "money-sent",
    title: "I sent money to a scammer",
    situation: "You transferred money, paid an invoice or bought gift cards or crypto for someone who turned out to be a scammer.",
    categories: ["bank-impersonation", "family-impersonation", "investment", "romance", "jobs", "payment-redirection"],
    steps: [
      ["Call your bank now, on the number on your card", "Say it is a scam payment and ask for it to be recalled. The sooner you call, the better the chance of getting it back."],
      ["If you paid by gift card, call the card's issuer", "The phone number is on the back of the card or the retailer's website. Have the card numbers and receipts ready."],
      ["If you paid in cryptocurrency, contact the exchange you used", "Report the wallet address you sent to. Exchanges can sometimes freeze funds that reach another account they hold."],
      ["Stop all contact with the scammer", "Do not send more money to 'unlock' or 'release' what you paid. That is a second scam."],
      ["Report it to ReportCyber", "At cyber.gov.au. Police use these reports, and your bank may ask for the reference number."],
      ["Beware of 'recovery' offers", "Anyone who contacts you offering to recover your money for a fee is running another scam. Legitimate help is free."],
      ["Tell Council", "Report it on CyberKent so officers can warn others in Hume. Your details are never published."],
    ],
  },
  {
    slug: "details-shared",
    title: "I gave away my bank or card details",
    situation: "You typed card numbers, a one-time code or your online banking login into a site or read them to a caller.",
    categories: ["phishing", "bank-impersonation", "toll-and-fines", "parcel-delivery", "government-impersonation"],
    steps: [
      ["Call your bank and cancel the card", "Use the number on the back of the card. Ask them to block the card and watch for unusual transactions."],
      ["Change your online banking password", "Do it on the bank's own app or by typing its address yourself — never through a link in a message."],
      ["Check recent transactions", "Look back over the last few weeks, not just today. Report anything you do not recognise to the bank."],
      ["Change any password you reused", "If the same password protects your email or other accounts, change those too, starting with email."],
      ["Keep the message and the link", "Screenshot the message and write down the site address before deleting anything."],
      ["Report it", "To ReportCyber at cyber.gov.au, and to Council on CyberKent."],
    ],
  },
  {
    slug: "identity-stolen",
    title: "My identity documents or personal details were taken",
    situation: "You sent a photo of your licence, passport or Medicare card, or gave your date of birth, address and tax file number to a scammer.",
    categories: ["identity-theft", "government-impersonation", "jobs", "online-shopping"],
    steps: [
      ["Call IDCARE on 1800 595 160", "Australia's free identity and cyber support service. They will build a response plan with you."],
      ["Replace the documents that were exposed", "Your licence through VicRoads, your passport through the Australian Passport Office, your Medicare card through Services Australia."],
      ["Ask for a free ban on your credit file", "Contact one of the credit reporting bodies (Equifax, Experian or illion). A ban stops anyone opening credit in your name."],
      ["Secure your myGov account", "Change the password and turn on multi-factor sign-in at my.gov.au, reached by typing the address yourself."],
      ["Tell your bank and telco", "Ask them to add extra identity checks to your accounts, so nobody can port your number or open an account in your name."],
      ["Report it", "To ReportCyber at cyber.gov.au, then to Council on CyberKent."],
    ],
  },
  {
    slug: "remote-access",
    title: "I let someone into my computer or phone",
    situation: "A caller had you install an app such as AnyDesk or TeamViewer, or took control of your screen.",
    categories: ["remote-access"],
    steps: [
      ["Disconnect from the internet", "Turn off Wi-Fi and unplug the network cable, so the connection is cut."],
      ["Call your bank from another phone", "If they saw or used your banking, tell the bank now and ask them to secure your accounts."],
      ["Remove the remote-access app", "Uninstall anything they asked you to install. If you are unsure, take the device to a trusted technician."],
      ["Change your passwords from a different device", "Email first, then banking, then everything else. Assume anything typed while they were connected was seen."],
      ["Run a security scan", "Use your device's built-in security tools or reputable antivirus before you use the device for banking again."],
      ["Report it", "To ReportCyber at cyber.gov.au, and to Council on CyberKent."],
    ],
  },
  {
    slug: "business-payment",
    title: "Our organisation paid a fake invoice",
    situation: "Your business, club or community group paid an invoice after the bank details were changed by email.",
    categories: ["payment-redirection"],
    steps: [
      ["Call your bank's business fraud line now", "Ask for the payment to be recalled. Give them the amount, time and the account it went to."],
      ["Call the real supplier on a number you already have", "Confirm the invoice was not theirs and tell them their email may have been compromised."],
      ["Secure the mailbox that received it", "Change the password, turn on multi-factor authentication and check for forwarding rules the scammer may have added."],
      ["Hold any other changed payment details", "Pause payments to any supplier whose bank details changed recently until each is confirmed by phone."],
      ["Report it to ReportCyber", "At cyber.gov.au, choosing the business option. Your bank may ask for the reference."],
      ["Write the rule down", "Agree that bank-detail changes are only ever confirmed by phone, on a number already on file, before the next invoice arrives."],
    ],
  },
];
