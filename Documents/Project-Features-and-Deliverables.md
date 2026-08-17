# Project Features and Deliverables

## CyberKent — Online Scam Detection and Reporting System

### Prepared for Hume City Council CyberSafe Services

---

| Field | Detail |
|---|---|
| **Project name** | CyberKent |
| **System name** | Online Scam Detection and Reporting System |
| **Group name** | CyberKent |
| **Client** | Hume City Council, Victoria, Australia |
| **Client business unit** | Hume City Council CyberSafe Services |
| **Unit** | CPRO306 Capstone Project, Kent Institute Australia |
| **Document version** | 1.0 |
| **Date of issue** | 13 August 2026 |
| **Status** | Published |
| **Companion documents** | Final SRS Report v1.0; Interim Project Report v1.0; System Architecture v1.0 |

---

## 1. Purpose of this document

This document is the plain-language summary of **what CyberKent does, what is being delivered, and how far along it is**. It is written for readers who need the shape of the project without the full requirements specification: Council stakeholders, community representatives, the project supervisor, and anyone visiting the service who wants to know what it is.

Every feature listed here traces to numbered requirements in the Final SRS Report, and every deliverable traces to a milestone in the project plan. Where something is not yet built, this document says so.

---

## 2. What the service does

CyberKent gives the Hume community a single trusted municipal portal that answers **"is this a scam?"** in seconds with a transparent, explained risk score; accepts a structured scam report with evidence and tells the reporter what happens next; lets trained Council staff verify reports and publish anonymised community alerts quickly; shows regional scam activity; provides awareness material and step-by-step recovery checklists; and produces the de-identified statistics Council needs to target its work and evidence its advocacy.

It does all of this while collecting the minimum personal data necessary, explaining every automated judgement it makes, and never presenting itself as professional cybersecurity certification.

### 2.1 The problem it addresses

Residents, small businesses, community organisations and not-for-profits in the City of Hume have **no local, trusted, immediate way** to check whether a suspicious message is a scam, no simple way to report one, and no reliable source of warnings about scams circulating in their own community. Council, in turn, has no visibility of the scam activity affecting its residents, so it cannot target its community-safety work, warn people early, direct victims to recovery support, or evidence the problem when advocating for State and Federal investment.

### 2.2 Why a local service, when national ones exist

| Existing channel | Gap CyberKent fills |
|---|---|
| Scamwatch / National Anti-Scam Centre | No municipal-level visibility; no local alerting; no feedback loop to Council |
| Bank and telecommunications warnings | Reach only their own customers; nothing for community organisations |
| ACSC / cyber.gov.au guidance | Generic advice; no "is *this* message a scam?" capability |
| Council newsletters and social media | Ad hoc, not evidence-driven, no reporting path, no analytics |

CyberKent is **complementary, not competing**. It does not replace Scamwatch, IDCARE, the police or a bank's fraud line — it routes people to them at the right moment.

---

## 3. Features for the community

### 3.1 Check a message — *available now*

Paste a suspicious text message, email, link, phone number or call transcript and receive an immediate assessment.

| What you get | Detail |
|---|---|
| **A risk score** | 0–100, calculated from the indicators found |
| **A risk band** | High, Medium, Low, or "Not enough to assess" |
| **A confidence value** | Reported separately, showing how much the submission gave the system to work with |
| **Every reason behind the score** | Each indicator is named, explained in plain English, weighted, and shown with the exact words that triggered it |
| **What to do next** | Report it to Council, open the recovery checklist, or contact your bank first if money has already moved |

**What is checked.** Eleven wording patterns — urgency, threatened consequences, requests for credentials or banking details, unusual payment methods such as gift cards or cryptocurrency, requests to install remote-access software, requests for secrecy, payment demands, impersonation of known organisations, pressure toward a link, unexpected prizes, and generic greetings. Plus six link checks — malformed addresses, high-abuse domain endings, link shorteners, lookalike domains, deeply nested subdomains, and links pointing at a raw IP address.

**Privacy.** No account is required, and the message is analysed on your own device rather than being sent to Council or stored.

**Honesty.** The scoring never reaches 100. A Low result explicitly states that a carefully written scam will not trip these checks. Every result carries the advisory notice.

*Requirements: FR13–FR24. Status: delivered and verified.*

### 3.2 Report a scam — *in development*

Lodge a structured report with Council, attach evidence, receive a reference number, track the report's status, and respond to requests for further information.

*Requirements: FR25–FR36, FR61–FR63.*

### 3.3 Stay informed — *in development*

Read moderated, anonymised community alerts about scams circulating in Hume; view where reports are clustering across the municipality; browse categorised awareness material; and subscribe to alerts by scam category or by suburb — with or without an account.

*Requirements: FR49–FR60, FR64–FR66, FR70.*

### 3.4 Recover — *in development*

Work through guided, step-by-step response checklists after being targeted, sequenced by what matters most in the first hour — contacting your bank, changing passwords, contacting IDCARE, reporting to police, and placing a credit ban — with your progress saved as you go.

*Requirements: FR58–FR60.*

---

## 4. Features for Council

| # | Capability | What it does | Requirements | Status |
|---|---|---|---|---|
| 1 | **Review and verify** | Work a prioritised review queue, assign reviewers, classify reports against a managed taxonomy, set severity, request more information, and approve or reject with a recorded reason | FR37–FR42 | In development |
| 2 | **Detect duplicates** | Surface probable duplicate and related reports by text similarity, phone number, email address and website — always to a human, never auto-merged | FR43–FR48 | In development |
| 3 | **Alert the community** | Draft alerts from verified reports, anonymise reporter information, obtain second-party approval, publish, search and archive | FR49–FR54 | In development |
| 4 | **Administer** | Manage user accounts, roles and permissions, and maintain the scam category taxonomy | FR67–FR69 | In development |
| 5 | **Analyse and audit** | Produce statistics on volume, category, severity, status and regional trend; export de-identified aggregate data; read an immutable audit trail | FR70–FR72 | In development |

---

## 5. The twelve functional modules

| # | Module | Requirements | Priority | Status |
|---|---|---|---|---|
| 1 | User registration and authentication | FR1–FR6 | Must | Partially delivered |
| 2 | User profile and access control | FR7–FR12 | Must | Partially delivered |
| 3 | Scam content analysis | FR13–FR18 | Must | **Delivered** |
| 4 | URL and contact analysis | FR19–FR24 | Must | **Delivered** (indicator matching pending) |
| 5 | Scam report management | FR25–FR30 | Must | Specified |
| 6 | Evidence management | FR31–FR36 | Must | Specified |
| 7 | Report review and verification | FR37–FR42 | Must | Specified |
| 8 | Duplicate and related report detection | FR43–FR48 | Should | Specified |
| 9 | Community scam alerts | FR49–FR54 | Should | Specified |
| 10 | Scam awareness and recovery | FR55–FR60 | Should | Specified |
| 11 | Notification and subscription | FR61–FR66 | Should | Specified |
| 12 | Administration, reporting and audit | FR67–FR72 | Must | Specified |

**Totals: 72 functional requirements, 30 non-functional requirements, 9 ethical requirements.** A further 20 enhanced functional requirements (FR73–FR92) are proposed and awaiting stakeholder approval.

---

## 6. Enhanced features proposed

Twenty additional requirements have been researched and proposed for approval. The most significant:

| Requirement | What it adds | Why |
|---|---|---|
| **FR84 — Multilingual delivery** | The interface, awareness content and alerts in the principal community languages of the municipality | Hume is among Victoria's most linguistically diverse municipalities, and unfamiliarity with how Australian institutions communicate is the precise vulnerability scams exploit. A service delivered only in English does not reach the residents most exposed |
| **FR81 — Screenshot checking** | Upload a screenshot; text is extracted and analysed by the same rule set | Most people screenshot a scam text rather than copying it |
| **FR91 — Data retention schedule** | Defined retention periods with automated purge | Personal information must not be kept longer than needed |
| **FR73 — Multi-factor authentication** | A second factor for Council officer and administrator accounts | These roles read sensitive evidence and publish under Council's name |
| **FR90 — Trend and anomaly detection** | Detect unusual spikes by category or suburb and notify officers | Catching a scam campaign on day one is what turns reporting into prevention |
| **FR92 — Dispute process** | Anyone whose contact detail appears as an indicator can dispute and correct it | Phone numbers and email addresses in scam reports frequently belong to innocent people whose identity was spoofed |

Six of the twenty are already built: anonymous checking without an account, evidence-carrying explanations, independent confidence reporting, channel-aware rules, uniform authentication failure handling, and assistive-technology support in dynamic results.

---

## 7. Deliverables

| ID | Deliverable | Milestone | Date | Status |
|---|---|---|---|---|
| D1 | Interim SRS Report | M4 | 16 Jul 2026 | Superseded by D11 |
| D2 | Technology stack selection and rationale | M2 | 12 Jul 2026 | Baselined |
| D3 | System architecture design | M2 | 12 Jul 2026 | Baselined |
| D4 | UI/UX design system | M3 | 15 Jul 2026 | Baselined |
| D5 | Engineering standards and prohibited practices | M2 | 12 Jul 2026 | Adopted |
| D6 | Interim Project Report | M6 | 1 Aug 2026 | Issued |
| D7 | Enhanced functional requirements | M7 | 12 Aug 2026 | **Awaiting approval** |
| D8 | Database design and ethics review | M8 | 21 Aug 2026 | Planned |
| D9 | Implemented system — frontend and backend | M9–M13 | Sep–Oct 2026 | In progress |
| D10 | Test strategy and verification evidence | M14 | 13 Nov 2026 | Planned |
| **D11** | **Final SRS Report** | **M15** | **13 Aug 2026** | **Issued** |
| D12 | Deployment, handover pack and final presentation | M16 | 27 Nov 2026 | Planned |

---

## 8. Delivery schedule

| Milestone | Deliverable state | Date | Status |
|---|---|---|---|
| M0 | Project initiation and brief analysis | 30 Jun 2026 | Complete |
| M1 | Requirements baseline established | 8 Jul 2026 | Complete |
| M2 | Technology stack and architecture baselined | 12 Jul 2026 | Complete |
| M3 | UI/UX design system baselined | 15 Jul 2026 | Complete |
| M4 | Interim SRS Report issued | 16 Jul 2026 | Complete |
| M5 | Frontend prototype demonstrating the stack | 31 Jul 2026 | Complete |
| M6 | Interim Project Report issued | 1 Aug 2026 | Complete |
| M7 | Enhanced requirements approved | 12 Aug 2026 | **Overdue** |
| M8 | Database design and ethics review signed off | 21 Aug 2026 | At risk |
| M9 | Modules 1–2 complete | 4 Sep 2026 | In progress |
| M10 | Modules 3–4 complete | 18 Sep 2026 | **Delivered early** |
| M11 | Modules 5–6 complete | 2 Oct 2026 | Planned |
| M12 | Modules 7–8 complete | 16 Oct 2026 | Planned |
| M13 | Modules 9–12 complete | 30 Oct 2026 | Planned |
| M14 | System verification complete | 13 Nov 2026 | Planned |
| M15 | Final SRS Report issued | 20 Nov 2026 | **Issued early** |
| M16 | Deployment, handover and final presentation | 27 Nov 2026 | Planned |

Project duration: **30 June 2026 – 27 November 2026 (22 weeks)**.

---

## 9. Current status

| Measure | Position |
|---|---|
| Functional requirements fully implemented | 16 of 72 (22%) |
| Partially implemented | 4 of 72 (6%) |
| Specified, with database tables built | 52 of 72 (72%) |
| Database tables built and migrated | 25 of 25 (100%) |
| Live API endpoints | 8 |
| Detection rules live | 11 wording rules + 6 link checks |
| Cash cost to date | AUD $0 |

**What works today.** The scam checker is complete and verified — seven of seven test classifications correct, with no false positive on genuine Council correspondence. The database supports all twelve modules. The security foundation — validation, authentication, authorisation, rate limiting, error handling and security headers — is in place.

**What is next.** Connecting the interface to the API, adding email delivery, and building the reporting and evidence modules.

---

## 10. How the service is held to account

| Commitment | How it is enforced |
|---|---|
| **It must not create fear** | Result wording, colour and presentation are governed by the design system. The tone is calm by requirement, not by preference |
| **It must be honest about what it is** | The advisory notice appears at the point of every verdict, not only in a policy page. The scoring is mathematically incapable of reaching certainty |
| **It must be explainable** | Every score is shown with the indicators that produced it and the exact words that triggered them, so a person can disagree with the machine |
| **It must not discriminate** | No scoring input references or stands in for organisation size, industry, resources, nationality, ethnicity, language, age, gender, disability, socio-economic status or address. The full rule set is published for review |
| **It must protect the people it names** | The service never publicly identifies an alleged scammer. Contact details in scam reports frequently belong to innocent people whose identity was spoofed. Alerts describe patterns, not people |
| **It must protect reporters** | Reporter identity is removed from every public output and every exported dataset, at the data layer rather than at the point of display |
| **It must collect as little as possible** | No account is needed to check a message or to subscribe to alerts |

---

## 11. Accessibility and reach

| Commitment | Detail |
|---|---|
| Accessibility standard | WCAG 2.1 Level AA on every page |
| Devices | Works on phones, tablets and desktops, from 320 pixels wide |
| Motion | All decorative movement is suppressed for readers who have asked for reduced motion |
| Colour | No information is carried by colour alone — every risk band has an icon and a text label |
| Screen readers | Results are announced as they arrive; every form error is announced and tied to its field |
| Cost and access | Free, with no account required for checking, reading alerts, or browsing awareness material |
| Languages | Multilingual delivery is proposed as FR84 and awaiting approval |

---

*Prepared by Group CyberKent for Hume City Council CyberSafe Services — 13 August 2026.*

*CyberKent is an advisory service. It does not constitute professional cybersecurity certification, does not guarantee protection from cyberattacks, and is not a substitute for qualified professional assistance or the relevant authorities.*
