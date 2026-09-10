import type { Channel } from "@/lib/scam/types";

/**
 * The labelled evaluation set for the detection engine.
 *
 * Written to answer one question the Lecturer put to the team directly — does
 * the system analyse the risk *correctly* — and the only honest way to answer
 * that is against messages whose true label is known in advance.
 *
 * Two halves, deliberately close in size. The scam half covers every family in
 * the Scamwatch taxonomy the service reports against; the genuine half is the
 * harder half, because each one is chosen to *look* like its scam counterpart:
 * a real bank notice that mentions a PIN, a real toll reminder, a real Council
 * rates notice. A rule set that only ever saw scams would score perfectly on
 * detection and still fail the community by flagging their actual mail.
 *
 * `expect` is the band a careful human reviewer would give it. For scoring,
 * MEDIUM and HIGH both count as "flagged" — the service's job at the point of
 * checking is to make someone stop, and a medium verdict does that.
 */
export interface LabelledCase {
  id: string;
  family: string;
  label: "scam" | "genuine" | "insufficient";
  expect: "high" | "medium" | "low" | "unclear";
  channel: Channel;
  text: string;
}

export const CORPUS: LabelledCase[] = [
  /* ── Scams ─────────────────────────────────────────────────────────── */
  {
    id: "S01", family: "Toll road", label: "scam", expect: "high", channel: "sms",
    text: "LINKT: You have an unpaid toll of $4.20. Late fees apply within 24 hours. Settle now: linkt-au.pay-toll.online",
  },
  {
    id: "S02", family: "Government impersonation", label: "scam", expect: "high", channel: "email",
    text: "Hume City Council: our records show you overpaid your rates by $283.60. Reply with your BSB and account number to release the refund immediately or it will be cancelled.",
  },
  {
    id: "S03", family: "Business email compromise", label: "scam", expect: "high", channel: "email",
    text: "Urgent - I need you to buy 5 gift cards for a client today. Do not tell anyone, I am in a meeting. Send the codes.",
  },
  {
    id: "S04", family: "Phishing", label: "scam", expect: "high", channel: "email",
    text: "Please verify your identity at http://192.168.44.9/login to avoid your account being suspended permanently.",
  },
  {
    id: "S05", family: "Parcel delivery", label: "scam", expect: "high", channel: "sms",
    text: "AusPost: Your parcel is on hold due to an incomplete address. Update your delivery details within 12 hours or it will be returned: https://auspost.com.au.redeliver-parcel.info/track",
  },
  {
    id: "S06", family: "Family impersonation", label: "scam", expect: "high", channel: "sms",
    text: "Hi Mum, I dropped my phone and this is my new number. Can you help me pay a bill today? I'll pay you back tomorrow, please don't tell dad yet.",
  },
  {
    id: "S07", family: "Payment redirection", label: "scam", expect: "high", channel: "email",
    text: "Dear customer, please note our bank account details have changed due to an audit. Kindly transfer the outstanding invoice of $8,450 to our new account, BSB 062-000, account 1234 5678, today.",
  },
  {
    id: "S08", family: "Investment", label: "scam", expect: "high", channel: "social",
    text: "Join our crypto trading platform and earn guaranteed returns of 3% daily. Risk-free, spots are limited so act now. Deposit via USDT to start.",
  },
  {
    id: "S09", family: "Jobs and employment", label: "scam", expect: "medium", channel: "sms",
    text: "Hello! We are hiring for a part-time job, work from home and earn $400 a day. No experience needed. Contact us on WhatsApp to begin.",
  },
  {
    id: "S10", family: "Remote access", label: "scam", expect: "high", channel: "phone",
    text: "This is Telstra technical support. Your internet has been hacked and your service will be suspended today. Please install AnyDesk so we can fix it immediately.",
  },
  {
    id: "S11", family: "Prize and lottery", label: "scam", expect: "high", channel: "email",
    text: "Congratulations! You have won $50,000 in the international lucky draw. To claim your prize, pay the processing fee of $250 by gift card within 48 hours.",
  },
  {
    id: "S12", family: "Tax impersonation", label: "scam", expect: "high", channel: "phone",
    text: "This is the ATO. There is a warrant for your arrest over unpaid tax. Pay the outstanding amount immediately in bitcoin or the police will attend your address.",
  },
  {
    id: "S13", family: "Bank impersonation", label: "scam", expect: "high", channel: "sms",
    text: "CommBank: We detected unusual sign-in activity on your account. Your access has been limited. Confirm your card details here: https://commbank-secure-login.com/verify",
  },
  {
    id: "S14", family: "Account takeover", label: "scam", expect: "high", channel: "sms",
    text: "Your Netflix membership has been suspended because we could not validate your payment. Update now to avoid permanent closure: bit.ly/nflx-update",
  },
  {
    id: "S15", family: "Credential theft", label: "scam", expect: "high", channel: "sms",
    text: "myGov: Your account will be deactivated today. Log in here to keep access: https://mygov-au.help/login",
  },
  {
    id: "S16", family: "One-time code theft", label: "scam", expect: "high", channel: "sms",
    text: "Hi, I accidentally sent my verification code to your number. Can you send me the one-time code you just received? It's urgent.",
  },
  {
    id: "S17", family: "Userinfo link trick", label: "scam", expect: "high", channel: "email",
    text: "PayPal: a payment of $849.00 is pending. If you did not authorise it, cancel here: https://www.paypal.com@payment-review.top/cancel",
  },
  {
    id: "S18", family: "Lookalike domain", label: "scam", expect: "high", channel: "email",
    text: "Westpac security team: a new payee was added to your account. If this was not you, secure your account now at https://westpac-verify.xyz",
  },
  {
    id: "S19", family: "Energy rebate", label: "scam", expect: "medium", channel: "sms",
    text: "You are eligible for the $300 energy bill rebate. Claim your rebate before it expires today at energy-relief-claim.online",
  },
  {
    id: "S20", family: "Customs fee", label: "scam", expect: "high", channel: "sms",
    text: "Your package could not be delivered. A customs fee of $3.99 is owing. Pay now to avoid it being returned: https://parcel-customs.click/pay",
  },
  {
    id: "S21", family: "Malware download", label: "scam", expect: "high", channel: "sms",
    text: "You have a new voicemail message. Listen here: http://voicemail-au.live/player.apk",
  },
  {
    id: "S22", family: "Encoded redirect", label: "scam", expect: "medium", channel: "email",
    text: "Your document is ready to view. Open it here: https://docs-share.link/open?redirect=https%3A%2F%2Flogin-office365.xyz%2Fsignin",
  },
  {
    id: "S23", family: "Punycode homograph", label: "scam", expect: "high", channel: "email",
    text: "Apple ID: your account has been locked for security reasons. Sign in to unlock it: https://xn--pple-43d.com/id",
  },
  {
    id: "S24", family: "Charity", label: "scam", expect: "medium", channel: "phone",
    text: "We are collecting urgent donations for flood victims. Please donate today by wire transfer, and keep this confidential as it is a private appeal.",
  },

  /* ── Genuine — each chosen to resemble a scam family above ─────────── */
  {
    id: "G01", family: "Council service notice", label: "genuine", expect: "low", channel: "email",
    text: "Your green waste collection day is changing from Tuesday to Thursday starting next month. More details are available on our website at hume.vic.gov.au/waste",
  },
  {
    id: "G02", family: "Personal message", label: "genuine", expect: "low", channel: "sms",
    text: "Hi, running about ten minutes late for the meeting. See you shortly at the cafe on the corner.",
  },
  {
    id: "G03", family: "Bank security notice", label: "genuine", expect: "low", channel: "email",
    text: "A reminder from your bank: we will never ask for your password, PIN or one-time code by email or SMS. If you receive a message asking for these, do not respond.",
  },
  {
    id: "G04", family: "Appointment reminder", label: "genuine", expect: "low", channel: "sms",
    text: "Reminder: your appointment with Dr Nguyen at Broadmeadows Medical Centre is on Thursday at 10:30am. Reply C to confirm.",
  },
  {
    id: "G05", family: "Delivery update", label: "genuine", expect: "low", channel: "sms",
    text: "Your order has been dispatched and is expected to arrive on Friday. Track it in the app or at auspost.com.au.",
  },
  {
    id: "G06", family: "School newsletter", label: "genuine", expect: "low", channel: "email",
    text: "Dear parents, the Year 5 excursion to the Melbourne Museum is on the 14th. Please return the signed permission form to the front office by Monday.",
  },
  {
    id: "G07", family: "Government notice", label: "genuine", expect: "low", channel: "email",
    text: "You have a new message in your myGov inbox. To read it, sign in to myGov by typing my.gov.au into your browser. We do not include links in these emails.",
  },
  {
    id: "G08", family: "Toll account", label: "genuine", expect: "low", channel: "email",
    text: "Your Linkt account statement for August is now available. You can view it by logging in to your account at linkt.com.au.",
  },
  {
    id: "G09", family: "Workplace message", label: "genuine", expect: "low", channel: "email",
    text: "Hi team, the quarterly planning session has moved to Wednesday at 2pm in meeting room 3. Agenda attached, let me know if you cannot make it.",
  },
  {
    id: "G10", family: "Family message", label: "genuine", expect: "low", channel: "sms",
    text: "Hi Mum, just landed in Sydney. The flight was fine, I'll call you tonight after dinner.",
  },
  {
    id: "G11", family: "Retail receipt", label: "genuine", expect: "low", channel: "email",
    text: "Thanks for shopping with us. Your receipt for order 58213 is attached. Items can be returned within 30 days with proof of purchase.",
  },
  {
    id: "G12", family: "Library notice", label: "genuine", expect: "low", channel: "email",
    text: "Hume Libraries: the book you reserved is ready to collect from the Craigieburn library. It will be held for seven days.",
  },
  {
    id: "G13", family: "Utility bill", label: "genuine", expect: "low", channel: "email",
    text: "Your electricity bill for July is ready. The amount of $142.50 is due on 28 August and will be paid by direct debit as usual. No action is needed.",
  },
  {
    id: "G14", family: "Community event", label: "genuine", expect: "low", channel: "social",
    text: "Join us at Broadmeadows Town Park this Saturday for the community picnic. Free face painting, a sausage sizzle and live music from 11am.",
  },
  {
    id: "G15", family: "Sports club", label: "genuine", expect: "low", channel: "sms",
    text: "Training is cancelled tonight because of the rain. See everyone on Thursday at the usual time.",
  },
  {
    id: "G16", family: "Rates notice", label: "genuine", expect: "low", channel: "email",
    text: "Your 2026-27 rates notice is now available. Payment options, including BPAY and instalments, are listed on the notice and at hume.vic.gov.au/rates",
  },

  /* ── Not enough to assess ──────────────────────────────────────────── */
  { id: "U01", family: "Too short", label: "insufficient", expect: "unclear", channel: "sms", text: "hello" },
  { id: "U02", family: "Too short", label: "insufficient", expect: "unclear", channel: "sms", text: "ok thanks" },
];

/**
 * Held out — written after the rules were revised, and never used to tune them.
 *
 * The corpus above found the defects and then confirmed the fixes, which means
 * a perfect score on it proves less than it appears to: the rules were shaped
 * by those exact messages. These cases were written afterwards and scored once.
 * Whatever they show is reported as it is, including misses.
 */
export const HELD_OUT: LabelledCase[] = [
  {
    id: "H01", family: "Rental", label: "scam", expect: "high", channel: "social",
    text: "The apartment is still available but I am overseas for work. Transfer the bond of $1,800 by Western Union and I will courier you the keys this week.",
  },
  {
    id: "H02", family: "Marketplace overpayment", label: "scam", expect: "medium", channel: "sms",
    text: "I have sent $950 for the couch, $200 more than the price by mistake. Please refund the extra to my cousin's account before the courier collects it.",
  },
  {
    id: "H03", family: "Superannuation", label: "scam", expect: "high", channel: "phone",
    text: "We can release your super early today. We just need your tax file number and myGov password to process the claim immediately.",
  },
  {
    id: "H04", family: "Streaming renewal", label: "scam", expect: "high", channel: "email",
    text: "Your subscription could not be renewed. Your account will be suspended within 24 hours unless you update your card details at https://stan-billing-help.xyz/renew",
  },
  {
    id: "H05", family: "Romance", label: "scam", expect: "medium", channel: "social",
    text: "My darling, I need help paying the customs fee to release my inheritance so I can finally come to Australia to be with you. Please send it through bitcoin.",
  },
  {
    id: "H06", family: "Fake invoice", label: "scam", expect: "high", channel: "email",
    text: "Please find attached the overdue invoice. Note that our banking details have changed, so pay the new account shown to avoid late fees.",
  },
  {
    id: "H07", family: "Quishing", label: "scam", expect: "medium", channel: "other",
    text: "Parking fine notice. Scan the QR code on this sticker to pay your penalty online now: https://pay-parking-vic.top",
  },
  {
    id: "H08", family: "Tech support", label: "scam", expect: "high", channel: "website",
    text: "WARNING: Your computer is infected. Do not close this page. Call Microsoft support now on 1800 000 000 and allow remote access to fix it.",
  },
  {
    id: "N01", family: "Pharmacy", label: "genuine", expect: "low", channel: "sms",
    text: "Your prescription is ready to collect from Craigieburn Central Pharmacy. We are open until 9pm tonight.",
  },
  {
    id: "N02", family: "Bank transfer receipt", label: "genuine", expect: "low", channel: "email",
    text: "You transferred $120.00 to J Smith on 3 September. If you don't recognise this transaction, call us on the number on the back of your card.",
  },
  {
    id: "N03", family: "Council survey", label: "genuine", expect: "low", channel: "email",
    text: "Hume City Council wants your views on the new playground at Roxburgh Park. The survey takes five minutes and closes on 30 September.",
  },
  {
    id: "N04", family: "Real delivery attempt", label: "genuine", expect: "low", channel: "sms",
    text: "We tried to deliver your parcel today but no one was home. It is waiting at your local post office for collection with photo ID.",
  },
  {
    id: "N05", family: "Club membership", label: "genuine", expect: "low", channel: "email",
    text: "Your tennis club membership renews on 1 October. The fee is unchanged at $180 and you can pay at the clubhouse or by bank transfer.",
  },
  {
    id: "N06", family: "Password reset you asked for", label: "genuine", expect: "low", channel: "email",
    text: "You asked to reset your password. If this was you, use the reset option in the app. If it wasn't, you can ignore this email and your password will stay the same.",
  },
  {
    id: "N07", family: "Friend's message", label: "genuine", expect: "low", channel: "sms",
    text: "Great seeing you at the footy on Saturday! Let me know when you're free for dinner next week.",
  },
  {
    id: "N08", family: "Employer payroll", label: "genuine", expect: "low", channel: "email",
    text: "Payslips for this fortnight are now available in the staff portal. Please contact payroll if anything looks incorrect.",
  },
];
