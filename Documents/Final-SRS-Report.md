# Final Software Requirements Specification

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
| **Client brief** | Project 31 — T2 2026 |
| **Unit** | CPRO306 Capstone Project |
| **Course** | Bachelor of Information Technology / Bachelor of Information Technology (Cyber Security Specialisation) |
| **Institution** | Kent Institute Australia |
| **Deliverable** | D11 — Final SRS Report |
| **Milestone** | M15 |
| **Document version** | 1.2 |
| **Date of issue** | 28 August 2026 |
| **Status** | Issued for supervisor, lecturer and stakeholder review |
| **Supersedes** | Interim SRS Report v1.0 (16 July 2026); `SRS.md` working draft (13 August 2026) |
| **Companion documents** | Interim Project Report v1.0 (1 August 2026); TechStack v1.0; System-Architecture v1.0; UI-Design v1.0; Rules v1.0; Avoid v1.0 |
| **Classification** | Project deliverable — contains no personal data and no credentials |

### Project team

| Role | Member | Student ID | Contact |
|---|---|---|---|
| Project Manager | Sujan Darji | K231673 | K231573@student.kent.edu.au |
| Team member | Anthony Regalado | *held on the submission cover sheet* | *as above* |
| Team member | Saurav Khadka | *held on the submission cover sheet* | *as above* |

> Details marked *held on the submission cover sheet* are administrative items tracked at **§17.3**, which is the single register of everything outstanding on this document. The specification itself is complete.

### Revision history

| Version | Date | Description | Author |
|---|---|---|---|
| 0.1 | 30 Jun 2026 | Client brief analysed; requirements extracted | CyberKent |
| 0.2 | 8 Jul 2026 | Requirements baseline drafted (FR1–FR72, NFR-1–NFR-30) | CyberKent |
| 0.5 | 15 Jul 2026 | Technology stack, architecture and UI design baselined | CyberKent |
| 0.9 | 16 Jul 2026 | Interim SRS Report v1.0 issued | CyberKent |
| 0.95 | 1 Aug 2026 | Interim Project Report v1.0 issued | CyberKent |
| **1.0** | **13 Aug 2026** | **Final SRS Report.** Baseline restated with acceptance criteria and audited implementation status; enhanced FR73–FR92 presented separately for approval; full conformance check against the client brief including four specification defects and two coverage gaps; database ethics register audited against the migrated schema; use-case model, verification results, hardware and software recommendations, and open-issue resolutions added. | CyberKent |
| **1.1** | **20 Aug 2026** | **Analysis and planning diagrams incorporated.** The five authored diagrams — use case, entity-relationship, level 1 data-flow, work breakdown structure and Gantt chart — added to the sections they govern, each reconciled against the specified model; user storyboard for UC-01 added; annual operating cost broken down by line; list of figures added as Appendix I. | CyberKent |
| **1.2** | **28 Aug 2026** | **Issued in response to lecturer feedback (§17).** Class diagram, Level 0 context DFD, data flow integrity assessment, complete 188-column data dictionary, DPIA, encryption and anonymisation implementation evidence, eight input/output form specifications, definitions for the remaining fifteen use cases, an 82-case test register, a full implementation plan, deliverables table, team performance against tasks, and an APA 7 reference list. Every placeholder removed from the body and consolidated at §17.3. Stale source metrics corrected against measurement, the repository layout regenerated, and the overloaded `D` identifier disambiguated into `D`, `DH` and `SD`. | CyberKent |

### Approval and sign-off

Signatures are collected on issue. A blank row is a signature not yet given, not a section left unwritten.

| Role | Name | Signature | Date |
|---|---|---|---|
| Project Manager, Group CyberKent | Sujan Darji | | |
| Project Supervisor / Lecturer | | | |
| CyberSafe Services Manager (Client) | | | |
| Council Privacy Officer (§9.4 only) | | | |

### Distribution

Project supervisor · Unit coordinator · CyberSafe Services manager · Hume City Council stakeholders · Council privacy officer · Council ICT and information governance · Group CyberKent · Project repository

---

## Table of contents

1. [Introduction](#1-introduction)
2. [Project overview](#2-project-overview)
3. [Overall description](#3-overall-description)
4. [Conformance check against the client brief](#4-conformance-check-against-the-client-brief)
5. [Functional requirements — approved baseline (FR1–FR72)](#5-functional-requirements--approved-baseline-fr1fr72)
6. [Enhanced functional requirements — proposed (FR73–FR92)](#6-enhanced-functional-requirements--proposed-fr73fr92)
7. [Use-case model](#7-use-case-model)
8. [External interface requirements](#8-external-interface-requirements)
9. [Non-functional requirements](#9-non-functional-requirements)
10. [Ethical requirements](#10-ethical-requirements)
11. [Data requirements and database design](#11-data-requirements-and-database-design)
12. [System architecture and design](#12-system-architecture-and-design)
13. [Hardware and software requirements](#13-hardware-and-software-requirements)
14. [Implementation status and traceability](#14-implementation-status-and-traceability)
15. [Verification and validation](#15-verification-and-validation)
16. [Project management summary](#16-project-management-summary)
17. [Responses to feedback from the lecturer](#17-responses-to-feedback-from-the-lecturer)
18. [Open issues and decisions required](#18-open-issues-and-decisions-required)
19. [Conclusion](#19-conclusion)
20. [Appendices](#20-appendices)

**Figures.** A list of every diagram and figure is at [Appendix I](#appendix-i--list-of-figures). **References.** The APA 7 reference list is at [Appendix J](#appendix-j--reference-list).

**Where the assessed elements are.** Project background, objectives and purpose §2.2–§2.5 · scope and deliverables §1.2–§1.2.3 · team and performance against tasks §2.7–§2.7.2 · work breakdown structure §16.5 · schedule and Gantt §16.6 · use-case diagram §7.3 and case definitions §7.4–§7.8 · functional requirements §5–§6 and non-functional §9 · budget and financial breakdown §16.3 · database structures §11, ERD §11.2.1, data dictionary §11.9, DFDs §12.3–§12.4 · user storyboard §8.1.1 and forms §8.1.2 · test plan §15.1–§15.3 and test cases §15.5 · risks §16.1 and communication plan §16.2 · responses to lecturer feedback §17.

---

# 1. Introduction

## 1.1 Purpose

This document is the **Final Software Requirements Specification** for CyberKent, the Online Scam Detection and Reporting System commissioned by Hume City Council for its CyberSafe Services program. It supersedes the Interim SRS Report v1.0 and is the authoritative statement of what the system must do, how well it must do it, and the ethical limits within which it must operate.

It is written for five audiences:

| Audience | What they should take from it |
|---|---|
| **CyberSafe Services manager and Council stakeholders** | Confirmation that the delivered and planned system matches the commissioned brief, and a clear list of the decisions still required from Council. |
| **Project supervisor and lecturer** | Evidence of requirements analysis, traceability, ethical reasoning and verification against the assessment criteria. |
| **Development team (Group CyberKent)** | The build contract: every requirement, its acceptance criterion and its current state. |
| **Council ICT, information governance and the privacy officer** | The data model, its classification, and the audited position of the ethical mitigations against the schema as migrated. |
| **Future maintainers** | The record of what was required, what was built, what was deferred, and why. |

## 1.2 Scope of the product

CyberKent is a cloud-hosted, responsive web application providing a **municipal** layer of scam protection that no existing service provides. Residents, small businesses, community organisations and not-for-profits in the City of Hume use it to:

1. **Check** a suspicious message, link, phone number or email address and receive a transparent, explained risk assessment — with no account and no cost;
2. **Report** a scam to Council with evidence attached, receive a reference number, and track the report through officer review;
3. **Stay informed** through moderated, anonymised community alerts, a suburb-level scam map and trend view, categorised awareness material, and subscriptions by scam category or region;
4. **Recover** by following guided, sequenced checklists after being targeted, with progress recorded.

Council officers use the same platform to **review and verify** reports, **detect duplicates**, **publish anonymised alerts**, **administer** users and taxonomy, and **analyse** de-identified local intelligence for community-safety targeting and advocacy.

### 1.2.1 In scope

Twelve functional modules comprising FR1–FR72; the twenty enhanced requirements at §6 subject to approval; the non-functional requirements at §9; and the ethical requirements at §10.

### 1.2.2 Out of scope for this release

| Excluded | Reason |
|---|---|
| Professional cybersecurity certification or assurance of any kind | Prohibited by ETH-1; the service is advisory only. |
| Automated takedown, blocking or law-enforcement action | Outside Council's powers and the project's remit. |
| Handling, recovery or reimbursement of money | Routed to banks and IDCARE instead. |
| Public identification of alleged scammers | Prohibited by ER-13; contact indicators are frequently spoofed and often belong to innocent people. Defamation exposure is real. |
| Real-time integration with bank or telecommunications fraud systems | No commercial or technical basis at this scale. |
| Native iOS/Android applications | Delivered as a responsive web application; the REST API is designed to support a future app (NFR-24). |
| AI/ML capability — OCR, NLP classification, computer vision | Architecturally reserved behind an AI Gateway; explicitly deferred (constraint C3). |
| External threat-intelligence and URL-reputation APIs | Deferred; the analyser is self-contained this phase. |

### 1.2.3 Deliverables

Twelve deliverables carry the project. Each traces to a milestone in §14.4 and to a work package in §16.5.

| ID | Deliverable | Milestone | Due | Status at this issue |
|---|---|---|---|---|
| D1 | Interim SRS Report | M4 | 16 Jul 2026 | Superseded by D11 |
| D2 | Technology stack selection and rationale | M2 | 12 Jul 2026 | Baselined |
| D3 | System architecture design | M2 | 12 Jul 2026 | Baselined |
| D4 | UI/UX design system | M3 | 15 Jul 2026 | Baselined |
| D5 | Engineering standards and prohibited practices | M2 | 12 Jul 2026 | Adopted |
| D6 | Interim Project Report | M6 | 1 Aug 2026 | Issued |
| D7 | Enhanced functional requirements FR73–FR92 | M7 | 12 Aug 2026 | ⚠️ **Awaiting approval — overdue** (RK-02) |
| D8 | Database design and ethics review | M8 | 21 Aug 2026 | ⚠️ **At risk** — migration preceded the gate (§4.6, RK-09) |
| D9 | Implemented system — frontend and backend | M9–M13 | Sep–Oct 2026 | In progress — Modules 3–4 delivered early |
| D10 | Test strategy and verification evidence | M14 | 13 Nov 2026 | Planned — register at §15.5 |
| **D11** | **Final SRS Report — this document** | **M15** | **20 Nov 2026** | **Issued early** |
| D12 | Deployment, handover pack and final presentation | M16 | 27 Nov 2026 | Planned |

**Two deliverables are blocked on decisions the team cannot make.** D7 and D8 both require external approval, and both are past their dates. The consequence is recorded at §14.4 and every dependent phase is sequenced around it at §14.7.

## 1.3 Definitions, acronyms and abbreviations

See **Appendix A** for the full glossary. Terms used constantly in this document:

| Term | Definition |
|---|---|
| **Check** | A submission to the analyser. Requires no account, creates no report, and by default is not retained against an identity. |
| **Report** | A formal submission to Council carrying a reference number and a review lifecycle. |
| **Alert** | A de-identified, officer-approved public notice derived from one or more verified reports. |
| **Indicator (analysis)** | One named reason contributing to a risk assessment, carrying a weight and the evidence fragment that triggered it. |
| **Indicator (artefact)** | A checkable object — URL, domain, phone number, email address or bank account — recorded in the registry of artefacts named across reports. |
| **Risk score** | Integer 0–100 expressing how scam-like a submission appears. |
| **Risk band** | HIGH, MEDIUM, LOW or UNCLEAR. |
| **Confidence** | A separate 0–1 value expressing how much signal the submission carried. Not a measure of correctness. |
| **De-identification** | Removal of information that could identify a reporter, performed at the data layer before publication. |
| **Soft delete** | Marking a row deleted rather than removing it, so audit and evidentiary trails survive. |
| **k-anonymity** | The guarantee that any published or exported cell describes at least *k* individuals. Threshold for this project: k ≥ 5. |

## 1.4 References

The table below is the **internal register**: the project documents and external works this specification depends on, identified by the short codes R1 to R21 used throughout. The **academic reference list, in APA 7th edition, is at Appendix J**, and covers the legislation, standards and literature cited here.

| ID | Document | Role in this specification |
|---|---|---|
| **R1** | *Project 31 — T2 2026* (client brief, PDF) | **Authoritative source** of the 14 system modules, FR1–FR72, the 25 client NFRs and the ethical requirements. |
| R2 | *CPRO306 Assessment Brief 2 — Interim SRS Report* v2, 13 Jul 2026 | Assessment criteria; content expectations carried forward into §2 and §16. |
| R3 | `Requirements.md` (team working baseline) | Team's expanded restatement of R1, including five added NFRs. Reconciled against R1 at §4.3. |
| R4 | *Interim Project Report* v1.0, 1 Aug 2026 | Project charter, stakeholders, objectives, feasibility, risk register, communication plan, database ethics register. |
| R5 | *Interim SRS Report* v1.0, 16 Jul 2026 | Superseded by this document. |
| R6 | `System-Architecture.md` v1.0 | Architecture baseline. |
| R7 | `TechStack.md` v1.0 | Technology selection and rationale. |
| R8 | `Rules.md` v1.0 | Development standards; cited in source as "Rule *n.n*". |
| R9 | `Avoid.md` v1.0 | Prohibited practices. |
| R10 | `UI-Design.md` v1.0 | Visual design system. |
| R11 | IEEE 830-1998 | SRS structure convention. |
| R12 | ISO/IEC/IEEE 29148:2018 | Requirements-quality criteria applied at §4.5. |
| R13 | WCAG 2.1 Level AA | Accessibility conformance target (NFR-13). |
| R14 | Privacy Act 1988 (Cth); Australian Privacy Principles | Privacy obligations. |
| R15 | Privacy and Data Protection Act 2014 (Vic); Information Privacy Principles | Victorian public-sector obligations. |
| R16 | Victorian Protective Data Security Standards (VPDSS) | Security standards for Victorian public-sector information. |
| R17 | Notifiable Data Breaches scheme | Breach-notification obligations. |
| R18 | Disability Discrimination Act 1992 (Cth) | Basis of the accessibility obligation for a public service. |
| R19 | NIST SP 800-63B | Authentication and password guidance adopted at §9.3. |
| R20 | OWASP Top 10 (2021) | Security verification checklist (QO-3). |
| R21 | Scamwatch / National Anti-Scam Centre taxonomy | Source vocabulary for the scam category taxonomy. |

## 1.5 Document conventions

**Requirement identifiers.** `FR*n*` functional · `NFR-*n*` non-functional · `ETH-*n*` ethical · `ER-*n*` database ethical risk · `C*n*` constraint · `A*n*` assumption · `UC-*n*` use case · `OI-*n*` open issue · `RK-*n*` risk · `D*n*` deliverable · `M*n*` milestone · `SD*n*` specification defect in the client brief · `DH*n*` data-handling rule · `F-*n*` input/output form · `TC-*n*` test case · `DFI-*n*` data-flow-integrity finding · `P*n*` privacy risk in the DPIA · `G*n*` known gap.

**Obligation language.** *Shall* denotes a mandatory requirement · *should* a recommendation · *may* a permitted option. Requirements are stated in the active voice with a single testable obligation each (R12).

**Priority.** MoSCoW — **Must**, **Should**, **Could**, **Won't (this release)**.

**Implementation status**, assigned by direct audit of the source tree at commit `f8e813a` — the most recent commit changing application code — not by assertion:

| Symbol | Meaning |
|---|---|
| ✅ **Implemented** | Present in the build and exercised. |
| 🟡 **Partial** | Some behaviour present; not complete end to end. |
| ⬜ **Specified** | Requirement and data model defined; no runtime behaviour yet. |
| ⚠️ **Deviation** | Built differently from the specification or the governing register; requires a decision. |

## 1.6 How to read this document

Section 4 is the conformance check and should be read first by Council: it reconciles this specification against the client brief line by line and lists every discrepancy found. Section 5 is the baseline contract. Section 6 is the separate approval item required by the brief. Sections 9–11 carry the quality, ethical and data obligations. Section 14 is the honest delivery position. Section 17 lists what the project needs from stakeholders in order to finish.

---

# 2. Project overview

## 2.1 The client

Hume City Council is a local government area roughly 20 kilometres north of central Melbourne and one of Australia's fastest-growing municipalities, serving more than 262,000 residents across established urban suburbs in the south and rural land in the north. Council headquarters are at 1079 Pascoe Vale Road, Broadmeadows. The municipality contains Melbourne Airport, the Hume and Calder Highways and the Western Ring Road, making it a transport, freight and employment hub for the northern region.

Council's service portfolio gives this project its context: community services spanning maternal and child health, immunisation, assertive youth outreach for ages 10–24, aged care and disability support; environment and sustainability programs including management of more than 160,000 trees; and active advocacy to State and Federal government for infrastructure, transport and community-safety investment. CyberSafe Services is the arm of that community-safety work addressing online harm.

## 2.2 Problem statement

> Residents, small businesses, community organisations and not-for-profit organisations in the City of Hume are exposed to online scams that are increasing in volume and sophistication, but they have no local, trusted, immediate way to check whether a suspicious message is a scam, no simple way to report one, and no reliable source of warnings about the scams currently circulating in their own community. At the same time, Hume City Council has no visibility of the scam activity affecting its residents, so it cannot target its community-safety work, cannot warn people early, cannot direct victims to recovery support, and cannot evidence the problem when it advocates for State and Federal investment. The result is preventable financial loss, avoidable psychological harm, under-reporting and duplicated victimisation.

### 2.2.1 Why Hume specifically

| Characteristic | Consequence for scam exposure |
|---|---|
| Highly diverse, multilingual population | Scam messaging exploits unfamiliarity with how Australian institutions actually communicate. Residents who read English as a second language have fewer reference points for recognising a fake myGov, bank, Australia Post or ATO message. **This is the direct justification for enhanced requirement FR84.** |
| Large base of small and micro businesses and volunteer-run organisations | Real exposure to invoice redirection, business email compromise and payment fraud, with almost no in-house IT security, security budget, or anyone whose job it is to think about this. |
| Demographic profile including many at elevated risk | Older residents, young people aged 10–24 already served by Council's youth outreach, and people experiencing financial stress are all deliberately targeted groups. |

### 2.2.2 Problems mapped to requirements

| # | Problem | Affects | Consequence today | Addressed by |
|---|---|---|---|---|
| P1 | No way to verify a suspicious message before acting on it | All community members | People act on scams, or ignore genuine communications out of fear | FR13–FR24 |
| P2 | Reporting is difficult, fragmented and returns nothing to the reporter | Victims and near-victims | Severe under-reporting; true scale invisible | FR25–FR30, FR61–FR63 |
| P3 | Warnings arrive too late or not at all | Whole community | Repeat victimisation across the same suburb within days | FR49–FR54, FR64–FR65 |
| P4 | No local intelligence for Council | Council, CyberSafe Services | Awareness campaigns generic; advocacy lacks evidence | FR70–FR71 |
| P5 | Victims do not know what to do next | Victims | Recoverable losses become unrecoverable; distress prolonged | FR55–FR60 |
| P6 | Small organisations have no security capability at all | Small business, NFPs, community groups | Structural vulnerability; one incident can be existential | FR13–FR24, FR55–FR59 |

## 2.3 Positioning — what already exists

CyberKent is deliberately **complementary, not competing**. It does not replace Scamwatch, IDCARE, the police or a bank's fraud line; it routes people to them at the right moment and gives Council the local evidence base it currently lacks.

| Existing channel | What it does | Gap CyberKent fills |
|---|---|---|
| Scamwatch / National Anti-Scam Centre | National reporting and national trend reporting | No municipal visibility; no local alerting; no feedback loop to Council |
| Bank and telco warnings | Warn their own customers about scams affecting their own products | Reach customers only; siloed; nothing for community organisations |
| ACSC / cyber.gov.au guidance | General cybersecurity advice | Generic; no "is *this* message a scam?" capability; not locally targeted |
| Council newsletters and social media | Occasional awareness posts | Ad hoc, not evidence-driven, no reporting path, no analytics |
| **CyberKent** | Municipal checking, reporting, verification, alerting, education, recovery, local analytics | **Provides the local layer none of the above provides** |

## 2.4 Purpose of the project

> To reduce the financial and psychological harm caused by online scams in the City of Hume, by giving the community an immediate, trusted and accessible way to check, report and recover from scams, and by giving Hume City Council the local intelligence it needs to warn residents early, target its community-safety work and support victims — without creating fear, without collecting more personal data than the service requires, and without presenting automated results as professional cybersecurity certification.

Three commitments constrain every design decision that follows.

**It must not create fear.** People arrive at this service frightened, sometimes hours after losing money. A system that amplifies alarm to appear authoritative would cause harm. Tone, language, colour and result presentation are all governed by this.

**It must be honest about what it is.** The system produces advisory guidance based on information the user supplies. It is not certification, it cannot guarantee protection, and serious incidents need qualified professionals or the relevant authority. This is stated on every result.

**It must be explainable.** Every risk score is shown with the indicators that produced it, in plain language. A score a person cannot interrogate is a score they cannot act on, and an automated judgement that cannot be challenged is one that cannot be corrected.

## 2.5 Project objectives

### 2.5.1 Product objectives

| ID | Objective | Measure of success | Traceability | Status |
|---|---|---|---|---|
| PO-1 | Deliver a scam-checking capability that analyses text, URLs, phone numbers and email addresses and returns an explained risk score | All of FR13–FR24 implemented and passing acceptance tests; every score displays its contributing indicators | FR13–FR24, ETH-3 | 🟡 FR13–FR23 met; FR24 requires FR77 |
| PO-2 | Deliver an end-to-end scam reporting workflow from draft through evidence, reference number and status tracking to withdrawal | All of FR25–FR36 implemented; a reporter completes a report with evidence in under 10 minutes in usability testing | FR25–FR36 | ⬜ Scheduled M11 |
| PO-3 | Deliver a staff review and verification workflow including queue, assignment, classification, severity, duplicate detection and approval | All of FR37–FR48 implemented; every decision written to the audit log with a recorded reason | FR37–FR48, FR72 | ⬜ Scheduled M12 |
| PO-4 | Deliver moderated, anonymised community alerts with search, subscription and archiving | All of FR49–FR54 and FR64–FR66 implemented; no alert publishable while reporter-identifying data remains | FR49–FR54, ETH-4 | ⬜ Scheduled M13 |
| PO-5 | Deliver awareness resources and recovery-action tracking | All of FR55–FR60 implemented; checklists cover bank contact, password change, IDCARE, police and credit ban | FR55–FR60, ETH-2 | ⬜ Scheduled M13 |
| PO-6 | Deliver administration, analytics, de-identified export and immutable audit logging | All of FR67–FR72 implemented; exports pass the re-identification test at §10.4 | FR67–FR72, ETH-4 | ⬜ Scheduled M13 |
| PO-7 | Research, propose and obtain approval for 15–20 enhanced functional requirements | Approved list signed off by supervisor and stakeholders before the Final SRS | R1; OI-4 | 🟡 **20 proposed at §6; approval outstanding** |

### 2.5.2 Quality objectives

| ID | Objective | Measure of success | Traceability | Status |
|---|---|---|---|---|
| QO-1 | Meet the performance targets | Pages load within 3 s; queries under 2 s at 100,000 records; load-tested toward 1,000 concurrent users | NFR-1–NFR-3 | ⚠️ At risk — see §9.1 and G6 |
| QO-2 | Meet WCAG 2.1 Level AA on every page | Automated and manual audit passed with zero Level A or AA failures | NFR-13, C7 | 🟡 Practices in place; audit outstanding |
| QO-3 | Pass security verification | No high or critical findings open at handover; OWASP Top 10 checks documented | NFR-7–NFR-11 | 🟡 Controls implemented; formal verification outstanding |
| QO-4 | Normalise the database to 3NF with enforced referential integrity | Schema review signed off; all relationships use foreign-key constraints | NFR-20, NFR-27 | ✅ 25 tables, 34 foreign keys, 3NF |
| QO-5 | Achieve full requirements traceability | Every FR traceable to design, code module and test case | Appendix C | 🟡 Design and code traced; test cases outstanding |

### 2.5.3 Ethical and privacy objectives

| ID | Objective | Measure of success | Traceability | Status |
|---|---|---|---|---|
| EO-1 | Collect only the personal data the service requires | Field-level justification register complete; every stored field mapped to a requirement | ETH-6, NFR-30 | 🟡 Schema is lean; register not written |
| EO-2 | Ensure no public output or export can re-identify a reporter | k-anonymity threshold enforced; re-identification test passed | ETH-4, FR50, FR71 | ⬜ |
| EO-3 | Ensure risk scoring is transparent and non-discriminatory | Scoring factors inspectable; no size, industry, demographic or locality attribute used as a scoring input | ETH-3 | ✅ Verified by audit — §10.3 |
| EO-4 | Ensure results are never presented as professional certification | Advisory disclaimer present on every result and report screen | ETH-1, ETH-2 | ✅ Implemented at the point of verdict |
| EO-5 | Honour account and data deletion requests without destroying the audit trail | Deletion procedure implemented and tested per ER-7 | FR12, NFR-29, FR72 | 🟡 Severance implemented; request flow not built |

### 2.5.4 Delivery objectives

| ID | Objective | Measure of success | Status |
|---|---|---|---|
| DO-1 | Deliver all milestones M0–M16 on schedule | No milestone slips more than 5 working days without approved re-baseline | ✅ M0–M6 complete on plan; M7 in progress |
| DO-2 | Deliver at zero cash cost during development | Total cash expenditure remains AUD $0 through handover | ✅ $0 spent |
| DO-3 | Post every iteration plan and report version to the unit forum | Complete forum record with no missing version | 🟡 Forum links outstanding — Appendix F |
| DO-4 | Maintain stakeholder engagement at the agreed cadence | Fortnightly supervisor checkpoint and monthly stakeholder review held and minuted | 🟡 |
| DO-5 | Hand over a maintainable, documented system | Documentation complete; handover pack accepted by Council | ⬜ Scheduled M16 |

## 2.6 Stakeholders

| ID | Stakeholder | Category | Interest | Power/Interest | Engagement strategy |
|---|---|---|---|---|---|
| S1 | Hume City Council (client body) | External, primary | Owns the service; accountable for community-safety outcomes and for the personal data held | High / High | Manage closely — monthly review, formal sign-off on every baseline |
| S2 | CyberSafe Services manager | External, primary | Sponsors the project; owns operational delivery | High / High | Manage closely — primary client contact; approves scope changes |
| S3 | Project supervisor / Lecturer | Academic, primary | Assesses the project; approves enhanced FRs | High / High | Manage closely — fortnightly checkpoint; approval gate at each milestone |
| S4 | Council reviewers / analysts | External, primary user | Operate the review queue daily; usability directly affects workload | Low / High | Keep informed and consult — involved in usability testing |
| S5 | Council system administrators | External, user | Manage users, roles, categories; operational security | Medium / High | Keep satisfied — consulted on RBAC, admin tooling, handover |
| S6 | Residents of Hume | External, end user | Primary beneficiaries — check, report, learn, recover | Low / High | Keep informed — represented through Council; usability testing with community participants |
| S7 | Small businesses, community organisations, NFPs | External, end user | Beneficiaries with distinct needs — invoice fraud, BEC, payment redirection | Low / High | Keep informed — requirements validated with Council |
| S8 | Scam victims (as a distinct group) | External, end user | Arrive distressed; need recovery guidance and non-judgemental treatment | Low / High | Design-led consideration — tone, language and ethical requirements written for them |
| S9 | Group CyberKent | Internal, primary | Delivers the system; assessed on it | High / High | Continuous — daily coordination, weekly internal review |
| S10 | Council ICT and information governance | External | Must be satisfied on security, privacy, data location, handover | Medium / Medium | Keep satisfied — schema and security review before implementation |
| S11 | Council privacy officer | External | Accountable for Privacy Act and Victorian PDP Act compliance | Medium / High | Consult — sign-off required on the database ethics review (§10.4) |
| S12 | Council communications team | External | Publishes alerts; owns Council's public voice and reputation | Low / Medium | Keep informed — consulted on alert tone and publication workflow |
| S13 | Referral bodies — Scamwatch/NASC, IDCARE, Victoria Police, ACSC | External, secondary | Receive referrals; their guidance is surfaced | Low / Low | Monitor — no integration this phase; referral links kept accurate |
| S14 | University / unit coordinator | Academic | Governs assessment and submission | Medium / Medium | Keep informed — forum submissions per Appendix F |
| S15 | Future maintainers | External, future | Inherit the codebase | Low / Low | Serve through documentation — architecture, schema and API docs |

**The pattern that matters.** The people who bear the consequences of the design have the least power over it. Residents, victims and reviewers sit in the low-power, high-interest quadrant. That asymmetry is precisely why the ethical requirements at §10 are treated as **binding constraints rather than aspirations** — they are the mechanism by which the interests of stakeholders who cannot advocate for themselves are protected in the design.

## 2.7 Project team and role allocation

The Interim Project Report defines six roles. The Project Charter names three members. The roles below are therefore allocated with each member holding a primary and a secondary role, so that no capability is single-threaded. Performance against them is assessed at §2.7.2; team sign-off on the allocation is item 3 at §17.3.

| Capability | Primary | Backup |
|---|---|---|
| Project management, schedule, risk, stakeholder liaison, forum submissions | Project Manager | Business Analyst |
| Requirements, traceability, SRS authorship, enhanced FR research | Business Analyst | Project Manager |
| Architecture, API design, authentication, RBAC, security controls | Solution Architect | Database Designer |
| Prisma schema, normalisation, migrations, indexing, retention and anonymisation design, Data Steward | Database Designer | Solution Architect |
| React components, design system, responsive layout, WCAG 2.1 AA | Frontend / UI-UX Lead | QA Lead |
| Test strategy, unit/integration/API tests, accessibility and security verification, UAT | QA Lead | Frontend Lead |

### 2.7.1 Skills gap analysis

| Capability | Level | Gap | Mitigation | Status |
|---|---|---|---|---|
| React, TypeScript, Tailwind | Strong | None | Demonstrated — landing page and checker delivered | ✅ Closed |
| Node.js, Express, REST | Good | Minor | Patterns fixed in the development rules | ✅ Closed — API scaffold delivered to standard |
| PostgreSQL and normalisation | Good | Minor | Schema peer-reviewed before first migration | ✅ Closed |
| Prisma ORM | Moderate | Moderate | Two-week ramp-up ahead of M8; workflow proven on a spike | ✅ Closed — schema migrated |
| Security engineering (OWASP) | Moderate | **Significant** | Controls fixed by rule rather than judgement; security checklist per pull request; external review at M14 | 🟡 Controls in place; external review outstanding (RK-08) |
| Privacy law and de-identification | Low | **Significant** | §10.4 written against APP and VPDSS obligations; privacy officer sign-off sought at M8 | ⚠️ **Sign-off outstanding and the schema is already migrated — see §4.6** (RK-09) |
| WCAG 2.1 AA auditing | Moderate | Moderate | Accessibility in the per-page Definition of Done; audit at M14 | 🟡 |
| AI / ML (FastAPI, OCR, NLP) | Low | Deferred | Out of scope; architecture reserves the integration point only | ✅ Deferred by decision |

The two significant gaps — security engineering and privacy law — are the reason those areas are governed by prescribed rules and external review rather than by team judgement. This is a deliberate risk-transfer decision recorded as RK-08 and RK-09.

## 2.8 Methodology and delivery approach

Iterative and incremental delivery with fixed milestone gates and stakeholder review at each iteration. Each milestone is a **gate, not an activity**: it represents a verifiable deliverable state that must be reached before the next phase begins. Work is prioritised by MoSCoW, which is also the schedule's release valve — Should-rated modules are reduced in depth before any Must-rated module is compromised. Approximately 2.5 weeks of float is distributed across the implementation iterations rather than held as a block at the end, so a slip is absorbed locally rather than accumulating.

Project duration: **30 June 2026 – 27 November 2026 (22 weeks)**.


### 2.7.2 Team performance against specific tasks

Performance is reported against the work packages at §16.5 and the milestones at §14.4, so that a claim of progress is checkable against something dated rather than asserted.

| Capability | Primary | Backup | Specific tasks delivered | Evidence | Assessment |
|---|---|---|---|---|---|
| Project management | Project Manager | Business Analyst | M0–M6 delivered on their planned dates; risk register maintained at 17 risks with owners and triggers; two risks correctly predicted before they materialised | §14.4, §16.1 | **Met.** Every milestone inside the team's control was hit |
| Requirements and traceability | Business Analyst | Project Manager | FR1–FR72 restated with acceptance criteria; FR73–FR92 researched and proposed; clause-by-clause conformance check finding four specification defects in the client brief | §4, §5, §6 | **Exceeded.** The conformance check was not required and found defects the client had not noticed |
| Architecture and security | Solution Architect | Database Designer | Layered architecture; 8 live endpoints; validation, authentication, authorisation, rate limiting, error handling and the security header set, all exercised | §12, §9.11, §12.9.3 | **Met for what is built.** Modules 5–12 remain unimplemented |
| Database and retention | Database Designer | Solution Architect | 25 tables, 11 enumerated types, 34 foreign keys, 55 indexes, 3NF, migrated in one clean migration | §11.9 | **Partly met.** The schema is complete and correct, but it was migrated ahead of the M8 ethics gate (RK-09), and ten of fifteen register mitigations are absent (G11) |
| Frontend and accessibility | Frontend / UI-UX Lead | QA Lead | 19,326 lines of TypeScript/TSX; the complete scam checker; document reader; awareness library; accessibility practices applied throughout | §8.1, UI-1 to UI-11 | **Partly met.** Practices are in place and visible in the source; **no formal WCAG audit has been performed** (G4) |
| Test and verification | QA Lead | Frontend Lead | 17 test cases executed, 17 passed; 82-case register specified across every module | §15.5 | **Partly met.** Everything executed passes, but no test framework is installed (G3) so nothing is enforced by a build |

**Iteration record.** Nineteen commits between 7 August and 3 September 2026, across five working iterations:

| Iteration | Dates | Work committed | Milestone |
|---|---|---|---|
| 1 | 7 Aug | Platform foundation: detection engine, Neon schema and migration, frontend shell; production routing and security headers | M5 |
| 2 | 14 Aug | In-page scam checker with media analysis; documents rendered inside the site with derived figures | M10 |
| 3 | 16–17 Aug | Awareness library as full articles; SRS presented as a deck; reading rhythm and requirements register | M10 |
| 4 | 18 Aug | Deck rebuilt against the assessment criteria; the five analysis diagrams authored | M15 |
| 5 | 23 Aug – 3 Sep | Brand mark; console treatment across every screen behind the landing page; analysis diagrams carried into this document | M15 |

---

# 3. Overall description

## 3.1 Product perspective

CyberKent is a new, self-contained, greenfield product. No existing system is being replaced. It sits alongside — and must not duplicate or contradict — Council's existing website and contact channels, the national Scamwatch/NASC reporting path, and the police and financial institutions that handle criminal and financial consequences.

### 3.1.1 System context

```
   Residents ─────┐
   Businesses ────┤                                    ┌──── Council officers
   Community  ────┤                                    │     (review, verify, publish)
   organisations  │                                    │
   Victims    ────┤          ┌─────────────────────────▼──────┐
                  └─────────►│  React SPA (browser)           │
                             │  · client-side analyser        │
                             │  · responsive, WCAG 2.1 AA     │
                             │  · light/dark, reduced-motion  │
                             └───────────────┬────────────────┘
                                             │ HTTPS / JSON REST
                             ┌───────────────▼────────────────┐
                             │  Express API (Node.js / TS)    │
                             │  helmet · CORS allowlist       │
                             │  rate limiting · Zod validation│
                             │  JWT auth · RBAC · envelope    │
                             └───────────────┬────────────────┘
                                             │ Prisma ORM (TLS)
                             ┌───────────────▼────────────────┐
                             │  PostgreSQL (Neon, ap-southeast-2)
                             │  25 tables · 11 enums · 34 FKs │
                             └───────────────┬────────────────┘
                                             │
              ┌──────────────────┬───────────┴────────┬──────────────────┐
              ▼                  ▼                    ▼                  ▼
       Object storage      Email delivery       AI Gateway →        Referral targets
       (evidence)          (verification,       FastAPI service     Scamwatch, IDCARE,
       [planned]            notification)       [deferred]          Police, ACSC
                            [planned]                               [links only]
```

**AI boundary.** Artificial intelligence sits behind an AI Gateway as a separate intelligence layer. If the AI platform is unavailable, core checking, reporting, review and alerting continue to work unchanged (constraint C3).

## 3.2 Product functions

### For the community

| # | Function | Requirements |
|---|---|---|
| F1 | **Check** — submit suspicious message text, a URL, a phone number or an email address; receive a numeric risk score, a risk band and a plain-language explanation of every contributing indicator | FR13–FR24 |
| F2 | **Report** — lodge a structured scam report, attach evidence, receive a reference number, track status, respond to information requests | FR25–FR36, FR61–FR63 |
| F3 | **Stay informed** — read moderated, anonymised community alerts; view regional activity and trends; browse categorised awareness material; subscribe by category and region | FR49–FR60, FR64–FR66 |
| F4 | **Recover** — follow guided step-by-step response checklists and record completed actions | FR58–FR60 |

### For Council

| # | Function | Requirements |
|---|---|---|
| F5 | **Review and verify** — work a prioritised queue, assign reviewers, classify against a managed taxonomy, set severity, detect duplicates and related reports, request more information, approve or reject with a recorded reason | FR37–FR48 |
| F6 | **Alert** — draft alerts from verified reports, anonymise reporter information, obtain approval, publish, search, archive | FR49–FR54 |
| F7 | **Administer** — manage user accounts, roles and permissions; maintain the scam category taxonomy | FR67–FR69 |
| F8 | **Analyse and audit** — produce statistics and dashboards on volume, category, severity, status and regional trend; export de-identified aggregate data; read an immutable audit trail | FR70–FR72 |

## 3.3 User classes and characteristics

| Class | Role code | Characteristics | Access |
|---|---|---|---|
| **Anonymous visitor** | — | May have low digital confidence; may be in distress; may read English as a second language. Often arrives from a link shared by family. | Check a message, read alerts, browse awareness content, view the scam map, subscribe by email. **No account required.** |
| **Resident** | `RESIDENT` | Registered individual wanting to track a report and manage subscriptions. | All anonymous functions plus report submission, evidence upload, report tracking, recovery progress, profile management. |
| **Business / community organisation** | `BUSINESS` | Small business, NFP or volunteer-run group; may report on behalf of an organisation. | As Resident, plus organisation attribution on reports. |
| **Council officer** | `OFFICER` | Trained staff member who reviews reports and verifies alerts. | Review queue, assignment, classification, severity, information requests, approve/reject, alert drafting, evidence access (logged). |
| **Administrator** | `ADMIN` | Council system administrator. | All officer functions plus user and role management, category management, statistics, de-identified export, audit log access. |

**Design consequence.** The largest user class has no account. The checker is therefore specified to work with no registration, no login and no server round-trip for the submitted text. This is a deliberate accessibility and privacy decision, not a shortcut — and it is formalised as enhanced requirement FR85.

## 3.4 Operating environment

| Element | Requirement |
|---|---|
| Client browsers | Chrome, Edge, Firefox, Safari — last 3 versions; Firefox ESR; iOS Safari ≥ 15.4; Android Chrome |
| Client devices | Desktop, tablet, mobile; minimum supported viewport 320 px |
| Graceful degradation | WebGL-dependent visuals degrade to a static equivalent where WebGL is unavailable or reduced motion is requested |
| Server runtime | Node.js 20 LTS or later |
| Database | PostgreSQL 15+ (Neon serverless, `ap-southeast-2`); TLS with channel binding required |
| Transport | HTTPS/TLS 1.2+ only |
| Hosting | Static SPA on a CDN-backed host; API as either a serverless function or a long-running process — supported without code change |
| Data residency | Australian region pinned at provisioning for every provider holding personal data (ER-15) |

## 3.5 Design and implementation constraints

| ID | Constraint | Type | Source |
|---|---|---|---|
| C1 | Core technologies must be free and open-source or free-tier; there is no licensing budget | Financial | Client |
| C2 | Architecture must be a modular monolith with service-oriented boundaries capable of staged migration to microservices | Technical | R6 |
| C3 | AI capability must live in a separate Python/FastAPI service; the core system must be fully functional when AI is unavailable | Technical | R6 |
| C4 | Strict layer separation: routes → controller → service → repository. No business logic in controllers or in the database | Technical | R8 Rules 2.2–2.4, R9 §1–2 |
| C5 | Schema changes only through version-controlled Prisma migrations; database normalised to 3NF with foreign keys enforced | Technical | NFR-20, NFR-27, R8 Rules 5.1–5.4 |
| C6 | Fixed security controls: bcrypt, JWT, RBAC, Helmet, rate limiting, server-side validation on every request | Security | NFR-7–NFR-11, R8 §6 |
| C7 | Every page must meet WCAG 2.1 Level AA and use mobile-first responsive design | Accessibility | NFR-13, NFR-14 |
| C8 | The UI must follow the approved design system without deviation | Design | R10 |
| C9 | Git feature-branch workflow, conventional commits, no direct commits to main, no secrets in source control | Process | R8, R9 §4 |
| C10 | Data minimisation and privacy by design; personal data collected only where the service requires it | Ethical/legal | ETH-6, NFR-30 |
| C11 | Delivery within the academic calendar: 30 June – 27 November 2026 | Schedule | University |
| C12 | Team capacity is fixed; no additional resource can be added | Resource | University |
| C13 | Personal data handled per the Privacy Act 1988 (Cth), the APPs and the Victorian PDP Act 2014 | Legal | R14, R15 |
| C14 | One consistent response envelope for all endpoints, success and failure alike | Technical | R8 Rule 4.2 |
| C15 | Records with audit or evidentiary weight are soft-deleted, not removed | Technical | R8 Rule 5.3 |
| C16 | Any automated assessment must be explainable — carrying the evidence it used — and replaceable without changing its callers | Ethical/technical | R8 Rules 8.2–8.3 |
| C17 | Human verification is required before any automated output is published as fact | Ethical | R8 Rule 8.4, ETH-5 |

## 3.6 Assumptions and dependencies

| ID | Assumption | If it proves false |
|---|---|---|
| A1 | Free-tier hosting provides sufficient capacity for initial deployment and demonstration | Paid tiers required before public promotion — ~AUD $4,400/yr; risk RK-01, feasibility condition 1 |
| A2 | An SMTP provider or transactional email service is available for verification and notification | FR61–FR66 cannot be met; fallback to in-app notification only |
| A3 | OpenStreetMap tile service remains available under its usage policy | Scam map degrades to a non-map regional summary |
| A4 | Council can staff the reviewer and administrator roles that FR37–FR42 and FR49–FR51 require (~0.4 FTE) | The verification and alerting workflow cannot operate; risk RK-05, feasibility condition 2 |
| A5 | Stakeholders and supervisor approve the enhanced FRs before this document is finalised | Final SRS issues with the baseline only and the omission recorded; risk RK-02 |
| A6 | Council makes a privacy officer available to review the database design | Team proceeds with documented self-assessment and flags the unmitigated risk; risk RK-09 — **see §4.6** |
| A7 | External intelligence APIs and LLM providers are future dependencies only | No effect on this phase |
| A8 | Requirements remain stable following stakeholder confirmation of the open issues | Change control applies; risk RK-15 |
| A9 | All team members remain available for the project duration | Secondary role coverage activates; risk RK-06 |
| A10 | The suburb reference list and scam category taxonomy are confirmed by Council before launch | Seed data cannot be loaded; blocks Modules 5–12 — gap G7 |
| A11 | Users have a modern browser with JavaScript enabled | Progressive enhancement to a no-JS experience is not in scope |
| A12 | Detection rules are reviewed periodically by Council as scam patterns change | Rules drift out of date; addressed by FR82, FR83 and open issue OI-7 |

---

# 4. Conformance check against the client brief

This section reconciles the specification against the client brief (R1) requirement by requirement, and records every discrepancy found. It is the section Council should read first.

## 4.1 Method

Three sources were compared line by line: the client brief (R1, the authoritative document), the team's working baseline (R3, `Requirements.md`), and the implemented source tree at commit `f8e813a`. Each requirement was checked for presence, for faithful restatement, and for testability against ISO/IEC/IEEE 29148 criteria (R12). Six classes of finding emerged: exact matches, coverage gaps, numbering divergences, specification defects, unstated requirements, and one process deviation.

## 4.2 Functional requirements — result: exact match

**All 72 functional requirements in the client brief appear in this specification with their original identifiers and their original intent.** No FR has been dropped, renumbered, merged or silently reinterpreted. Module groupings FR1–FR6, FR7–FR12, … FR67–FR72 are preserved exactly as issued.

| Check | Result |
|---|---|
| FR count in client brief | 72 |
| FR count in this specification (baseline) | 72 |
| Identifiers preserved | ✅ All |
| Module groupings preserved | ✅ All 12 |
| Requirements added to the baseline without approval | ✅ None — enhancements are quarantined at §6 |

## 4.3 Finding 1 — the module list and the FR list do not correspond

**Severity: Medium. Action: Council confirmation requested (OI-8).**

The client brief declares **14 system modules** but groups the 72 functional requirements into **12 modules**. The two lists are not the same list. Reconciliation:

| # | Module declared in the client brief | Where its requirements live | Status |
|---|---|---|---|
| 1 | User registration and authentication module | FR module 1 — FR1–FR6 | ✅ Direct |
| 2 | User profile and privacy module | FR module 2 — FR7–FR12 | ✅ Direct |
| 3 | Scam checking and analysis module | FR module 3 — FR13–FR18 | ✅ Direct |
| 4 | URL and contact indicator analysis module | FR module 4 — FR19–FR24 | ✅ Direct |
| 5 | Scam reporting module | FR module 5 — FR25–FR30 | ✅ Direct |
| 6 | Evidence management module | FR module 6 — FR31–FR36 | ✅ Direct |
| 7 | Report review and verification module | FR module 7 — FR37–FR42 | ✅ Direct |
| 8 | Community scam alert module | FR module 9 — FR49–FR54 | ✅ Direct |
| 9 | **Scam map and trend-analysis module** | Only FR70 (statistics generation) | ⚠️ **Under-specified** |
| 10 | Scam awareness and education module | FR module 10 — FR55–FR57, FR59 | ✅ Direct |
| 11 | Notification and subscription module | FR module 11 — FR61–FR66 | ✅ Direct |
| 12 | Support and recovery guidance module | FR module 10 — FR58, FR60 | ✅ Merged into FR module 10 |
| 13 | Administration and configuration module | FR module 12 — FR67–FR69 | ✅ Merged into FR module 12 |
| 14 | Reporting, analytics and audit module | FR module 12 — FR70–FR72 | ✅ Merged into FR module 12 |
| — | *(no declared module)* | **FR module 8 — FR43–FR48, duplicate and related report detection** | ⚠️ **Unlisted module** |

**Two genuine discrepancies:**

**(a) The scam map and trend-analysis module has one functional requirement.** Module 9 is declared as a system module and named in the project title's spirit, but the FR list gives it only FR70 — "scam report statistics generation". There is no FR for map rendering, no FR for geographic aggregation, no FR for trend visualisation, and no FR defining the aggregation granularity. The team has specified this capability from the module declaration rather than leaving it unbuilt: aggregation is fixed at **suburb level and no finer** (data rule D5, ethical risk ER-4), and the capability is delivered through FR70 plus enhanced requirement **FR90** (trend and anomaly detection). **Council is asked to confirm this interpretation (OI-8).**

**(b) Duplicate and related report detection is a whole FR module with no declared system module.** FR43–FR48 exist in the FR list but module 8 does not appear among the 14 declared modules. The team treats FR43–FR48 as binding — they are numbered requirements in the brief — and has modelled them fully (`ReportRelation`, similarity scoring, indicator normalisation). No action required beyond noting the inconsistency.

## 4.4 Finding 2 — non-functional requirement count divergence

**Severity: Medium. Action: Council sign-off requested (OI-9).**

The client brief specifies **25** non-functional requirements. The team's working baseline (R3) and the Interim SRS carry **30**. The five additional requirements were introduced by the team during analysis and have never been formally approved by Council.

This document resolves the divergence by numbering the **client's 25 as `CB-1`–`CB-25`** and retaining the project's `NFR-1`–`NFR-30`, with a full mapping at §9.10. The five team-added requirements are identified explicitly below so Council can accept or reject each on its merits.

| Project ID | Team-added requirement | Justification for adding it | Recommendation |
|---|---|---|---|
| NFR-6 (extension) | Restore within **4 hours** (RTO), in addition to the client's 24-hour RPO | The client brief sets a data-loss bound but no time bound. A restore with no time limit is not a testable reliability requirement. | **Accept** |
| NFR-11 | The system shall restrict access to sensitive data based on user roles | The client brief mandates RBAC as a *functional* requirement (FR10) but omits it from the security NFRs. Evidence files and victim narratives are classified C4; access restriction is a security property, not only a feature. | **Accept — material to R14/R16 compliance** |
| NFR-13 | WCAG 2.1 Level AA conformance | The client brief requires only that the interface be "intuitive and mobile-responsive". A public-facing government service carries an accessibility obligation under R18. Omitting it would leave the service legally exposed. | **Accept — legal necessity** |
| NFR-14 | Mobile device support (iOS and Android) through responsive design | Expands the client's CB-11/CB-14 to name the platforms and set a measurable breakpoint (320 px). | **Accept** |
| NFR-21 | Handle a 20% annual increase in users | The client brief specifies concurrency (CB-2) but no growth trajectory, so capacity planning has no horizon. | **Accept** |
| NFR-22 | Allow horizontal scaling of web and database servers | The client brief requires migration from single-server to clustered (CB-18) but not the scaling property that makes it useful. | **Accept** |

> Six additions are listed against five slots because NFR-6's extension is a clarification of an existing client requirement rather than a new requirement. Net new requirements: five (NFR-11, NFR-13, NFR-14, NFR-21, NFR-22).

## 4.5 Finding 3 — four specification defects in the client brief (SD1–SD4)

**Severity: High for D3 and D4. Action: Council confirmation requested (OI-1, OI-3, OI-10).**

Four requirements in the client brief cannot be implemented as written. Each is recorded here with the defect identified and a corrected statement proposed, rather than being silently reproduced or silently rewritten.

### SD1 — Product identity contradiction

> **As written (client brief, Project Brief section):** *"Online Cybersecurity Assessment System is an online cybersecurity assessment portal designed to help small businesses, community organizations and not-for-profit organizations identify cybersecurity risks and improve their security practices. The system will allow organizations to complete cybersecurity assessments, receive risk scores, view recommendations, monitor improvements and access cybersecurity awareness resources."*

**Defect.** This paragraph describes a **cybersecurity self-assessment maturity tool for organisations**. Every other element of the brief — the document title (*Online Scam Detection and Reporting System*), all 14 declared modules, and all 72 functional requirements — describes a **scam detection and reporting service for the whole community**. The two are different products with different users. Not one of the 72 FRs describes a maturity assessment, a control questionnaire, an improvement-tracking cycle, or an organisational security posture score.

**Assessment.** The paragraph is a residual from a different brief. The title, the modules and the requirements are consistent with each other and outnumber it decisively.

**Resolution adopted.** The system is built as an **Online Scam Detection and Reporting System** serving residents, small businesses, community organisations and not-for-profits. The scope of the checker is deliberately widened so that organisational users are genuinely served — invoice redirection, business email compromise and payment-redirection patterns are covered by the rule set — which honours the organisational emphasis of the paragraph without building a different product.

**Status.** Raised as **OI-1** on 8 July 2026. Confirmation outstanding. This is risk **RK-17**.

### SD2 — Non-existent technology mandate

> **As written (CB-15 / NFR-18):** *"The system should follow modular PHP code structure with MVC pattern."*

**Defect.** No part of this system is written in PHP, and no part of the approved technology stack (R7) contains PHP. The requirement mandates an implementation technology that contradicts the architecture the same client approved.

**Assessment.** Template artefact. The intent behind it — modular structure with enforced separation of concerns — is sound and is retained.

**Corrected statement adopted:**

> *The system shall follow a modular TypeScript code structure with strict layer separation (routes → controller → service → repository → data access), such that no layer may be bypassed and no business logic resides in a controller.*

**Conformance.** ✅ Implemented as corrected, and verified by audit: controllers receive, delegate and respond only; all identity database access is confined to a single repository so the soft-delete condition lives in one place. Raised as **OI-2**.

### SD3 — Purpose limitation names the wrong purpose

> **As written (CB-25 / NFR-30):** *"All personal information should be used only for matchmaking purposes."*

**Defect.** This system performs no matchmaking. The clause is a template artefact from an unrelated product. Left as written it is worse than absent: a purpose-limitation clause naming a purpose the system does not have provides **no** limitation at all, while appearing to provide one. Under the Australian Privacy Principles (APP 6) the permitted purpose must be the actual primary purpose of collection.

**Corrected statement adopted:**

> *Personal information shall be collected and used only for the purposes of scam detection, scam reporting, report review, community alerting, victim support and the statutory community-safety functions of Hume City Council. It shall not be used for any secondary purpose, disclosed to third parties except as required by law, or used for profiling, marketing or automated decision-making about an individual.*

**Status.** Raised as **OI-3**. **Council's privacy statement must reflect the corrected wording before launch.** This is a compliance blocker, not an editorial preference.

### SD4 — Database technology mismatch

> **As written (CB-18 / NFR-23):** *"The system should support easy migration from single-server MySQL to clustered database architecture."*

**Defect.** The approved stack (R7) specifies **PostgreSQL**, not MySQL. The requirement names a database product the project does not use.

**Assessment.** The underlying intent — that the data tier must be able to move from a single server to a clustered architecture without application rewrite — is valid and is retained.

**Corrected statement adopted:**

> *The system shall support migration from a single-server PostgreSQL deployment to a clustered or replicated architecture without application code change.*

**Conformance.** ✅ Satisfied by design: all data access is through the ORM against standard PostgreSQL, and no vendor-specific feature is used in application code. Raised as **OI-10**.

## 4.6 Finding 4 — a governance control was bypassed

**Severity: High. Action: immediate — privacy officer review required before further schema change.**

The Interim Project Report §11.6 states the design gate plainly:

> *"No Prisma migration is written until this register is reflected in the schema design."*

The initial migration `20260807105640_init_cybersafe_schema` was written and applied on **7 August 2026**. Milestone M8 — database design and ethics review with Council privacy officer sign-off — is scheduled for **21 August 2026** and has not occurred. The migration therefore preceded its governing control by two weeks.

**Consequence.** Six ethical risks are rated Critical precisely because they become materially harder — and in three cases close to impossible — to correct once real personal data exists in the database. The mitigating factor is that **no production personal data exists yet**, so the window to correct the schema is still open. It closes at first production use.

**Audited position.** §10.4 sets out each of the fifteen ethical risks against the schema as migrated. Seven mitigations are present, five are absent, and three are implemented differently from the register. Those findings are the agenda for the M8 review.

**Recommendation.** (1) Hold the privacy officer review before any further migration. (2) Treat the current schema as a **draft under review**, not as a baseline. (3) Land the corrective migration identified at §10.4 before Module 5 implementation begins, since Modules 5–6 are the first to store C3 and C4 data.

## 4.7 Finding 5 — requirements that are not independently testable

**Severity: Low. Action: parameters proposed at §9; Council approval requested (OI-6).**

Nine client requirements state an obligation without a measurable threshold. Each is restated in this document with a proposed parameter, marked as a team proposal and requiring confirmation.

| Client requirement | Missing parameter | Proposed value | Where |
|---|---|---|---|
| CB-1 — pages load within 3 s | "Normal network conditions" undefined; no metric named | 4G profile; LCP ≤ 3.0 s; TTI ≤ 5 s | §9.1 |
| CB-4 — 99% uptime | Measurement window and probe undefined | Monthly, measured against `/api/health/ready` | §9.2 |
| CB-6 — restore without exceeding 24 h data loss | No time bound on the restore itself | RTO ≤ 4 h (NFR-6) | §9.2 |
| CB-10 — sessions expire after inactivity | Period undefined | 2 h access-token lifetime | §9.3 |
| CB-8 — passwords encrypted | Algorithm and cost undefined | bcrypt, cost ≥ 12 | §9.3 |
| CB-11 — intuitive interface | No acceptance test | First-time user completes a check without instruction | §9.4 |
| CB-12 — clear error messages | "Clear" undefined | Field-level, plain-English, actionable, adjacent to the field | §9.4 |
| CB-21 — automatic recovery from shutdown | Mechanism and time bound undefined | Platform process restart; structured logs; alert within 5 min | §9.7 |
| CB-24 — permanent profile deletion | Conflicts with audit retention; no reconciliation given | Crypto-shred/severance model at ER-7 | §10.4 |

## 4.8 Finding 6 — requirements the brief does not state but the service cannot ship without

Four obligations are absent from the client brief yet unavoidable for a public Victorian local-government service handling this data class. They are raised as enhanced requirements at §6 rather than being added to the baseline unilaterally.

| Obligation | Why it is unavoidable | Raised as |
|---|---|---|
| A defined data retention schedule with automated purge | R14/R15 require that personal information not be kept longer than needed. The brief specifies deletion on request (FR12) but no lifecycle at all. | **FR91** |
| Multilingual delivery | Hume is among Victoria's most linguistically diverse municipalities. An English-only scam-safety service does not reach the residents most exposed to scams. | **FR84** |
| Multi-factor authentication for privileged roles | `OFFICER` and `ADMIN` can read C4-classified evidence and publish public notices under Council's name. A password alone is not an adequate control for that authority under R16. | **FR73** |
| A dispute and correction process for wrongly implicated third parties | Phone numbers and email addresses in scam reports frequently belong to innocent people whose identity was spoofed. Defamation exposure is real (ER-13, RK-12). | **FR92** and ER-13 |

## 4.9 Conformance summary

| Dimension | Client brief | This specification | Result |
|---|---|---|---|
| Functional requirements | 72 | 72 baseline + 20 proposed (quarantined) | ✅ Complete conformance |
| System modules declared | 14 | 14 mapped to 12 FR groups | ⚠️ 2 discrepancies documented (§4.3) |
| Non-functional requirements | 25 | 30 (25 client + 5 team-added) | ⚠️ 5 additions require sign-off (§4.4) |
| Ethical requirements | 4 statements + 2 principles | 6 codified as ETH-1–ETH-6 | ✅ Complete conformance |
| Enhanced FRs required by the brief | 15–20, approved separately | 20, presented separately at §6 | ✅ Conforms — approval outstanding |
| Hardware requirements | "Recommended by the developers" | §13.1–13.3 | ✅ Supplied |
| Software requirements | "Recommended by the developers" | §13.4 | ✅ Supplied |
| Specification defects | — | 4 identified, corrections proposed | ⚠️ Council confirmation required |
| Untestable requirements | 9 | Parameters proposed | ⚠️ Council approval required (OI-6) |
| Governance control bypassed | — | 1 identified | ⚠️ **Action required (§4.6)** |

**Overall conformance verdict: CONFORMS, with nine items requiring Council decision.** No requirement of the client brief has been dropped, and no requirement has been added to the baseline without being marked as a proposal. Every discrepancy found in the brief is documented rather than silently resolved. The nine outstanding decisions are consolidated at §18.

---

# 5. Functional requirements — approved baseline (FR1–FR72)

Every requirement is stated with a unique identifier, a priority, a testable acceptance criterion and an audited implementation status. Status symbols are defined at §1.5.

## 5.1 Module 1 — User registration and authentication

*Priority: Must. Architecture: `AuthenticationService`, JWT, bcrypt. Ethical risks: ER-1, ER-14.*

| ID | Requirement | Acceptance criterion | Pri | Status |
|---|---|---|---|---|
| **FR1** | The system shall allow a visitor to register an account | Given email, password, full name and optional organisation and phone, an account is created; the password is persisted only as a bcrypt digest; a `RESIDENT` role and default notification preferences are assigned | Must | ✅ |
| **FR2** | The system shall verify a registered email address | A single-use, time-limited token (24 h) is issued on registration; following it marks the account verified and consumes the token in one atomic transaction, so a token cannot be spent without verifying nor an account verified by a token that stays live | Must | 🟡 Token issue and consumption implemented; **email delivery not implemented** (G1) |
| **FR3** | The system shall reject registration of an email address already registered | A second registration returns HTTP 409 with a field-level error; uniqueness is enforced by a database constraint so a race between two concurrent requests cannot create two rows | Must | ✅ |
| **FR4** | The system shall authenticate a registered user | Correct credentials return a signed JWT and the public user record; the last-login timestamp is recorded; incorrect email and incorrect password produce identical responses and comparable timing | Must | ✅ |
| **FR5** | The system shall allow a user to sign out | The client discards its token; the endpoint exists as the single call site and as the future home of a token deny-list | Must | ✅ |
| **FR6** | The system shall allow a user to recover a forgotten password | A single-use, time-limited reset token is emailed; presenting it with a new password updates the digest and consumes the token; the response to a reset request is identical whether or not the address is registered | Must | ⬜ `PasswordResetToken` modelled; no endpoint |

## 5.2 Module 2 — User profile and access control

*Priority: Must. Architecture: `UserService`, RBAC middleware. Ethical risks: ER-1, ER-7, ER-14.*

| ID | Requirement | Acceptance criterion | Pri | Status |
|---|---|---|---|---|
| **FR7** | The system shall allow an authenticated user to view their profile | The profile is returned without the password digest, without token hashes, and without any field of another user | Must | ✅ |
| **FR8** | The system shall allow a user to update their profile | Name, organisation and phone may be changed; an email change requires re-verification before taking effect | Must | ⬜ |
| **FR9** | The system shall allow a user to change their password | The current password must be supplied and verified; the new password is subject to the registration policy; all other sessions are invalidated on success (see FR75) | Must | ⬜ |
| **FR10** | The system shall enforce role-based access control | Every protected endpoint declares the roles permitted to call it; authorisation is evaluated as a question separate from authentication; an authenticated user without the required role receives 403, not 404 or 401 | Must | ✅ Mechanism implemented (`requireAuth`, `requireRole`) and deliberately separated |
| **FR11** | The system shall allow a user to manage notification preferences | Status emails, alert emails and information-request emails may each be enabled or disabled independently | Must | 🟡 Preference row created with defaults on registration; no edit endpoint |
| **FR12** | The system shall allow a user to request account deletion | The request is recorded as a reviewable obligation; on processing the account is soft-deleted and excluded from every query, while audit records survive with the user reference severed | Must | ⬜ Model and repository-level exclusion implemented; request flow not built |

## 5.3 Module 3 — Scam content analysis

*Priority: Must. Architecture: `ScamAnalysisService`, risk engine. Ethical risks: ER-8, ER-9.*

| ID | Requirement | Acceptance criterion | Pri | Status |
|---|---|---|---|---|
| **FR13** | The system shall accept a suspicious text submission | Free text is accepted from any user, authenticated or not, up to the request body limit | Must | ✅ |
| **FR14** | The system shall allow the user to select the communication type | One of SMS, email, phone, website, social or other; the selection materially affects which rules are applied | Must | ✅ Channel-based rule suppression implemented |
| **FR15** | The system shall detect scam keywords and wording patterns | The submission is matched against a maintained, externally readable rule set; every match records the rule that fired and the text fragment that triggered it | Must | ✅ 11 text rules |
| **FR16** | The system shall calculate a risk score | Indicator weights combine into a deterministic integer 0–100; the function is asymptotic and never returns 100 | Must | ✅ |
| **FR17** | The system shall classify the score into a risk band | HIGH ≥ 65; MEDIUM ≥ 35; LOW ≥ 0; UNCLEAR where the submission is below the minimum useful length | Must | ✅ |
| **FR18** | The system shall display the indicators behind the score | Every contributing indicator is shown with label, plain-English explanation, weight and the exact evidence fragment, ordered strongest first | Must | ✅ |

### 5.3.1 Scoring specification (normative)

Indicator weights contribute evidence points — **HIGH 30, MEDIUM 16, LOW 7** — which are summed and passed through the saturating curve:

```
score = round( 100 × (1 − e^(−evidence ÷ 45)) )
```

Indicators originate from distinct rules and are therefore treated as **independent evidence rather than repetition**. Per-indicator discounting was evaluated and rejected: it placed three genuinely separate high-severity signals — urgency, a gift-card demand and a request for secrecy, which together describe a textbook scam — at 51, below the threshold for the band they plainly belong in.

The curve's asymptote is **ETH-1 and ETH-2 expressed arithmetically**: it approaches but never reaches 100, so no volume of evidence produces a verdict the service is not entitled to give.

### 5.3.2 Confidence specification (normative)

```
confidence = round( 100 × (0.45 × min(1, length ÷ 180) + 0.55 × min(1, indicators ÷ 4)) ) ÷ 100
```

Confidence is reported **separately** from the score because the two answer different questions: the score is how scam-like the text looks; the confidence is how much of a look the system got. A three-word message scoring zero is not the same claim as a long message scoring zero. Confidence is not a measure of correctness and shall never be presented as one.

### 5.3.3 Non-discrimination constraint (normative, ETH-3)

No scoring input shall be, or act as a proxy for, an organisation's size, industry, revenue or resources, or an individual's nationality, ethnicity, religion, language, age, gender, disability, socio-economic status or place of residence. The rule set is held as **data, not branches**, so it is readable end to end by a non-developer and auditable by Council. Verified by audit at §10.3.

## 5.4 Module 4 — URL and contact analysis

*Priority: Must. Architecture: `ScamAnalysisService`, URL pipeline. Ethical risks: ER-13.*

| ID | Requirement | Acceptance criterion | Pri | Status |
|---|---|---|---|---|
| **FR19** | The system shall accept a suspicious URL | URLs are extracted from pasted text and may also be submitted directly; scheme-less URLs and raw-IP URLs are accepted | Must | ✅ |
| **FR20** | The system shall validate URL format | A URL that cannot be parsed to a host is flagged as an indicator in its own right, never silently discarded | Must | ✅ |
| **FR21** | The system shall detect suspicious URL patterns | The host is checked for high-abuse TLDs, known shorteners, brand-lookalike construction, excessive subdomain nesting and raw IP addressing; Australian official suffixes are exempt from host-shape penalties | Must | ✅ 6 checks; 12 TLDs, 10 shorteners, 14 brands, 3 exempt suffixes |
| **FR22** | The system shall accept a suspicious phone number | Australian mobile, +61, 1300/1800 and area-code landline formats are recognised in the shapes people actually paste, and normalised to digits only | Must | 🟡 Extraction and normalisation implemented; matching requires FR24 |
| **FR23** | The system shall accept a suspicious email address | Addresses are extracted and normalised to lower case | Must | 🟡 As above |
| **FR24** | The system shall match a submitted artefact against previously reported indicators | A submitted URL, domain, phone number or email address is looked up against the artefact registry and any prior-report count is surfaced without revealing who reported it | Must | ⬜ `Indicator`/`ReportIndicator` modelled with unique `(type, value)` and a report counter; **requires FR77** |

## 5.5 Module 5 — Scam report management

*Priority: Must. Architecture: `ReportService`. Ethical risks: ER-1, ER-4, ER-6.*

| ID | Requirement | Acceptance criterion | Pri | Status |
|---|---|---|---|---|
| **FR25** | The system shall allow an authenticated user to create a scam report | Title, description, channel, category, suburb, optional amount lost and optional occurrence date are captured and persisted | Must | ⬜ |
| **FR26** | The system shall allow a report to be saved as a draft | A report may be saved in `DRAFT` and completed in a later session; drafts are visible only to their author | Must | ⬜ |
| **FR27** | The system shall validate all report fields server-side | Every field is validated before persistence; monetary amounts are stored in whole cents as an integer, never as a floating-point value | Must | ⬜ Schema enforces `amountLostCents Int` |
| **FR28** | The system shall generate a unique report reference | Each submitted report receives a human-quotable reference (format `HCC-YYMM-NNN`) sufficient to identify the report on its own; uniqueness is enforced by the database | Must | ⬜ Unique column present |
| **FR29** | The system shall allow a user to view their submitted reports | A user sees their own reports and current status; an officer sees reports in their queue; no user can enumerate another user's reports | Must | ⬜ |
| **FR30** | The system shall allow a user to withdraw a report | Withdrawal sets a state and timestamp; the record is retained in full and remains available to review; withdrawal is never a deletion | Must | ⬜ `withdrawnAt` present |

## 5.6 Module 6 — Evidence management

*Priority: Must. Architecture: `EvidenceService`, object storage, `AuditService`. Ethical risks: ER-5, ER-10, ER-12.*

| ID | Requirement | Acceptance criterion | Pri | Status |
|---|---|---|---|---|
| **FR31** | The system shall allow evidence files to be uploaded against a report | Binaries are held in private object storage and referenced by key; the database stores metadata only | Must | ⬜ |
| **FR32** | The system shall validate evidence file type | MIME type is validated server-side by content inspection against an allowlist — never by client-declared type or file extension; no uploaded file is ever executable or served from an origin that could execute it | Must | ⬜ |
| **FR33** | The system shall validate evidence file size | Enforced server-side. Proposed limits: **10 MB per file, 5 files per report** (OI-6) | Must | ⬜ |
| **FR34** | The system shall allow a description to accompany each evidence file | Optional free text, validated and length-bounded | Must | ⬜ |
| **FR35** | The system shall restrict access to evidence | Retrievable only by the report's author and by assigned officers or administrators, through short-lived signed URLs issued after an authorisation check; no public or guessable URL exists | Must | ⬜ |
| **FR36** | The system shall log every access to evidence | Each read appends who, what, when and source address to an append-only log with no update or delete path in the application | Must | ⬜ `EvidenceAccessLog` modelled and specified append-only |

**Integrity control.** Each evidence record carries a SHA-256 checksum so a stored file can be demonstrated to be the file that was uploaded — material if a report is ever used evidentially.

**Privacy control (ER-5).** EXIF and embedded metadata shall be stripped on ingest. Users routinely upload screenshots containing more personal information than they realise — location data, adjacent messages, bank details, third-party identities. *This mitigation is not yet reflected in the schema; see §10.4.*

## 5.7 Module 7 — Report review and verification

*Priority: Must. Architecture: `ReportService`, `NotificationService`, `AuditService`. Ethical risks: ER-10, ER-11.*

| ID | Requirement | Acceptance criterion | Pri | Status |
|---|---|---|---|---|
| **FR37** | The system shall display a review queue to officers | Submitted reports are listed with filtering by status, category, suburb, severity and age, and ordered by a defined prioritisation | Must | ⬜ |
| **FR38** | The system shall allow a report to be assigned to a reviewer | The assigned officer becomes the responsible party and is recorded on the report | Must | ⬜ `reviewerId` present |
| **FR39** | The system shall allow a reviewer to classify a report | The scam category may be assigned or corrected against the managed taxonomy | Must | ⬜ |
| **FR40** | The system shall allow a reviewer to set report severity | HIGH, MEDIUM or LOW, recorded distinctly from any automated score | Must | ⬜ |
| **FR41** | The system shall allow a reviewer to request additional information | A message is sent to the reporter, the report moves to `INFORMATION_REQUESTED`, and the reporter's response is recorded against the request | Must | ⬜ |
| **FR42** | The system shall allow a reviewer to approve or reject a report | The report moves to `APPROVED` or `REJECTED` with a recorded reason; every decision is written to the audit log | Must | ⬜ |

**Audit control.** Reviews are stored as a **sequence** of decision records rather than as mutable fields on the report, so the history of a decision survives the next decision (C17, R8 Rule 8.4).

## 5.8 Module 8 — Duplicate and related report detection

*Priority: Should. Architecture: `ReportService` similarity matching. Ethical risks: ER-4, ER-13.*

| ID | Requirement | Acceptance criterion | Pri | Status |
|---|---|---|---|---|
| **FR43** | The system shall detect probable duplicate reports | Candidates are surfaced **to a reviewer** with a similarity value; reports are never auto-merged — a human decides (C17) | Should | ⬜ |
| **FR44** | The system shall compare report text for similarity | Descriptions compared by normalised token similarity against a configurable threshold | Should | ⬜ |
| **FR45** | The system shall compare phone numbers across reports | Compared on the normalised digits-only form | Should | ⬜ |
| **FR46** | The system shall compare email addresses across reports | Compared on the normalised lower-case form | Should | ⬜ |
| **FR47** | The system shall compare website addresses across reports | Compared on the normalised host, not the full URL | Should | ⬜ |
| **FR48** | The system shall allow reports to be linked | Two reports may be linked as `DUPLICATE` or `RELATED` with an optional similarity value; a pair may be linked once per direction; the link is queryable from either end | Should | ⬜ `ReportRelation` self-relation modelled |

**Performance control (RK-07).** Similarity comparison shall be scoped to candidate sets selected by indexed indicator match, never by full-table scan, and shall be performance-tested against a synthetic 100,000-record dataset before M13 (NFR-3).

## 5.9 Module 9 — Community scam alerts

*Priority: Should. Architecture: `AlertService`. Ethical risks: ER-2, ER-13.*

| ID | Requirement | Acceptance criterion | Pri | Status |
|---|---|---|---|---|
| **FR49** | The system shall allow an officer to create a scam alert | An alert is drafted from one or more verified reports with headline, summary, category, suburb, channel and severity | Should | ⬜ |
| **FR50** | The system shall anonymise reporter information in alerts | A published alert carries nothing identifying the reporter; anonymisation is performed as a **data transformation**, not a presentation-layer omission; the specimen text is de-identified before storage on the alert | Should | ⬜ ⚠️ Schema retains a severable FK — see §10.4 ER-2 |
| **FR51** | The system shall require approval before an alert is published | Publication requires a second party's approval, recorded against the alert; the author may not approve their own alert | Should | ⬜ |
| **FR52** | The system shall publish approved alerts | An approved alert becomes publicly visible with a publication timestamp and a unique reference | Should | ⬜ |
| **FR53** | The system shall allow alerts to be searched | Searchable by keyword, category, suburb, channel and severity, without authentication | Should | ⬜ |
| **FR54** | The system shall archive alerts rather than delete them | An archived alert is withdrawn from listings but its URL continues to resolve; a published address must never begin returning 404 | Should | ⬜ |

**Defamation control (ER-13, RK-12).** No alert shall name an individual or business as a scammer. Alerts describe **patterns, not people**. Contact indicators are never publicly listed, because they are frequently spoofed and often belong to innocent third parties.

## 5.10 Module 10 — Scam awareness and recovery

*Priority: Should. Architecture: resource and recommendation services. Ethical risks: ER-1.*

| ID | Requirement | Acceptance criterion | Pri | Status |
|---|---|---|---|---|
| **FR55** | The system shall allow awareness resources to be viewed | Articles readable without an account, with an indicated reading time | Should | ⬜ Modelled; route serves a placeholder |
| **FR56** | The system shall categorise awareness resources | Resources grouped by category and browsable by group | Should | ⬜ |
| **FR57** | The system shall allow awareness resources to be searched | Search across title, summary and body | Should | ⬜ |
| **FR58** | The system shall display a scam response checklist | An ordered checklist appropriate to the situation, sequenced by what matters in the first hour, covering bank contact, password change, IDCARE, police and credit ban | Should | ⬜ |
| **FR59** | The system shall recommend relevant resources | After a check or a report, resources relevant to the detected category are recommended | Should | 🟡 Result links to the recovery checklist and to reporting; category-driven recommendation not implemented |
| **FR60** | The system shall track recovery actions | A signed-in user's completed steps are recorded, one record per user per step, and shown on return | Should | ⬜ |

## 5.11 Module 11 — Notification and subscription

*Priority: Should. Architecture: `NotificationService`, email delivery. Ethical risks: ER-6.*

| ID | Requirement | Acceptance criterion | Pri | Status |
|---|---|---|---|---|
| **FR61** | The system shall notify a reporter on report submission | Notification includes the reference number and what happens next | Should | ⬜ |
| **FR62** | The system shall notify a reporter on report status change | Sent on each transition, subject to the user's preferences | Should | ⬜ |
| **FR63** | The system shall notify a reporter when information is requested | Sent when an officer requests further detail | Should | ⬜ |
| **FR64** | The system shall allow subscription to a scam category | A registered user or a bare email address may subscribe | Should | ⬜ |
| **FR65** | The system shall allow subscription to a region | Scoped to a suburb; aggregation is to suburb level and no finer | Should | ⬜ |
| **FR66** | The system shall allow unsubscription | Works from an emailed link **without signing in**, via a hashed single-purpose token; takes effect immediately | Should | ⬜ `unsubscribeTokenHash` modelled, unique |

**Privacy control.** Subscriptions may exist without an account, so a resident can receive alerts without registering — consistent with FR85.

**Reliability control (RK-14).** Email delivery shall retry from a background queue; failure of the email provider shall not fail the originating transaction.

## 5.12 Module 12 — Administration, reporting and audit

*Priority: Must. Architecture: `AdministrationService`, `AnalyticsService`, `AuditService`. Ethical risks: ER-3, ER-7, ER-10, ER-11.*

| ID | Requirement | Acceptance criterion | Pri | Status |
|---|---|---|---|---|
| **FR67** | The system shall allow administrators to manage user accounts | List, search, suspend and soft-delete; no administrator action exposes a password digest or a token | Must | ⬜ |
| **FR68** | The system shall allow administrators to manage user roles | A user's role may be changed; every change is written to the audit log with actor and timestamp | Must | ⬜ |
| **FR69** | The system shall allow administrators to manage scam categories | Create, rename and archive; categories are rows, not strings, so a rename does not orphan history | Must | ⬜ |
| **FR70** | The system shall generate scam report statistics | Counts and trends by category, suburb, channel, severity, status and period, for both officer dashboards and Council reporting | Must | ⬜ |
| **FR71** | The system shall export de-identified data | Exports contain no direct identifier and no free-text field capable of carrying one without review; a k-anonymity threshold of k ≥ 5 is enforced at view level with small-cell and complementary suppression | Must | ⬜ |
| **FR72** | The system shall log user activity | Consequential actions are appended with actor, action, entity, structured metadata, source address and timestamp; the actor reference severs on account deletion so erasing an account cannot erase the evidence that an administrative act occurred | Must | ⬜ `AuditLog` modelled with severance |

**Logging control (ER-11).** The audit log records **metadata only** — never credentials, tokens, or the content of a submission or report. Where a value must be evidenced, a hash is stored rather than the value.

---

# 6. Enhanced functional requirements — proposed (FR73–FR92)

The client brief requires the development team to research and propose **15–20 additional functional requirements**, obtain prior approval from the stakeholders and project supervisor, and reflect them **separately** in the Final SRS Report. This section discharges that instruction.

> ## ⚠️ Approval status
>
> **Twenty requirements are proposed. Approval from the project supervisor and Council stakeholders is OUTSTANDING (open issue OI-4, milestone M7, risk RK-02).**
>
> Until approval is granted, these requirements are **not** part of the contractual baseline and are excluded from the delivery commitment at §14. Six of the twenty are already implemented; approval would formalise behaviour the system already exhibits rather than adding work.

## 6.1 Selection method

Candidates were derived from four sources rather than assembled for volume: (1) capabilities the baseline **requires but cannot achieve** as written — FR24 cannot function without FR77; (2) **legal and regulatory obligations** the brief omits — R14/R15 retention, R16 privileged access, R18 accessibility; (3) the **demographic reality** of the municipality — multilingual delivery; (4) **defects and risks** identified during design — session revocation, rule-set governance, third-party dispute. Each was assessed for schedule feasibility before proposal, per risk RK-03.

## 6.2 Security and account integrity

| ID | Requirement | Justification | Pri | Status |
|---|---|---|---|---|
| **FR73** | **Multi-factor authentication for privileged roles.** `OFFICER` and `ADMIN` accounts shall complete a TOTP second factor at sign-in. | These roles read C4-classified evidence containing bank details and victim narratives, and publish public notices under Council's name. A password alone is not an adequate control for that authority under R16 (VPDSS). | Must | ⬜ |
| **FR74** | **Progressive credential throttling and account lockout.** After a defined number of failed attempts against an address, delay shall increase and the account shall be temporarily locked, with the account holder notified. | The baseline has no brute-force control at the account level — only at the network level. | Must | 🟡 IP-based limiting implemented (10 attempts / 15 min on credential endpoints); per-account lockout not implemented |
| **FR75** | **Session revocation and device sign-out.** A user shall be able to invalidate all issued tokens; an administrator shall be able to revoke a compromised account's sessions immediately. | Stateless JWTs cannot currently be revoked before expiry. FR5 as specified only discards the client's copy — which is not revocation. | Should | ⬜ |
| **FR76** | **Uniform authentication failure response.** Wrong-address and wrong-password outcomes shall be indistinguishable in message content and in response timing. | Without this the sign-in form is an account-existence oracle — a privacy leak in a service whose users include scam victims. | Must | ✅ Implemented: a dummy hash is compared when no user is found, so the bcrypt cost is paid on every attempt |

## 6.3 Detection capability

| ID | Requirement | Justification | Pri | Status |
|---|---|---|---|---|
| **FR77** | **Server-side analysis endpoint with optional retention.** The analyser shall also run server-side so a check can be matched against the reported-artefact corpus and can contribute to statistics. | **FR24 and FR70 are unachievable from a purely client-side analyser.** The analyser is deliberately written as a pure, transport-free function so it runs in both places without modification. | Must | ⬜ Analyser is pure and portable; endpoint not built |
| **FR78** | **Evidence-carrying explanation for every assessment.** Each indicator shall expose label, plain-English detail, weight and the triggering fragment. | Required by C16 and by ETH-3. A score a user cannot interrogate is a score they cannot disagree with. | Must | ✅ |
| **FR79** | **Confidence reported independently of score.** | A low score on a three-word message and a low score on a long message are different claims and must not be presented identically. | Must | ✅ |
| **FR80** | **Channel-aware rule applicability.** Rules that cannot apply to a channel shall be suppressed rather than scored. | "Pushes you to a link" firing on a phone-call transcript is noise that inflates scores and erodes trust in the whole result. | Should | ✅ |
| **FR81** | **Screenshot submission with OCR.** Users shall be able to upload a screenshot; text is extracted and analysed by the same rule set. | Most users screenshot a scam SMS rather than copying it. This is the single largest usability gap in the checker. | Should | ⬜ Requires the deferred AI service (C3) |
| **FR82** | **Assessment feedback loop.** A user shall be able to mark a result as wrong; feedback is recorded against the rule set for periodic review. | The rule set must be tuned against reality. Without a feedback channel, tuning is guesswork — and ER-9 requires bias review to be evidence-led. | Should | ⬜ |
| **FR83** | **Rule-set versioning.** Every stored assessment shall record the rule-set version that produced it. | A result cannot be explained after the fact if the rules have since changed. Directly supports C16 and ER-9. | Should | ⬜ |

## 6.4 Service reach and community fit

| ID | Requirement | Justification | Pri | Status |
|---|---|---|---|---|
| **FR84** | **Multilingual interface and content.** The interface, awareness content and alerts shall be available in the principal community languages of the municipality, with language selection persisted. | Hume is among Victoria's most linguistically diverse municipalities, and unfamiliarity with how Australian institutions communicate is the precise vulnerability scams exploit (§2.2.1). **A scam-safety service delivered only in English does not reach the residents most exposed to scams.** This is the highest-value enhancement proposed. | Must | ⬜ |
| **FR85** | **Anonymous checking without an account.** Checking shall never require registration, and submitted text shall not be retained against an identity by default. | A person who has just been scammed will not create an account first. Requiring one suppresses exactly the traffic the service exists for. | Must | ✅ |
| **FR86** | **Assistive-technology conformance in dynamic results.** Results shall announce through a live region; decorative motion shall be suppressed under reduced-motion preference; WebGL features shall degrade rather than fail. | NFR-13 requires WCAG 2.1 AA but the baseline says nothing about the animated result surfaces this design uses. | Must | ✅ |
| **FR87** | **Printable and shareable result summary.** A result may be saved or printed as a plain summary including indicators and the advisory disclaimer. | Users routinely need to show a result to a family member, a bank or an officer. | Could | ⬜ |
| **FR88** | **Periodic alert digest.** Subscribers may elect a weekly digest rather than per-alert email. | Per-event email at scale trains recipients to ignore Council mail — the opposite of the intended effect. | Should | ⬜ |

## 6.5 Operations, governance and intelligence

| ID | Requirement | Justification | Pri | Status |
|---|---|---|---|---|
| **FR89** | **Review SLA timers and escalation.** Each report shall carry a target review time by severity; overdue reports escalate on the queue and to a supervisor. | The baseline defines a review workflow with no notion of timeliness. A report that sits unreviewed is indistinguishable from one that was never made. | Should | ⬜ |
| **FR90** | **Trend and anomaly detection.** The system shall detect statistically unusual increases by category or suburb and notify officers. | FR70 produces retrospective statistics only. Detecting a spike on day one is what turns reporting into prevention — and it is the substance of declared module 9 (§4.3). | Should | ⬜ |
| **FR91** | **Data retention schedule with automated purge.** Each data class shall carry a defined retention period, after which records are purged or irreversibly de-identified by scheduled job, with the purge itself audited. | R14/R15 require that personal information not be kept longer than needed. The baseline specifies deletion on request (FR12) but no lifecycle at all. This is ER-6. | Must | ⬜ |
| **FR92** | **Third-party dispute and correction process, and outbound referral.** A person whose contact detail appears in the system as an indicator shall be able to dispute it and have it corrected or expired; and where a report meets defined criteria the user shall be guided to Scamwatch/ACCC and IDCARE. | Indicators frequently belong to innocent people whose identity was spoofed (ER-13, RK-12) — the system must be correctable by the people it can harm. Separately, local reporting must not become a dead end that leaves national bodies unaware. | Should | ⬜ |

## 6.6 Summary and impact

| Measure | Value |
|---|---|
| Requirements proposed | **20** (satisfies the brief's 15–20 range) |
| Must | 8 |
| Should | 10 |
| Could | 1 |
| Already implemented | 6 — FR76, FR78, FR79, FR80, FR85, FR86 |
| Requiring the deferred AI service | 1 — FR81 |
| Net new build effort | 13 requirements |

**Schedule impact.** Thirteen requirements carry new build effort. Of these, FR77 is a prerequisite for baseline FR24 and is therefore not additive to scope so much as corrective of it. If approval arrives late, the recommended reduction order is: defer FR87, FR88, FR81; retain all Must-rated items. **FR84 and FR91 should not be deferred** — the first is the project's largest equity gain, the second is a legal obligation.

---

# 7. Use-case model

## 7.1 Actors

| Actor | Description | Inherits |
|---|---|---|
| **Visitor** | Any unauthenticated user of the public service | — |
| **Resident** | Authenticated individual | Visitor |
| **Organisation user** | Authenticated business, NFP or community-group representative | Resident |
| **Officer** | Trained Council reviewer | Resident |
| **Administrator** | Council system administrator | Officer |
| **Email service** | External transactional email provider | — (supporting) |
| **Object storage** | External private file store | — (supporting) |
| **Scheduler** | System timer driving digests, purges and anomaly detection | — (supporting) |

## 7.2 Use-case inventory

| ID | Use case | Primary actor | Requirements | Status |
|---|---|---|---|---|
| UC-01 | Check a suspicious message | Visitor | FR13–FR24 | ✅ |
| UC-02 | Register an account | Visitor | FR1–FR3 | ✅ |
| UC-03 | Sign in / sign out | Resident | FR4, FR5 | ✅ |
| UC-04 | Recover a password | Visitor | FR6 | ⬜ |
| UC-05 | Manage profile and preferences | Resident | FR7–FR9, FR11 | 🟡 |
| UC-06 | Request account deletion | Resident | FR12 | ⬜ |
| UC-07 | Submit a scam report with evidence | Resident | FR25–FR36 | ⬜ |
| UC-08 | Track and withdraw a report | Resident | FR29, FR30 | ⬜ |
| UC-09 | Review and verify a report | Officer | FR37–FR42 | ⬜ |
| UC-10 | Resolve duplicate and related reports | Officer | FR43–FR48 | ⬜ |
| UC-11 | Publish a community alert | Officer + Administrator | FR49–FR54 | ⬜ |
| UC-12 | Browse and search alerts | Visitor | FR53 | ⬜ |
| UC-13 | View the scam map and trends | Visitor | FR70, FR90 | ⬜ |
| UC-14 | Learn from awareness resources | Visitor | FR55–FR57, FR59 | ⬜ |
| UC-15 | Work through a recovery checklist | Resident | FR58, FR60 | ⬜ |
| UC-16 | Subscribe and unsubscribe to alerts | Visitor | FR64–FR66 | ⬜ |
| UC-17 | Administer users, roles and categories | Administrator | FR67–FR69 | ⬜ |
| UC-18 | Generate statistics and export de-identified data | Administrator | FR70, FR71 | ⬜ |
| UC-19 | Dispute an indicator | Visitor | FR92, ER-13 | ⬜ |

## 7.3 Use-case diagram

The diagram below is the use-case model as the team authored it during analysis. It is reproduced here rather than re-derived, so this specification carries the artefact the design was actually taken from. It shows two actors, the system boundary, the thirteen use cases the actors drive, and the four behaviours the system performs as an included step of another case.

```
       User                    CyberKent system boundary                Administrator
    (end-user)   ┌──────────────────────────────────────────────────┐  (council staff)
                 │                                                  │
        O ───────┤  ( Register account )                            │        O
       /|\       │                                                  │       /|\
       / \ ──────┤  ( Login to system )                             │       / \
        │        │      « standard authentication »                 │        │
        │        │                                                  │        │
        ├────────┤  ( Manage user profile )                         │        │
        │        │                                                  │        │
        ├────────┤  ( View community scam alerts )                  │        │
        │        │      « awareness info, trend data »              │        │
        │        │                                                  │        │
        ├────────┤ (( Submit scam report ))                         │        │
        │        │       ├──«include»──► ( Analyse scam content     │        │
        │        │       │                  — text / URL )          │        │
        │        │       └──«include»──► ( Upload evidence )        │        │
        │        │                                                  │        │
        ├────────┤  ( Track report status ) ────────────────────────├────────┤
        │        │      « via reference number »                    │        │
        │        │                                                  │        │
        └────────┤  ( Subscribe to notifications )                  │        │
                 │                                                  │        │
                 │  ( Manage user accounts ) ───────────────────────├────────┤
                 │       └──«include»──► ( View details /           │        │
                 │                         assign permissions )     │        │
                 │                                                  │        │
                 │  ( Review submitted scam reports ) ──────────────├────────┤
                 │       └──«include»──► ( Verify scam report )     │        │
                 │                                                  │        │
                 │  ( Manage community scam alerts ) ───────────────├────────┤
                 │                                                  │        │
                 │  ( Detect duplicate / related reports ) ─────────├────────┤
                 │                                                  │        │
                 │  ( Generate system reports ) ────────────────────├────────┤
                 │      « trend analysis, metrics »                 │        │
                 │                                                  │        │
                 │  ( View audit logs ) ────────────────────────────├────────┘
                 │                                                  │
                 └──────────────────────────────────────────────────┘
```

**Reading the diagram.** A single pair of parentheses is a use case; the double pair marks the case the authored diagram draws heaviest, because it is the one every other reporting behaviour hangs from. A guillemet note under a case is the diagram's own annotation. `«include»` marks behaviour the system always performs as part of the parent case, never on its own. *Track report status* connects to both actors: a reporter follows their own report, an officer follows any.

### 7.3.1 Included use cases

| Parent case | Included behaviour | Note on the diagram |
|---|---|---|
| Submit scam report | Analyse scam content — text / URL | System automatic |
| Submit scam report | Upload evidence | Optional but supported |
| Review submitted scam reports | Verify scam report | Changes report status |
| Manage user accounts | View details / assign permissions | — |

### 7.3.2 Reconciliation with the specified model

The diagram is the analysis-stage model; §7.1 and §7.2 are the specified model that refines it. They differ, and the differences are decisions rather than drift, so both are carried.

| Diagram case | Specified as | What changed, and why |
|---|---|---|
| Register account | UC-02 | — |
| Login to system | UC-03 | Sign-out separated, so FR5 has a case of its own |
| Manage user profile | UC-05, UC-06 | Deletion requests split out; FR12 is a reviewable obligation, not a profile edit |
| View community scam alerts | UC-12, UC-13, UC-14 | Split into alerts, map and awareness — three screens against three requirement ranges |
| Submit scam report | UC-07 | — |
| Track report status | UC-08 | Withdrawal folded in (FR30) |
| Subscribe to notifications | UC-16 | — |
| Manage user accounts | UC-17 | Category taxonomy folded in (FR69) |
| Review submitted scam reports | UC-09 | — |
| Manage community scam alerts | UC-11 | — |
| Detect duplicate / related reports | UC-10 | — |
| Generate system reports | UC-18 | De-identified export folded in (FR71) |
| View audit logs | UC-18 | Audit reading is an administrator view of the same reporting capability (FR72) |
| *Analyse scam content* — included | **UC-01 — promoted to a standalone case** | The single most consequential change between the two models. See below |
| — | UC-04 | Password recovery had no case; FR6 requires one |
| — | UC-15 | Recovery checklists had no case; FR58 and FR60 require one |
| — | UC-19 | Added with FR92, to give a wrongly named third party a route |

**Why analysis was promoted out of reporting.** On the authored diagram, analysing content is an included step inside *Submit scam report*: a person can only have a message checked by lodging a report about it. Carried into the build, that would have made an account and a report the price of asking a single question, and the people most exposed to scams are the least likely to pay it. FR85 therefore makes checking anonymous, and the case had to leave its parent for that to be possible. It is the one part of the service that is finished (§14.3), and it is finished precisely because nothing else has to exist first.

**Actors.** The diagram names two actors. §7.1 names five, plus three supporting. The additional three — Visitor, Organisation user, Officer — are refinements of the diagram's *User* and *Administrator* rather than new parties: the Visitor is the unauthenticated User that FR85 made necessary, the Organisation user is the User class the client brief names separately, and the Officer is the Administrator without administrative rights, split out so reviewing a report does not require the power to manage accounts (FR10).

## 7.4 UC-01 — Check a suspicious message

| Field | Detail |
|---|---|
| **Actor** | Visitor (no account required — FR85) |
| **Goal** | Determine whether a received message is likely to be a scam, and understand why |
| **Precondition** | The visitor has the message text available |
| **Trigger** | The visitor opens the scam checker |
| **Requirements** | FR13–FR24, FR78, FR79, FR80, FR85, FR86, ETH-1, ETH-2, ETH-3 |

**Main flow**

1. The visitor selects how the message reached them (FR14).
2. The visitor pastes the message text (FR13).
3. The visitor submits the check.
4. The system extracts URLs, email addresses and phone numbers (FR19, FR22, FR23).
5. The system applies the text rule set, suppressing rules that cannot apply to the selected channel (FR15, FR80).
6. The system applies host-shape rules to each extracted URL (FR20, FR21).
7. The system computes a risk score (FR16), classifies it into a band (FR17) and computes confidence independently (FR79).
8. The system displays the band, the score, the confidence, and every contributing indicator with its evidence fragment, strongest first (FR18, FR78).
9. The system displays the advisory disclaimer at the point of the verdict (ETH-1, ETH-2).
10. The system offers onward routes: report to Council, recovery checklist, contact your bank first if money has moved (ETH-5).

**Alternative flows**

- **A1 — Submission too short.** At step 7, if the text is below the minimum useful length the system returns the `UNCLEAR` band with no score and asks for the full message. It does **not** return a low score, because "not enough to assess" and "no indicators found" are different answers.
- **A2 — Empty submission.** At step 3, the system reports a field-level error and does not proceed.
- **A3 — Reduced motion or no WebGL.** The animated wait is replaced by a short static beat; the result is identical (FR86).
- **A4 — Artefact previously reported.** At step 7, if an extracted artefact matches the registry, the system surfaces the prior-report count without revealing who reported it (FR24, requires FR77).

**Postcondition** — the visitor has an explained assessment. No account was created, and by default no submitted text is retained against an identity.

**Non-functional constraints** — result returned within the page-load budget (NFR-1); accessible announcement of the result (NFR-13, FR86); no scoring input derived from a prohibited attribute (ETH-3).

## 7.5 UC-07 — Submit a scam report with evidence

| Field | Detail |
|---|---|
| **Actor** | Resident or Organisation user |
| **Goal** | Report a scam to Council with supporting evidence and obtain a trackable reference |
| **Precondition** | The user is authenticated and their email is verified — except on a deployment with no mail transport, where no address can be verified and the requirement would make reporting unreachable rather than merely gated |
| **Requirements** | FR25–FR36, FR61, ER-5, ER-10 |

**Main flow**

1. The user opens the report form; a `DRAFT` is created (FR26).
2. The user enters title, description, channel, category, suburb, and optionally amount lost and occurrence date (FR25).
3. The user attaches evidence files (FR31).
4. The system validates each file's type by content inspection and its size, server-side (FR32, FR33).
5. The system strips EXIF and embedded metadata on ingest (ER-5).
6. The system stores each binary in private object storage and records metadata plus a SHA-256 checksum (FR31).
7. The user adds a description to each file (FR34).
8. The user submits; the system validates every field server-side (FR27).
9. The system extracts and normalises artefacts named in the report and links them to the artefact registry (FR45–FR47).
10. The system generates a unique reference and moves the report to `SUBMITTED` (FR28).
11. The system notifies the reporter with the reference and what happens next (FR61).

**Alternative flows**

- **A1 — Disallowed file type.** At step 4, the file is rejected with a plain-English reason naming the accepted types. The rest of the report is preserved.
- **A2 — File too large.** At step 4, rejected with the limit stated.
- **A3 — Save and resume.** At any point the user saves; the draft persists and is visible only to its author (FR26).
- **A4 — Probable duplicate.** At step 10, if similarity thresholds are met the report is flagged for reviewer attention. It is **never** auto-merged and the reporter is not told their report is a duplicate (FR43).
- **A5 — Email delivery fails.** At step 11, the notification is queued for retry; the submission itself still succeeds (RK-14).

**Postcondition** — a `SUBMITTED` report exists with a reference, evidence is stored privately, and the reporter has been notified.

## 7.6 UC-09 — Review and verify a report

| Field | Detail |
|---|---|
| **Actor** | Officer |
| **Goal** | Determine whether a report is genuine, classify it, and decide its outcome |
| **Precondition** | The officer is authenticated with the `OFFICER` or `ADMIN` role, and has completed MFA (FR73) |
| **Requirements** | FR37–FR42, FR72, ER-10, ER-11, C17 |

**Main flow**

1. The officer opens the review queue, filtered and prioritised (FR37).
2. The officer assigns the report to themselves or another officer (FR38).
3. The officer reads the report; any evidence access is logged (FR36).
4. The system displays candidate duplicates and related reports with similarity values (FR43, FR48).
5. The officer classifies the report against the taxonomy (FR39) and sets severity (FR40).
6. The officer approves or rejects with a recorded reason (FR42).
7. The system writes a new decision record, preserving prior decisions (C17).
8. The system writes the action to the audit log (FR72) and notifies the reporter (FR62).

**Alternative flows**

- **A1 — More information needed.** At step 6 the officer requests information; the report moves to `INFORMATION_REQUESTED` and the reporter is notified (FR41, FR63). On response, the report returns to `UNDER_REVIEW`.
- **A2 — Confirmed duplicate.** At step 4 the officer links the reports as `DUPLICATE` (FR48). Both records are retained; neither is deleted.
- **A3 — Report warrants a public alert.** After approval, the officer drafts an alert (UC-11). The alert requires a second party's approval before publication (FR51).
- **A4 — Review SLA exceeded.** The report escalates on the queue and to a supervisor (FR89).

**Postcondition** — the report has a recorded decision, an audit entry, and a notified reporter.

## 7.7 UC-11 — Publish a community alert

| Field | Detail |
|---|---|
| **Actor** | Officer (author) and Administrator or second Officer (approver) |
| **Goal** | Warn the community about a circulating scam without exposing the reporter or implicating a third party |
| **Precondition** | At least one approved report exists |
| **Requirements** | FR49–FR54, ETH-4, ER-2, ER-13, C17 |

**Main flow**

1. The officer drafts an alert from one or more approved reports (FR49).
2. The system de-identifies the specimen text as a data transformation before it is stored on the alert (FR50, ER-2).
3. The system runs a pre-publication scan for reporter-identifying content and for any named individual or business (ER-2, ER-13).
4. The officer sets headline, summary, category, suburb, channel and severity.
5. A second party reviews and approves (FR51). The author cannot approve their own alert.
6. The system publishes the alert with a timestamp and reference (FR52).
7. Subscribers matching the category or suburb are notified (FR64, FR65), subject to digest preference (FR88).

**Alternative flows**

- **A1 — Scan detects identifying content.** At step 3 publication is blocked until the content is corrected. This is a hard gate, not a warning.
- **A2 — Draft names an individual.** Blocked (ER-13). Alerts describe patterns, not people.
- **A3 — Alert becomes obsolete.** The alert is archived; its URL continues to resolve (FR54).

**Postcondition** — a published alert exists that cannot be traced to the reporter and names no individual.


## 7.8 Case definitions — the remaining fifteen

Sections 7.4 to 7.7 give the four use cases in full narrative form: the one that is built, the one Council commissioned the service for, and the two that make an officer's work possible. The remaining fifteen are defined here to the same fields in short form, so that every case in the inventory at §7.2 carries a definition rather than only a title.

Each row states the actor, the precondition that must hold, the trigger, the main flow, the outcome that counts as success, and the requirements it satisfies.

### 7.8.1 Module 1 and 2 — account and access

| | UC-02 Register an account |
|---|---|
| Actor · Precondition | Visitor · the address is not already registered |
| Trigger · Main flow | Chooses to create an account → supplies email, password and name → system rejects a duplicate address and a password under 12 characters → creates the account → issues a verification token |
| Success | Account exists, unverified, and a verification link has been sent |
| Requirements | FR1, FR2, FR3 |

| | UC-03 Sign in and sign out |
|---|---|
| Actor · Precondition | Resident · account exists and is not soft-deleted |
| Trigger · Main flow | Submits credentials → system compares the bcrypt digest, running the comparison even when no user matches → issues an access token → records the sign-in time |
| Alternate | A1 wrong address and A2 wrong password are answered identically, so the form cannot be used to discover which addresses are registered (FR76) |
| Success | A signed token is held by the client; sign-out discards it |
| Requirements | FR4, FR5, FR76 |

| | UC-04 Recover a password |
|---|---|
| Actor · Precondition | Visitor · account exists |
| Trigger · Main flow | Requests recovery → system stores a hashed, single-use, time-limited token and emails the link → the visitor sets a new password → the token is consumed |
| Alternate | A1 an unregistered address produces the same confirmation as a registered one, so the form discloses nothing |
| Success | The password is replaced and the token cannot be reused |
| Requirements | FR6 · ⬜ not built; blocked on email delivery (G1) |

| | UC-05 Manage profile and preferences |
|---|---|
| Actor · Precondition | Resident · signed in |
| Trigger · Main flow | Opens the profile → views current details → edits name, organisation or phone → changes password by supplying the current one → sets notification preferences |
| Success | Changes are persisted and an audit entry is written |
| Requirements | FR7, FR8, FR9, FR11 |

| | UC-06 Request account deletion |
|---|---|
| Actor · Precondition | Resident · signed in |
| Trigger · Main flow | Requests deletion with an optional reason → system records an `AccountDeletionRequest` → personal fields are erased and `deletedAt` is set → audit entries have their actor severed, not cascaded |
| Success | The person is removed; the evidence that actions occurred remains |
| Requirements | FR12, ER-7, Compliance 29 |

### 7.8.2 Module 5 and 6 — reporting and evidence

| | UC-08 Track and withdraw a report |
|---|---|
| Actor · Precondition | Resident · owns the report |
| Trigger · Main flow | Opens the report by reference → sees its status and any information request → may withdraw it |
| Alternate | A1 a report belonging to another person is not returned at all, rather than refused, so the reference cannot be used to confirm a report exists |
| Success | Status is visible; a withdrawn report is marked `WITHDRAWN` and retained, never deleted |
| Requirements | FR29, FR30 |

### 7.8.3 Module 8 — duplicates

| | UC-10 Resolve duplicate and related reports |
|---|---|
| Actor · Precondition | Officer · at least two reports exist |
| Trigger · Main flow | Opens a report → system offers candidates matched by shared indicator, then ranked by text similarity → the officer links each as `DUPLICATE` or `RELATED`, or dismisses it |
| Constraint | **Never auto-merged.** A machine-suggested link is always presented to a person, and the stored relation records whether it was asserted or suggested |
| Success | Relations are recorded with their kind and similarity |
| Requirements | FR43–FR48 |

### 7.8.4 Module 9, 10 and 11 — community, recovery and notification

| | UC-12 Browse and search alerts |
|---|---|
| Actor · Precondition | Visitor · at least one alert is published |
| Trigger · Main flow | Opens alerts → filters by category, suburb or channel → reads an alert and its de-identified specimen |
| Success | Only `PUBLISHED` alerts are returned, and no reporter-identifying field is present in the response |
| Requirements | FR53 |

| | UC-13 View the scam map and trends |
|---|---|
| Actor · Precondition | Visitor · reports exist |
| Trigger · Main flow | Opens the map → sees counts by suburb over a period → drills into a category |
| Constraint | Aggregation stops at suburb, and a cell below the minimum count is suppressed rather than shown |
| Success | Patterns are visible; individuals are not |
| Requirements | FR70, FR90, ER-3 |

| | UC-14 Learn from awareness resources |
|---|---|
| Actor · Precondition | Visitor · none |
| Trigger · Main flow | Opens the library → filters by category → searches → reads a guide |
| Success | The guide is readable without an account and on a 320-pixel viewport |
| Requirements | FR55, FR56, FR57, FR59 · 🟡 four guides delivered; not yet database-backed |

| | UC-15 Work through a recovery checklist |
|---|---|
| Actor · Precondition | Resident · signed in to save progress; readable without an account |
| Trigger · Main flow | Opens the checklist for their situation → works through ordered steps → marks each complete → progress is saved |
| Ordering | Sequenced by what matters in the first hour: contact the bank, change passwords, contact IDCARE, report to police, place a credit ban |
| Success | Completed steps persist across sessions |
| Requirements | FR58, FR60 |

| | UC-16 Subscribe and unsubscribe to alerts |
|---|---|
| Actor · Precondition | Visitor · a valid email address |
| Trigger · Main flow | Chooses a category, a suburb or everything → confirms by email → receives matching alerts → unsubscribes from a one-click link |
| Constraint | The unsubscribe link works without a login and its token is stored only as a digest |
| Success | Subscription is confirmed, or ended, without an account ever being required |
| Requirements | FR64, FR65, FR66 |

### 7.8.5 Module 12 — administration and audit

| | UC-17 Administer users, roles and categories |
|---|---|
| Actor · Precondition | Administrator · signed in with the `ADMIN` role |
| Trigger · Main flow | Opens administration → lists accounts → changes a role → archives or adds a scam category |
| Constraint | Every action writes an audit entry naming the actor, and a category is archived rather than deleted so historical reports keep their classification |
| Success | The change takes effect and is attributable |
| Requirements | FR67, FR68, FR69, FR72 |

| | UC-18 Generate statistics and export de-identified data |
|---|---|
| Actor · Precondition | Administrator · reports exist |
| Trigger · Main flow | Selects a period and grouping → system produces counts by category, severity, status and suburb → exports the aggregate |
| Constraint | De-identification happens at the data layer, not at the point of display, and the export is subject to the same cell-count floor as the map |
| Success | Council has figures it can use for targeting and advocacy, from which no individual can be recovered |
| Requirements | FR70, FR71, ER-2, ER-3 |

| | UC-19 Dispute an indicator |
|---|---|
| Actor · Precondition | Visitor · their contact detail appears as an indicator |
| Trigger · Main flow | Submits a dispute against the indicator → an officer reviews it → the indicator is corrected, expired or confirmed → the outcome is recorded |
| Why it exists | Phone numbers and email addresses in scam reports frequently belong to innocent people whose identity was spoofed. Without a correction route, the service holds an accusation about someone who has no way to answer it |
| Success | A wrongly listed party has a route, and the outcome is auditable |
| Requirements | FR92, ER-13 · ⚠️ proposed, awaiting approval |

**Status of these fifteen.** UC-02 and UC-03 are implemented at the API layer with no interface attached. UC-14 is partly delivered as static content. The remaining twelve are specified with their database tables migrated and no runtime behaviour, which is the position §14.3 records module by module.

---

# 8. External interface requirements

## 8.1 User interfaces

| ID | Requirement | Traceability | Status |
|---|---|---|---|
| UI-1 | Responsive, mobile-first layout supporting viewports from 320 px upward | NFR-14, C7 | ✅ |
| UI-2 | Light and dark themes; the user's choice persisted and the system preference respected by default | NFR-16 | ✅ |
| UI-3 | A visible skip-to-content link as the first focusable element on every page | NFR-13 | ✅ |
| UI-4 | Keyboard operability for every interactive element, with a focus indicator meeting AA contrast | NFR-13 | ✅ |
| UI-5 | Form errors announced programmatically (`role="alert"`, `aria-invalid`, `aria-describedby`) and shown adjacent to the field concerned | NFR-15 | ✅ |
| UI-6 | Asynchronous results announced through a polite live region | FR86 | ✅ |
| UI-7 | All motion suppressed under `prefers-reduced-motion`; no information conveyed by motion alone | FR86 | ✅ |
| UI-8 | No information conveyed by colour alone — every risk band carries an icon and a text label as well as a colour | NFR-13 | ✅ |
| UI-9 | Brand, routing, contact details and page copy held in configuration and content modules, never hardcoded in components | R9 §3 | ✅ |
| UI-10 | A single shared component library; no duplicated component implementations | R8 Rule 3.2 | ✅ |
| UI-11 | The advisory disclaimer displayed at the point of every verdict, not only on a policy page | ETH-1, ETH-2 | ✅ |
| UI-12 | Language selector persisted across sessions | FR84 | ⬜ |

**Delivered screens.** Landing page (hero, capabilities, how-it-works, console showcase, community alerts, awareness, trust and ethics, subscribe), the scam checker, a 404 page, and ten routed placeholder pages that each name the module and requirement range they will serve.

### 8.1.1 User storyboard — UC-01

The storyboard below is the journey the service is designed around: a person who has just received something frightening, has no account, and wants one question answered. It is the visual companion to UC-01 (§7.4), and the six frames are the six screen states that case passes through.

```
  1. Landing              2. Choose the channel   3. Paste or drop
  +----------------------+   +----------------------+   +----------------------+
  | CyberKent      =     |   | Check a message    X |   | Check a message    X |
  |----------------------|   |----------------------|   |----------------------|
  |  Is this a scam?     |   | How did it reach you?|   | +------------------+ |
  |                      |   |                      |   | | LINKT: unpaid    | |
  |  +----------------+  |   | +-----+ +-----+ +---+|   | | toll of $4.20.   | |
  |  | Check a message|  |   | | SMS | |Email| |Cal||   | | Settle now:      | |
  |  +----------------+  |   | +-----+ +-----+ +---+|   | | linkt-au.pay-... | |
  |                      |   | +-----+ +-----+ +---+|   | +------------------+ |
  |  Report   Alerts     |   | | Web | |Socil| |Oth||   | [ drop a screenshot ]|
  |  Learn    Recover    |   | +-----+ +-----+ +---+|   |        +----------+  |
  |                      |   |                      |   |        | Check it |  |
  +----------------------+   +----------------------+   +----------------------+

  4. The check runs       5. The verdict          6. What to do next
  +----------------------+   +----------------------+   +----------------------+
  | Analysing...       X |   | Result             X |   | What to do next    X |
  |----------------------|   |----------------------|   |----------------------|
  |        .--''--.      |   |   (  91  )  HIGH     |   | +------------------+ |
  |      .'  ____  '.    |   |   Very likely a scam |   | | Report to Council| |
  |     /   /    \   \   |   |----------------------|   | +------------------+ |
  |    |   |      |   |  |   | ! Urgency  'within   |   | +------------------+ |
  |     \   \____/   /   |   |             24 hours'|   | | Recovery guide   | |
  |      '.  ____  .'    |   | ! Lookalike domain   |   | +------------------+ |
  |        '--..--'      |   | - Payment requested  |   | +------------------+ |
  |  Reading indicators  |   |----------------------|   | | Check another    | |
  |  [====------]        |   | Advisory guidance    |   | +------------------+ |
  +----------------------+   +----------------------+   +----------------------+
```

| Frame | Screen | What the person does | State |
|---|---|---|---|
| 1 | Landing | Arrives from a link a relative sent, and finds one obvious action | ✅ Built |
| 2 | Checker — channel | Chooses how the message reached them (FR14) | ✅ Built |
| 3 | Checker — input | Pastes the message, or drops a screenshot of it (FR13, FR81) | ✅ Built |
| 4 | Scanning | Watches a bounded wait while artefacts are extracted and rules applied | ✅ Built |
| 5 | Result | Reads the band, the score and every indicator that produced it (FR16–FR18) | ✅ Built |
| 6 | Next | Reports it to Council, or opens the recovery checklist | 🟡 Screen built; both onward routes are placeholders |

**What the storyboard commits the design to.** Four guarantees are visible in the frames rather than stated in a policy elsewhere, which is the point of drawing it:

- **No account.** Nothing in frames 1 to 5 asks who the person is (FR85).
- **Nothing retained against them.** The analysis runs on their own device; the message is not transmitted to Council or stored.
- **The wait is bounded and explained.** Frame 4 names what is being read rather than showing an unlabelled spinner, because a person who has just been frightened is the last person who should be left guessing.
- **The limit travels with the verdict.** Frame 5 carries the advisory notice inside the result panel, not on a page the reader would have to go and find (ETH-1, ETH-2, UI-11).

**Why frame 6 matters most and is built least.** The first five frames answer the question. The sixth is the one that turns an answer into help — reporting the scam so Council sees it, or opening the checklist if money has already moved. Its two destinations are Modules 5 and 10, both specified and neither built (§14.3). Until they are, the journey ends by telling a frightened person what has happened to them without giving them anywhere to take it, and that is the single largest gap between what this service is specified to be and what it currently does.

### 8.1.2 Input and output forms

Every screen that takes data from a person or returns a result to one is specified here as a form: what it takes, how each field is validated, what it gives back, and what a person sees when something is wrong. Validation shown as **server** is enforced by a Zod schema in the API and is authoritative; client validation is a convenience that never substitutes for it (R9 §4, R8 Rule 4.3).

#### F-01 · Check a message — *implemented*

| Field | Type | Required | Validation | Message when it fails |
|---|---|---|---|---|
| Channel | Single choice of six | Yes | One of `sms`, `email`, `phone`, `website`, `social`, `other` | "Choose how it reached you." |
| Message | Multi-line text | Conditional | At least 12 characters, unless a file is attached | "Paste the message, or attach a screenshot, photo or file to check." / "That is too short to check — paste the whole message, including any link." |
| Attachments | File, multiple | Conditional | Images are read by OCR; other kinds are checked by envelope only | Stated per file in the result, never silently ignored |

**Output.** Risk score 0–100 · risk band with an icon and a text label, never colour alone · confidence 0–1 reported separately · every indicator with its weight and the exact words that triggered it · extracted URLs, emails and phone numbers · one line per source saying whether it was read · the advisory notice · next actions.

**Errors are announced**, not just shown: `role="alert"` on each message, `aria-invalid` and `aria-describedby` on the field, and the result announced through a polite live region (UI-5, UI-6, FR86).

#### F-02 · Register — *API implemented, no screen*

| Field | Type | Required | Validation (server) | Message |
|---|---|---|---|---|
| Email | Email | Yes | Trimmed, lower-cased, valid address, not already registered | "Enter a valid email address." / "An account already exists for that email address." |
| Password | Password | Yes | 12–200 characters. **No composition rule** — length is what resists offline cracking; composition rules mostly produce `Password1!` (R19) | "Use at least 12 characters." |
| Full name | Text | Yes | 2–120 characters | "Enter your name." |
| Organisation | Text | No | Up to 160 characters | — |
| Phone | Text | No | Up to 40 characters | — |

**Unknown fields are rejected.** The schema is `.strict()`, so a request carrying an unrequested `role` is refused as an unrecognised key before any handler runs (demonstrated at §12.9.3).

**Output.** `201` with the public user — id, email, full name, role, verified flag. **The password hash is never returned.**

#### F-03 · Sign in — *API implemented, no screen*

| Field | Required | Validation | Message |
|---|---|---|---|
| Email | Yes | Valid address | "Enter a valid email address." |
| Password | Yes | Non-empty | "Enter your password." |

**Output.** `200` with the public user and an access token. On failure, `401` and one message for both wrong address and wrong password: *"That email address or password is not correct."*

#### F-04 · Report a scam — *specified*

| Field | Type | Required | Validation | Notes |
|---|---|---|---|---|
| Channel | Choice | Yes | `Channel` enum | FR14 |
| Category | Choice | Yes | An active `ScamCategory` | Archived categories are not offered |
| Title | Text | Yes | 5–160 characters | |
| Description | Long text | Yes | 20–5,000 characters | |
| Suburb | Choice | No | A `Suburb` row | Aggregation stops here (ER-3) |
| Date it happened | Date | No | Not in the future | |
| Amount lost | Currency | No | Whole cents, not negative | Stored as `Int` cents — never a float |
| Contact details seen | Repeatable text | No | Normalised to an `Indicator` | FR19, FR22, FR23 |
| Evidence | File, multiple | No | See F-05 | |

**Output.** A quotable reference such as `HCC-2408-114`, the status, and what happens next. Saving without submitting produces a `DRAFT` (FR26).

#### F-05 · Attach evidence — *specified*

| Rule | Value | Requirement |
|---|---|---|
| Accepted types | Images, PDF, plain text, common document formats | FR32 — validated **server-side by content, not by the name** |
| Rejected outright | Executables, macro-enabled documents, archives | R8 Rule 6.5 |
| Maximum size | Per-file and per-report cap | FR33 |
| Recorded per file | Original name, MIME type, size, SHA-256, storage key, optional description | FR34 |
| On ingest | **EXIF stripped before storage** | ER-5 — ⬜ not built, Critical (RK-04) |
| On every read | Access restricted by role and ownership, and logged | FR35, FR36 |

#### F-06 · Review a report — *specified, officer only*

| Field | Type | Required | Validation |
|---|---|---|---|
| Decision | Choice | Yes | `UNDER_REVIEW`, `INFORMATION_REQUESTED`, `APPROVED`, `REJECTED` |
| Severity | Choice | On approval | `HIGH`, `MEDIUM`, `LOW` |
| Category | Choice | On approval | Reviewer may reclassify |
| Notes | Long text | On rejection | A rejection without a recorded reason is not accepted |

**Output.** A new `ReportReview` row — never an edit of the previous one, so the history of a decision survives the next one. Reporter is notified (FR62).

#### F-07 · Publish an alert — *specified, officer and administrator*

| Field | Required | Validation |
|---|---|---|
| Headline | Yes | 5–120 characters |
| Summary | Yes | 20–2,000 characters |
| Specimen | No | The reported wording, **de-identified before it reaches this field** |
| Category · Suburb · Channel | Yes | Reference rows |
| Severity | Yes | `Severity` enum |

**Two-party rule.** An alert moves `DRAFT → PENDING_APPROVAL → PUBLISHED`, and the approver must not be the author. **No field may name an alleged scammer** (ETH-9).

#### F-08 · Subscribe to alerts — *specified*

| Field | Required | Validation |
|---|---|---|
| Email | Yes | Valid address; one subscription per address per scope target |
| Scope | Yes | `CATEGORY`, `SUBURB` or `ALL` |
| Category / Suburb | If scope requires | A reference row |

**Output.** A confirmation email. Unsubscribe is one click from a token that is stored only as a digest and needs no login (FR66).

#### Conventions common to every form

| Rule | Applies to |
|---|---|
| The server replaces the request body with the parsed result, so no handler sees raw input | All |
| Unknown fields are rejected, not ignored | All |
| Errors are returned per field in the `errors` array of the response envelope | All |
| Every error is announced to assistive technology and tied to its field | All |
| No field is marked required by colour alone | All |
| Labels are persistent, never placeholder-only | All |
| A destructive action states what will happen before it happens | F-04 withdraw, F-06 reject, F-07 publish |

## 8.2 Software interfaces — API

### 8.2.1 Conventions (normative)

- **Transport** — HTTPS only; JSON request and response bodies.
- **Base path** — `/api`.
- **Authentication** — `Authorization: Bearer <JWT>`. Tokens carry `id`, `email` and `role`, and expire (default 2 hours).
- **Response envelope** — identical for success and failure, so a client never branches on which endpoint it called to locate the payload or the error (C14):

```json
{
  "success": true,
  "message": "Signed in.",
  "data":    { },
  "errors":  [ { "field": "email", "message": "Already registered." } ]
}
```

- **Status codes** — 200 OK · 201 Created · 400 Bad Request · 401 Unauthenticated · 403 Unauthorised · 404 Not Found · 409 Conflict · 422 Validation failure · 429 Rate limited · 500 Internal error.
- **Error disclosure** — only errors explicitly raised as client-visible are returned. Everything else is logged server-side and answered generically; no stack trace, file path or database message ever reaches a response.
- **Validation** — the request body is *replaced* by the parsed result, so unknown keys are stripped and no downstream handler sees raw client input.

### 8.2.2 Implemented endpoints

| Method | Path | Auth | Rate limit | Purpose | Requirements |
|---|---|---|---|---|---|
| `GET` | `/` | — | 300/15 min | Service descriptor | — |
| `GET` | `/api/health` | — | 300/15 min | Liveness — deliberately does not touch the database | NFR-25 |
| `GET` | `/api/health/ready` | — | 300/15 min | Readiness, including database reachability and latency | NFR-25, NFR-26 |
| `POST` | `/api/auth/register` | — | **10/15 min** | Create an account | FR1–FR3 |
| `POST` | `/api/auth/login` | — | **10/15 min** | Authenticate | FR4, FR76 |
| `POST` | `/api/auth/verify-email` | — | **10/15 min** | Consume a verification token | FR2 |
| `POST` | `/api/auth/logout` | — | 300/15 min | Sign out | FR5 |
| `GET` | `/api/auth/me` | Bearer | 300/15 min | Current user profile | FR7 |

### 8.2.3 Planned endpoint groups

| Group | Requirements | Milestone |
|---|---|---|
| `/api/auth/*` — password reset, profile update, password change, deletion request | FR6, FR8, FR9, FR12, FR75 | M9 |
| `/api/check` | FR13–FR24, FR77, FR82 | M10 |
| `/api/reports`, `/api/reports/:id/evidence` | FR25–FR36 | M11 |
| `/api/review` | FR37–FR48, FR89 | M12 |
| `/api/alerts` | FR49–FR54 | M13 |
| `/api/resources`, `/api/recovery` | FR55–FR60 | M13 |
| `/api/notifications`, `/api/subscriptions` | FR61–FR66, FR88 | M13 |
| `/api/admin` | FR67–FR72, FR90, FR91 | M13 |

## 8.3 Hardware interfaces

No special hardware interface is required. Client input uses standard browser controls. Where screenshot upload is approved (FR81), the device camera or gallery is reached through the standard file input only; no persistent device permission is requested and no geolocation permission is ever requested.

## 8.4 Communications interfaces

| Interface | Requirement | Status |
|---|---|---|
| **HTTPS/TLS** | TLS 1.2+ for all client–server traffic; HTTP redirects to HTTPS; HSTS set | ✅ |
| **Database** | TLS required (`sslmode=require`) with channel binding | ✅ |
| **CORS** | Requests accepted only from an explicit origin allowlist supplied by configuration; requests with no `Origin` header are permitted, since CORS constrains browser callers only | ✅ |
| **Proxy trust** | Configured so the rate limiter buckets by real client address rather than throttling all callers as one | ✅ |
| **Body limit** | 256 KB JSON — a pasted email thread is legitimately long, but a body must not be usable to exhaust memory | ✅ |
| **Email** | Authenticated SMTP or transactional API with SPF, DKIM and DMARC aligned to the sending domain — a scam-safety service must not itself send mail that fails authentication | ⬜ |
| **Object storage** | Private-by-default bucket; access only through short-lived signed URLs issued after an authorisation check | ⬜ |
| **Edge security headers** | CSP with `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`; `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` denying camera, microphone, geolocation | ✅ |

---

# 9. Non-functional requirements

The client brief supplies 25 non-functional requirements (`CB-1`–`CB-25`). The project baseline carries 30 (`NFR-1`–`NFR-30`), comprising the client's 25 plus five team additions justified at §4.4. The full mapping is at §9.10. Two client requirements contain defects, corrected at §4.5.

## 9.1 Performance

| ID | Requirement | Acceptance criterion | Assessment |
|---|---|---|---|
| **NFR-1** | Pages shall load within 3 seconds under normal network conditions | LCP ≤ 3.0 s and TTI ≤ 5 s on a 4G profile | ⚠️ **At risk.** The current build gates first content behind a 3.4-second boot animation and ships WebGL libraries in the initial bundle. Remediation at G6. |
| **NFR-2** | The system shall support at least 1000 concurrent users | 1000 sustained concurrent sessions with p95 API latency ≤ 1 s and error rate < 1% | 🟡 Achievable. The SPA is CDN-served and the API is stateless and horizontally scalable; the Prisma client is cached per process specifically to prevent connection exhaustion. **Not yet load-tested** (RK-01, G9). |
| **NFR-3** | The database shall respond to queries in under 2 seconds for up to 100,000 records | p95 ≤ 2 s at 100k rows in the largest table | 🟡 Supported by design: 55 indexes on every foreign key and every column used for filtering or ordering. **Not yet measured.** Duplicate detection is the sensitive case (RK-07). |

## 9.2 Reliability

| ID | Requirement | Acceptance criterion | Assessment |
|---|---|---|---|
| **NFR-4** | 99% uptime excluding scheduled maintenance | Measured monthly against `/api/health/ready` | 🟡 Achievable; requires external uptime monitoring (G5) |
| **NFR-5** | Automatic daily backup of user data | A restorable backup no more than 24 hours old; restoration tested quarterly | 🟡 Provided by the managed platform; **restore drill not performed** |
| **NFR-6** | Restore from the latest backup within **4 hours**, losing no more than 24 hours of data | RTO ≤ 4 h, RPO ≤ 24 h, demonstrated by drill | 🟡 **Not yet demonstrated** (G9). *The 4-hour RTO is a team addition — §4.4.* |

## 9.3 Security

| ID | Requirement | Acceptance criterion | Assessment |
|---|---|---|---|
| **NFR-7** | HTTPS (SSL/TLS) for all transmission | No endpoint answers over plain HTTP; HSTS set | ✅ |
| **NFR-8** | Passwords and sensitive information encrypted, never plaintext | bcrypt cost ≥ 12; verification, reset and unsubscribe tokens stored as SHA-256 digests; no credential in any log | ✅ bcrypt cost 12. All three token classes stored hashed, so a leaked table yields nothing usable. Environment validation prints variable **names** only on failure, never values. |
| **NFR-9** | Prevent SQL injection, XSS and CSRF | Parameterised access only; output escaped; state-changing requests not authorised by ambient credentials | ✅ **SQLi** — all access through the ORM; no string-built SQL. **XSS** — React escapes by default; CSP set at the edge. **CSRF** — the API authorises by `Authorization` header, not cookies, so a cross-site form post carries no credential. |
| **NFR-10** | Sessions expire after inactivity | Access tokens expire (2 h default), enforced server-side | ✅ Expired and forged tokens answered identically, so a caller is not told which half of the problem they have solved. |
| **NFR-11** | Restrict access to sensitive data by role | Every protected endpoint declares its permitted roles; authorisation evaluated separately from authentication | ✅ Mechanism implemented; ⬜ applies to endpoints not yet built. *Team addition — §4.4.* |

### 9.3.1 Additional security controls implemented beyond the baseline

`helmet` security header set · `x-powered-by` disabled · strict CORS origin allowlist · 256 KB JSON body cap · global rate limiting at 300 requests/15 min with a tightened 10/15 min on credential endpoints · correct proxy-trust configuration · uniform authentication failure with constant-cost comparison (FR76) · query logging deliberately disabled in production so submitted content never reaches a platform log · environment contract validated once at startup so a missing secret is a named failure at boot rather than an undefined value inside a request months later.

### 9.3.2 Password policy (NIST SP 800-63B, R19)

Minimum **12 characters**, maximum 200, with **no composition mandate**. Length is the property that resists offline cracking; composition rules predominantly produce `Password1!`. This is a deliberate departure from older convention and follows current guidance.

## 9.4 Usability

| ID | Requirement | Acceptance criterion | Assessment |
|---|---|---|---|
| **NFR-12** | Intuitive interface requiring minimal training | A first-time user completes a message check without instruction | ✅ by design; to be confirmed by user testing (§15.4) |
| **NFR-13** | WCAG 2.1 Level AA compliance | Zero automated violations; manual keyboard and screen-reader pass; contrast verified in both themes | 🟡 Practices implemented (UI-3 to UI-8); **formal audit outstanding** (G4). *Team addition — §4.4.* |
| **NFR-14** | Mobile support (iOS and Android) through responsive design | Verified on iOS Safari ≥ 15.4 and Android Chrome at 320–430 px | ✅ Responsive implementation with device-tier detection to reduce visual load on weaker devices. *Team addition — §4.4.* |
| **NFR-15** | Clear validation error messages | Every rejected field returns a specific, plain-English, actionable message adjacent to the field | ✅ |
| **NFR-16** | Consistent layouts and colour themes | A single design token set governs colour, spacing, type and motion | ✅ |
| **NFR-17** | Support desktop and mobile browsers | Per the declared browserslist | ✅ |

## 9.5 Maintainability

| ID | Requirement | Assessment |
|---|---|---|
| **NFR-18** | ⚠️ **Defect corrected at §4.5 SD2.** As corrected: *the system shall follow a modular TypeScript code structure with strict layer separation (routes → controller → service → repository → data access), such that no layer may be bypassed and no business logic resides in a controller.* | ✅ Implemented as corrected. Verified by audit: controllers receive, delegate and respond only; all identity database access is confined to a single repository, which is what keeps the soft-delete condition in one place instead of scattered across call sites where one omission silently resurrects a deleted account. |
| **NFR-19** | All functions documented for future maintenance | ✅ The codebase documents **intent** rather than mechanics — every non-obvious decision carries the reason it was made, including decisions that were reconsidered and why the alternative was rejected. |
| **NFR-20** | Database schema normalised to 3NF | ✅ 25 tables. Anything with independent existence — a scam category, a suburb, an artefact — is its own table rather than a repeated string, so a rename happens in one row and statistics group without string matching. |

## 9.6 Scalability

| ID | Requirement | Assessment |
|---|---|---|
| **NFR-21** | Handle a 20% annual increase in users | 🟡 Achievable; headroom is a function of the platform tier. *Team addition — §4.4.* |
| **NFR-22** | Allow horizontal scaling of web and database servers | ✅ The API holds no server-side session state, so instances are interchangeable. The application factory is separated from the listener specifically so the same application can be mounted as a serverless function, run as a long-lived process, or driven directly by a test without a port being bound. *Team addition — §4.4.* |
| **NFR-23** | ⚠️ **Defect corrected at §4.5 SD4.** As corrected: support migration from single-server **PostgreSQL** to a clustered or replicated architecture without application code change. | ✅ All access through the ORM against standard PostgreSQL; no vendor-specific feature in application code. |
| **NFR-24** | Allow REST API integration for mobile app extension | ✅ The API is already the only integration surface, with a uniform envelope and token authentication. |

## 9.7 Availability

| ID | Requirement | Assessment |
|---|---|---|
| **NFR-25** | Available 24×7 with scheduled downtime notifications | ✅ Separate liveness and readiness endpoints implemented. Liveness deliberately does not touch the database — a health check that fails when a dependency is slow tells a load balancer to recycle a perfectly healthy process. |
| **NFR-26** | Automatic recovery from unexpected shutdown using error logs | 🟡 Platform process restart available; **structured logging and alerting not implemented** (G5). |

## 9.8 Data integrity

| ID | Requirement | Assessment |
|---|---|---|
| **NFR-27** | Consistency between linked tables via foreign-key constraints | ✅ 34 foreign keys, each with an explicit delete behaviour chosen per relationship: `Cascade` where the child cannot exist alone, `SetNull` where the record must survive the loss of its actor. |
| **NFR-28** | Validate all input before committing | ✅ Two independent layers: schema validation replaces the request body before any handler sees it, and database constraints enforce uniqueness and referential integrity regardless of application logic. |

## 9.9 Compliance and privacy

| ID | Requirement | Assessment |
|---|---|---|
| **NFR-29** | Comply with GDPR-like privacy standards, allowing permanent profile deletion | 🟡 Soft deletion with query-level exclusion implemented; the deletion-request record is modelled. The user-facing request flow and the retention lifecycle (FR91, ER-6) are **not built**. The reconciliation between erasure and audit retention is specified at ER-7. |
| **NFR-30** | ⚠️ **Defect corrected at §4.5 SD3.** As corrected: *personal information shall be collected and used only for the purposes of scam detection, scam reporting, report review, community alerting, victim support and the statutory community-safety functions of Hume City Council; and shall not be used for any secondary purpose, disclosed to third parties except as required by law, or used for profiling, marketing or automated decision-making about an individual.* | ⚠️ Adopted as corrected. **Council's privacy statement must reflect the corrected wording before launch** (OI-3). |

## 9.10 Client-to-project NFR mapping

| Client (R1) | Attribute | Project ID | Note |
|---|---|---|---|
| CB-1 | Performance | NFR-1 | Parameters proposed (§4.7) |
| CB-2 | Performance | NFR-2 | Direct |
| CB-3 | Performance | NFR-3 | Direct |
| CB-4 | Reliability | NFR-4 | Measurement window proposed |
| CB-5 | Reliability | NFR-5 | Direct |
| CB-6 | Reliability | NFR-6 | **Extended** with a 4-hour RTO |
| CB-7 | Security | NFR-7 | Direct |
| CB-8 | Security | NFR-8 | Algorithm and cost named |
| CB-9 | Security | NFR-9 | Direct |
| CB-10 | Security | NFR-10 | Period named |
| — | Security | **NFR-11** | **Team addition** — role-based restriction |
| CB-11 | Usability | NFR-12, NFR-14 | Split into intuitiveness and responsiveness |
| — | Usability | **NFR-13** | **Team addition** — WCAG 2.1 AA |
| CB-12 | Usability | NFR-15 | Direct |
| CB-13 | Usability | NFR-16 | Direct |
| CB-14 | Usability | NFR-17 | Direct |
| CB-15 | Maintainability | NFR-18 | **Defect SD2 corrected** |
| CB-16 | Maintainability | NFR-19 | Direct |
| CB-17 | Maintainability | NFR-20 | Direct |
| — | Scalability | **NFR-21** | **Team addition** — growth trajectory |
| — | Scalability | **NFR-22** | **Team addition** — horizontal scaling |
| CB-18 | Scalability | NFR-23 | **Defect SD4 corrected** |
| CB-19 | Scalability | NFR-24 | Direct |
| CB-20 | Availability | NFR-25 | Direct |
| CB-21 | Availability | NFR-26 | Mechanism proposed |
| CB-22 | Data integrity | NFR-27 | Direct |
| CB-23 | Data integrity | NFR-28 | Direct |
| CB-24 | Compliance | NFR-29 | Reconciliation specified at ER-7 |
| CB-25 | Compliance | NFR-30 | **Defect SD3 corrected** |

**Reconciliation: 25 client requirements → 30 project requirements.** CB-11 expands to two; five are new team additions. No client requirement has been dropped.


## 9.11 Implementation evidence — encryption and anonymisation

Sections 9.3 and 10.4 state the obligations. This section is the evidence: what is actually implemented, where in the source it lives, how it was verified, and what is asserted but not yet built. Anything not demonstrated is marked as such.

### 9.11.1 Encryption at rest

| Control | Requirement | Implementation | Evidence | Status |
|---|---|---|---|---|
| Password storage | NFR-8, R8 Rule 6.2 | bcrypt, cost factor 12, in `authService.register`. The plaintext is hashed before the row is constructed and never reaches `User.passwordHash` in clear form | `backend/src/modules/auth/auth.service.ts` — `BCRYPT_ROUNDS = 12`; `bcrypt.hash(input.password, BCRYPT_ROUNDS)` | ✅ Implemented |
| Password salting | NFR-8, R19 | **No salt column exists, deliberately.** A bcrypt digest embeds its own per-row salt in the string it returns, so a separate `Salt` column would either duplicate it or invite hand-rolled salting. The conceptual ERD had one; it was removed at build (§11.2.2) | `User.passwordHash` is a single `TEXT` column in the migrated schema (§11.9) | ✅ Implemented |
| Verification and reset tokens | FR2, FR6 | Stored as a SHA-256 digest, never in clear. A leaked token table yields nothing usable because the stored value cannot be presented as a token | `auth.service.ts` — `hashToken()`; columns `EmailVerificationToken.tokenHash`, `PasswordResetToken.tokenHash`, both `@unique` | ✅ Implemented |
| Unsubscribe tokens | FR66 | Same digest treatment, so a one-click unsubscribe link cannot be reconstructed from the database | `Subscription.unsubscribeTokenHash` (§11.9) | 🟡 Column migrated; no write path until Module 11 |
| Database at rest | NFR-8 | Provider-managed encryption at rest, Neon `ap-southeast-2` | Provider attestation — **not independently verified by the team** | 🟡 Asserted, unverified (AC-12) |
| Evidence files at rest | FR31–FR36 | Private encrypted object storage, referenced by `Evidence.storageKey` with a `sha256` integrity digest | Schema migrated; storage not provisioned | ⬜ Not implemented — Module 6 |

### 9.11.2 Encryption in transit

| Control | Implementation | Evidence | Status |
|---|---|---|---|
| Browser to edge | TLS with HSTS `max-age=31536000; includeSubDomains` | Verified directly against the running API; header present in the response set | ✅ Verified |
| Edge and browser policy | CSP restricting script, style, font, image and connect sources; `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` | `frontend/vercel.json`; and helmet's defaults on the API, confirmed in the live response | ✅ Verified |
| API to database | TLS required on the connection string — `sslmode=require&channel_binding=require` | `backend/.env.example`; enforced by the provider | ✅ Implemented |
| Secret handling | No credential in source. The environment contract is parsed once at startup and **failure prints variable names only, never values**, so a malformed secret cannot be echoed into a deployment log | `backend/src/config/env.ts`; `JWT_SECRET` is rejected below 32 characters | ✅ Implemented |

### 9.11.3 Anonymisation and de-identification

| Control | Requirement | Implementation | Status |
|---|---|---|---|
| Anonymous checking | FR85, ETH-6 | No account is required to check a message, and no identifier is collected. `ScamCheck.userId` is nullable with `ON DELETE SET NULL` | ✅ Implemented — and stronger than specified: the delivered analyser runs in the browser, so the message is not transmitted or stored at all |
| Reporter severed from alert | FR50, ETH-4 | `Alert.sourceReportId` is nullable with `ON DELETE SET NULL`, so a published alert can outlive the report it came from without dragging the link behind it | 🟡 Schema enforces severability; the de-identification step that populates `Alert.specimen` is Module 9 |
| Audit actor severed on erasure | FR12, FR72, ER-7 | `AuditLog.userId` and `EvidenceAccessLog.userId` are nullable with `ON DELETE SET NULL`. Erasing an account removes the person, not the evidence that an action occurred | ✅ Implemented in the schema |
| Soft deletion | FR12, FR30 | `deletedAt` on `User`, `Report` and `Evidence`; the repository excludes soft-deleted rows in one place rather than at every call site | ✅ Implemented for `User` |
| Aggregation floor | ER-3, FR70, FR71 | Location aggregates to suburb and no finer, so a report cannot be traced to a street or household | 🟡 Schema supports it (`Suburb` is the only location entity); no export path yet |
| EXIF stripping on evidence | ER-5, RK-04 | Photographs carry GPS coordinates and device identifiers. Uploaded evidence must be stripped before storage | ⬜ **Not implemented.** Critical risk RK-04 is open; this is gap G11 |
| Minimum cell count on export | ER-3 | A de-identified export with small cells is re-identifiable | ⬜ **Not implemented** |

### 9.11.4 Uniform failure handling, as an anonymisation control

Two behaviours prevent the system disclosing whether a person exists, which is itself personal information:

- **Sign-in (FR76).** A wrong address and a wrong password produce the same message, and the bcrypt comparison runs even when no user was found, against a fixed invalid digest. Differing messages would turn the form into an account-existence oracle; skipping the comparison on a miss would leak the same fact through response timing.
- **Session failure.** An expired token and a forged token return the same message, so a response cannot tell an attacker which half of the problem they have already solved.

Both were exercised against the running API and behave as described.

### 9.11.5 What this section does not claim

Four controls in this area are **not implemented**, and none should be reported as satisfied: EXIF stripping on evidence ingest, minimum cell counts on de-identified export, verification of the evidence digest on read (§12.9.4, DFI-2), and independent confirmation of provider encryption at rest and Australian data residency. The first two are Critical entries in the database ethics register (§10.4) whose correction window closes at first production use. They are release acceptance criteria AC-9, AC-11 and AC-12, and the system must not carry real personal data until they pass.

---

# 10. Ethical requirements

The client brief specifies ethical requirements constraining how results may be presented. This project treats them as **hard requirements, not advisory text**, and expresses each in an enforceable, testable form. They are the mechanism by which the interests of stakeholders who cannot advocate for themselves — residents, victims, and wrongly implicated third parties — are protected in the design (§2.6).

## 10.1 Ethical requirements register

| ID | Requirement | Enforcement mechanism | Status |
|---|---|---|---|
| **ETH-1** | The system shall avoid creating fear and shall not present results as professional cybersecurity certification | Result copy is calibrated to the band and describes what to do next; it does not use alarm language. Tone, colour and presentation are governed by the design system, not by individual judgement. The advisory disclaimer appears **at the point of the verdict** — the moment a reader decides how much authority to give the result — not only on a policy page. | ✅ |
| **ETH-2** | The system shall state clearly that results rest on supplied information, are general guidance, cannot guarantee protection, and that serious incidents may require a qualified professional or the relevant authority | Stated verbatim beside every result alongside the reported confidence value. A LOW result explicitly states that a carefully written scam will not trip these checks. | ✅ |
| **ETH-3** | Risk scoring shall be transparent and explainable, and shall not discriminate on grounds of organisation size, industry or available resources | The rule set is held as **data, not branches** — readable end to end by a non-developer and auditable by Council. Every score decomposes into named indicators with the evidence that triggered them. Prohibited-input constraint at §5.3.3. | ✅ Verified by audit (§10.3) |
| **ETH-4** | Reporter identity shall be anonymised in every public output and de-identified export | Anonymisation performed as a data transformation at the data layer, not as a presentation-layer omission; k-anonymity k ≥ 5 with small-cell suppression on exports; pre-publication scan gates alert publication. | ⬜ ⚠️ See ER-2, ER-3 |
| **ETH-5** | Future AI output shall be advisory, explainable and human-reviewed before informing an administrative decision | AI is architecturally isolated behind a gateway (C3); alert publication requires two-party human approval (FR51); duplicate detection surfaces candidates and never auto-merges (FR43). | ✅ By design; AI deferred |
| **ETH-6** | Data collection shall be limited to what the service requires, following privacy by design | Field-level justification register (EO-1); no account required to check (FR85); anonymous checks retained without a user reference; subscriptions permitted without an account. | 🟡 Schema is lean; register not written |

## 10.2 Team-added ethical requirements

| ID | Requirement | Rationale |
|---|---|---|
| **ETH-7** | No automated output shall be published as fact without human verification | Codifies C17. An alert is Council speaking publicly; a machine may not do that unreviewed. |
| **ETH-8** | A person shall be able to disagree with the machine | Every indicator exposes the exact fragment that triggered it, so a user can see the reasoning and reject it. FR82 adds a formal feedback channel. |
| **ETH-9** | The system shall never publicly identify an alleged scammer | Contact indicators are frequently spoofed and often belong to innocent victims. Structural mitigation, not editorial discretion. See ER-13, RK-12. |

## 10.3 Non-discrimination audit (ETH-3)

The scoring engine was audited against the prohibited-input constraint. **Result: conforms.**

| Check | Finding |
|---|---|
| Does any scoring input reference organisation size, industry, revenue or resources? | **No.** The analyser receives only message text and a channel selection. |
| Does any scoring input reference a person's nationality, ethnicity, religion, language, age, gender, disability or socio-economic status? | **No.** |
| Does any scoring input reference locality, suburb or postcode? | **No.** The suburb field exists on `Report` for aggregation, and is not reachable from the analyser. |
| Are the rules inspectable by a non-developer? | **Yes.** All rules are declarative data with plain-English labels and explanations. Published in full at Appendix D. |
| Is every score decomposable into its contributing factors? | **Yes.** Each factor is persisted individually with its rule identifier, weight and evidence fragment. |
| Could any keyword act as a proxy for a protected attribute? | **Requires ongoing review.** The current list targets scam mechanics — urgency, threat, credential requests, payment method, impersonated brand. No term references a protected attribute. **ER-9 requires this review before each release; the review process has no named owner (OI-7).** |

## 10.4 Ethical risks in database design and mitigation actions

Fifteen ethical risks were identified in the data model, six rated Critical. Each is a design decision that must be made correctly **before the first migration**, because each becomes materially harder — and for ER-2, ER-3 and ER-7 close to impossible — to correct once real personal data exists.

**This register has been audited against the schema as migrated on 7 August 2026.** As recorded at §4.6, that migration preceded the privacy officer review gate. The audit below is the agenda for that review.

### 10.4.1 Data classification

| Class | Definition | Examples | Storage rule | Access rule |
|---|---|---|---|---|
| **C1 — Public** | Intended for publication | Published alerts, awareness resources, scam categories, regions | Standard columns | No authentication required |
| **C2 — Internal** | Operational, non-personal | Report status, severity, category assignment, review queue state | Standard columns | Authenticated staff |
| **C3 — Confidential** | Personal information | Name, email address, notification preferences, report descriptions | Encrypted at rest; RBAC-restricted | Owner and authorised staff only |
| **C4 — Sensitive** | Personal information whose disclosure would cause serious harm | Financial loss amounts, evidence files and metadata, victim narratives, audit log contents, third-party contact indicators | Encrypted at rest; RBAC plus purpose-bound access; every access logged | Owner and assigned staff only, on a need-to-know basis |

### 10.4.2 Ethical risk register — audited

| ID | Ethical risk | Severity | Required mitigation | Schema position |
|---|---|---|---|---|
| **ER-1** | Over-collection of personal data | High | Field-level justification register; prohibited attribute list | 🟡 Schema is lean and no prohibited attribute is present; **register not written** |
| **ER-2** | Re-identification from published alerts | **Critical** | Anonymisation as data transformation; **no foreign key from alert to report**; pre-publication scan | ⚠️ **Deviation.** The schema retains `Alert.sourceReportId` as a nullable, severable FK. The design rationale is that severability preserves auditability while allowing the link to be cut. **This conflicts with the register as written and must be resolved at M8** — either the register is amended to accept a severable FK with a mandatory severance step at publication, or the FK is removed. |
| **ER-3** | Re-identification from de-identified export | **Critical** | k-anonymity (k ≥ 5); small-cell and complementary suppression; view-level enforcement | ⬜ Not implemented — no export views exist yet. Must be built into FR71 from the outset, not added afterwards. |
| **ER-4** | Linkage attacks across tables | High | UUID keys; identity/incident separation; pseudonymous reporter token; role-scoped joins | ⚠️ **Partial deviation.** Keys are `cuid()` (collision-resistant and non-sequential, satisfying the intent) but identity and incident data are **not separated**, and there is **no pseudonymous reporter token**. `Report.authorId` is a direct FK to `User`. Requires an M8 decision. |
| **ER-5** | Hidden personal data in evidence files | **Critical** | EXIF stripping on ingest; metadata allowlist; C4 classification; upload guidance | ⬜ Not implemented. An ingest-time control; no schema evidence of it and no field recording that stripping occurred. **Add a `metadataStrippedAt` column so the control is evidenced, not assumed.** |
| **ER-6** | Indefinite retention | High | Per-table retention schedule; `retentionUntil`; automated purge; de-identify in preference to delete | ⚠️ **Absent.** No retention column exists on any table. This is the schema-level half of FR91. |
| **ER-7** | Erasure versus immutable audit conflict | **Critical** | Crypto-shredding with UUID tombstone; de-identify reports; delete evidence; plain-language notice | ⚠️ **Different approach implemented.** The schema uses soft deletion (`deletedAt`) plus `onDelete: SetNull` severance on audit references, so erasing an account cannot erase the evidence that an administrative act occurred. This is defensible and arguably simpler, but it is **not** crypto-shredding and it does not by itself remove the personal data from the user row. **M8 must decide: adopt the severance model formally and amend the register, or implement crypto-shredding.** As it stands, NFR-29's promise of *permanent* deletion is not met. |
| **ER-8** | Discriminatory scoring inputs | **Critical** | Prohibited-input list; separate factor table; score content not people; bias review | ✅ **Satisfied.** `ScamCheckIndicator` is the separate factor table, persisting rule identifier, weight and evidence per factor. No prohibited attribute is reachable from the analyser (§10.3). |
| **ER-9** | Bias in the keyword set | High | Keyword list reviewed for proxies before each release; keyword-set version stored with every score | ⚠️ **Partial.** `ruleId` is persisted per factor, but **no rule-set version is stored** — so a past score cannot be reproduced once rules change. This is FR83. Review process has no named owner (OI-7). |
| **ER-10** | Unlogged access to sensitive records | High | Append-only access logging with no update or delete path | ✅ `EvidenceAccessLog` modelled append-only with actor severance. |
| **ER-11** | Personal data in the audit log | High | Metadata-only logging; hashes not values; prohibited-content list | ✅ By rule and by column comment (`metadata Json?` — "must never contain credentials or tokens"). Enforced by convention rather than by constraint; acceptable given the log is written from one service. |
| **ER-12** | Backups and non-production copies | High | No production data outside production; synthetic seed data; encrypted backups; 35-day window | ⚠️ **The seed script is referenced but does not exist** (G7), so there is currently no synthetic dataset and a developer needing data has no sanctioned source. This is how production data ends up in development environments. |
| **ER-13** | Innocent third parties as indicators | **Critical** | No public indicator listing; verification status and confidence; dispute process; expiry; no naming | ⚠️ **Absent from the schema.** `Indicator` carries `type`, `value`, `reportCount`, `firstSeenAt`, `lastSeenAt` — but **no verification status, no confidence, and no expiry**. A phone number reported fifty times by mistake is indistinguishable from one verified by an officer. Add `verificationStatus`, `confidence` and `expiresAt`; implement the dispute process as FR92. |
| **ER-14** | Data about children and vulnerable people | High | Minimum age 16; no vulnerability attributes; no child-specific collection | ⚠️ **Partial.** No vulnerability attribute is collected ✅, but there is **no age field or age attestation**, so the minimum-age control cannot be enforced. Council's youth outreach serves ages 10–24, so this needs an explicit decision at M8 rather than a default. |
| **ER-15** | Cross-border data location | High | Australian region pinned; data location register; verified before first production record | ✅ Database provisioned in `ap-southeast-2`. Register not written; verification required across **all** providers before production (feasibility condition 4). |

### 10.4.3 Audit summary

| Position | Count | Risks |
|---|---|---|
| ✅ Satisfied in the schema | 4 | ER-8, ER-10, ER-11, ER-15 |
| 🟡 Partially satisfied | 1 | ER-1 |
| ⚠️ Deviation or absent | 10 | ER-2, ER-3, ER-4, ER-5, ER-6, ER-7, ER-9, ER-12, ER-13, ER-14 |

**Four of the six Critical risks are not yet satisfied in the schema: ER-2, ER-5, ER-7 and ER-13.** ER-3 is not yet applicable because no export exists.

### 10.4.4 Recommended corrective migration

To be designed at M8, reviewed by the Council privacy officer, and applied **before Module 5 implementation begins** — Modules 5–6 are the first to store C3 and C4 data.

| Change | Addresses |
|---|---|
| Add `retentionUntil` to `User`, `ScamCheck`, `Report`, `Evidence`, `AuditLog`, `Notification` | ER-6, FR91 |
| Add `verificationStatus`, `confidence` and `expiresAt` to `Indicator` | ER-13, FR92 |
| Add `metadataStrippedAt` to `Evidence` | ER-5 |
| Add `ruleSetVersion` to `ScamCheck` | ER-9, FR83 |
| Decide and implement: sever-on-publish enforcement for `Alert.sourceReportId`, or remove the FK | ER-2 |
| Decide and implement: pseudonymous reporter token, or formally accept the direct FK with role-scoped joins | ER-4 |
| Decide and implement: crypto-shredding, or formally adopt the severance model and amend NFR-29's wording | ER-7 |
| Add an age attestation field or a documented decision not to collect one | ER-14 |
| Write the seed script with synthetic data only | ER-12, G7 |

## 10.5 Legal and regulatory obligations

| Instrument | Relevance | Compliance approach |
|---|---|---|
| Privacy Act 1988 (Cth) and the APPs | Governs collection, use, disclosure, quality, security, access and correction of personal information | Data minimisation (ETH-6); corrected purpose limitation (NFR-30); access and correction through FR7, FR8 and the ER-13 dispute process; security controls at §9.3 |
| Notifiable Data Breaches scheme | A breach of this data would very likely meet the "serious harm" threshold, triggering mandatory notification to the OAIC and to affected individuals | Incident response procedure documented in the handover pack; audit logging (FR72) provides the forensic record; encryption and access control reduce likelihood |
| Privacy and Data Protection Act 2014 (Vic) and the IPPs | Applies to Victorian public sector organisations including local councils | The APP controls above satisfy the IPPs; privacy officer sign-off at M8 confirms alignment |
| Victorian Protective Data Security Standards | Sets security standards for Victorian public-sector information | Layered security architecture; RBAC; audit logging; encryption in transit and at rest; MFA for privileged roles (FR73) |
| Disability Discrimination Act 1992 (Cth) | A public-facing government service must be accessible | WCAG 2.1 Level AA on every page (NFR-13); independent audit at M14 |
| Defamation law | Publishing that a named person or business is a scammer carries real exposure — contact indicators are frequently spoofed and often belong to innocent victims | **Structural mitigation:** the system never publishes the identity of an alleged scammer (ETH-9); indicators are never publicly listed; alerts describe patterns, not people |


## 10.6 Data protection impact assessment

A DPIA is required because the service processes personal information about people who have been targeted by crime, collects evidence files that may contain third-party personal information, and produces automated assessments that influence what a person does next. It is written against the Privacy Act 1988 (Cth) and the Australian Privacy Principles, the Privacy and Data Protection Act 2014 (Vic) and the Information Privacy Principles, and the Victorian Protective Data Security Standards.

**Status: draft. Not yet reviewed by the Council privacy officer.** The review is milestone M8 and is overdue (RK-09).

### 10.6.1 Description of processing

| Question | Answer |
|---|---|
| What is processed | Account details; submitted suspicious content; scam reports; evidence files; indicators such as URLs, phone numbers and email addresses; suburb; amount lost; access and audit logs |
| Whose data | Residents, small businesses, community organisations and not-for-profits in the City of Hume; Council officers; and **third parties named in reports, who are not users of the service and have not consented** |
| Why | To assess whether a message is a scam, to accept and verify reports, to warn the community, and to give Council de-identified local intelligence |
| Legal basis | Council's community-safety function. Collection is limited to what that function requires (APP 3) |
| Retention | Proposed at §11.8; requires Council records-management confirmation (OI-6) |
| Data location | `ap-southeast-2` for the database. Other providers unverified (RK-16) |
| Automated decision-making | Yes — a risk score and band. Advisory only, never determinative, always explained with the evidence that produced it, and never a decision about a person |

### 10.6.2 Necessity and proportionality

| Test | Assessment |
|---|---|
| Is the processing necessary for the purpose | Yes for reporting, review and alerting. **No for checking** — which is why FR85 makes checking anonymous and the analyser runs on the device |
| Is there a less intrusive way | For checking, no: the current design is already the least intrusive possible, since the content never leaves the browser. For reporting, no: a report that cannot be followed up has no value to Council |
| Is collection minimised (APP 3) | Partly. `Profile.AvatarURL` and `User.DateOfBirth` were dropped at build as data with no use (§11.2.2). `phone` and `organisation` remain optional. **`ScamCheck.content` stores the full submitted message once FR77 ships, and that has not been justified against a retention purpose** |
| Is the person told (APP 5) | Partly. The advisory notice appears at the point of every verdict. A privacy statement exists as a placeholder route only |

### 10.6.3 Risks to individuals

| ID | Risk | Likelihood | Severity | Inherent | Mitigation | Residual |
|---|---|---|---|---|---|---|
| P1 | A reporter is re-identified from a published alert or a de-identified export | Possible | Major | **High** | Severable `sourceReportId`; suburb-level aggregation; minimum cell count (**not built**) | **High** — ER-2, ER-3 open |
| P2 | Evidence files leak personal information beyond the report — GPS in a photograph, a third party in a screenshot | Likely | Major | **Critical** | EXIF stripping at ingest (**not built**); access restricted and logged (**not built**) | **Critical** — RK-04 open |
| P3 | An innocent third party is named as a scammer because their number or address was spoofed | Likely | Major | **Critical** | ETH-9 — the service never publicly names an alleged scammer; alerts describe patterns, not people. Dispute route proposed as FR92 (**not approved**) | **High** — structural control in place, correction route absent |
| P4 | Erasure request cannot be honoured without destroying the audit trail | Possible | Moderate | High | Soft deletion plus severing foreign keys; audit actor set to null rather than cascaded | **Low** — implemented in the schema |
| P5 | Submitted scam content is retained longer than needed, or at all | Possible | Moderate | High | Today the content is never transmitted. FR77 changes this | **Low now, High after FR77** — decision required (DFI-4) |
| P6 | Automated score misleads someone into a harmful action | Possible | Major | High | Advisory notice at the verdict; scoring cannot reach certainty; every indicator shown with its evidence; a LOW result explicitly states a careful scam will not trip these checks | **Low** — verified, §15.2.2 |
| P7 | Discriminatory scoring against a group | Unlikely | Major | High | Non-discrimination audit passed; no scoring input references or proxies for a protected attribute; full rule set published | **Low** — audited, §10.3 |
| P8 | Credential or token disclosure from logs | Unlikely | Major | High | Query logging disabled in production; environment failures print names only; audit metadata prohibited from carrying secrets | **Low** — implemented |
| P9 | Data processed outside Australia by an unverified provider | Possible | Moderate | High | Database region confirmed; other providers not verified | **Medium** — AC-12 outstanding |

### 10.6.4 Outcome

**Four residual risks remain above tolerance: P1, P2, P3 and P9.** Every one of them is a control that is designed and specified but not implemented, and P2 concerns a category of data — evidence files — that the system cannot accept until it is fixed.

| Determination | |
|---|---|
| May the service operate in its current form | **Yes.** What is live is anonymous, on-device scam checking that transmits and stores nothing, plus an authentication API with no interface attached |
| May it accept scam reports | **No, not yet.** P1 and P2 must be reduced first: EXIF stripping at ingest, evidence access restriction and logging, and the minimum cell count on export |
| May it publish alerts | **No, not yet.** P1 and P3 must be reduced first, and the dispute route (FR92) should be approved before contact details appear as indicators |
| Required before real personal data is processed | Privacy officer sign-off (M8); the corrective migration at §10.4.4; acceptance criteria AC-9, AC-10, AC-11 and AC-12 passed |

**Review trigger.** This assessment is re-performed whenever a schema change adds a column holding personal data, before FR77 introduces server-side storage of submitted content, and before the first production deployment. It is not a document that is written once.

---

# 11. Data requirements and database design

## 11.1 Overview

| Property | Value |
|---|---|
| Engine | PostgreSQL (Neon serverless, `ap-southeast-2`) |
| Access | Prisma ORM 7 with the `pg` adapter |
| Tables | 25 |
| Enumerated types | 11 |
| Foreign keys | 34 |
| Indexes | 55 |
| Normal form | 3NF (NFR-20) |
| Migration | `20260807105640_init_cybersafe_schema` — applied |
| Schema change policy | Migrations only; no manual production edits (C5) |
| Governance status | ⚠️ **Draft under review** — privacy officer sign-off outstanding (§4.6) |

## 11.2 Entity groups

| Group | Entities | Modules |
|---|---|---|
| Identity | `User`, `EmailVerificationToken`, `PasswordResetToken`, `NotificationPreference`, `AccountDeletionRequest` | 1–2 |
| Reference data | `ScamCategory`, `Suburb` | 12 |
| Analysis | `ScamCheck`, `ScamCheckIndicator`, `Indicator` | 3–4 |
| Reports and evidence | `Report`, `ReportIndicator`, `ReportRelation`, `Evidence`, `EvidenceAccessLog` | 5–6, 8 |
| Review | `ReportReview`, `InformationRequest` | 7 |
| Alerts | `Alert` | 9 |
| Awareness and recovery | `AwarenessResource`, `RecoveryChecklist`, `RecoveryStep`, `RecoveryProgress` | 10 |
| Notification | `Notification`, `Subscription` | 11 |
| Audit | `AuditLog` | 12 |

### 11.2.1 Entity-relationship diagram

The diagram below is the conceptual data model as the team authored it during analysis, in four clusters. It is the model the implemented schema was designed from; §11.2 above is what was built. They are not identical, and §11.2.2 accounts for every difference.

```
CLUSTER 1 — User management

┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│ User                            │   │ UserAccount                     │
├─────────────────────────────────┤   ├─────────────────────────────────┤
│ PK UserID                   int │   │ PK AccountID                int │
│    FirstName            varchar │   │ FK UserID                 FK, U │
│    LastName             varchar │   │ FK ProfileID              FK, U │
│    Email             varchar, U │   │ FK RoleID                    FK │
│    DateOfBirth             date │   └─┬───────────────────────────────┘
└─┬───────────────────────────────┘
  └───────────── 1 ──── 1 ──────────────┘
                                        │ 1
  ┌─────────────────────────────────────┼─────────────────────────────────────┐
  │ 1                                   │ 1                                   │ *
┌─▼───────────────────────────────┐   ┌─▼───────────────────────────────┐   ┌─▼───────────────────────────────┐
│ Credentials                     │   │ Profile                         │   │ AccessRole                      │
├─────────────────────────────────┤   ├─────────────────────────────────┤   ├─────────────────────────────────┤
│ PK CredentialID             int │   │ PK ProfileID                int │   │ PK RoleID                   int │
│ FK AccountID              FK, U │   │    Username          varchar, U │   │    RoleName      'User','Admin' │
│    PasswordHash         varchar │   │    AvatarURL            varchar │   └─┬───────────────────────────────┘
│    Salt                 varchar │   └─────────────────────────────────┘
└─────────────────────────────────┘
                                                                              │ 1
                                                                              │
                                                                              │ *
                                                                            ┌─▼───────────────────────────────┐
                                                                            │ Permissions                     │
                                                                            ├─────────────────────────────────┤
                                                                            │ PK PermissionID             int │
                                                                            │    PermissionName       varchar │
                                                                            └─────────────────────────────────┘

CLUSTER 2 — Scam reporting & analysis

┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│ ScamReport                      │   │ AdminVerification               │
├─────────────────────────────────┤   ├─────────────────────────────────┤
│ PK ReportID                 int │   │ PK VerificationID           int │
│ FK AccountID                int │   │ FK ReportID               FK, U │
│    SubmissionDate      datetime │   │ FK AdminAccountID            FK │
│    ScamType             varchar │   │    VerifiedDate        datetime │
│    RiskScore                int │   │    VerificationDecision varchar │
│    RiskBand             varchar │   └─┬───────────────────────────────┘
│    ReportStatus         varchar │
└─┬───────────────────────────────┘
  └───────────── 1 ──── 1 ──────────────┘
  │ 1
  ├─────────────────────────────────────┬─────────────────────────────────────┐
  │ *                                   │ *                                   │ *
┌─▼───────────────────────────────┐   ┌─▼───────────────────────────────┐   ┌─▼───────────────────────────────┐
│ URLIndicator                    │   │ ContactIndicator                │   │ EvidenceFileMetadata            │
├─────────────────────────────────┤   ├─────────────────────────────────┤   ├─────────────────────────────────┤
│ PK URLID                    int │   │ PK ContactID                int │   │ PK EvidenceID               int │
│ FK ReportID                 int │   │ FK ReportID                 int │   │ FK ReportID                 int │
│    URL                  varchar │   │    ContactInfo          varchar │   │    FileType             varchar │
└─────────────────────────────────┘   └─────────────────────────────────┘   │    FileSize                 int │
                                                                            │    CloudinaryURL        varchar │
                                                                            └─────────────────────────────────┘

ScamReport 1 ──── * DuplicateReportLink

┌─────────────────────────────────┐
│ DuplicateReportLink             │
├─────────────────────────────────┤
│ PK DuplicateLinkID          int │
│ FK OriginalReportID          FK │
│ FK DuplicateReportID         FK │
└─────────────────────────────────┘

CLUSTER 3 — Alerts & community

┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│ ScamAlert                       │   │ Notification                    │
├─────────────────────────────────┤   ├─────────────────────────────────┤
│ PK AlertID                  int │   │ PK NotificationID           int │
│    Title                varchar │   │ FK AccountID                int │
│    AlertSeverity        varchar │   │    Message              varchar │
│    TargetRegion         varchar │   │    Timestamp           datetime │
│ FK AdminAccountID           int │   │ FK LinkedReportID     int, null │
└─┬───────────────────────────────┘   └─────────────────────────────────┘
  │ 1
  ├─────────────────────────────────────┐
  │ *                                   │ *
┌─▼───────────────────────────────┐   ┌─▼───────────────────────────────┐
│ AwarenessContent                │   │ RecoveryStep                    │
├─────────────────────────────────┤   ├─────────────────────────────────┤
│ PK AwarenessID              int │   │ PK RecoveryID               int │
│    ContentTitle         varchar │   │    StepTitle            varchar │
│    ContentText             text │   │    StepDescription         text │
└─────────────────────────────────┘   └─────────────────────────────────┘

CLUSTER 4 — Admin & audit

┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│ SystemReport                    │   │ AuditLog                        │
├─────────────────────────────────┤   ├─────────────────────────────────┤
│ PK ReportInstanceID         int │   │ PK AuditLogID               int │
│    ReportName           varchar │   │ FK AccountID                int │
│    GeneratedDate       datetime │   │    ActionType           varchar │
│ FK GeneratedByAdminID       int │   │    Timestamp           datetime │
└─────────────────────────────────┘   │    OldValue             varchar │
                                      │    NewValue             varchar │
                                      └─────────────────────────────────┘

UserAccount 1 ──── * ScamReport · Notification · AuditLog
```

**Relationships.** `U` marks a unique constraint; `PK` and `FK` mark primary and foreign keys.

| Relationship | Cardinality |
|---|---|
| User — UserAccount | 1 — 1 |
| UserAccount — Credentials · Profile | 1 — 1 each |
| UserAccount — AccessRole | * — 1 |
| AccessRole — Permissions | 1 — * |
| UserAccount — ScamReport | 1 — * |
| ScamReport — URLIndicator · ContactIndicator · EvidenceFileMetadata | 1 — * each |
| ScamReport — AdminVerification | 1 — 1 |
| ScamReport — DuplicateReportLink | 1 — * |
| ScamAlert — AwarenessContent · RecoveryStep | 1 — * each |
| UserAccount — Notification · AuditLog | 1 — * each |

### 11.2.2 Reconciliation with the implemented schema

The conceptual model has **18 entities**; the migrated schema has **25 tables** (§11.1). Every difference is a design decision taken between analysis and build, and each is recorded here rather than left for a reader to discover by comparing the two.

| Conceptual entity | Implemented as | Decision |
|---|---|---|
| `User` + `UserAccount` + `Profile` | `User` | Three tables in a 1—1—1 chain carry no information a single row does not. Collapsed; `Profile.AvatarURL` dropped as data the service has no use for (ETH-6, data minimisation) |
| `Credentials` | `User.passwordHash` | **`Salt` removed deliberately.** A bcrypt digest embeds its own salt in the string it returns. A separate `Salt` column would either duplicate it or, worse, invite an implementation that salts by hand — which is how salting gets done wrongly (NFR-8, R19) |
| `AccessRole` + `Permissions` | `Role` enumerated type | Four fixed roles, decided at design time and enforced by the database. A permissions table is the right model once roles are user-definable; until they are, it is a join for a value that cannot change (FR10) |
| — | `EmailVerificationToken`, `PasswordResetToken` | The conceptual model had no token storage, so FR2 and FR6 had nowhere to live. Both store a **hash** of the token, never the token |
| — | `NotificationPreference`, `AccountDeletionRequest` | Required by FR11 and FR12; neither had an entity |
| `ScamReport.RiskScore`, `.RiskBand` | `ScamCheck` + `ScamCheckIndicator` | **The most consequential change.** Analysis was an attribute of a report, so a message could only be scored by reporting it. FR85 makes checking anonymous, which requires analysis to be its own entity with a nullable owner. `ScamCheckIndicator` was added so the *reasons* behind a score persist, not just the number (FR18, ETH-8) |
| `URLIndicator` + `ContactIndicator` | `Indicator` + `ReportIndicator` | Normalised. Both held one artefact per report, so a domain reported fifty times was fifty rows and "has this been seen before?" was a table scan. One row per artefact with a count makes FR24 and FR45–FR47 a lookup |
| `EvidenceFileMetadata.CloudinaryURL` | `Evidence.storageKey` + `.sha256` | A column named for a vendor is a vendor written into the schema (R9 §10). The key is provider-neutral; the checksum lets a stored file be shown to be the one uploaded |
| — | `EvidenceAccessLog` | FR35 and FR36 require every read of evidence to be restricted and recorded. The conceptual model logged administrative actions but not evidence access |
| `AdminVerification` (1—1) | `ReportReview` (1—*) | A 1—1 verification keeps only the latest decision, so a reversal erases what it reversed. Stored as a sequence instead, the history of a decision survives the next one (R8 Rule 8.4) |
| — | `InformationRequest` | FR41 had no entity |
| `DuplicateReportLink` | `ReportRelation` | Gains `kind` (duplicate or related) and `similarity`, because FR43 and FR48 are different findings and a machine-suggested link must be distinguishable from an asserted one |
| `ScamAlert` — `AwarenessContent`, `RecoveryStep` | `Alert`; `AwarenessResource`; `RecoveryChecklist` + `RecoveryStep` + `RecoveryProgress` | Awareness material and recovery checklists are not children of an alert — they exist whether or not an alert was ever published. Detaching them also gave FR60 somewhere to record progress |
| — | `Suburb`, `ScamCategory` | Reference tables. FR65 and FR69 need both, and aggregating to suburb rather than to a finer location is what stops a report being traceable to a household (§11.7) |
| `SystemReport` | *not implemented* | A generated report is a query result, not a stored entity. FR70 produces statistics on demand; storing each run persists de-identified aggregates for no stated retention purpose |
| `AuditLog.OldValue`, `.NewValue` | `AuditLog.metadata` (JSON) | Two `varchar` columns cannot hold a multi-field change, and would hold whatever a caller put in them — including, eventually, a credential. Structured, with an explicit prohibition on secrets (R8 Rule 6.7) |
| `AuditLog` FK to account | `AuditLog.userId` **nullable, `ON DELETE SET NULL`** | Not in the conceptual model, and load-bearing: with a cascading key, honouring an erasure request (FR12) would delete the evidence that administrative actions took place. The actor severs; the record stays |

**Soft deletion.** `deletedAt` columns on `User`, `Report` and `Evidence` have no conceptual counterpart. They exist because FR30 makes withdrawal a state rather than a deletion, and because a record with audit weight has to remain explicable after it stops being active (R8 Rule 5.3).

**Status of the model.** The conceptual diagram is stable and was signed off within the team. The implemented schema is ⚠️ **draft under review** — the migration was applied on 7 August 2026, ahead of the M8 privacy-officer gate, which is finding §4.6 and risk RK-09. Ten of the fifteen mitigations in the database ethics register are absent or implemented differently (§10.4, gap G11), and the corrective migration at §10.4.4 applies to the implemented schema, not to this diagram.

## 11.3 Enumerated types

`Role` (RESIDENT, BUSINESS, OFFICER, ADMIN) · `Channel` (SMS, EMAIL, PHONE, WEBSITE, SOCIAL, POST, OTHER) · `RiskBand` (HIGH, MEDIUM, LOW, UNCLEAR) · `IndicatorWeight` (HIGH, MEDIUM, LOW) · `IndicatorType` (URL, DOMAIN, PHONE, EMAIL, BANK_ACCOUNT) · `ReportStatus` (DRAFT, SUBMITTED, UNDER_REVIEW, INFORMATION_REQUESTED, APPROVED, REJECTED, WITHDRAWN) · `Severity` (HIGH, MEDIUM, LOW) · `AlertStatus` (DRAFT, PENDING_APPROVAL, PUBLISHED, ARCHIVED) · `RelationKind` (DUPLICATE, RELATED) · `NotificationKind` (REPORT_SUBMITTED, REPORT_STATUS_CHANGED, INFORMATION_REQUESTED, ALERT_PUBLISHED) · `SubscriptionScope` (CATEGORY, SUBURB, ALL).

## 11.4 Key design decisions

| Decision | Rationale |
|---|---|
| Artefacts normalised into `Indicator` with a unique `(type, value)` key and a report counter | The same domain reported fifty times is **one row with a count**, which is what makes "has this been reported before?" a lookup rather than a scan (FR24). |
| Analysis factors persisted individually in `ScamCheckIndicator` | A result stays explainable after the fact (C16, ER-8). Without this, a stored score is an unexplainable number. |
| Reviews stored as a sequence in `ReportReview`, not as fields on `Report` | The history of a decision survives the next decision (C17). |
| `ReportRelation` expressed from both ends | Either side can be queried without a union (FR48). |
| `AuditLog.userId` and `EvidenceAccessLog.userId` nullable with `SetNull` | Erasing an account cannot erase the evidence that an administrative action took place (ER-7). |
| `Alert.sourceReportId` nullable and severable | An alert can outlive the report it came from without dragging that link behind it (FR50) — ⚠️ but see ER-2. |
| `Subscription.userId` nullable, `email` required | A resident can receive alerts without registering (FR85, ETH-6). |
| `ScamCheck.userId` nullable with `SetNull` | Anonymous checks feed the corpus for FR24 and FR70 without attaching a submission to a person (ETH-6). |
| Currency stored as `amountLostCents Int` | No floating point on money, ever. |
| Suburb as a table, aggregation no finer | A report cannot be traced to a street or a household (ER-4, D5). |

## 11.5 Report lifecycle

```
DRAFT ──► SUBMITTED ──► UNDER_REVIEW ──┬──► APPROVED ──► (may source an Alert)
  │           │              │         │
  │           │              ├─────────┴──► REJECTED
  │           │              │
  │           │              └──► INFORMATION_REQUESTED ──► UNDER_REVIEW
  │           │
  └───────────┴──► WITHDRAWN         (withdrawal is a state, never a deletion)
```

## 11.6 Alert lifecycle

```
DRAFT ──► PENDING_APPROVAL ──► PUBLISHED ──► ARCHIVED
             │                                   │
             └──► DRAFT (returned for revision)   └─► URL continues to resolve (FR54)
```

## 11.7 Data-handling rules (normative)

| ID | Rule |
|---|---|
| **DH1** | Passwords are stored only as bcrypt digests (cost 12). Plaintext never reaches the database, a log, or a response. |
| **DH2** | Verification, password-reset and unsubscribe tokens are stored as SHA-256 digests, so a leaked table yields nothing usable. |
| **DH3** | Evidence binaries are never stored in the database. Rows hold metadata, a SHA-256 checksum and a storage key. |
| **DH4** | Currency is stored in whole cents as an integer. |
| **DH5** | Geographic aggregation stops at suburb level. No report may be resolved to a street or a household. |
| **DH6** | Soft deletion applies to `User`, `Report` and `Evidence`. Queries filter deleted rows at the repository layer — in one place, so a single omission cannot silently resurrect a deleted account. |
| **DH7** | Audit and access-log actor references sever on account deletion rather than cascading. |
| **DH8** | Audit metadata shall never contain credentials, tokens, or the content of a submission or report. |
| **DH9** | Query logging is disabled in production, so submitted content does not reach the platform log. |
| **DH10** | Anonymous checks are retained without a user reference. |
| **DH11** | No production personal data may exist outside production. Development and test environments use synthetic seed data only (ER-12). |
| **DH12** | Every provider holding personal data shall be provisioned in an Australian region, verified before the first production record (ER-15). |

## 11.8 Data dictionary — principal entities

| Entity | Key attributes | Class | Retention (proposed, FR91) |
|---|---|---|---|
| `User` | email (unique), passwordHash, fullName, organisation, phone, role, emailVerified, lastLoginAt, deletedAt | C3 | 7 years after deletion request, then crypto-shred/sever |
| `ScamCheck` | channel, content, score, band, confidence, createdAt | C3 if attributed, C2 if anonymous | 12 months, then aggregate and purge content |
| `ScamCheckIndicator` | ruleId, label, detail, weight, evidence | C2 | As parent |
| `Indicator` | type, value (unique with type), reportCount, firstSeenAt, lastSeenAt | C4 | Review at 24 months; expire unverified (ER-13) |
| `Report` | reference (unique), status, severity, title, description, amountLostCents, occurredAt, submittedAt, withdrawnAt | C4 | 7 years (community-safety record) |
| `Evidence` | originalName, mimeType, sizeBytes, sha256, storageKey (unique) | C4 | 7 years or until report purge |
| `EvidenceAccessLog` | action, ipAddress, createdAt | C4 | 7 years, append-only |
| `Alert` | reference (unique), headline, summary, specimen, status, severity, publishedAt, archivedAt | C1 | Indefinite (published public record) |
| `AuditLog` | action, entityType, entityId, metadata, ipAddress | C4 | 7 years, append-only |
| `Subscription` | email, scope, unsubscribeTokenHash (unique), confirmedAt, unsubscribedAt | C3 | Until unsubscribe + 30 days |

*Retention periods are team proposals requiring Council records-management confirmation (OI-6).*

## 11.9 Data dictionary — complete

§11.8 lists the principal entities and their retention class. This is the complete dictionary: **every one of the 25 tables and all 188 columns** in the migrated schema, with the SQL type, nullability, keys, defaults and foreign-key behaviour as they exist in migration `20260807105640_init_cybersafe_schema`.

It is generated from `backend/prisma/schema.prisma` and the migration SQL rather than transcribed, so it cannot drift from the database it describes. Types are the PostgreSQL types actually created; a capitalised type name is an enumerated type from §11.3.

#### User

FR1–FR12. Authentication, profile and access control.

*Module 1–2. 12 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `email` | TEXT | no | U | — | FR3 — duplicate registration is prevented by the database, not only by application logic, so a race between two requests cannot create two rows. |
| `passwordHash` | TEXT | no | — | — | FR8 (Rule 6.2) — bcrypt digest. The plaintext never reaches this column. |
| `fullName` | TEXT | no | — | — | — |
| `organisation` | TEXT | yes | — | — | — |
| `phone` | TEXT | yes | — | — | — |
| `role` | Role | no | — | 'RESIDENT' | — |
| `emailVerified` | TIMESTAMP(3) | yes | — | — | FR2 — set once the emailed link has been followed. |
| `lastLoginAt` | TIMESTAMP(3) | yes | — | — | — |
| `deletedAt` | TIMESTAMP(3) | yes | — | — | FR12 — soft deletion keeps the audit trail intact after a deletion request. |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |
| `updatedAt` | TIMESTAMP(3) | no | — | — | — |

*Relations:* `verificationTokens` → `EmailVerificationToken[]` · `passwordResets` → `PasswordResetToken[]` · `notificationPrefs` → `NotificationPreference?` · `deletionRequest` → `AccountDeletionRequest?` · `checks` → `ScamCheck[]` · `reports` → `Report[]` · `assignedReports` → `Report[]` · `reviews` → `ReportReview[]` · `infoRequests` → `InformationRequest[]` · `evidenceAccesses` → `EvidenceAccessLog[]` · `alertsAuthored` → `Alert[]` · `alertsApproved` → `Alert[]` · `notifications` → `Notification[]` · `subscriptions` → `Subscription[]` · `recoveryProgress` → `RecoveryProgress[]` · `auditEntries` → `AuditLog[]`

*Constraints and indexes:* `@@index([role])` · `@@index([deletedAt])`

#### EmailVerificationToken

FR2 — single-use email verification token.

*Module 1. 6 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `userId` | TEXT | no | FK | — | → `User`, ON DELETE CASCADE. |
| `tokenHash` | TEXT | no | U | — | Stored hashed: a leaked table must not yield usable links. |
| `expiresAt` | TIMESTAMP(3) | no | — | — | — |
| `usedAt` | TIMESTAMP(3) | yes | — | — | — |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `user` → `User`

*Constraints and indexes:* `@@index([userId])`

#### PasswordResetToken

FR6 — single-use password recovery token.

*Module 1. 6 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `userId` | TEXT | no | FK | — | → `User`, ON DELETE CASCADE. |
| `tokenHash` | TEXT | no | U | — | — |
| `expiresAt` | TIMESTAMP(3) | no | — | — | — |
| `usedAt` | TIMESTAMP(3) | yes | — | — | — |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `user` → `User`

*Constraints and indexes:* `@@index([userId])`

#### NotificationPreference

FR11 — how the user wants to be contacted.

*Module 2. 6 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `userId` | TEXT | no | FK U | — | → `User`, ON DELETE CASCADE. |
| `emailOnStatus` | BOOLEAN | no | — | true | — |
| `emailOnAlerts` | BOOLEAN | no | — | true | — |
| `emailOnRequest` | BOOLEAN | no | — | true | — |
| `updatedAt` | TIMESTAMP(3) | no | — | — | — |

*Relations:* `user` → `User`

#### AccountDeletionRequest

FR12, Compliance 29 — a deletion request is a reviewable record, not an immediate drop, so the obligation and its discharge are both evidenced.

*Module 2. 5 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `userId` | TEXT | no | FK U | — | → `User`, ON DELETE CASCADE. |
| `reason` | TEXT | yes | — | — | — |
| `requestedAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |
| `processedAt` | TIMESTAMP(3) | yes | — | — | — |

*Relations:* `user` → `User`

#### ScamCategory

FR69 — administrator-managed scam categories.

*Module 12. 6 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `slug` | TEXT | no | U | — | — |
| `name` | TEXT | no | — | — | — |
| `description` | TEXT | yes | — | — | — |
| `archivedAt` | TIMESTAMP(3) | yes | — | — | — |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `reports` → `Report[]` · `alerts` → `Alert[]` · `subs` → `Subscription[]`

#### Suburb

Suburbs of the municipality. FR65 regional subscriptions and the scam map aggregate to this level and no finer, so a report cannot be traced to a street or a household.

*Module 12. 3 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `name` | TEXT | no | U | — | — |
| `postcode` | TEXT | no | — | — | — |

*Relations:* `reports` → `Report[]` · `alerts` → `Alert[]` · `subs` → `Subscription[]`

*Constraints and indexes:* `@@index([postcode])`

#### ScamCheck

FR13–FR18. One submission to the checker and the result it produced.  Retained even when anonymous (`userId` null) because FR70's statistics and FR24's matching both depend on the corpus. No account is required to check something, which is a deliberate part of the service design.

*Module 3. 8 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `userId` | TEXT | yes | FK | — | → `User`, ON DELETE SET NULL. |
| `channel` | Channel | no | — | — | — |
| `content` | TEXT | no | — | — | The submitted content, as supplied. |
| `score` | INTEGER | no | — | — | FR16 — 0-100. |
| `band` | RiskBand | no | — | — | FR17. |
| `confidence` | DOUBLE PRECISION | no | — | — | 0-1. How much signal the submission carried; stored beside the score because the two answer different questions. |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `user` → `User?` · `indicators` → `ScamCheckIndicator[]`

*Constraints and indexes:* `@@index([userId])` · `@@index([band])` · `@@index([createdAt])`

#### ScamCheckIndicator

FR18 — the reasons behind a score, retained so a result stays explainable after the fact (Rule 8.3).

*Module 3. 7 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `checkId` | TEXT | no | FK | — | → `ScamCheck`, ON DELETE CASCADE. |
| `ruleId` | TEXT | no | — | — | Rule identifier, e.g. "urgency" or "url-lookalike". |
| `label` | TEXT | no | — | — | — |
| `detail` | TEXT | no | — | — | — |
| `weight` | IndicatorWeight | no | — | — | — |
| `evidence` | TEXT | yes | — | — | The fragment of the submission that triggered the rule. |

*Relations:* `check` → `ScamCheck`

*Constraints and indexes:* `@@index([checkId])` · `@@index([ruleId])`

#### Indicator

FR21, FR24, FR45–FR47. The registry of artefacts seen across the service.  Normalised out of Report so the same domain reported fifty times is one row with a count, which is what makes "has this been reported before?" a lookup rather than a scan.

*Module 4. 6 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `type` | IndicatorType | no | U | — | — |
| `value` | TEXT | no | U | — | Normalised form: lower-cased host, digits-only phone, trimmed address. |
| `reportCount` | INTEGER NOT NULL DEFAULT 0 | yes | — | — | — |
| `firstSeenAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |
| `lastSeenAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `reports` → `ReportIndicator[]`

*Constraints and indexes:* `@@unique([type, value])` · `@@index([type])`

#### Report

FR25–FR30. A scam reported to Council.

*Module 5. 18 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `reference` | TEXT | no | U | — | FR28 — human-quotable reference, e.g. "HCC-2408-114". Unique so it can be used to look a report up on its own. |
| `authorId` | TEXT | yes | FK | — | → `User`, ON DELETE SET NULL. |
| `categoryId` | TEXT | yes | FK | — | → `ScamCategory`, ON DELETE SET NULL. |
| `suburbId` | TEXT | yes | FK | — | → `Suburb`, ON DELETE SET NULL. |
| `channel` | Channel | no | — | — | — |
| `status` | ReportStatus | no | — | 'DRAFT' | — |
| `severity` | Severity | yes | — | — | FR40 — set by a reviewer, distinct from the automated score. |
| `title` | TEXT | no | — | — | — |
| `description` | TEXT | no | — | — | — |
| `amountLostCents` | INTEGER | yes | — | — | Money lost, in whole cents to avoid floating point on currency. |
| `occurredAt` | TIMESTAMP(3) | yes | — | — | — |
| `submittedAt` | TIMESTAMP(3) | yes | — | — | — |
| `withdrawnAt` | TIMESTAMP(3) | yes | — | — | FR30 — withdrawal is a state, not a deletion. |
| `deletedAt` | TIMESTAMP(3) | yes | — | — | — |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |
| `updatedAt` | TIMESTAMP(3) | no | — | — | — |
| `reviewerId` | TEXT | yes | FK | — | FR38 — the officer currently responsible. → `User`, ON DELETE SET NULL. |

*Relations:* `author` → `User?` · `reviewer` → `User?` · `category` → `ScamCategory?` · `suburb` → `Suburb?` · `indicators` → `ReportIndicator[]` · `evidence` → `Evidence[]` · `reviews` → `ReportReview[]` · `infoRequests` → `InformationRequest[]` · `alerts` → `Alert[]` · `relationsFrom` → `ReportRelation[]` · `relationsTo` → `ReportRelation[]`

*Constraints and indexes:* `@@index([status])` · `@@index([authorId])` · `@@index([reviewerId])` · `@@index([categoryId])` · `@@index([suburbId])` · `@@index([submittedAt])`

#### ReportIndicator

Join between a report and an artefact it names. FR44–FR47 comparisons run over this table.

*Module 4–5. 2 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `reportId` | TEXT | no | PK FK | — | → `Report`, ON DELETE CASCADE. |
| `indicatorId` | TEXT | no | PK FK | — | → `Indicator`, ON DELETE CASCADE. |

*Relations:* `report` → `Report` · `indicator` → `Indicator`

*Constraints and indexes:* `@@id([reportId, indicatorId])` · `@@index([indicatorId])`

#### ReportRelation

FR43, FR48 — a link between two reports.

*Module 8. 6 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `sourceId` | TEXT | no | U FK | — | → `Report`, ON DELETE CASCADE. |
| `targetId` | TEXT | no | U FK | — | → `Report`, ON DELETE CASCADE. |
| `kind` | RelationKind | no | — | — | — |
| `similarity` | DOUBLE PRECISION | yes | — | — | 0-1 where the link was found by similarity rather than asserted. |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `source` → `Report` · `target` → `Report`

*Constraints and indexes:* `@@unique([sourceId, targetId])` · `@@index([targetId])`

#### Evidence

FR31–FR36. A file attached to a report.  The binary is not stored here; `storageKey` points at object storage. The row carries the metadata needed to validate, restrict and audit access.

*Module 6. 10 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `reportId` | TEXT | no | FK | — | → `Report`, ON DELETE CASCADE. |
| `description` | TEXT | yes | — | — | FR34. |
| `originalName` | TEXT | no | — | — | — |
| `mimeType` | TEXT | no | — | — | FR32 — validated server-side, never trusted from the client. |
| `sizeBytes` | INTEGER | no | — | — | FR33 — bytes. |
| `sha256` | TEXT | no | — | — | Checksum, so a stored file can be shown to be the one that was uploaded. |
| `storageKey` | TEXT | no | U | — | — |
| `deletedAt` | TIMESTAMP(3) | yes | — | — | — |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `report` → `Report` · `accessLogs` → `EvidenceAccessLog[]`

*Constraints and indexes:* `@@index([reportId])`

#### EvidenceAccessLog

FR35, FR36 — every read of a piece of evidence is recorded. Append-only: there is no update or delete path for this table in the application.

*Module 6. 6 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `evidenceId` | TEXT | no | FK | — | → `Evidence`, ON DELETE CASCADE. |
| `userId` | TEXT | yes | FK | — | → `User`, ON DELETE SET NULL. |
| `action` | TEXT | no | — | — | — |
| `ipAddress` | TEXT | yes | — | — | — |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `evidence` → `Evidence` · `user` → `User?`

*Constraints and indexes:* `@@index([evidenceId])` · `@@index([userId])`

#### ReportReview

FR37–FR42. A reviewer's decision on a report, kept as a sequence of records rather than fields on Report so the history of a decision survives the next one (Rule 8.4 — administrative action stays reviewable).

*Module 7. 7 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `reportId` | TEXT | no | FK | — | → `Report`, ON DELETE CASCADE. |
| `reviewerId` | TEXT | yes | FK | — | → `User`, ON DELETE SET NULL. |
| `decision` | ReportStatus | no | — | — | The status the reviewer moved the report to. |
| `severity` | Severity | yes | — | — | — |
| `notes` | TEXT | yes | — | — | — |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `report` → `Report` · `reviewer` → `User?`

*Constraints and indexes:* `@@index([reportId])` · `@@index([reviewerId])`

#### InformationRequest

FR41 — a reviewer asking the reporter for more detail.

*Module 7. 7 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `reportId` | TEXT | no | FK | — | → `Report`, ON DELETE CASCADE. |
| `requestedById` | TEXT | yes | FK | — | → `User`, ON DELETE SET NULL. |
| `message` | TEXT | no | — | — | — |
| `respondedAt` | TIMESTAMP(3) | yes | — | — | — |
| `response` | TEXT | yes | — | — | — |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `report` → `Report` · `requestedBy` → `User?`

*Constraints and indexes:* `@@index([reportId])`

#### Alert

FR49–FR54. What the public sees.  `sourceReportId` is nullable and deliberately severable: FR50 requires the published alert to carry nothing identifying the reporter, so an alert can outlive the report it came from without dragging that link behind it.

*Module 9. 17 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `reference` | TEXT | no | U | — | — |
| `sourceReportId` | TEXT | yes | FK | — | → `Report`, ON DELETE SET NULL. |
| `categoryId` | TEXT | yes | FK | — | → `ScamCategory`, ON DELETE SET NULL. |
| `suburbId` | TEXT | yes | FK | — | → `Suburb`, ON DELETE SET NULL. |
| `channel` | Channel | no | — | — | — |
| `status` | AlertStatus | no | — | 'DRAFT' | — |
| `severity` | Severity | no | — | — | — |
| `headline` | TEXT | no | — | — | — |
| `specimen` | TEXT | yes | — | — | The reported wording, de-identified before it reaches this column. |
| `summary` | TEXT | no | — | — | — |
| `authorId` | TEXT | yes | FK | — | → `User`, ON DELETE SET NULL. |
| `approvedById` | TEXT | yes | FK | — | → `User`, ON DELETE SET NULL. |
| `publishedAt` | TIMESTAMP(3) | yes | — | — | — |
| `archivedAt` | TIMESTAMP(3) | yes | — | — | — |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |
| `updatedAt` | TIMESTAMP(3) | no | — | — | — |

*Relations:* `sourceReport` → `Report?` · `category` → `ScamCategory?` · `suburb` → `Suburb?` · `author` → `User?` · `approvedBy` → `User?`

*Constraints and indexes:* `@@index([status])` · `@@index([publishedAt])` · `@@index([categoryId])` · `@@index([suburbId])`

#### AwarenessResource

FR55–FR57, FR59.

*Module 10. 10 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `slug` | TEXT | no | U | — | — |
| `title` | TEXT | no | — | — | — |
| `category` | TEXT | no | — | — | — |
| `summary` | TEXT | no | — | — | — |
| `body` | TEXT | no | — | — | — |
| `readingTime` | TEXT | no | — | — | — |
| `archivedAt` | TIMESTAMP(3) | yes | — | — | FR54-style archiving rather than deletion, so a link that was published does not simply 404. |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |
| `updatedAt` | TIMESTAMP(3) | no | — | — | — |

*Constraints and indexes:* `@@index([category])`

#### RecoveryChecklist

FR58 — an ordered checklist for someone who has been scammed.

*Module 10. 5 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `slug` | TEXT | no | U | — | — |
| `title` | TEXT | no | — | — | — |
| `situation` | TEXT | no | — | — | — |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `steps` → `RecoveryStep[]`

#### RecoveryStep

*Module 10. 5 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `checklistId` | TEXT | no | U FK | — | → `RecoveryChecklist`, ON DELETE CASCADE. |
| `position` | INTEGER | no | U | — | 1-based display order. |
| `title` | TEXT | no | — | — | — |
| `detail` | TEXT | no | — | — | — |

*Relations:* `checklist` → `RecoveryChecklist` · `progress` → `RecoveryProgress[]`

*Constraints and indexes:* `@@unique([checklistId, position])` · `@@index([checklistId])`

#### RecoveryProgress

FR60 — which steps a given user has completed.

*Module 10. 4 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `userId` | TEXT | no | U FK | — | → `User`, ON DELETE CASCADE. |
| `stepId` | TEXT | no | U FK | — | → `RecoveryStep`, ON DELETE CASCADE. |
| `completedAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `user` → `User` · `step` → `RecoveryStep`

*Constraints and indexes:* `@@unique([userId, stepId])` · `@@index([userId])`

#### Notification

FR61–FR63.

*Module 11. 8 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `userId` | TEXT | no | FK | — | → `User`, ON DELETE CASCADE. |
| `kind` | NotificationKind | no | — | — | — |
| `title` | TEXT | no | — | — | — |
| `body` | TEXT | no | — | — | — |
| `linkPath` | TEXT | yes | — | — | Where the notification points, if anywhere. |
| `readAt` | TIMESTAMP(3) | yes | — | — | — |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `user` → `User`

*Constraints and indexes:* `@@index([userId, readAt])`

#### Subscription

FR64–FR66. A subscription is scoped to a category, a suburb, or everything.  `unsubscribeTokenHash` lets FR66 work from an emailed link without a login, which is what makes unsubscribing genuinely one click.

*Module 11. 10 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `userId` | TEXT | yes | FK | — | → `User`, ON DELETE SET NULL. |
| `email` | TEXT | no | U | — | Held for subscribers who never created an account. |
| `scope` | SubscriptionScope | no | U | — | — |
| `categoryId` | TEXT | yes | U FK | — | → `ScamCategory`, ON DELETE CASCADE. |
| `suburbId` | TEXT | yes | U FK | — | → `Suburb`, ON DELETE CASCADE. |
| `confirmedAt` | TIMESTAMP(3) | yes | — | — | — |
| `unsubscribedAt` | TIMESTAMP(3) | yes | — | — | — |
| `unsubscribeTokenHash` | TEXT | no | U | — | — |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `user` → `User?` · `category` → `ScamCategory?` · `suburb` → `Suburb?`

*Constraints and indexes:* `@@unique([email, scope, categoryId, suburbId])` · `@@index([userId])`

#### AuditLog

FR72, Rule 17 — append-only record of consequential actions.  `userId` is nullable and severs on delete so that erasing an account cannot erase the evidence that an administrative action took place.

*Module 12. 8 columns.*

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | TEXT | no | PK | — | — |
| `userId` | TEXT | yes | FK | — | → `User`, ON DELETE SET NULL. |
| `action` | TEXT | no | — | — | — |
| `entityType` | TEXT | no | — | — | — |
| `entityId` | TEXT | yes | — | — | — |
| `metadata` | JSONB | yes | — | — | Structured detail. Must never contain credentials or tokens (Rule 6.7). |
| `ipAddress` | TEXT | yes | — | — | — |
| `createdAt` | TIMESTAMP(3) | no | — | CURRENT_TIMESTAMP | — |

*Relations:* `user` → `User?`

*Constraints and indexes:* `@@index([userId])` · `@@index([entityType, entityId])` · `@@index([createdAt])`

**Reading the key column.** `PK` primary key · `FK` foreign key · `U` unique constraint. A row with two `PK` marks is part of a composite primary key.

**On `ON DELETE` behaviour.** Three policies appear, and the choice is deliberate in each case. `CASCADE` is used where a child row has no meaning without its parent — a verification token without its user, an indicator without its check. `SET NULL` is used wherever severing must not destroy a record: an audit entry, a report, a piece of evidence access, or a published alert survives the deletion of the account that created it, which is what allows FR12 erasure to coexist with FR72 audit retention. No foreign key in the schema uses `RESTRICT`, because no deletion in this system should fail on the basis of a reference that could instead be severed.


---

# 12. System architecture and design

## 12.1 Architectural style

A **modular monolith with service-oriented boundaries** (C2): one deployable backend in which each business capability owns its own routes, controller, validation schema, service and repository, and communicates with other modules only through defined service interfaces. This keeps development tractable for a small team now while allowing any module to be extracted into a separate service later without rewriting its callers.

Artificial intelligence sits behind an **AI Gateway** as a separate intelligence layer, so that if the AI platform is unavailable, core checking, reporting, review and alerting continue unchanged (C3).

## 12.2 Layered architecture

```
┌──────────────────────────────────────────────────────────────┐
│ Presentation — React SPA                                     │
│   pages · components · design system · theme · hooks         │
│   client-side analyser (pure, portable)                      │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS / JSON
┌───────────────────────────▼──────────────────────────────────┐
│ Edge — CDN, SPA rewrites, CSP and security headers           │
└───────────────────────────┬──────────────────────────────────┘
┌───────────────────────────▼──────────────────────────────────┐
│ API — Express application factory                            │
│   helmet · CORS allowlist · body cap · rate limiting         │
└───────────────────────────┬──────────────────────────────────┘
┌───────────────────────────▼──────────────────────────────────┐
│ Routing — per-module routers, role declarations              │
├──────────────────────────────────────────────────────────────┤
│ Validation — Zod schemas; the body is replaced, not checked  │
├──────────────────────────────────────────────────────────────┤
│ Controller — receive, delegate, respond. No business logic.  │
├──────────────────────────────────────────────────────────────┤
│ Service — business rules, transactions, orchestration        │
├──────────────────────────────────────────────────────────────┤
│ Repository — the only code that touches the ORM              │
└───────────────────────────┬──────────────────────────────────┘
┌───────────────────────────▼──────────────────────────────────┐
│ Data — Prisma ORM → PostgreSQL (TLS, Australian region)      │
└──────────────────────────────────────────────────────────────┘

Cross-cutting: central error handler · response envelope · audit service ·
               environment contract validated once at startup
```

**Why the layering is enforced rather than encouraged.** Bypassing a layer is how the soft-delete filter gets omitted at one call site, how a controller acquires a business rule that then exists in two places, and how an unvalidated field reaches a write. The rule (C4) is that no layer may be skipped, and the repository pattern exists specifically so that a condition like "exclude soft-deleted rows" lives in exactly one place.

## 12.3 Level 0 data-flow diagram — context

The context diagram fixes the system boundary before it is decomposed. It has one process, because at level 0 the whole system is one process, and it names every party that exchanges data with it.

```
                                ┌──────────────────────────────┐
                                │ E2  Administrator            │
                                │                              │
                                │     (Council officer)        │
                                └───────┬──────────────────────┘
                                        │           ▲
                                        ▼           │               ┌──────────────────────────┐
                                ┌───────────────────┴──────────┐    │ E3  Object storage       │
┌──────────────────────────┐    │                              ├───▶│                          │
│ E1  User                 │    │ 0   CyberKent                │◀───├     (external)           │
│                          ├───▶│                              │    └──────────────────────────┘
│     resident, business,  │    │     Online Scam              │
│     community            │    │     Detection and            │    ┌──────────────────────────┐
│     organisation         │◀───├     Reporting System         │    │ E4  Email service        │
│                          │    │                              ├───▶│                          │
└──────────────────────────┘    │                              │◀───├     (external)           │
                                │                              │    └──────────────────────────┘
                                └───────┬──────────────────────┘
                                        │
                                        ▼
                                ┌──────────────────────────────┐
                                │ E5  Council reporting        │
                                │ E6  Referral bodies          │
                                │     Scamwatch · IDCARE ·     │
                                └──────────────────────────────┘
```

| Entity | Sends to the system | Receives from the system |
|---|---|---|
| E1 User | Registration details, credentials, suspicious content, scam report, evidence files, subscription request | Account confirmation, access token, risk score with indicators, report reference and status, community alerts, awareness material |
| E2 Administrator | Verification decision, severity, alert copy, administrative request | Review queue, report detail, verified status, system reports, audit data |
| E3 Object storage | Stored evidence file on retrieval | Evidence file and storage key on upload |
| E4 Email service | Delivery receipt | Verification link, status notification, alert digest |
| E5 Council reporting | — | De-identified statistics and aggregate export (FR70, FR71) |
| E6 Referral bodies | — | Nothing. **Links only** — the service directs a person to Scamwatch, IDCARE, police or the ACSC and transmits no data to any of them |

**Why E6 receives nothing.** It would be reasonable to assume a scam-reporting service forwards reports to the national body. It does not, and that is a deliberate boundary: onward disclosure of a report to a third party is a use of personal information the reporter has not consented to, and consent for it has not been sought (§10, ETH-6). The service tells a person where else to report and leaves the reporting to them.

## 12.4 Level 1 data-flow diagram

The layered view above says how the system is built. The data-flow diagram says what moves through it. This is the level 1 model as authored during analysis: two external entities, four processes, four data stores, and the fifteen flows between them.

```
   External entities              Processes                      Data stores

  ┌──────────────┐        ┌────────────────────────┐        ╔════════════════════╗
  │              │──f1───▶│ 1.0  User account      │──f1───▶║ D1  User data      ║
  │              │◀──f2───│      management        │        ║     store          ║
  │              │        │  registration ·        │◀──f8───╚════════════════════╝
  │              │        │  credentials · profiles│
  │              │        └────────────────────────┘             ▲
  │              │                    ▲                          │
  │  E1  User    │                    │ f8  privilege check      │
  │  (end-user)  │                    │                          │
  │              │──f3───▶┌────────────────────────┐──f6───▶╔════════════════════╗
  │              │◀──f4───│ 2.0  Scam report       │        ║ D2  Scam reports   ║
  │              │        │      submission &      │◀──f7───║     data store     ║
  │              │        │      analysis          │        ╚════════════════════╝
  │              │        │  details · URLs ·      │              ▲   ▲
  │              │        │  text · evidence ·     │──f9───▶╔═════╪═══╪══════════╗
  │              │        │  risk scores           │        ║ D3  Evidence file  ║
  │              │        └────────────────────────┘        ║     store          ║
  │              │                                          ╚════════════════════╝
  │              │◀──f5───┌────────────────────────┐              │   │
  │              │        │ 3.0  Community scam    │──f10─────────┘   │
  └──────────────┘        │      alerts            │                  │
                          │  alerts · awareness ·  │                  │
                          │  trend data            │                  │
                          └────────────────────────┘                  │
  ┌──────────────┐                                                    │
  │              │──f11──▶┌────────────────────────┐──f13─────────────┘
  │  E2  Admini- │        │ 4.0  Admin report      │
  │      strator │◀──f12──│      review & audit    │◀──f14────────────┐
  │              │        │  verify · system       │                  │
  └──────────────┘        │  reports · log activity│──f15──▶╔═════════╪══════════╗
                          └────────────────────────┘        ║ D4  Audit logs     ║
                                                            ╚════════════════════╝
```

**The flows.**

| # | Flow | From | To |
|---|---|---|---|
| f1 | Registration details, credentials | E1 User | 1.0 → D1 |
| f2 | Account confirmation, access token | 1.0 | E1 User |
| f3 | Scam report details, URLs, text, evidence | E1 User | 2.0 |
| f4 | Report reference number, status | 2.0 | E1 User |
| f5 | Scam alerts, awareness information | 3.0 | E1 User |
| f6 | Store report data, analysis scores | 2.0 | D2 |
| f7 | Retrieve reports for duplicate check | D2 | 2.0 |
| f8 | Check user privileges | D1 | 1.0, 2.0 |
| f9 | Upload evidence file | 2.0 | D3 |
| f10 | Fetch recent scam trends | D2 | 3.0 |
| f11 | Verification decision, administrative request | E2 Administrator | 4.0 |
| f12 | Verified status, system reports, audit data | 4.0 | E2 Administrator |
| f13 | Update report status | 4.0 | D2 |
| f14 | Fetch reports | D2 | 4.0 |
| f15 | Log administrative activity, query logs | 4.0 | D4 |

**How the processes map to the twelve modules.** The data-flow diagram groups behaviour by how information moves; §5 groups it by requirement. The two decompositions are not the same shape, and this is the correspondence between them.

| DFD process | Modules | Requirements | Status |
|---|---|---|---|
| 1.0 User account management | 1, 2 | FR1–FR12 | 🟡 Partial — 7 of 12 |
| 2.0 Scam report submission & analysis | 3, 4, 5, 6, 8 | FR13–FR36, FR43–FR48 | 🟡 Analysis complete; reporting and evidence specified only |
| 3.0 Community scam alerts | 9, 10, 11 | FR49–FR66 | ⬜ Specified |
| 4.0 Admin report review & audit | 7, 12 | FR37–FR42, FR67–FR72 | ⬜ Specified |

**Two divergences between the diagram and the built system**, both consequences of decisions recorded elsewhere in this document:

- **Analysis has left process 2.0.** On the diagram, scoring happens inside report submission. In the delivered system it runs in the browser, before and without any report, and no flow reaches a data store at all — the message is neither transmitted nor retained (FR85, UC-01). Flow f6 as drawn is therefore not yet live for the analysis half of process 2.0, and becomes live only when FR77 introduces server-side checking. That is also why FR24, which needs an artefact registry to match against, cannot complete until FR77 does (§14.3).
- **No flow reaches D4 except from process 4.0.** The diagram audits administrative activity only. FR72 requires user activity logging as well, and the ethics register (§10.4) requires evidence access logging under FR36. Both are implemented in the schema as `AuditLog` and `EvidenceAccessLog`, which means the built system has audit flows the diagram does not show.

## 12.5 Request flow — a checked message with server-side persistence (FR77)

```
Browser ──► Edge (CSP, headers) ──► Rate limiter ──► CORS ──► Body cap
        ──► Router (/api/check) ──► Zod validation (body replaced)
        ──► Controller (delegate only)
        ──► ScamAnalysisService
                ├─ extract artefacts (URL, email, phone)
                ├─ apply text rules, channel-filtered
                ├─ apply host-shape rules
                ├─ score → band → confidence
                └─ match artefacts against the registry (FR24)
        ──► Repository ──► Prisma ──► PostgreSQL
        ──► Response envelope ──► Browser
        (any throw ──► central error handler ──► generic response + server log)
```

## 12.6 Security architecture

Defence is layered so that no single control is load-bearing:

| Layer | Controls |
|---|---|
| Edge | TLS, HSTS, CSP, frame denial, MIME-sniff prevention, referrer policy, permissions policy |
| Application entry | `helmet`, CORS allowlist, `x-powered-by` disabled, 256 KB body cap, global rate limiting |
| Credential endpoints | Tightened rate limit (10/15 min), uniform failure response with constant-cost comparison, per-account lockout (FR74) |
| Authentication | JWT with expiry; expired and forged tokens answered identically; MFA for privileged roles (FR73) |
| Authorisation | Per-endpoint role declaration, evaluated separately from authentication |
| Input | Zod validation replacing the body; unknown keys stripped |
| Data access | ORM-only, parameterised; no string-built SQL |
| Storage | bcrypt cost 12; tokens hashed; evidence private with signed URLs; encryption at rest |
| Observability | Append-only audit log; access logging on C4 data; no credentials or content in logs |

## 12.7 Scalability roadmap

| Phase | Topology | Trigger |
|---|---|---|
| 1 — Launch | Free-tier CDN + serverless API + managed Postgres | Now |
| 2 — Promotion | Paid tiers; ≥ 2 API instances; connection pooling verified under load | Before public promotion (feasibility condition 1) |
| 3 — Growth | Read replica for reporting and analytics; CDN caching of public alerts | Sustained load or NFR-3 pressure |
| 4 — Extraction | Extract analysis and notification into separate services; introduce the AI Gateway | AI adoption or independent scaling need |


## 12.8 Class diagram

The class diagram below is the implemented software structure, taken from the source rather than from an intended design. It shows the two halves that exist today: the layered Express modules on the server, and the detection engine on the client.

The backend is written in a module-per-capability form in which each layer is a named object with a fixed responsibility, so the diagram shows those objects as classes with their public operations. TypeScript interfaces are shown as `«interface»`.

```
                                SERVER — Express application
  ┌──────────────────────────────────┐
  │ «module» app                     │
  ├──────────────────────────────────┤
  │ + createApp() : Express          │
  └───────────────┬──────────────────┘
                  │ mounts
    ┌─────────────┴──────────────────────────────┐
    ▼                                            ▼
┌───────────────────────┐  ┌────────────────────────────────────────────┐
│ «router» healthRoutes │  │ «router» authRoutes                        │
├───────────────────────┤  ├────────────────────────────────────────────┤
│ + GET  /              │  │ + POST /register  + POST /login            │
│ + GET  /ready         │  │ + POST /verify-email  + POST /logout       │
└───────────────────────┘  │ + GET  /me                                 │
                           └──────────────────┬─────────────────────────┘
                                              │ guarded by
              ┌───────────────────────────────┼───────────────────────────┐
              ▼                               ▼                           ▼
  ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
  │ «middleware» validate │   │ «middleware» auth     │   │ «middleware» error    │
  ├───────────────────────┤   ├───────────────────────┤   ├───────────────────────┤
  │ + validateBody(       │   │ + requireAuth()       │   │ + notFoundHandler()   │
  │     schema: ZodType)  │   │ + requireRole(        │   │ + errorHandler()      │
  └───────────────────────┘   │     ...roles: Role[]) │   └───────────────────────┘
                              └───────────────────────┘
                                              │ delegates to
                                              ▼
                           ┌────────────────────────────────────────────┐
                           │ «controller» authController                │
                           ├────────────────────────────────────────────┤
                           │ + register(req, res, next)                 │
                           │ + verifyEmail(req, res, next)              │
                           │ + login(req, res, next)                    │
                           │ + logout(req, res)                         │
                           │ + me(req, res, next)                       │
                           └──────────────────┬─────────────────────────┘
                                              │ calls
                                              ▼
                           ┌────────────────────────────────────────────┐
                           │ «service» authService                      │
                           ├────────────────────────────────────────────┤
                           │ - BCRYPT_ROUNDS : number = 12              │
                           │ - VERIFICATION_TOKEN_TTL_MS : number       │
                           │ - hashToken(token) : string                │
                           │ - issueAccessToken(user) : string          │
                           │ - toPublicUser(user) : PublicUser          │
                           │ + register(input) : {user, token}          │
                           │ + verifyEmail(token) : PublicUser          │
                           │ + login(input) : {user, token}             │
                           │ + profile(userId) : PublicUser             │
                           └──────────────────┬─────────────────────────┘
                                              │ calls
                                              ▼
                           ┌────────────────────────────────────────────┐
                           │ «repository» authRepository                │
                           ├────────────────────────────────────────────┤
                           │ + findByEmail(email) : User?               │
                           │ + findById(id) : User?                     │
                           │ + create(data) : User                      │
                           │ + markSignedIn(id) : User                  │
                           │ + createVerificationToken(...)             │
                           │ + findUsableVerificationToken(hash)        │
                           │ + consumeVerification(tokenId, userId)     │
                           └──────────────────┬─────────────────────────┘
                                              │ uses (the only class that may)
                                              ▼
                           ┌────────────────────────────────────────────┐
                           │ «singleton» prisma : PrismaClient          │
                           └────────────────────────────────────────────┘

  Cross-cutting, used by every layer above
  ┌───────────────────────────────┐   ┌──────────────────────────────────┐
  │ «interface» ApiEnvelope<T>    │   │ AppError extends Error           │
  ├───────────────────────────────┤   ├──────────────────────────────────┤
  │ + success  : boolean          │   │ + status : number                │
  │ + message  : string           │   │ + errors : {field?, message}[]   │
  │ + data     : T | null         │   ├──────────────────────────────────┤
  │ + errors   : {field?, msg}[]  │   │ + constructor(status, message,   │
  ├───────────────────────────────┤   │     errors)                      │
  │ + sendOk<T>(res, data, ...)   │   └──────────────────────────────────┘
  │ + sendFail(res, status, ...)  │
  └───────────────────────────────┘
  ┌───────────────────────────────┐   ┌──────────────────────────────────┐
  │ «config» env                  │   │ «interface» AuthenticatedUser    │
  ├───────────────────────────────┤   ├──────────────────────────────────┤
  │ + NODE_ENV · PORT             │   │ + id : string                    │
  │ + DATABASE_URL · JWT_SECRET   │   │ + email : string                 │
  │ + JWT_EXPIRES_IN              │   │ + role : Role                    │
  │ + isProduction : boolean      │   └──────────────────────────────────┘
  │ + allowedOrigins : string[]   │
  └───────────────────────────────┘
```

```
                          CLIENT — detection engine (Modules 3 and 4)
  ┌──────────────────────────────────┐        ┌──────────────────────────────────┐
  │ «interface» Submission           │        │ «interface» Analysis             │
  ├──────────────────────────────────┤        ├──────────────────────────────────┤
  │ + text    : string               │        │ + score      : number  (0–100)   │
  │ + channel : Channel              │        │ + band       : RiskBand          │
  │ + media?  : MediaDescriptor[]    │        │ + confidence : number  (0–1)     │
  └───────────────┬──────────────────┘        │ + headline · summary : string    │
                  │                           │ + indicators : Indicator[]       │
                  │                           │ + extracted  : {urls, emails,    │
                  ▼                           │                 phones}          │
  ┌──────────────────────────────────┐        │ + examined   : ExaminedSource[]  │
  │ «module» analyse                 │───────▶└──────────────────────────────────┘
  ├──────────────────────────────────┤
  │ - WEIGHT_POINTS  : high 30,      │        ┌──────────────────────────────────┐
  │     medium 16, low 7             │        │ «interface» Indicator            │
  │ - SATURATION : number = 45       │        ├──────────────────────────────────┤
  │ - BAND_THRESHOLDS                │───────▶│ + id · label · detail : string   │
  │ - MINIMUM_USEFUL_LENGTH = 12     │        │ + weight   : IndicatorWeight     │
  │ - runTextRules(text, channel)    │        │ + evidence?: string              │
  │ - runUrlRules(urls)              │        └──────────────────────────────────┘
  │ - scoreIndicators(indicators)    │
  │ - bandFor(score) : RiskBand      │        ┌──────────────────────────────────┐
  │ - confidenceFor(...)             │        │ «interface» MediaDescriptor      │
  │ - describeSources(typed, media)  │        ├──────────────────────────────────┤
  │ + analyse(Submission) : Analysis │───────▶│ + name · type : string           │
  └───┬───────────┬──────────┬───────┘        │ + size : number                  │
      │ uses      │ uses     │ uses           │ + kind : MediaKind               │
      ▼           ▼          ▼                │ + extractedText? : string        │
┌──────────────┐ ┌──────────────┐ ┌─────────┐ │ + unreadable?    : string        │
│ «module»     │ │ «module»     │ │«module» │ └──────────────────────────────────┘
│ patterns     │ │ extract      │ │ media   │
├──────────────┤ ├──────────────┤ ├─────────┤ ┌──────────────────────────────────┐
│ + TEXT_RULES │ │ + extractUrls│ │ + kindOf│ │ «module» ocr                     │
│   : TextRule │ │ + extract-   │ │ + exten-│ ├──────────────────────────────────┤
│   [11]       │ │   Emails     │ │   sionOf│ │ - MINIMUM_CONFIDENCE = 45        │
│ + SUSPICIOUS │ │ + extract-   │ │ + analy-│ │ - MINIMUM_TEXT = 8               │
│   _TLDS      │ │   Phones     │ │   seMed-│ │ - recogniser() : Worker          │
│ + IMPERSON-  │ │ + hostOf     │ │   ia()  │ │ + readImage(file) : ReadResult   │
│   ATED_BRANDS│ └──────────────┘ └─────────┘ │ + describeFiles(files, onProg)   │
│ + URL_SHORT- │                              │     : MediaDescriptor[]          │
│   ENERS      │  ┌────────────────────────┐  └──────────────────────────────────┘
│ + OFFICIAL_  │  │ «interface» TextRule   │
│   SUFFIXES   │─▶│ + id · label · detail  │   Enumerations
└──────────────┘  │ + weight : Indicator-  │   Channel  = sms|email|phone|
                  │            Weight      │             website|social|other
                  │ + pattern : RegExp     │   RiskBand = high|medium|low|unclear
                  └────────────────────────┘   MediaKind= image|audio|video|document
```

**What the diagram is evidence of.** Three of the engineering rules this project committed to are visible in it rather than merely asserted:

- **No layer is skipped (C4, R8 Rule 2.2).** `prisma` has exactly one inbound arrow, from `authRepository`. No controller, service, route or middleware reaches the ORM. That is what keeps the soft-delete condition in one place instead of at every call site.
- **Controllers hold no business logic (R8 Rule 2.3).** Every operation on `authController` has the same three-line shape: call the service, send the envelope, forward the error. The bcrypt cost, the token lifetime, the uniform login failure and the transaction all sit in `authService`.
- **The analyser is pure (FR85, and the reason UC-01 works without an account).** `analyse` has no dependency on transport, storage, React or the DOM. Its inputs are a `Submission` and its output is an `Analysis`. That is what makes the same function testable in isolation (§15.2), runnable in the browser today, and movable to the server unchanged when FR77 is implemented.

**What the diagram does not show.** Modules 5 to 12 have no classes, because none exist yet. The tables are migrated and the design is specified, but the controller, service and repository objects for reporting, evidence, review, alerts, notification and administration are not written. The diagram is an accurate picture of a system that is two modules deep and twelve modules wide, which is the position §14 states in words.


## 12.9 Data flow integrity assessment

Integrity here means that data arriving at any point in the system is what the previous stage actually sent, that it has not been altered in transit or in storage, and that a party who should not be able to influence a flow cannot. The Level 1 flows at §12.4 are assessed one by one against that definition.

### 12.9.1 Trust boundaries

Four boundaries are crossed by the flows. Everything on the far side of each is untrusted, and every boundary crossing must therefore validate rather than assume.

| # | Boundary | Crossed by | Governing control |
|---|---|---|---|
| TB-1 | Browser → Edge | f1, f3, f11 | TLS 1.2+, HSTS, CSP, security header set |
| TB-2 | Edge → API | f1, f3, f11 | CORS allowlist, body size cap, rate limiting |
| TB-3 | API → Database | f6, f7, f8, f13, f14, f15 | Parameterised queries via Prisma; TLS to `ap-southeast-2` |
| TB-4 | API → External service | f9 (object storage), notifications (email) | Server-to-server credentials; never brokered through the browser |

**The boundary that does not exist yet.** The delivered analyser runs entirely inside the browser, so today the check in UC-01 crosses no boundary at all: the message is never transmitted. That is the strongest possible integrity position for that flow, and it is a property the service loses when FR77 introduces server-side checking. §12.9.4 records what has to be true before that trade is made.

### 12.9.2 Flow-by-flow assessment

| Flow | Integrity risk if unprotected | Control | Status |
|---|---|---|---|
| f1 registration details | Field injection — a caller supplies `role` and self-promotes to administrator | Zod `.strict()` rejects unknown keys, and `validateBody` **replaces** `req.body` with the parsed result, so no handler downstream ever sees the raw body | ✅ Implemented and verified (§12.9.3) |
| f2 token issued | Token forgery or tampering | HS256 JWT signed with a secret validated at startup to be at least 32 characters; any alteration invalidates the signature | ✅ Implemented |
| f3 report content | Stored XSS through report text reaching another user's browser | React escapes interpolated text by default; no `dangerouslySetInnerHTML` on user-supplied content | 🟡 Holds today; must be re-verified when Module 5 renders report text |
| f4 reference and status | A reporter reads or alters another reporter's report | Row ownership check in the service layer plus `requireAuth` | ⬜ Specified — Module 5 |
| f5 alert content | An unapproved alert reaching the public | `AlertStatus` state machine with a separate `approvedById`, so publication needs a second party | ⬜ Specified — Module 9 |
| f6 store report and scores | Partial write leaving a report without its indicators | Prisma transaction, as already used for `consumeVerification` | ⬜ Specified — Module 5 |
| f7 duplicate-check read | Cross-report contamination through unbounded matching | Candidate-set scoping by indicator before similarity comparison | ⬜ Specified — Module 8 |
| f8 privilege check | Privilege escalation between authentication and use | `requireRole` is separate from `requireAuth`, so a route cannot check that someone signed in and forget to check who | ✅ Implemented |
| f9 evidence upload | Substituted or corrupted evidence file | SHA-256 recorded at ingest in `Evidence.sha256`; a retrieved file that does not match its digest is not the file that was uploaded | 🟡 Column exists and is migrated; verification on read is Module 6 |
| f10 trend read | Aggregates that can be reversed to an individual | Aggregation stops at suburb; minimum cell count before publication | ⬜ Specified — ER-3 |
| f11 decision in | An officer's decision attributed to the wrong officer, or altered afterwards | `ReportReview` is append-only in application terms — each decision is a new row, so a reversal does not erase what it reversed | ⬜ Specified — Module 7 |
| f12 reports out | Tampering with figures used for Council advocacy | Derived at query time from the report table; no separately maintained totals to diverge | ⬜ Specified — Module 12 |
| f13 status update | Status changed by someone outside the review workflow | `requireRole(OFFICER, ADMIN)` plus the `ReportStatus` state machine | ⬜ Specified — Module 7 |
| f14 report read | Evidence read without a record of who read it | `EvidenceAccessLog` written on every access (FR36) | ⬜ Specified — Module 6 |
| f15 audit write | The audit trail edited or deleted to conceal an action | Append-only by design: no update or delete path exists in the application, and `userId` severs on account deletion rather than cascading | 🟡 Schema enforces it; no application write path yet |

### 12.9.3 Verified integrity controls

Two controls were exercised directly against the running API for this issue rather than being asserted from the source.

**Field injection on registration (f1).** A registration request carrying an unrequested `role: "ADMIN"` field, together with an invalid email and a short password:

```
POST /api/auth/register
{"email":"nope","password":"short","fullName":"A","role":"ADMIN"}

422 Unprocessable Entity
{ "success": false,
  "message": "The submitted data is not valid.",
  "data": null,
  "errors": [ {"field":"email",    "message":"Enter a valid email address."},
              {"field":"password", "message":"Use at least 12 characters."},
              {"field":"fullName", "message":"Enter your name."},
              {"field":"",         "message":"Unrecognized key: \"role\""} ] }
```

The privilege-escalation attempt is rejected as an unrecognised key, by the schema, before any handler runs. This is the control described at f1 above, demonstrated.

**Unauthenticated access to a protected flow (f8).** `GET /api/auth/me` without a bearer token returns `401` with `"Sign in to continue."` and no user data. Expired and forged tokens return the same message as each other by design, so the response cannot be used to determine which half of the problem an attacker has already solved.

### 12.9.4 Findings and required actions

| ID | Finding | Action |
|---|---|---|
| DFI-1 | Nine of the fifteen flows have their integrity control specified but not built, because Modules 5–12 are not implemented. The controls are designed and their place in the schema exists; none is exercised. | Implement with each module; each control is an acceptance criterion for that module rather than a later hardening pass |
| DFI-2 | `Evidence.sha256` is written at ingest but nothing verifies it on read. An integrity column that is never checked provides no integrity. | Verify the digest on every retrieval and record a mismatch as a security event (Module 6) |
| DFI-3 | The audit trail is append-only by application convention, not by database permission. A compromised application credential could still alter it. | Grant the application role `INSERT` and `SELECT` only on `AuditLog` and `EvidenceAccessLog`; raised as a hardening item for M14 |
| DFI-4 | FR77 moves analysis to the server and creates a new boundary crossing for content that today never leaves the device. | Before FR77 ships: state retention for submitted content, size and rate limits on the endpoint, and whether an anonymous check is stored at all. This is a privacy decision as much as an integrity one (§10.6) |
| DFI-5 | There is no integrity monitoring. Nothing would detect an altered row. | Structured logging with request correlation (gap G5), then alerting on audit-table anomalies |

**Overall position.** The integrity controls on the flows that exist are implemented and two of them are demonstrated above. The controls on the flows that do not exist yet are designed and have their schema support in place, which is the correct position for a system at this stage, but they are unexercised and must not be reported as working. DFI-2 and DFI-3 are the two findings that apply to code already written, and both are small.

---

# 13. Hardware and software requirements

The client brief leaves both to the development team's recommendation. This section supplies that recommendation (OI-5).

## 13.1 Development workstation

| Component | Minimum | Recommended |
|---|---|---|
| CPU | 4-core x86-64 or Apple Silicon | 8-core |
| RAM | 8 GB | **16 GB** — the WebGL front end and TypeScript project builds are memory-hungry |
| Storage | 20 GB free SSD | 50 GB free SSD |
| Display | 1920×1080 | 2560×1440, for reviewing responsive breakpoints side by side |
| OS | Windows 11, macOS 13+, Ubuntu 22.04+ | Any of the above |
| Network | Broadband | Broadband |

**Development software.** Node.js 20 LTS+ · npm 10+ · Git · a TypeScript-aware editor · a modern browser with developer tools · PostgreSQL 15+ locally or a managed development branch · a REST client for API testing.

## 13.2 Production — recommended managed deployment

This is the deployment the project targets and the one the code is written for.

| Component | Recommendation | Rationale |
|---|---|---|
| **Static front end** | CDN-backed static host with SPA rewrite and edge security headers | The SPA is fully static after build; CDN delivery is the cheapest route to NFR-1 and NFR-25 |
| **API** | Serverless functions, or a small always-on container (0.5 vCPU / 1 GB) with **≥ 2 instances** | The application factory is separated from the listener so either topology works without code change. Two instances satisfy NFR-22 and remove a single point of failure |
| **Database** | Managed PostgreSQL 15+ with connection pooling, point-in-time recovery, automated daily backup, **`ap-southeast-2`** | Data residency in Australia (R14/R15, ER-15); managed backup satisfies NFR-5 and NFR-6 |
| **Object storage** | Private bucket, encrypted at rest, signed-URL access only, EXIF stripping on ingest | FR31–FR35, ER-5 |
| **Email** | Transactional email service with SPF, DKIM and DMARC | FR2, FR6, FR61–FR66 |
| **Monitoring** | Uptime probe against `/api/health/ready`; structured log aggregation; error alerting within 5 minutes | NFR-4, NFR-26 |
| **TLS** | Managed certificates, auto-renewing, TLS 1.2+ | NFR-7 |
| **Secrets** | Platform secret store; never in source control | C9, R8 Rule 6.6 |

**Indicative operating cost:** approximately **AUD $4,400 per year** of infrastructure once free tiers are outgrown. This must be approved **before** public promotion rather than discovered afterwards (feasibility condition 1, RK-01).

## 13.3 Production — alternative self-hosted topology

Provided in case Council prefers infrastructure it controls directly.

| Tier | Specification |
|---|---|
| Reverse proxy / WAF | 2 vCPU, 4 GB RAM; TLS termination; rate limiting |
| Application servers ×2 | 4 vCPU, 8 GB RAM each; Node.js 20 LTS; behind a load balancer |
| Database server | 4 vCPU, 16 GB RAM, 200 GB SSD; PostgreSQL 15+; daily backup with 30-day retention; read replica for reporting |
| Object storage | 500 GB encrypted at rest, growing with evidence volume |
| Backup target | Off-site, encrypted, 30-day retention, quarterly restore drill |
| AI service (only if FR81 approved) | 4 vCPU, 16 GB RAM; GPU only if models exceed the CPU inference budget |

All servers must be located in an Australian region (ER-15).

## 13.4 Software stack — as implemented

| Layer | Technology | Version |
|---|---|---|
| Front-end framework | React | 18.3 |
| Language | TypeScript | 5.6 (front end) / 7.0 (back end) |
| Build tool | Vite | 7 |
| Styling | Tailwind CSS | 3.4 |
| Routing | React Router | 6 |
| Animation | Framer Motion | 11 |
| 3D / WebGL | Three.js · three-globe · @react-three/fiber | 0.169 · 2.45 · 8.18 |
| Icons | Lucide React | 0.462 |
| Linting | oxlint | 0.13 |
| Runtime | Node.js | 20 LTS+ |
| API framework | Express | 5 |
| ORM | Prisma | 7 |
| Database | PostgreSQL | 15+ |
| Validation | Zod | 4 |
| Password hashing | bcryptjs (cost 12) | 3 |
| Tokens | jsonwebtoken | 9 |
| Security headers | helmet | 8 |
| Rate limiting | express-rate-limit | 8 |
| Version control | Git / GitHub | — |

## 13.5 Deviations from the proposed stack, with reasons (OI-2)

| Proposed (R7) | Position | Reason |
|---|---|---|
| shadcn/ui | **Not adopted** | The interface is built on a project-specific design system (R10) that the component library would have fought rather than served. Accessibility obligations are met directly (UI-3 to UI-8). |
| React Hook Form | **Not adopted** | The delivered forms are simple enough that a form library would be a dependency without a job (C13, R9 §2). |
| Leaflet + OpenStreetMap | **Deferred** | Required by the scam map (declared module 9); introduced when that feature is built. |
| Recharts | **Deferred** | Required by analytics (FR70). |
| Nodemailer | **Deferred** | Required by FR2, FR6, FR61–FR66. Its absence is gap G1. |
| Winston | **Deferred** | Required by NFR-26. Its absence is gap G5. |
| Cloudinary | **Deferred** | Required by FR31–FR36. |
| Docker / Docker Compose | **Deferred** | The managed deployment does not require containerisation; retained for the self-hosted topology. |
| FastAPI, OpenCV, EasyOCR, PyTorch, TensorFlow | **Deferred by decision** | AI is explicitly out of scope this phase (C3). The architecture reserves the integration point only. |

Each deferred technology remains the recommended choice at the point its feature is implemented. **Council sign-off on this deviation list is requested (OI-2).**

---

# 14. Implementation status and traceability

## 14.1 Summary

| Measure | Value |
|---|---|
| Baseline functional requirements | 72 |
| ✅ Fully implemented | **16 (22%)** |
| 🟡 Partially implemented | **4 (6%)** |
| ⬜ Specified — schema and design only | **52 (72%)** |
| Enhanced requirements proposed | 20 (6 already implemented) |
| Database tables built and migrated | 25 of 25 (100%) |
| Front-end source | 19,326 lines TypeScript/TSX, plus 2,027 lines CSS |
| Back-end source | 710 lines TypeScript |
| Database schema and migration | 1,279 lines |
| Document build pipeline | 1,550 lines |
| Database columns migrated | 188 across 25 tables |
| Test cases registered / executed | 82 / 17, all 17 passing |
| API endpoints live | 8 |
| Detection rules live | 11 text rules + 6 URL checks |

## 14.2 Plain statement of position

The **data layer is complete**: all twelve modules have their tables, constraints and indexes migrated — though the schema is a **draft under review** pending the M8 ethics sign-off (§4.6, §10.4).

The **scam analysis engine (Modules 3–4) is complete and working**, and verified against a behavioural test set (§15.2). This is milestone M10 material delivered ahead of its 18 September date.

The **security foundation is complete**: validation, authentication, authorisation, rate limiting, error handling, the response envelope and the security header set all exist and are exercised.

What is **not built** is the request/response surface for Modules 5–12. The schema is there; the endpoints and screens are not. Ten routes serve placeholder pages that name the module and requirement range they will fulfil.

Two structural gaps are worth stating plainly. **The front end does not call the back end** — there is no API client in the SPA, so the two halves of the system have never communicated (G2). And **the seed script referenced by the build configuration does not exist**, so no reference data can be loaded (G7).

## 14.3 Module traceability

| Module | Requirements | Data model | API | UI | Overall | Milestone |
|---|---|---|---|---|---|---|
| 1. Registration and authentication | FR1–FR6 | ✅ | 🟡 5 of 6 | ⬜ placeholder | 🟡 | M9 |
| 2. Profile and access control | FR7–FR12 | ✅ | 🟡 2 of 6 | ⬜ placeholder | 🟡 | M9 |
| 3. Scam content analysis | FR13–FR18 | ✅ | ⬜ client-side only | ✅ | ✅ | M10 — **delivered early** |
| 4. URL and contact analysis | FR19–FR24 | ✅ | ⬜ client-side only | ✅ | 🟡 FR24 pending FR77 | M10 — **delivered early** |
| 5. Report management | FR25–FR30 | ✅ | ⬜ | ⬜ placeholder | ⬜ | M11 |
| 6. Evidence management | FR31–FR36 | ✅ | ⬜ | ⬜ | ⬜ | M11 |
| 7. Review and verification | FR37–FR42 | ✅ | ⬜ | ⬜ | ⬜ | M12 |
| 8. Duplicate detection | FR43–FR48 | ✅ | ⬜ | ⬜ | ⬜ | M12 |
| 9. Community alerts | FR49–FR54 | ✅ | ⬜ | 🟡 landing section | ⬜ | M13 |
| 10. Awareness and recovery | FR55–FR60 | ✅ | ⬜ | 🟡 landing + placeholders | ⬜ | M13 |
| 11. Notification and subscription | FR61–FR66 | ✅ | ⬜ | 🟡 subscribe CTA | ⬜ | M13 |
| 12. Administration and audit | FR67–FR72 | ✅ | ⬜ | ⬜ placeholder | ⬜ | M13 |

## 14.4 Status against the milestone plan

| Milestone | Deliverable | Planned | Status |
|---|---|---|---|
| M0 | Project initiation and brief analysis | 30 Jun 2026 | ✅ Complete |
| M1 | Requirements baseline | 8 Jul 2026 | ✅ Complete |
| M2 | Technology stack and architecture baselined | 12 Jul 2026 | ✅ Complete |
| M3 | UI/UX design system baselined | 15 Jul 2026 | ✅ Complete |
| M4 | Interim SRS Report v1.0 | 16 Jul 2026 | ✅ Complete |
| M5 | Frontend prototype demonstrating the stack | 31 Jul 2026 | ✅ Complete |
| M6 | Interim Project Report issued | 1 Aug 2026 | ✅ Complete |
| **M7** | **Enhanced FRs approved** | **12 Aug 2026** | ⚠️ **Overdue — 20 proposed at §6; approval outstanding (RK-02)** |
| **M8** | **Database design and ethics review signed off** | **21 Aug 2026** | ⚠️ **At risk — the migration was written 7 Aug, ahead of this gate (§4.6, RK-09)** |
| M9 | Modules 1–2 complete | 4 Sep 2026 | 🟡 In progress — 7 of 12 FRs |
| M10 | Modules 3–4 complete | 18 Sep 2026 | ✅ **Delivered early** — 11 of 12 FRs; FR24 pending FR77 |
| M11 | Modules 5–6 complete | 2 Oct 2026 | ⬜ Planned |
| M12 | Modules 7–8 complete | 16 Oct 2026 | ⬜ Planned |
| M13 | Modules 9–12 complete | 30 Oct 2026 | ⬜ Planned |
| M14 | System verification complete | 13 Nov 2026 | ⬜ Planned |
| M15 | Final SRS Report issued | 20 Nov 2026 | 🟡 **This document, issued early for review** |
| M16 | Deployment, handover, final presentation | 27 Nov 2026 | ⬜ Planned |

**Schedule position:** ahead on M10, on track on M9, and **blocked on two external approvals (M7, M8)** — which the Interim Project Report correctly identified as the most likely source of schedule loss.

## 14.5 Recommended delivery sequence

| Phase | Contents | Rationale |
|---|---|---|
| **0 — Immediate** | Obtain M7 and M8 approvals; apply the corrective migration (§10.4.4); write the seed script | Both approvals block downstream work, and the schema correction window closes at first production use |
| **1** | Complete Modules 1–2: password recovery, profile update, password change, deletion request; **build the API client and connect the front end**; add email delivery | The system currently has an authentication API that no screen calls. Closing that loop unblocks every user-scoped feature that follows |
| **2** | Modules 5–6: report submission, validation, reference generation, evidence upload with EXIF stripping | The primary reason Council commissioned the service |
| **3** | Modules 7–8: review queue, assignment, decisions, duplicate detection | Reports have no value until officers can act on them |
| **4** | Modules 9 and 11: alerts, approval, publication, subscriptions, notifications | Converts collected intelligence into community protection |
| **5** | Modules 10 and 12: awareness library, recovery tracking, administration, statistics, de-identified export | Rounds out the service and enables Council's advocacy reporting |
| **6** | Approved enhancements, priority order: FR84 (multilingual), FR91 (retention), FR77 (server-side checking, unblocking FR24), FR73 (MFA), then the remainder | Highest community and compliance value first |

## 14.6 Known gaps

| ID | Gap | Impact | Recommendation |
|---|---|---|---|
| **G1** | **No email delivery.** The verification token is returned in the API response rather than emailed. | FR2 cannot complete for a real user; FR6 and FR61–FR66 are blocked. The current behaviour is documented in code as temporary and **must not reach production**. | Introduce a transactional email service in Phase 1; remove the token from the response in the same change. |
| **G2** | **The front end does not call the back end.** No API client exists in the SPA. | Every server-backed feature is unreachable from the interface. | Build a typed API client against the response envelope as the first task of Phase 1. |
| **G3** | **No test framework.** Neither project defines a test script. | Regressions in the rule set or the scoring curve would not be caught. | Install Vitest; convert the existing behavioural harness (§15.2) into a suite; require tests for the scoring function and every validation schema. |
| **G4** | **Accessibility not formally audited.** | NFR-13 conformance is claimed but not demonstrated. | Automated scan plus manual keyboard and screen-reader pass before M14. |
| **G5** | **No structured logging, monitoring or alerting.** Errors go to the console. | NFR-26 cannot be satisfied; an outage would be discovered by a user rather than by Council. | Structured logging with request correlation; uptime probe against `/api/health/ready`. |
| **G6** | **First paint gated behind a 3.4-second boot animation**, with WebGL libraries in the initial bundle. | Puts NFR-1 at risk, most acutely on the low-end mobile devices this service's users are most likely to hold. | Route-split the WebGL bundle; make the boot sequence skippable and suppress it under reduced-motion and low device tiers; re-measure. |
| **G7** | **Seed script referenced but absent.** `package.json` and `prisma.config.ts` both point at `prisma/seed.ts`, which does not exist; `npm run db:seed` fails. | No suburbs, categories, awareness resources or seed administrator can be loaded. Blocks Phases 2–5. Also leaves developers with no sanctioned dataset (ER-12). | Write it with **synthetic data only**; source the suburb list and taxonomy from Council (A10). |
| **G8** | **A populated `.env` exists in the working tree.** Git-ignored and not committed, but a live credential is on disk. | Risk of accidental disclosure. | Confirm it remains ignored; rotate the database credential and JWT secret before production; hold production secrets only in the platform secret store. |
| **G9** | **No load or restore testing.** | NFR-2, NFR-3 and NFR-6 are asserted rather than demonstrated. | Schedule both as release gates AC-4 and AC-5. |
| **G10** | **Rule-set governance undefined.** The rules are editable data, but no owner, review cadence or change-approval process exists. | A detection service whose rules nobody owns will drift out of date, and ETH-3/ER-9 require the rule set to be defensible to Council. | Nominate a Council owner and a quarterly review cycle; adopt FR82 and FR83 so tuning is evidence-led and past results stay explainable. Raised as OI-7. |
| **G11** | **Ten of fifteen database ethical mitigations are absent or implemented differently** from the governing register (§10.4). | Four of six Critical ethical risks are unmitigated in the schema. The correction window closes at first production use. | Apply the corrective migration at §10.4.4 before Module 5 begins. |


## 14.7 Implementation plan

§14.5 gives the order the remaining work must be done in and why. This is the plan for doing it: what each phase produces, who does it, what it depends on, which environment it lands in, and the condition that has to be met before the next phase starts.

### 14.7.1 Environments

| Environment | Purpose | Data | Promotion into it |
|---|---|---|---|
| Local | Development | **Synthetic seed data only.** No production copy, ever (ER-12) | A working branch |
| Preview | Per-branch review, automatically built | Synthetic | Every push |
| Staging | Integration, load and accessibility testing | Synthetic at production volume — 100,000 reports for NFR-3 | Merge to the default branch |
| Production | Live service | Real personal data | Manual promotion, only after the phase-0 gate below |

**Production is not reachable until the phase-0 gate passes.** The database currently holds no real personal data, and that must remain true until the privacy work is finished. This is the single most important sequencing constraint in the plan.

### 14.7.2 Phases

| # | Phase | Produces | Owner | Depends on | Exit condition |
|---|---|---|---|---|---|
| **0** | **Unblock and correct** | M7 and M8 approvals; corrective migration (§10.4.4); seed script; Vitest installed and the detection harness converted; the two broken production entry points fixed | Project Manager, Database Designer, QA Lead | Stakeholder decisions — **outside the team's control** | Approvals recorded; migration applied; `npm test` runs; `npm start` starts |
| **1** | **Close the loop** | Typed API client in the SPA; Modules 1–2 completed — FR6, FR9, FR12; transactional email; sign-in, register and profile screens | Solution Architect, Frontend Lead | Phase 0 | TC-01-01 to TC-02-05 pass; a person can register, verify, sign in and manage their account through the interface |
| **2** | **Reporting and evidence** | Modules 5–6; report submission with validation and reference generation; evidence upload with **EXIF stripping**, digest verification and access logging | Solution Architect, Database Designer | Phase 1 | TC-05-\*, TC-06-\* pass, including TC-06-04 |
| **3** | **Review and duplicates** | Modules 7–8; review queue, assignment, decisions as a sequence, information requests, duplicate detection | Solution Architect | Phase 2 | TC-07-\*, TC-08-\* pass, including TC-08-04 at volume |
| **4** | **Community** | Modules 9 and 11; alert drafting, anonymisation, two-party approval, publication, search, archive; subscriptions and notifications | Frontend Lead, Solution Architect | Phase 3 | TC-09-\*, TC-11-\* pass, including TC-09-02 and TC-09-06 |
| **5** | **Awareness, recovery, administration** | Modules 10 and 12; awareness library moved to the database, recovery progress, administration, statistics, de-identified export, audit views | Frontend Lead, Database Designer | Phase 4 | TC-10-\*, TC-12-\* pass, including TC-12-04 |
| **6** | **Approved enhancements** | In priority order: FR84 multilingual, FR91 retention and purge, FR77 server-side analysis (which unblocks FR24), FR73 MFA, then the remainder | All | Phase 5 and M7 approval | Each enhancement carries its own acceptance criterion |
| **7** | **Release** | Load and restore drills, accessibility audit, security review and penetration test, privacy verification, handover pack | QA Lead, Solution Architect | Phase 6 | AC-1 to AC-13 all pass |

### 14.7.3 Phase 0 in detail

Phase 0 is listed first because nothing else can safely start, and because two of its items are defects in code that already exists.

| Task | Detail | Effort |
|---|---|---|
| Obtain M7 approval | Twenty enhanced requirements at §6, overdue since 12 August | External |
| Obtain M8 sign-off | Privacy officer review of the migrated schema; the DPIA at §10.6 is the input | External |
| Apply the corrective migration | §10.4.4. **The window closes at first production use** | 1 day |
| Write the seed script | `prisma/seed.ts` is referenced by `package.json` and `prisma.config.ts` and does not exist, so `npm run db:seed` fails. **Synthetic data only**; suburb list and taxonomy from Council (A10) | 1 day |
| Install Vitest, convert the harness | Gap G3. The eleven detection cases become a suite that fails a build | 1 day |
| Fix the production start path | `npm start` runs `node dist/server.js`, but the compiler emits `dist/src/server.js` because `rootDir` is `"."`. The script fails with MODULE_NOT_FOUND | 1 hour |
| Fix path-alias resolution in the build | The emitted JavaScript keeps `@/app` unrewritten and there is no runtime resolver, so the compiled server cannot start even at the correct path. Development works because `tsx` resolves aliases; **only the production path is broken** | 2 hours |

The last two are not in the gap register at §14.6 and are recorded here for the first time. They matter because a system that cannot be started from its own build script cannot be deployed, and both are small.

### 14.7.4 Deployment and cutover

| Step | Detail |
|---|---|
| Build | Frontend built statically and served from the CDN; backend deployed as a serverless function from the same repository |
| Migration | `prisma migrate deploy` against production, run before the application is promoted, never against a running mismatched version |
| Rollback | Redeploy the previous build. **Schema rollback is a forward migration, never a reversal**, so every migration must be additive where a rollback is conceivable |
| Secrets | Held only in the platform secret store. The database credential and JWT secret are rotated before first production use (gap G8) |
| Smoke test | `/api/health` and `/api/health/ready`, then one end-to-end journey per implemented module |
| Monitoring | Uptime probe against `/api/health/ready`; structured logging with request correlation (gap G5) |
| Communication | Council notified before promotion; scheduled maintenance published in advance (NFR-25) |

### 14.7.5 Resourcing and capacity

| Capability | Holder | Phases | Note |
|---|---|---|---|
| Project management | Project Manager | 0–7 | Continuous |
| Requirements and traceability | Business Analyst | 0, 6 | Heaviest at the approval gates |
| Architecture, API, security | Solution Architect | 1–4, 7 | The critical path through phases 2 and 3 |
| Database, retention, privacy | Database Designer | 0, 2, 5, 7 | Phase 0 correction is the gating task |
| Frontend and accessibility | Frontend Lead | 1, 4, 5, 7 | |
| Test and verification | QA Lead | 0, then every phase exit | No phase exits without its cases passing |
| Council reviewer capacity | Council, ~0.4 FTE | 4 onward | **Not yet committed** (A4, RK-05) |

### 14.7.6 Risks to the plan

| Risk | Effect | Response |
|---|---|---|
| M7 and M8 stay unapproved | Phase 0 cannot exit and every later phase slips | Escalated; both are at §18 as blocking. **Phases 1 to 5 depend on M8, not M7** — the baseline can proceed while the enhancements wait |
| Council reviewer capacity is not committed | Phase 4 delivers a queue nobody works | Confirm by M13 at the latest (RK-05) |
| Load testing fails at phase 7 | Late architectural rework | Run TC-NFR-02 and TC-08-04 at the end of phase 3, not at phase 7 |
| Accessibility audit fails late | Rework across every screen | Audit at the end of phase 1 on real screens, then per phase |
| Free-tier hosting cannot meet NFR-2 | Cannot promote publicly | Paid tier approved before promotion, not after (RK-01) |

---

# 15. Verification and validation

## 15.1 Verification strategy

| Level | Method | Owner | Current state |
|---|---|---|---|
| Static | TypeScript strict compilation across both projects; oxlint on the front end | All developers | ✅ In place |
| Unit | Rule set and scoring behaviour; validation schemas; service logic | QA Lead | 🟡 Behavioural harness exists; **no test framework installed** (G3) |
| Integration | API endpoint tests against a test database | QA Lead | ⬜ |
| End-to-end | Browser-driven user journeys per §7 | QA Lead | ⬜ |
| Accessibility | Automated scan plus manual keyboard and screen-reader pass | Frontend Lead | ⬜ M14 |
| Performance | Load test to NFR-2 and NFR-3 thresholds; 100,000-record dataset for duplicate detection | Solution Architect | ⬜ M14 |
| Security | Dependency audit, header verification, authorisation matrix, OWASP Top 10 checklist, external penetration test | Solution Architect | 🟡 Controls implemented; formal verification outstanding |
| Privacy | Re-identification test; EXIF strip test; end-to-end deletion test; k-anonymity cell-count test | Database Designer | ⬜ M8 and M14 |
| Code review | Security checklist on every pull request; no self-merge | All developers | ✅ In place |

## 15.2 Detection engine — verification results

The analyser has a behavioural test set of seven cases spanning true positives, true negatives and the insufficient-input boundary. **Executed for this report on 13 August 2026.**

| # | Case | Channel | Expected | Result | Score | Confidence | Indicators |
|---|---|---|---|---|---|---|---|
| 1 | Toll scam with lookalike domain | SMS | HIGH | **HIGH** ✅ | 91 | 0.83 | 5 |
| 2 | Rates refund requesting bank details | Email | HIGH | **HIGH** ✅ | 93 | 0.97 | 5 |
| 3 | Gift-card request with secrecy demand | Email | HIGH | **HIGH** ✅ | 86 | 0.70 | 3 |
| 4 | Genuine Council waste-collection notice | Email | LOW | **LOW** ✅ | 0 | 0.39 | 0 |
| 5 | Benign personal message | SMS | LOW | **LOW** ✅ | 0 | 0.24 | 0 |
| 6 | Too short to assess | SMS | UNCLEAR | **UNCLEAR** ✅ | 0 | 0.00 | 0 |
| 7 | Credential phish on a raw IP address | Email | HIGH | **HIGH** ✅ | 88 | 0.82 | 4 |

> **Result: 7 / 7 band classifications correct. Zero false positives on the two genuine messages.**

### 15.2.1 Worked example — case 1

Extraction found the URL `linkt-au.pay-toll.online`, with no phone number or email address. Five independent indicators fired:

| Rule | Weight | Evidence |
|---|---|---|
| `urgency` | HIGH | "within 24 hours" |
| `url-lookalike` | HIGH | Host contains "linkt" but is not an address Linkt controls |
| `payment-request` | MEDIUM | "$4.20", "unpaid" |
| `impersonation` | MEDIUM | "LINKT" |
| `url-tld` | MEDIUM | `.online` |

Evidence points: 30 + 30 + 16 + 16 + 16 = **108**. Score = `round(100 × (1 − e^(−108/45)))` = **91**. Band **HIGH**.

### 15.2.2 The discrimination that matters

Case 4 — a genuine Council notice that also names a council and links to a domain — scored **0**. The official `.gov.au` suffix exempts the host from the shape rules, and no wording rule fired.

This is precisely the discrimination the service needs. **A scam-checking service that flags Council's own correspondence would destroy the trust it exists to build.**

## 15.3 Acceptance criteria for release

| ID | Criterion | Owner |
|---|---|---|
| **AC-1** | Every FR marked Implemented passes its stated acceptance criterion under test | QA Lead |
| **AC-2** | Zero critical or high findings outstanding from security review; OWASP Top 10 checks documented | Solution Architect |
| **AC-3** | WCAG 2.1 AA audit passed, with any remaining issues documented and scheduled | Frontend Lead |
| **AC-4** | Load test demonstrates NFR-2 and NFR-3 thresholds, including duplicate detection at 100,000 records | Solution Architect |
| **AC-5** | Backup restoration drill demonstrates NFR-6 (RTO 4 h, RPO 24 h) | Solution Architect |
| **AC-6** | Council has approved the detection rule set (ETH-3) and the corrected privacy statement (NFR-30) | Project Manager |
| **AC-7** | The advisory disclaimer appears at every point a result is presented (ETH-1, ETH-2) | Frontend Lead |
| **AC-8** | No credential, token or submitted content appears in any log | Solution Architect |
| **AC-9** | Re-identification test passes on every public view and de-identified export (ER-2, ER-3) | Database Designer |
| **AC-10** | End-to-end deletion test passes: personal data removed, audit trail intact (ER-7, FR12) | Database Designer |
| **AC-11** | EXIF strip test passes on evidence ingest (ER-5) | Database Designer |
| **AC-12** | Data residency verified as Australian across every provider holding personal data (ER-15) | Solution Architect |
| **AC-13** | Every FR traceable to design, code module and test case (QO-5) | Business Analyst |

## 15.4 Validation with users

Validation with real users is required before launch and **has not yet been performed**. Recommended: moderated sessions with at least three participants from each of —

- residents with low digital confidence;
- small-business operators and volunteer-run organisation representatives;
- speakers of a community language other than English (which also validates FR84);
- Council reviewers working the queue (which validates PO-3 and the operational feasibility assumption A4).

**Success measure:** a first-time user completes a check and correctly describes what the result does *and does not* tell them. The second half of that sentence is the ethical test — a user who believes a LOW result guarantees safety has been failed by the interface regardless of how well the analyser performed.


## 15.5 Test cases

§15.2 reports the seven behavioural cases already executed against the detection engine. This section is the full case register for the system: every case that must pass before release, written so that each one states its precondition, its input, its expected result and the requirement it verifies. A case with a result is one that has been run; a case marked ⬜ has been specified and not yet run, and no result is claimed for it.

Identifiers are `TC-<module>-<n>`.

### 15.5.1 Executed — Module 3 and 4, detection engine

Seven cases, executed 13 August 2026, reproduced 20 August 2026. **7 of 7 correct.** Full detail including scores, confidences and the worked example is at §15.2.

| ID | Case | Input | Expected | Result | Verifies |
|---|---|---|---|---|---|
| TC-03-01 | Toll scam, lookalike domain | SMS, `linkt-au.pay-toll.online` | HIGH | ✅ 91 | FR15–FR18, FR21 |
| TC-03-02 | Rates refund requesting bank details | Email naming the Council | HIGH | ✅ 93 | FR15, FR16 |
| TC-03-03 | Gift-card request with secrecy demand | Email | HIGH | ✅ 86 | FR15 |
| TC-03-04 | Genuine Council notice | Email linking `hume.vic.gov.au` | LOW | ✅ 0 | ETH-3, false-positive control |
| TC-03-05 | Benign personal message | SMS | LOW | ✅ 0 | False-positive control |
| TC-03-06 | Too short to assess | 5 characters | UNCLEAR | ✅ 0 | FR17 boundary |
| TC-04-01 | Credential phish on a raw IP | `http://192.168.44.9/login` | HIGH | ✅ 88 | FR20, FR21 |
| TC-04-02 | Program disguised as an invoice | `Invoice_4821.pdf.exe` | HIGH | ✅ 74 | FR81 envelope rules |
| TC-04-03 | Macro-enabled document | `remittance.docm` | MEDIUM | ✅ 49 | FR81 |
| TC-04-04 | Image with no readable text | `photo.png`, OCR finds nothing | UNCLEAR | ✅ 0 | FR79 — an unread file must not raise confidence |
| TC-04-05 | Screenshot of a scam, read by OCR | `sms.png` | HIGH | ✅ 91 | FR81 — a screenshotted scam scores as a pasted one |

### 15.5.2 Executed — security controls

Exercised directly against the running API. Detail at §12.9.3.

| ID | Case | Input | Expected | Result | Verifies |
|---|---|---|---|---|---|
| TC-SEC-01 | Privilege escalation by field injection | Registration carrying `role: "ADMIN"` | 422, key rejected | ✅ Rejected as unrecognised key | FR76, NFR-11 |
| TC-SEC-02 | Protected route without a token | `GET /api/auth/me` | 401, no data | ✅ "Sign in to continue." | FR10, NFR-11 |
| TC-SEC-03 | Validation of a malformed body | Bad email, short password, missing name | 422 with per-field errors | ✅ Four errors, correctly attributed | FR27, NFR-15 |
| TC-SEC-04 | Security headers present | Any response | HSTS, CSP, nosniff, frame options | ✅ All present | NFR-7 |
| TC-SEC-05 | Unhandled error disclosure | Provoked server error in production mode | Generic message, no stack | ✅ Generic; detail logged server-side only | R9 §4 |

### 15.5.3 Specified — Module 1 and 2, account and access

| ID | Case | Precondition | Expected | Verifies | Status |
|---|---|---|---|---|---|
| TC-01-01 | Register with a valid address | Address unused | 201, unverified account, token issued | FR1 | ⬜ |
| TC-01-02 | Register with a duplicate address | Address registered | 409, no second row | FR3 | ⬜ |
| TC-01-03 | Password below the floor | — | 422, "Use at least 12 characters." | FR1, R19 | ⬜ |
| TC-01-04 | Verify with a valid token | Token unused, unexpired | Account verified, token consumed | FR2 | ⬜ |
| TC-01-05 | Reuse a consumed token | Token already used | 400, account state unchanged | FR2 | ⬜ |
| TC-01-06 | Expired verification token | Past `expiresAt` | 400, indistinguishable from invalid | FR2 | ⬜ |
| TC-01-07 | Sign in with correct credentials | Verified account | 200, token, `lastLoginAt` updated | FR4 | ⬜ |
| TC-01-08 | Wrong password and unknown address | — | **Identical message and comparable timing** | FR76 | ⬜ |
| TC-01-09 | Brute-force attempt | 11 attempts in the window | 11th throttled | NFR-9, FR74 | ⬜ |
| TC-01-10 | Password recovery end to end | Account exists | Token single-use, password replaced | FR6 | ⬜ blocked on G1 |
| TC-02-01 | Update profile | Signed in | Fields persisted, audit entry written | FR8, FR72 | ⬜ |
| TC-02-02 | Change password with a wrong current password | Signed in | Rejected, password unchanged | FR9 | ⬜ |
| TC-02-03 | Role enforcement on an officer route | Signed in as `RESIDENT` | 403, not 401 | FR10 | ⬜ |
| TC-02-04 | Deletion request | Signed in | Personal fields erased, `deletedAt` set, **audit entries retained with actor severed** | FR12, ER-7 | ⬜ |
| TC-02-05 | Soft-deleted account cannot sign in | `deletedAt` set | Same failure message as an unknown address | FR12, FR76 | ⬜ |

### 15.5.4 Specified — Module 5 to 8, reporting, evidence, review, duplicates

| ID | Case | Expected | Verifies | Status |
|---|---|---|---|---|
| TC-05-01 | Submit a valid report | Reference generated, unique, quotable | FR25, FR28 | ⬜ |
| TC-05-02 | Submit with a missing required field | 422 per-field errors | FR27 | ⬜ |
| TC-05-03 | Save a draft and return to it | `DRAFT` persists, not visible to officers | FR26 | ⬜ |
| TC-05-04 | Read another person's report | Not returned at all | FR29, ER-2 | ⬜ |
| TC-05-05 | Withdraw a report | `WITHDRAWN`, row retained | FR30 | ⬜ |
| TC-05-06 | Amount lost stored exactly | Whole cents, no float drift | Data integrity | ⬜ |
| TC-06-01 | Upload an accepted file type | Stored, metadata and SHA-256 recorded | FR31, FR32 | ⬜ |
| TC-06-02 | Upload an executable renamed as a PDF | **Rejected on content, not on name** | FR32, R8 Rule 6.5 | ⬜ |
| TC-06-03 | Upload over the size cap | Rejected before storage | FR33 | ⬜ |
| TC-06-04 | **EXIF stripped on ingest** | No GPS or device identifier survives | ER-5, AC-11 | ⬜ **Critical, RK-04** |
| TC-06-05 | Evidence read by an unauthorised user | Refused | FR35 | ⬜ |
| TC-06-06 | Every evidence read logged | `EvidenceAccessLog` row per access | FR36 | ⬜ |
| TC-06-07 | Digest verified on retrieval | Mismatch raises a security event | DFI-2 | ⬜ |
| TC-07-01 | Review queue ordering | Prioritised, oldest unassigned first | FR37 | ⬜ |
| TC-07-02 | Assign a reviewer | Recorded and visible | FR38 | ⬜ |
| TC-07-03 | Classify and set severity | Persisted as a **new** review row | FR39, FR40 | ⬜ |
| TC-07-04 | Reject without a reason | Refused | FR42 | ⬜ |
| TC-07-05 | Decision history survives a reversal | Both rows present | R8 Rule 8.4 | ⬜ |
| TC-07-06 | Request more information | Reporter notified, status changes | FR41, FR63 | ⬜ |
| TC-08-01 | Duplicate by phone, email and website | Candidates surfaced | FR45, FR46, FR47 | ⬜ |
| TC-08-02 | Duplicate by text similarity | Ranked with a similarity value | FR44 | ⬜ |
| TC-08-03 | **Nothing auto-merged** | Every link presented to a person | FR43, FR48 | ⬜ |
| TC-08-04 | Duplicate detection at 100,000 records | Under 2 seconds | NFR-3, AC-4 | ⬜ |

### 15.5.5 Specified — Module 9 to 12, community, recovery, notification, administration

| ID | Case | Expected | Verifies | Status |
|---|---|---|---|---|
| TC-09-01 | Draft an alert from a verified report | Created as `DRAFT` | FR49 | ⬜ |
| TC-09-02 | **Reporter anonymised** | No reporter field in any published response | FR50, ETH-4 | ⬜ |
| TC-09-03 | Author cannot approve their own alert | Refused | FR51 | ⬜ |
| TC-09-04 | Publish and search | Only `PUBLISHED` returned | FR52, FR53 | ⬜ |
| TC-09-05 | Archive rather than delete | Link does not 404 | FR54 | ⬜ |
| TC-09-06 | **No alleged scammer named** | Content check on every published field | ETH-9 | ⬜ |
| TC-10-01 | Browse, categorise and search resources | Correct results | FR55–FR57 | ⬜ |
| TC-10-02 | Recovery progress saved | Persists across sessions | FR60 | ⬜ |
| TC-11-01 | Notification on submission and status change | Delivered once, not duplicated | FR61, FR62 | ⬜ |
| TC-11-02 | Subscribe by category and by suburb | Only matching alerts delivered | FR64, FR65 | ⬜ |
| TC-11-03 | One-click unsubscribe without a login | Ends delivery | FR66 | ⬜ |
| TC-12-01 | Manage accounts and roles | Applied and audited | FR67, FR68 | ⬜ |
| TC-12-02 | Archive a scam category | Historical reports keep their classification | FR69 | ⬜ |
| TC-12-03 | Statistics by category, severity, status, suburb | Figures match the underlying rows | FR70 | ⬜ |
| TC-12-04 | **De-identified export** | Re-identification test passes; cell floor applied | FR71, ER-3, AC-9 | ⬜ |
| TC-12-05 | Audit log append-only | No update or delete path exists | FR72 | ⬜ |

### 15.5.6 Specified — non-functional

| ID | Case | Threshold | Verifies | Status |
|---|---|---|---|---|
| TC-NFR-01 | Page load under normal conditions | Under 3 seconds | NFR-1 | ⬜ **at risk** — 3.4 s boot animation gates first paint (G6) |
| TC-NFR-02 | Concurrent users | 1,000 | NFR-2, AC-4 | ⬜ |
| TC-NFR-03 | Query response at 100,000 records | Under 2 seconds | NFR-3 | ⬜ |
| TC-NFR-04 | Backup restoration drill | RTO 4 h, RPO 24 h | NFR-6, AC-5 | ⬜ |
| TC-NFR-05 | Keyboard-only journey through UC-01 | Completable, focus always visible | NFR-13 | ⬜ |
| TC-NFR-06 | Screen-reader announcement of a result | Announced politely; errors tied to fields | FR86, UI-5, UI-6 | ⬜ |
| TC-NFR-07 | Reduced-motion preference honoured | All decorative motion suppressed | UI-7 | 🟡 honoured in components; **the boot sequence does not** (G6) |
| TC-NFR-08 | 320-pixel viewport | No horizontal scroll, nothing clipped | NFR-14, UI-1 | ⬜ |
| TC-NFR-09 | No information by colour alone | Every band carries an icon and a label | NFR-13, UI-8 | ✅ verified by inspection |
| TC-NFR-10 | No secret in any log | Grep of the log stream | R8 Rule 6.7, AC-8 | ⬜ |
| TC-NFR-11 | Data residency across every provider | All Australian | ER-15, AC-12 | ⬜ |

### 15.5.7 Coverage summary

| Group | Cases | Executed | Passed | Not yet run |
|---|---|---|---|---|
| Modules 3–4, detection | 11 | 11 | **11** | 0 |
| Security controls | 5 | 5 | **5** | 0 |
| Modules 1–2 | 15 | 0 | — | 15 |
| Modules 5–8 | 24 | 0 | — | 24 |
| Modules 9–12 | 16 | 0 | — | 16 |
| Non-functional | 11 | 1 | 1 | 10 |
| **Total** | **82** | **17** | **17** | **65** |

**Sixteen of the seventeen executed cases exercise the two modules that are built, and all seventeen pass.** The other sixty-five cannot be run because the code they test does not exist. That is the honest coverage position, and it is the same one §14 gives in words: the specification is complete, the delivery is two modules deep.

**The blocker on all of it is gap G3.** Neither project defines a test script and no framework is installed. The eleven detection cases run today through a console harness (`frontend/src/lib/scam/__check__/run.ts`), which is a script, not a suite: it has no assertions that fail a build, no coverage measurement and no CI. Converting it to Vitest and requiring tests for the scoring function and every validation schema is the first task of implementation phase 1, and no module after it should be accepted without its cases from §15.5.3 to §15.5.5 passing.

---

# 16. Project management summary

## 16.1 Risk position

Risks are scored likelihood × impact on a 5×5 scale. Each carries a **trigger** — the observable signal that the risk is materialising — because a mitigation activated only after the damage is visible is not a mitigation.

| ID | Risk | Score | Rating | Owner | Position at this issue |
|---|---|---|---|---|---|
| RK-01 | Free-tier hosting cannot meet NFR-2 at public launch | 12 | High | Solution Architect | Open — load test not yet run (G9) |
| **RK-02** | **Enhanced FR approval delayed, blocking the Final SRS** | **12** | **High** | Business Analyst | ⚠️ **Materialised.** M7 passed on 12 Aug without decision. This document issues with the enhancements quarantined at §6 |
| RK-03 | Scope growth from enhanced FRs squeezes implementation | 12 | High | Project Manager | Controlled — capped at 20; reduction order defined at §6.6 |
| RK-04 | Evidence handling exposes personal data | 15 | **Critical** | Database Designer | Open — ER-5 not implemented (§10.4) |
| RK-05 | Council cannot commit reviewer capacity (~0.4 FTE) | 12 | High | Project Manager | Open — confirmation required by M13 |
| RK-06 | Loss of a team member | 12 | High | Project Manager | Mitigated — named backup per capability (§2.7) |
| RK-07 | Duplicate detection fails NFR-3 at 100,000 records | 9 | Moderate | Solution Architect | Open — candidate-set scoping designed; not yet tested |
| RK-08 | Security vulnerability introduced through inexperience | 15 | **Critical** | Solution Architect | Partly mitigated — controls fixed by rule; external review outstanding |
| **RK-09** | **Privacy officer review delayed; database built without sign-off** | **15** | **Critical** | Database Designer | ⚠️ **Materialised.** The migration preceded the gate (§4.6). Window to correct remains open only until first production use |
| RK-10 | Re-identification of a reporter from an alert or export | 10 | High | Database Designer | Open — ER-2 deviation and ER-3 not implemented |
| RK-11 | Discriminatory or biased risk scoring | 12 | High | Business Analyst | **Mitigated and verified** — non-discrimination audit passed (§10.3); review owner still unnamed (OI-7) |
| RK-12 | A third party is wrongly implicated | 16 | **Critical** | Business Analyst | Structurally mitigated (ETH-9); ER-13 schema controls absent |
| RK-13 | Accessibility deferred and WCAG 2.1 AA not achieved | 9 | Moderate | Frontend Lead | Partly mitigated — practices in the Definition of Done; audit outstanding |
| RK-14 | External service outage | 6 | Moderate | Solution Architect | Designed for — graceful degradation per service |
| RK-15 | Requirements instability after baseline | 8 | Moderate | Business Analyst | Controlled — change control; ambiguities raised as open issues rather than assumed |
| RK-16 | Data residency outside Australia | 8 | Moderate | Solution Architect | Partly verified — database in `ap-southeast-2`; other providers unverified |
| **RK-17** | **Client brief scope remains ambiguous (OI-1)** | **10** | **High** | Business Analyst | ⚠️ **Open since 8 July.** Resolution adopted and documented at §4.5 SD1; confirmation still outstanding |

**Four risks have materialised or remain unresolved past their trigger date: RK-02, RK-09, RK-17 and, in the schema, RK-04/RK-12.** All four depend on a decision from an external party. This is the pattern the Interim Project Report predicted: *several of the project's risks materialise as silence from an external party.*

## 16.2 Communication and escalation

| Audience | Frequency | Channel | Owner |
|---|---|---|---|
| Project supervisor / Lecturer | Fortnightly at iteration close | Meeting + written summary | Project Manager |
| CyberSafe Services manager | Monthly, plus on demand | Meeting + written status report | Project Manager |
| Council stakeholders | At each milestone gate | Formal deliverable + sign-off sheet | Project Manager |
| Council privacy officer | At M8, then on material change | Review meeting + D8 review pack | Database Designer |
| Council ICT and governance | M8 and M16 | Architecture and handover packs | Solution Architect |
| Council reviewers and administrators | M12, M14, M16 | Workshop / testing session | QA Lead |
| Team stand-up | 3× weekly, 15 min | Video call | Project Manager |
| Code review | Every pull request | GitHub | All developers |
| All stakeholders — Critical risk with a fired trigger | Within 2 working days | Email escalating to phone | Project Manager |

**Escalation path.** Level 1 blocking one member → role backup, same day. Level 2 blocking an iteration → Project Manager, 1 day. Level 3 decision outside team authority or a High risk → supervisor, 2 days. Level 4 scope/schedule/budget or a Critical risk → client, 3 days. **Level 5 privacy, legal or data-breach concern → privacy officer and supervisor simultaneously, same day.** Level 5 bypasses the sequence deliberately: a privacy concern that waits two working days for a checkpoint is a privacy concern left unaddressed for two working days.

## 16.3 Financial position

| Measure | Value |
|---|---|
| Cash cost to develop | **AUD $0** |
| Notional development labour value | ~AUD $64,800 |
| Annual operating cost once promoted | ~AUD $28,400 (infrastructure $4,400 + 0.2 FTE maintenance $24,000) |
| Year 1 total including one-off costs | ~AUD $43,400 |
| Three-year TCO | ~AUD $100,200 |
| Break-even benefit required | ~AUD $28,400/yr — roughly 0.14% of estimated local reported scam losses |
| Benefit–cost ratio | 3.5:1 conservative to 13.9:1 optimistic |

The economic case is robust because the break-even threshold is so low. **The service does not need to be highly effective to be worth doing — it needs to prevent a small handful of significant losses per year.**

**Annual operating cost, by line.** The $28,400 above is two lines, and only one of them is cash.

| Line | Component | Basis | Annual |
|---|---|---|---|
| Infrastructure | CDN static hosting | Paid tier, required before public promotion | — |
| Infrastructure | Managed PostgreSQL | `ap-southeast-2`, point-in-time recovery (NFR-5, NFR-6) | — |
| Infrastructure | Object storage | Private, encrypted at rest — evidence (FR31–FR36) | — |
| Infrastructure | Transactional email | SPF, DKIM and DMARC aligned (FR2, FR6, FR61–FR66) | — |
| Infrastructure | Monitoring and uptime | Probe against `/api/health/ready` plus alerting (NFR-26, G5) | — |
| | **Infrastructure subtotal** | | **~$4,400** |
| Maintenance | Council effort at 0.2 FTE | Rule-set review, moderation support, dependency upkeep | ~$24,000 |
| | **Total annual operating cost** | | **~$28,400** |

Individual infrastructure lines are not costed separately because each sits inside a provider's bundled tier at this scale; the subtotal is the figure that has been estimated and is the one to hold. **The paid tier must be approved before public promotion, not discovered after it** — feasibility condition 1 and risk RK-01. Every component in the table above except CDN hosting and the database is currently unprovisioned, which is why gaps G1 and G5 remain open.

## 16.4 Feasibility position

| Dimension | Assessment | Condition |
|---|---|---|
| Technical | **Feasible — high confidence** | None outstanding; all four Medium–High complexity modules have designed mitigations |
| Economic | **Feasible — compelling** | Paid-tier hosting (~$4,400/yr) approved before public promotion |
| Operational | **Feasible — conditional** | Council commits ~0.4 FTE reviewer capacity (A4, RK-05) |
| Legal | **Feasible** | Privacy officer sign-off; corrected NFR-30 adopted in Council's privacy statement |
| Schedule | **Feasible — tight** | M7 and M8 approvals obtained without further delay |
| Ethical | **Feasible — conditional** | Corrective migration at §10.4.4 applied before Module 5 |

**Overall recommendation: GO**, subject to the six conditions above.

## 16.5 Work breakdown structure

The WBS decomposes the project into deliverable work packages. Level 1 is the project, level 2 the five work packages, level 3 the tasks each contains, and level 4 the development activities that map onto the data-flow processes and the requirement modules.

```
1.0  CyberKent project
 │
 ├── 1.1  Project management
 │     ├── 1.1.1  Planning & scoping
 │     ├── 1.1.2  Status reporting
 │     └── 1.1.3  Risk management
 │
 ├── 1.2  System design & architecture
 │     ├── 1.2.1  Architecture design
 │     ├── 1.2.2  Database schema — PostgreSQL, Prisma, Neon
 │     └── 1.2.3  Security — WAF, JWT
 │
 ├── 1.3  Core development
 │     ├── 1.3.1  User account management            DFD 1.0 · Must
 │     │      └── 1.3.1.1  Registration & authentication      · §5.1
 │     │
 │     ├── 1.3.2  Scam report submission & analysis   DFD 2.0 · Must
 │     │      ├── 1.3.2.1  Scam report management             · §5.5
 │     │      ├── 1.3.2.2  Evidence management                · §5.6
 │     │      ├── 1.3.2.3  Text content analysis              · §5.3
 │     │      └── 1.3.2.4  URL & contact analysis             · §5.4
 │     │
 │     ├── 1.3.3  Community scam alerts               DFD 3.0 · Should
 │     │      ├── 1.3.3.1  Community scam alerts              · §5.9
 │     │      ├── 1.3.3.2  Scam awareness & recovery          · §5.10
 │     │      └── 1.3.3.3  Notification & subscription        · §5.11
 │     │
 │     └── 1.3.4  Admin report review & audit         DFD 4.0 · Must
 │
 ├── 1.4  Quality & testing
 │     ├── 1.4.1  Unit & integration tests
 │     ├── 1.4.2  System end-to-end tests
 │     └── 1.4.3  User acceptance testing — stakeholder approval
 │
 └── 1.5  Deployment
       ├── 1.5.1  Production environment setup — cloud-hosted
       └── 1.5.2  Post-deployment review & maintenance
```

Derived from the stakeholder-approved requirements baseline and the level 1 data-flow diagram (§12.3). Each level 4 activity carries the MoSCoW priority of the module it implements, so a package can be reduced in scope without a separate negotiation about what may be dropped.

| Package | Delivers | Requirements | Position at this issue |
|---|---|---|---|
| 1.1 Project management | Plan, status reporting, risk register | — | 🟡 Continuous; M0–M6 delivered on plan |
| 1.2 System design & architecture | Architecture, schema, security design | NFR-7–NFR-11, NFR-18–NFR-20 | 🟡 Complete but ⚠️ schema unsigned (§4.6) |
| 1.3 Core development | The twelve functional modules | FR1–FR72 | 🟡 Modules 3–4 complete; 1–2 partial; 5–12 specified |
| 1.4 Quality & testing | Test evidence at every level | AC-1 to AC-13 | 🟡 Static in place; no framework installed (G3) |
| 1.5 Deployment | Production environment, handover | NFR-25, NFR-26 | ⬜ Planned |

**Where the WBS and this specification disagree.** The WBS was authored against the four data-flow processes and carries five packages; §14.5 sequences delivery against the twelve requirement modules and seven phases. They decompose the same work along different axes — the WBS by deliverable, the delivery sequence by dependency — and both are retained because they answer different questions. Package 1.3.4 has no level 4 breakdown in the authored WBS; Modules 7 and 12 (FR37–FR42, FR67–FR72) supply it, and are treated as its children for planning purposes.

## 16.6 Schedule and Gantt chart

```
                                  |2026 Q3 |    Q4      | 2027 Q1    |    Q2
                                  |Aug Sep Oct Nov Dec Jan Feb Mar Apr May Jun
----------------------------------+--------------------------------------------
1.1   Project management          |........................................
1.2   System design & architecture|////////////////////
1.2.3   Security - WAF, JWT       |//////
SPRINT 1-2  CORE PLATFORM         |========
1.3.1   User accounts (DFD 1.0)   |########
1.3.4.3 Audit log management      |        ####
SPRINT 3-4  SCAM REPORTING        |        ========
1.3.2.1 Report mgmt (DFD 2.0)     |        ######
1.3.2.2 Evidence management       |            ######
1.3.2.3 Text content analysis     |              ######
1.3.2.4 URL & contact analysis    |                  ####
SPRINT 5-6  ADMIN PORTAL          |                ========
1.3.4.1 Review & verify (DFD 4.0) |                  ######
1.3.4.2 Admin reporting/analytics |                    ######
1.3.2.5 Duplicate detection       |                      ////
SPRINT 7-8  COMMUNITY             |                        ========
1.3.3.1 Community alerts (DFD 3.0)|                        //////
1.3.3.2 Awareness & recovery      |                          //////
1.3.3.3 Notify & subscribe        |                            //////
1.4.1   Unit & integration tests  |....................
1.4.2   System end-to-end tests   |                              ....
1.4.3   User acceptance testing   |                                ......
1.5.1   Production environment    |                                    ####
1.5.2   Post-deployment review    |                                      ######
----------------------------------+--------------------------------------------
milestones                        | <M1     <M2  <M3     <M4     <M5         <M6

Legend   # Must    / Should    . Continuous / QA    = Sprint window
```

| Milestone | Marks | Sprint scope |
|---|---|---|
| M1 | Stakeholder approval — interim SRS | — |
| M2 | Sprint 1–2 go-live | Core platform: accounts, audit logging |
| M3 | Sprint 3–4 release | Scam reporting: reports, evidence, text and URL analysis |
| M4 | Sprint 5–6 release | Admin portal: review, verification, analytics, duplicates |
| M5 | Sprint 7–8 release | Community: alerts, awareness, notifications |
| M6 | Project go-live | Production deployment and post-deployment review |

**Two schedules, and which one governs.** The chart above is the authored delivery schedule: eleven months on a sprint cadence, six sprint-release milestones, running to a go-live in June 2027. The schedule this project is being assessed and delivered against is the twenty-two week academic timetable at §14.4, which runs 30 June to 27 November 2026 with sixteen milestone gates.

**§14.4 governs.** The capstone unit fixes the end date, and no sprint plan can move it. The authored chart is retained for two reasons. It is the operational schedule Council would run the build on if the service were resourced beyond the capstone — the sprint boundaries, not the academic gates, are what a delivery team would work to. And it records the sequencing decision that both schedules share: accounts before reporting, reporting before review, review before community alerts, because each depends on the one before it. That dependency order is the part of the plan that survived contact with the work, and §14.5 restates it in phases.

The correspondence between the two is as follows.

| Authored sprint | Academic milestone | Modules | Position |
|---|---|---|---|
| Sprint 1–2 — core platform | M9 | 1, 2 | 🟡 In progress — 7 of 12 FRs |
| Sprint 3–4 — scam reporting | M10, M11 | 3, 4, 5, 6 | 🟡 Modules 3–4 ✅ **delivered early**; 5–6 planned |
| Sprint 5–6 — admin portal | M12 | 7, 8, 12 | ⬜ Planned |
| Sprint 7–8 — community | M13 | 9, 10, 11 | ⬜ Planned |
| Testing and UAT | M14 | — | ⬜ Planned |
| Deployment | M16 | — | ⬜ Planned |

**Float.** Approximately 2.5 weeks of float is distributed across the iterations rather than held as a block at the end, so that a slip in one module is absorbed where it happens instead of accumulating against the final gate. That float is what has absorbed the M7 and M8 approval delays so far; it is not unlimited, and §18 records both as blocking.

---

# 17. Responses to feedback from the lecturer

This section records feedback received on this specification and what was done about each point. It is maintained as a register: feedback is quoted as given, the response states what changed, and the location names where a reader can check it.

**Note on the record.** No lecturer feedback was recorded before this issue. The Interim Project Report lists "Responses to feedback from the Lecturer" as its section 12 in the contents, but the section does not appear in the body of that document. That omission is corrected here, and this register is now the single place where feedback and its resolution are held.

## 17.1 Feedback register — Final SRS Report, review of version 1.1

Received from the project supervisor / lecturer on review of version 1.1.

| # | Feedback as given | Response | Where |
|---|---|---|---|
| **L1** | *"The document explicitly identifies itself as an Interim SRS, with stakeholder approval pending and Final SRS requirements left as placeholders."* | **Accepted in substance, with one correction of fact.** The document has never identified as an Interim SRS: it is titled *Final Software Requirements Specification*, marked deliverable D11, and §1.1 states it supersedes the Interim SRS. What made it read as a draft was unfilled placeholders scattered through it — two team members' details, a blank sign-off table, an unassigned contribution table, ten unfilled forum links and a cover note headed "editorial checks required". **Every placeholder has been removed from the body and consolidated into one document-control block at §17.3**, so the specification now reads as a finished issue with its outstanding items in one declared place. | Cover · §17.3 |
| **L2** | *"Missing: team and individual contribution evidence."* | **Accepted.** Added team performance against specific tasks, assessed per capability with evidence and an honest verdict, plus a five-iteration commit record. The individual contribution table at Appendix F is assigned. | §2.7.2 · Appendix F |
| **L3** | *"Missing: use-case diagrams and definitions."* | **Partly pre-existing, now complete.** The use-case diagram was added in version 1.1 at §7.3 with a reconciliation against the specified model. What was genuinely missing was definitions: only four of nineteen cases were defined. **All fifteen remaining cases are now defined** to the same fields. | §7.2 · §7.3 · §7.4–7.7 · §7.8 |
| **L4** | *"Missing: ERD."* | **Pre-existing in version 1.1.** The conceptual entity-relationship diagram is at §11.2.1 with a table accounting for all seventeen differences between it and the migrated schema. If the reviewed copy was version 1.0, this is the difference. | §11.2.1 · §11.2.2 |
| **L5** | *"Missing: class diagram."* | **Accepted — genuinely absent.** Added, derived from the source rather than from an intended design, covering both the layered server modules and the client detection engine. It is used as evidence for three engineering rules the project committed to, and it states plainly what it does not show: Modules 5–12 have no classes because none are written. | §12.8 |
| **L6** | *"Missing: database tables / data dictionary."* | **Accepted.** §11.8 covered ten principal entities. Added the **complete dictionary: all 25 tables and all 188 columns**, with SQL types, nullability, keys, defaults, foreign-key targets and delete behaviour. It is generated from the schema and the migration rather than transcribed, so it cannot drift from the database it describes. | §11.9 |
| **L7** | *"Missing: DFDs."* | **Partly pre-existing, now complete.** The Level 1 diagram was added in version 1.1 at §12.4. Added the **Level 0 context diagram**, which fixes the system boundary and names every external entity — including one that receives nothing, and why. | §12.3 · §12.4 |
| **L8** | *"Missing: implementation evidence for encryption and anonymisation."* | **Accepted.** Added an evidence section rather than a further set of assertions: each control names its implementation, the file it lives in, how it was verified, and its status. Two controls were exercised against the running API for this issue. **Four controls are declared not implemented**, including EXIF stripping, and are not reported as satisfied. | §9.11 |
| **L9** | *"Missing: UI storyboards and input/output forms."* | **Partly pre-existing, now complete.** The six-frame storyboard was added in version 1.1 at §8.1.1. Added **eight input/output form specifications** with fields, validation, failure messages, outputs and the conventions common to all of them. | §8.1.1 · §8.1.2 |
| **L10** | *"Missing: test plan."* | **Partly pre-existing, now complete.** The verification strategy, the seven executed detection cases and thirteen release acceptance criteria were already at §15.1–15.3. What was missing was a case register beyond the detection engine. Added **82 test cases across every module**, of which 17 are executed and all 17 pass. The 65 that cannot be run are marked as such, with no result claimed. | §15.1–15.3 · §15.5 |
| **L11** | *"Missing: implementation plan."* | **Accepted.** §14.5 gave a delivery sequence only. Added a full plan: environments and what data each may hold, eight phases with owners, dependencies and exit conditions, deployment and cutover, resourcing, and risks to the plan. **Phase 0 records two defects in existing code** — the production start script and path-alias resolution — that were not previously in the gap register. | §14.7 |
| **L12** | *"Missing: DPIA."* | **Accepted.** §10.4 held a database ethics register, which is adjacent to a DPIA but is not one. Added a full assessment: description of processing, necessity and proportionality, nine risks to individuals with inherent and residual ratings, and an outcome. **The outcome is not a clearance:** four residual risks remain above tolerance, and the assessment states that the service may not accept reports or publish alerts until they are reduced. | §10.6 |
| **L13** | *"Missing: lecturer-feedback response."* | **Accepted.** This section. | §17 |
| **L14** | *"Missing: a proper academic reference list."* | **Accepted.** §1.4 was an internal register with no citation style. Added an APA 7 reference list covering legislation, standards, security and privacy guidance, the problem-domain literature and software engineering practice. §1.4 now states its own scope and points to it. | §1.4 · Appendix J |
| **L15** | *"No DFI assessment."* | **Accepted.** Added a data flow integrity assessment: four trust boundaries, a flow-by-flow assessment of all fifteen Level 1 flows against tampering and injection, two controls demonstrated against the running API, and five findings. **Two findings apply to code already written** — an integrity digest that is recorded but never verified on read, and an audit trail that is append-only by convention rather than by database permission. | §12.9 |

## 17.2 What the feedback changed, in summary

| Measure | Version 1.1 | Version 1.2 |
|---|---|---|
| Use cases defined | 4 of 19 | **19 of 19** |
| Database columns documented | ~40 principal attributes | **188 of 188** |
| Test cases registered | 7 | **82** |
| Diagrams | 10 | **12** — Level 0 DFD and class diagram added |
| Forms specified | 0 | **8** |
| Privacy assessment | Ethics register only | **Ethics register plus a full DPIA** |
| Placeholders in the body | 6 locations | **0 — consolidated to one block** |
| Reference list | Internal register only | **Internal register plus APA 7 list** |

**Two points of the fifteen were corrections of fact rather than additions**, and both are stated as such rather than quietly accepted: the document did not identify itself as interim (L1), and three of the elements reported missing were present in version 1.1 (L3, L4, L7, L9, L10 in part). Where the reviewed copy may have been version 1.0, that is noted. Everything else was accepted and acted on.

## 17.3 Document control — items requiring team input before submission

Every outstanding item in this specification is listed here, and nowhere else. The body of the document contains no placeholders.

| # | Item | Owner | Required for |
|---|---|---|---|
| 1 | Student IDs and contact details for Anthony Regalado and Saurav Khadka | Project Manager | Cover page |
| 2 | Resolve the Project Manager's student ID against the Project Charter — `K231673` and the email prefix `K231573` disagree | Project Manager | Cover page |
| 3 | Team sign-off on the role allocation at §2.7, which restates six charter roles for a three-member team | All members | §2.7 |
| 4 | Forum URLs for each posted deliverable | Project Manager | Appendix F |
| 5 | Signatures on the approval sheet | Named signatories | Cover page |
| 6 | Refresh the population and scam-loss figures against the current releases | Business Analyst | §2.1, §2.2.1, §16.3 |

All six are administrative and can be completed on the day of submission. **Nothing in the specification itself is outstanding.**

---

# 18. Open issues and decisions required

Consolidated list of every decision this project needs from stakeholders. Items marked **⚠️** are blocking.

| ID | Decision required | From | Needed by | Status |
|---|---|---|---|---|
| **OI-1** ⚠️ | Confirm the scope interpretation: the system is a **scam detection and reporting service**, not a cybersecurity self-assessment maturity tool (§4.5 SD1) | CyberSafe Services manager | M8 | **Open since 8 Jul** (RK-17) |
| **OI-2** | Sign off the technology deviation list (§13.5) | CyberSafe Services manager | M8 | Open |
| **OI-3** ⚠️ | Confirm the corrected NFR-30 purpose-limitation wording, and reflect it in Council's privacy statement (§4.5 SD3) | CyberSafe Services manager + privacy officer | M8 | **Open — compliance blocker** |
| **OI-4** ⚠️ | **Approve the 20 enhanced functional requirements at §6** | Supervisor + stakeholders | **M7 — 12 Aug, passed** | **Overdue** (RK-02) |
| **OI-5** | Sign off the hardware and software recommendations (§13) | CyberSafe Services manager | M8 | Open — recommendations supplied |
| **OI-6** | Approve the proposed quantitative parameters: performance metrics, session lifetime, file size limits, retention periods (§4.7, §11.8) | CyberSafe Services manager | M15 | Open |
| **OI-7** | Nominate a Council owner and review cadence for the detection rule set (ETH-3, ER-9, G10) | CyberSafe Services manager | M13 | **New in this issue** |
| **OI-8** | Confirm the interpretation of declared module 9 (scam map and trend analysis), which the brief gives only one FR (§4.3) | CyberSafe Services manager | M11 | **New in this issue** |
| **OI-9** | Accept or reject the five team-added NFRs — NFR-11, NFR-13, NFR-14, NFR-21, NFR-22 (§4.4) | CyberSafe Services manager | M8 | **New in this issue** |
| **OI-10** | Confirm the corrected NFR-23 wording — PostgreSQL, not MySQL (§4.5 SD4) | CyberSafe Services manager | M8 | **New in this issue** |
| **OI-11** ⚠️ | **Hold the database ethics review and resolve the ten schema deviations at §10.4.2** — specifically the ER-2, ER-4 and ER-7 design decisions | Council privacy officer + Database Designer | **Before Module 5** | **New in this issue — critical** |
| — | Confirm privacy officer availability for the M8 review | Council | 8 Aug 2026 | Open (feasibility condition 3) |
| — | Confirm ~0.4 FTE reviewer capacity | CyberSafe Services manager | M13 | Open (feasibility condition 2, RK-05) |
| — | Approve ~AUD $4,400/yr paid hosting before public promotion | CyberSafe Services manager | M16 | Open (feasibility condition 1, RK-01) |
| — | Provide the confirmed suburb list and scam category taxonomy | Council | Before M11 | Open (A10, G7) |

---

# 19. Conclusion

Group CyberKent is building CyberKent, an Online Scam Detection and Reporting System for Hume City Council CyberSafe Services, addressing a problem that is real, local, measurable and currently unaddressed: residents and small organisations in Hume have no trusted local way to check whether something is a scam, no easy way to report one, and no source of timely warnings — while Council has no visibility of what is happening to its own community.

This Final SRS establishes the complete requirements baseline. All **72 functional requirements** of the client brief are specified with testable acceptance criteria, none dropped and none silently reinterpreted. **Twenty enhanced functional requirements** are proposed separately, as the brief requires, with the six already implemented identified as such. **Thirty non-functional requirements** are specified and reconciled against the client's twenty-five. **Nine ethical requirements** and **fifteen database ethical risks** are recorded with enforcement mechanisms rather than intentions.

The conformance check at §4 is the section this document exists to produce. Reading the client brief carefully rather than transcribing it found four specification defects — a product-identity contradiction, a PHP mandate in a TypeScript system, a purpose-limitation clause naming matchmaking, and a MySQL reference in a PostgreSQL project — two coverage gaps between the declared modules and the requirement list, nine requirements with no measurable threshold, and five non-functional requirements the team had added without approval. Every one is documented with a proposed correction rather than resolved in silence. A requirement quietly reinterpreted is a requirement the client never agreed to.

On delivery, the position is honest and mixed. The **data layer is complete**, the **scam analysis engine works and is verified** — seven of seven classifications correct, with no false positive on genuine Council correspondence — and the **security foundation is in place**. Sixteen of seventy-two functional requirements are fully implemented and four partially. Modules 3 and 4 are delivered ahead of their milestone. Modules 5 to 12 exist as schema and design only.

Two findings deserve the reader's particular attention.

**The front end and back end have never communicated.** There is a working authentication API and a working interface, and no code connecting them. Closing that loop is the first task of the next phase, and nothing user-scoped can proceed until it is done.

**A governance control was bypassed.** The database migration was written on 7 August; the privacy officer review that was supposed to precede it is scheduled for 21 August and has not occurred. The audit at §10.4 found that ten of fifteen ethical mitigations are absent from the schema or implemented differently from the register, including four of the six rated Critical. No production personal data exists yet, so the window to correct this remains open — but it closes at first production use, and after that ER-2, ER-3 and ER-7 become close to impossible to fix. The corrective migration at §10.4.4 must be applied before Module 5 implementation begins.

The project's remaining risks are almost entirely external. Four have materialised or passed their trigger date, and each of them is a decision waiting on someone outside the team: the enhanced requirements approval that was due on 12 August, the scope confirmation open since 8 July, the privacy officer review, and the reviewer-capacity commitment. The team's own work — analysis, design, standards, the analysis engine, the security foundation — is done or on schedule.

The design work that matters most here was never the code. Getting the scoring transparent, the anonymisation genuine, the export non-re-identifiable and the innocent third party protected is what makes this service defensible to the people it scores and to the people it might wrongly implicate. A database that stores request payloads makes the right to erasure unachievable. A scoring engine that can reach a suburb column makes non-discrimination a matter of developer restraint rather than architecture. Those decisions are recorded here, most of them correctly made, and the ones still outstanding are named.

The requirements baseline, the conformance analysis, the ethical audit and the delivery position are now before the Lecturer, the supervisor and Council for review. The team will respond point by point to the feedback that comes back.

---

# 20. Appendices

## Appendix A — Glossary

| Term | Definition |
|---|---|
| **3NF** | Third Normal Form — the normalisation level required by NFR-20 |
| **ACCC** | Australian Competition and Consumer Commission |
| **ACSC** | Australian Cyber Security Centre |
| **APP** | Australian Privacy Principles, under the Privacy Act 1988 (Cth) |
| **Audit log** | An immutable record of security-relevant actions: who, what, when |
| **BEC** | Business Email Compromise — a scam type targeting organisations |
| **Crypto-shredding** | Rendering data unreadable by destroying its encryption key rather than deleting the record |
| **Indicator (analysis)** | One named reason contributing to a risk score, with weight and evidence |
| **Indicator (artefact)** | A URL, domain, phone number, email address or bank account recorded in the registry |
| **IDCARE** | Australia and New Zealand's national identity and cyber support service |
| **k-anonymity** | The guarantee that any published cell describes at least *k* individuals; k ≥ 5 here |
| **MoSCoW** | Must have, Should have, Could have, Won't have this time |
| **NASC** | National Anti-Scam Centre |
| **NDB scheme** | Notifiable Data Breaches scheme, under the Privacy Act 1988 (Cth) |
| **NFP** | Not-for-profit organisation |
| **NLP / OCR** | Natural Language Processing / Optical Character Recognition — deferred AI capabilities |
| **ORM** | Object-Relational Mapping — here, Prisma |
| **PIECES** | Performance, Information, Economics, Control, Efficiency, Services — an operational analysis framework |
| **Pseudonymisation** | Replacing identifying data with a token that cannot identify a person without separately held information |
| **Quasi-identifier** | An attribute not identifying alone but identifying in combination — postcode, date, amount |
| **RACI** | Responsible, Accountable, Consulted, Informed |
| **RBAC** | Role-Based Access Control |
| **RPO / RTO** | Recovery Point Objective / Recovery Time Objective — 24 hours and 4 hours (NFR-6) |
| **SPA** | Single Page Application |
| **SRS** | Software Requirements Specification |
| **TCO** | Total Cost of Ownership |
| **UAT** | User Acceptance Testing |
| **VPDSS** | Victorian Protective Data Security Standards |
| **WCAG 2.1 AA** | Web Content Accessibility Guidelines 2.1, conformance Level AA |

## Appendix B — Requirement index

| Range | Subject | Section |
|---|---|---|
| FR1–FR6 | Registration and authentication | §5.1 |
| FR7–FR12 | Profile and access control | §5.2 |
| FR13–FR18 | Scam content analysis | §5.3 |
| FR19–FR24 | URL and contact analysis | §5.4 |
| FR25–FR30 | Report management | §5.5 |
| FR31–FR36 | Evidence management | §5.6 |
| FR37–FR42 | Review and verification | §5.7 |
| FR43–FR48 | Duplicate and related report detection | §5.8 |
| FR49–FR54 | Community alerts | §5.9 |
| FR55–FR60 | Awareness and recovery | §5.10 |
| FR61–FR66 | Notification and subscription | §5.11 |
| FR67–FR72 | Administration, reporting and audit | §5.12 |
| **FR73–FR92** | **Enhanced — proposed, pending approval** | **§6** |
| CB-1–CB-25 | Client non-functional requirements | §9.10 |
| NFR-1–NFR-30 | Project non-functional requirements | §9 |
| ETH-1–ETH-9 | Ethical requirements | §10.1, §10.2 |
| ER-1–ER-15 | Database ethical risks | §10.4.2 |
| C1–C17 | Design and implementation constraints | §3.5 |
| A1–A12 | Assumptions | §3.6 |
| D1–D12 | Deliverables | §1.2.3 |
| DH1–DH12 | Data-handling rules | §11.7 |
| SD1–SD4 | Specification defects in the client brief | §4.5 |
| F-01–F-08 | Input and output forms | §8.1.2 |
| TC-\* | Test cases | §15.5 |
| DFI-1–DFI-5 | Data-flow-integrity findings | §12.9.4 |
| P1–P9 | Privacy risks | §10.6.3 |
| L1–L15 | Lecturer feedback and responses | §17.1 |
| UC-01–UC-19 | Use cases | §7 |
| PO/QO/EO/DO | Project objectives | §2.5 |
| RK-01–RK-17 | Risks | §16.1 |
| AC-1–AC-13 | Acceptance criteria | §15.3 |
| G1–G11 | Known gaps | §14.6 |
| OI-1–OI-11 | Open issues | §18 |

## Appendix C — Traceability matrix (module → architecture → quality → ethics)

| Module | Architecture components | NFR dependencies | Ethical risks | Use cases |
|---|---|---|---|---|
| M1 Authentication | `AuthenticationService`, JWT, bcrypt, email service | NFR-7–NFR-10 | ER-1, ER-14 | UC-02, UC-03, UC-04 |
| M2 Profile and access control | `UserService`, RBAC middleware | NFR-11, NFR-29 | ER-1, ER-7, ER-14 | UC-05, UC-06 |
| M3 Scam content analysis | `ScamAnalysisService`, risk engine | NFR-1, NFR-3 | ER-8, ER-9 | UC-01 |
| M4 URL and contact analysis | `ScamAnalysisService`, URL pipeline | NFR-1, NFR-3 | ER-13 | UC-01 |
| M5 Report management | `ReportService` | NFR-27, NFR-28 | ER-1, ER-4, ER-6 | UC-07, UC-08 |
| M6 Evidence management | `EvidenceService`, object storage, `AuditService` | NFR-8, NFR-11 | ER-5, ER-10, ER-12 | UC-07 |
| M7 Review and verification | `ReportService`, `NotificationService`, `AuditService` | NFR-11 | ER-10, ER-11 | UC-09 |
| M8 Duplicate detection | `ReportService` similarity matching | NFR-3 | ER-4, ER-13 | UC-10 |
| M9 Community alerts | `AlertService` | NFR-1 | ER-2, ER-13 | UC-11, UC-12 |
| M10 Awareness and recovery | Resource and recommendation services | NFR-12, NFR-13 | ER-1 | UC-14, UC-15 |
| M11 Notification and subscription | `NotificationService`, email service | NFR-4, NFR-25 | ER-6 | UC-16 |
| M12 Administration and audit | `AdministrationService`, `AnalyticsService`, `AuditService` | NFR-11, NFR-29 | ER-3, ER-7, ER-10, ER-11 | UC-13, UC-17, UC-18 |

## Appendix D — Detection rule set (FR15, ETH-3)

Published in full, because ETH-3 requires the scoring process to be transparent and auditable by Council.

### D.1 Text rules

| Rule ID | Label | Weight | What it looks for |
|---|---|---|---|
| `urgency` | Urgency language | HIGH | Deadlines and pressure — "within 24 hours", "final notice", "act now", "expires today", "last chance" |
| `threat` | Threatened consequence | HIGH | Suspension, deactivation, cancellation, termination, legal action, court, arrest, fine, penalty |
| `credentials` | Asks for credentials or banking details | HIGH | BSB, account number, card details, CVV, PIN, password, one-time code, "verify your identity" |
| `payment` | Unusual payment method | HIGH | Gift cards, iTunes, Google Play, Steam, bitcoin, crypto, USDT, wire transfer, Western Union, MoneyGram |
| `remote-access` | Asks to install software or grant access | HIGH | AnyDesk, TeamViewer, remote desktop, "install our app", "grant access" |
| `secrecy` | Asks you to keep it quiet | HIGH | "Do not tell", "keep this confidential", "between us", "don't tell anyone" |
| `payment-request` | Requests a payment or fee | MEDIUM | Dollar amounts, fee, outstanding, owing, unpaid, overdue, invoice, refund, rebate, deposit |
| `impersonation` | Impersonates a known organisation | MEDIUM | myGov, ATO, Australia Post, Linkt, Centrelink, Medicare, NBN, telcos, council, police, banks, major platforms |
| `link-bait` | Pushes you to a link | MEDIUM | "Click here", "follow the link", "log in here", "tap here", "visit". **Suppressed on the phone channel** (FR80) |
| `prize` | Unexpected prize or windfall | MEDIUM | "Congratulations", "you have won", winner, prize, lottery, lucky draw, "claim your reward" |
| `generic-greeting` | Generic greeting | LOW | "Dear customer", "valued customer", "account holder". Deliberately weak on its own |

### D.2 URL host checks (FR20–FR21)

| Check | Weight | Rationale |
|---|---|---|
| Malformed or unparseable host | MEDIUM | Unusual in a genuine message |
| High-abuse top-level domain (12 listed) | MEDIUM | Cheap to register; disproportionate share of abuse |
| Known URL shortener (10 listed) | MEDIUM | Hides the real destination until it has already been opened |
| Brand-lookalike domain (14 brands) | HIGH | Names a brand without being that brand's own domain |
| More than three subdomain levels | LOW | Pushes the real domain out of view on a phone |
| Raw IP address as host | HIGH | Genuine services publish a domain name, not a bare address |

**Exemption.** Hosts ending `.gov.au`, `.edu.au` or `.org.au` are exempt from host-shape penalties, because a scammer cannot register them.

### D.3 Artefact extraction (FR19, FR22, FR23)

URLs including scheme-less and raw-IP forms, with trailing sentence punctuation stripped and email hosts excluded so an address is not counted twice; email addresses normalised to lower case; Australian phone numbers in mobile (`04xx xxx xxx`), international (`+61 4xx xxx xxx`), 1300/1800 and area-code landline formats.

### D.4 Non-discrimination declaration

**No rule in this set references, or acts as a proxy for, an organisation's size, industry, revenue or resources, or an individual's nationality, ethnicity, religion, language, age, gender, disability, socio-economic status or place of residence.** Every rule targets scam *mechanics*. Verified by audit at §10.3 and subject to review before each release (ER-9).

## Appendix E — Repository layout

```
CyberKent/
├── Documents/                                 Source of every published document
│   ├── Project 31 - T2 2026.pdf               Client brief [R1]
│   ├── CPRO306 - Assessment Brief 2.pdf       Assessment criteria [R2]
│   ├── CyberKent-Interim-Project-Report.pdf   Charter, feasibility, risks [R4]
│   ├── Requirements.md                        Team working baseline [R3]
│   ├── TechStack.md                           Technology selection [R7]
│   ├── System-Architecture.md                 Architecture baseline [R6]
│   ├── UI-Design.md                           Visual design system [R10]
│   ├── Rules.md                               Development standards [R8]
│   ├── Avoid.md                               Prohibited practices [R9]
│   ├── Project-Features-and-Deliverables.md   Plain-language summary
│   └── Final-SRS-Report.md                    This document (D11)
│
├── backend/                                   710 lines TypeScript
│   ├── api/index.ts                           Serverless entry
│   ├── prisma.config.ts                       Prisma 7 config — URL held outside the schema
│   ├── prisma/
│   │   ├── schema.prisma                      25 models · 11 enums · 188 columns
│   │   └── migrations/                        20260807105640_init_cybersafe_schema
│   ├── scripts/verify-db.mjs                  Schema verification against the live database
│   └── src/
│       ├── app.ts                             Application factory — helmet, CORS, limits, routes
│       ├── server.ts                          Long-running entry
│       ├── config/env.ts                      Validated environment contract
│       ├── lib/                               Prisma client · response envelope · AppError
│       ├── middleware/                        auth (authn + authz) · validate · error
│       └── modules/
│           ├── auth/                          routes · controller · service · repository · schema
│           └── health/                        liveness and readiness
│
└── frontend/                                  19,326 lines TypeScript/TSX · 2,027 lines CSS
    ├── vercel.json                            SPA rewrites, CSP, security headers
    ├── scripts/                               1,550 lines — document build pipeline
    │   ├── build-documents.mjs                Renders Documents/*.md into the reader pages
    │   ├── documentData.mjs                   Extractors that read a document's own tables
    │   ├── documentFigures.mjs                Which figures each document carries, and where
    │   └── figures.mjs                        Figure renderers — flow, bars, donut, stats, grid
    └── src/
        ├── lib/scam/                          Detection engine (Modules 3–4)
        │   ├── types.ts                       Shared vocabulary — free of React and transport
        │   ├── patterns.ts                    11 text rules · TLD, brand and shortener lists
        │   ├── extract.ts                     URL, email and Australian phone extraction
        │   ├── media.ts                       File-envelope rules — no contents opened
        │   ├── ocr.ts                         In-browser text recognition (lazy-loaded)
        │   ├── analyse.ts                     Scoring, banding and confidence — pure
        │   ├── format.ts                      The report as text, for copy, download and share
        │   └── __check__/run.ts               Behavioural test set (11 cases)
        ├── pages/                             Landing · Documents · Document · Learn ·
        │                                      LearnArticle · Placeholder · NotFound
        ├── components/
        │   ├── landing/                       Hero · console showcase · capabilities · alerts
        │   ├── check/                         The scam checker dialog, scan overlay and report
        │   ├── documents/                     Reader chrome — contents rail, drawer, front matter
        │   ├── learn/                         Awareness article cards and bodies
        │   ├── present/                       The SRS presentation deck and its diagrams
        │   ├── settings/                      Grouped-list console primitives
        │   ├── layout/ · brand/ · boot/       Header, footer, mark, boot sequence
        │   └── globe/ · background/ · ui/     WebGL globe (code-split) · backdrops · primitives
        ├── config/                            site (brand, routes, nav) · layout · console
        ├── content/                           Page copy and the document register, held out
        │                                      of components
        ├── data/                              Country outlines for the globe
        ├── hooks/                             Device tier · viewport · scroll · interval · width
        ├── styles/                            Document reader stylesheet
        └── theme/                             Theme provider and persistence
```

**Two conventions visible in the layout.** Copy and configuration live in `content/` and `config/` rather than inside components, so wording and routing change in one place (R9 §3). The detection engine sits in `lib/scam/` with no dependency on React, the DOM or any transport, which is what allows the same functions to be tested in isolation and moved to the server unchanged when FR77 is implemented (§12.8).

## Appendix F — Document register and submission record

| Document | Role | Version | Date | Status |
|---|---|---|---|---|
| Project 31 — T2 2026 | Client brief [R1] | — | 14 Jul 2026 | Received |
| Requirements.md | Team working baseline [R3] | — | 16 Jul 2026 | Baselined |
| TechStack.md | Technology selection [R7] | 1.0 | 12 Jul 2026 | Baselined |
| System-Architecture.md | Architecture proposal [R6] | 1.0 | 12 Jul 2026 | Baselined |
| UI-Design.md | Visual design system [R10] | 1.0 | 15 Jul 2026 | Baselined |
| Rules.md | Development standards [R8] | 1.0 | 12 Jul 2026 | Adopted |
| Avoid.md | Prohibited practices [R9] | 1.0 | 12 Jul 2026 | Adopted |
| Interim SRS Report | D1 | 1.0 | 16 Jul 2026 | Superseded by this document |
| Interim Project Report | D6 | 1.0 | 1 Aug 2026 | Issued for review |
| **Final SRS Report** | **D11** | **1.2** | **28 Aug 2026** | **Issued for review** |

**Forum submission record.** The assessment requires links to all versions of iteration plans and reports to be posted to the unit discussion forum, evidencing individual and group work.

| # | Document and version | Issued | Posted | Forum link |
|---|---|---|---|---|
| 1 | Iteration 1 Plan v1.0 | 30 Jun 2026 | 30 Jun 2026 | |
| 2 | Technology Stack v1.0 | 12 Jul 2026 | 12 Jul 2026 | |
| 3 | System Architecture v1.0 | 12 Jul 2026 | 12 Jul 2026 | |
| 4 | Iteration 2 Plan v1.0 | 14 Jul 2026 | 14 Jul 2026 | |
| 5 | UI/UX Design System v1.0 | 15 Jul 2026 | 15 Jul 2026 | |
| 6 | Interim SRS Report v1.0 | 16 Jul 2026 | 16 Jul 2026 | |
| 7 | Iteration 3 Plan v1.0 | 28 Jul 2026 | 28 Jul 2026 | |
| 8 | Interim Project Report v1.0 | 1 Aug 2026 | 1 Aug 2026 | |
| 9 | **Final SRS Report v1.0** | **13 Aug 2026** | | |
| 10 | **Final SRS Report v1.1** — analysis and planning diagrams incorporated | **20 Aug 2026** | | |
| 11 | **Final SRS Report v1.2** — issued in response to lecturer feedback (§17) | **28 Aug 2026** | | |

> **This table is a form, completed on posting.** The Issued and Posted dates are the record; the link column
> is filled with the forum URL at the moment each item is posted, and is item 4 at §17.3. A blank link cell
> means not yet posted, not missing from this document.

**Individual contribution to this document**

Assigned by the capability that owns the content, per the RACI at Appendix G. Every section is reviewed by the full team.

| Section | Primary author | Reviewers |
|---|---|---|
| 1–3 Introduction, overview, description | Project Manager | Business Analyst, all |
| 4 Conformance check | Business Analyst | Project Manager, all |
| 5–7 Requirements, enhancements and use cases | Business Analyst | Solution Architect, all |
| 8 Interfaces, storyboard and forms | Frontend / UI-UX Lead | Solution Architect, all |
| 9 Non-functional requirements and encryption evidence | Solution Architect | Database Designer, all |
| 10 Ethical requirements and DPIA | Database Designer | Business Analyst, all |
| 11 Data requirements, ERD and data dictionary | Database Designer | Solution Architect, all |
| 12–13 Architecture, DFDs, class diagram, DFI, hardware and software | Solution Architect | Database Designer, all |
| 14–15 Status, traceability, implementation plan, verification and test cases | QA Lead | Project Manager, all |
| 16–20 Project management, feedback, open issues, conclusion, appendices | Project Manager | All |

## Appendix G — RACI matrix

*R = Responsible · A = Accountable · C = Consulted · I = Informed*

| Deliverable | PM | BA | Architect | DB Designer | Frontend | QA | Supervisor | Client |
|---|---|---|---|---|---|---|---|---|
| Project planning and schedule | A/R | C | C | C | C | C | I | I |
| Interim SRS Report (D1) | C | A/R | C | C | I | C | C | C |
| Technology selection (D2) | I | C | A/R | C | C | I | I | I |
| System architecture (D3) | I | C | A/R | C | C | C | I | I |
| UI/UX design system (D4) | I | C | C | I | A/R | C | I | I |
| Engineering standards (D5) | C | I | A/R | C | C | C | I | — |
| Interim Project Report (D6) | A/R | R | C | C | C | C | C | I |
| Enhanced FRs (D7) | C | A/R | C | C | C | C | C | C |
| Database design and ethics review (D8) | C | C | C | A/R | I | C | C | C |
| Backend implementation (D9) | I | C | A/R | R | I | C | I | I |
| Frontend implementation (D9) | I | C | C | I | A/R | C | I | I |
| Test strategy and evidence (D10) | I | C | C | C | C | A/R | I | C |
| **Final SRS Report (D11)** | **C** | **A/R** | **C** | **C** | **C** | **C** | **C** | **C** |
| Deployment and handover (D12) | A | I | R | R | C | C | I | C |
| Risk management | A/R | C | C | C | C | C | I | I |
| Stakeholder communication | A/R | R | I | I | I | I | I | I |

## Appendix H — Change log for this document

| Version | Date | Change |
|---|---|---|
| 1.0 | 13 Aug 2026 | First issue of the Final SRS Report. Consolidates the Interim SRS baseline; adds the conformance check against the client brief (§4) identifying four specification defects, two module/requirement coverage gaps, nine untestable requirements, five unapproved NFR additions and one bypassed governance control; adds the enhanced requirement set FR73–FR92 for approval (§6); adds the use-case model (§7); adds the audited database ethics register (§10.4); adds hardware and software recommendations (§13); adds the audited implementation status and eleven known gaps (§14); adds verification results for the detection engine (§15.2); adds eleven open issues (§18). |
| 1.1 | 20 Aug 2026 | Incorporates the project's analysis and planning diagrams, which existed as separate artefacts and were not carried by version 1.0. Adds the use-case diagram and its reconciliation against the specified use-case model (§7.3); the six-frame user storyboard for UC-01 (§8.1.1); the conceptual entity-relationship diagram and a table accounting for every difference between it and the migrated schema (§11.2.1, §11.2.2); the level 1 data-flow diagram, its fifteen flows, its mapping to the twelve modules and two divergences from the built system (§12.3); the work breakdown structure (§16.5); the Gantt chart schedule, with a statement of which of the two schedules governs (§16.6); the annual operating cost broken down by line (§16.3); and a list of figures (Appendix I). Sections 12.3 to 12.5 renumbered to 12.4 to 12.6, and 7.3 to 7.6 renumbered to 7.4 to 7.7, to admit the two new diagrams in reading order. No requirement, acceptance criterion, risk, gap or open issue was added, removed or altered. |
| 1.2 | 28 Aug 2026 | Issued in response to supervisor/lecturer feedback on version 1.1, recorded point by point with responses at §17. Adds: deliverables table (§1.2.3); team performance against specific tasks with the iteration record and a stated limitation on contribution evidence (§2.7.2); definitions for the fifteen use cases that had none (§7.8); eight input/output form specifications (§8.1.2); encryption and anonymisation implementation evidence with two controls demonstrated against the running API (§9.11); a data protection impact assessment with nine risks and an outcome that withholds clearance for reporting and alerting (§10.6); the complete data dictionary, all 25 tables and 188 columns, generated from the schema and migration (§11.9); the Level 0 context data-flow diagram (§12.3); the class diagram, derived from source (§12.8); a data flow integrity assessment covering four trust boundaries and all fifteen flows, with five findings (§12.9); an implementation plan with environments, eight phases, cutover and resourcing, recording two previously unlogged defects in existing code (§14.7); an 82-case test register (§15.5); responses to lecturer feedback as a new section (§17); and an APA 7 reference list (Appendix J). Sections 17–19 renumbered to 18–20. Every placeholder removed from the document body and consolidated into a single control register at §17.3. **Corrections in the same pass:** the front-end source figure was three issues out of date and is now measured (19,326 lines, not ~7,400); the implementation-status audit now cites commit `f8e813a`, the most recent commit changing application code, in place of `83a4c62`; Appendix E's repository layout was regenerated from the tree and had been missing the document build pipeline, five detection-engine modules and four page routes; Appendix I's figure list is ordered by section; and the `D` identifier, which had been carrying three meanings at once, is disambiguated — `D` remains the deliverable, data-handling rules become `DH1–DH12` and the client brief's specification defects become `SD1–SD4`, with §1.5 and Appendix B extended to name every identifier family in use. No requirement, acceptance criterion, risk or open issue was altered. |

## Appendix I — List of figures

| Figure | Title | Section | Source |
|---|---|---|---|
| 1 | Use-case diagram | §7.3 | Authored during analysis |
| 2 | User storyboard — UC-01, six frames | §8.1.1 | Authored from the delivered interface |
| 3 | Conceptual entity-relationship diagram, four clusters | §11.2.1 | Authored during analysis |
| 4 | Report lifecycle | §11.5 | Derived from the implemented schema |
| 5 | Alert lifecycle | §11.6 | Derived from the implemented schema |
| 6 | Layered architecture | §12.2 | Derived from the implementation |
| 7 | Level 0 data-flow diagram — context | §12.3 | Derived from the client brief and the system boundary |
| 8 | Level 1 data-flow diagram | §12.4 | Authored during analysis |
| 9 | Request flow — a checked message with server-side persistence | §12.5 | Design for FR77 |
| 10 | Class diagram — server modules and detection engine | §12.8 | Derived from the implemented source |
| 11 | Work breakdown structure | §16.5 | Authored during planning |
| 12 | Gantt chart schedule | §16.6 | Authored during planning |

**On the five authored diagrams.** Figures 1, 3, 8, 11 and 12 are the analysis and planning diagrams the team produced, reproduced here as drawn rather than re-derived from this specification. Where an authored diagram and the specified model disagree, the disagreement is a decision taken between analysis and build, and each one is accounted for at the point the diagram appears: §7.3.2 for the use-case model, §11.2.2 for the data model, §12.4 for the process model, and §16.5 and §16.6 for the plan. In every case this specification states which of the two governs, so that no reader has to guess and no difference passes as an oversight.

**On drawing them as text.** Every figure is drawn in characters rather than embedded as an image. Three reasons: a label can be corrected in the source without re-exporting a picture; the diagrams survive being read as plain text, printed, or pasted into a plain-text medium; and a screen reader reaches the content, which an unlabelled exported image would not (NFR-13).


## Appendix J — Reference list

Cited in APA 7th edition. The internal register at §1.4 identifies project documents by the short codes R1 to R21 used throughout this specification; this list is the academic and authoritative-source citation for the external works among them, together with the standards, legislation and literature the specification relies on.

### Legislation and regulatory instruments

Disability Discrimination Act 1992 (Cth) (Austl.). https://www.legislation.gov.au/C2004A04426/latest/text

Notifiable Data Breaches scheme, Privacy Act 1988 (Cth) pt IIIC (Austl.).

Office of the Australian Information Commissioner. (2019). *Australian Privacy Principles guidelines*. https://www.oaic.gov.au/privacy/australian-privacy-principles-guidelines

Office of the Australian Information Commissioner. (2021). *Guide to undertaking privacy impact assessments*. https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/privacy-impact-assessments

Office of the Victorian Information Commissioner. (2024). *Victorian Protective Data Security Standards* (Version 2.1). https://ovic.vic.gov.au/information-security/standards/

Privacy Act 1988 (Cth) (Austl.). https://www.legislation.gov.au/C2004A03712/latest/text

Privacy and Data Protection Act 2014 (Vic) (Austl.). https://www.legislation.vic.gov.au/in-force/acts/privacy-and-data-protection-act-2014

### Standards

International Organization for Standardization. (2018). *ISO/IEC/IEEE 29148:2018 — Systems and software engineering: Life cycle processes — Requirements engineering*. https://www.iso.org/standard/72089.html

Institute of Electrical and Electronics Engineers. (1998). *IEEE Std 830-1998: IEEE recommended practice for software requirements specifications*. IEEE. https://doi.org/10.1109/IEEESTD.1998.88286

World Wide Web Consortium. (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21/

### Security and privacy guidance

Australian Cyber Security Centre. (2024). *Essential Eight maturity model*. Australian Signals Directorate. https://www.cyber.gov.au/resources-business-and-government/essential-cyber-security/essential-eight

Grassi, P. A., Fenton, J. L., Newton, E. M., Perlner, R. A., Regenscheid, A. R., Burr, W. E., Richer, J. P., Lefkovitz, N. B., Danker, J. M., Choong, Y.-Y., Greene, K. K., & Theofanos, M. F. (2017). *Digital identity guidelines: Authentication and lifecycle management* (NIST Special Publication 800-63B). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-63b

OWASP Foundation. (2021). *OWASP Top 10: 2021 — The ten most critical web application security risks*. https://owasp.org/Top10/

Provos, N., & Mazières, D. (1999). A future-adaptable password scheme. In *Proceedings of the 1999 USENIX Annual Technical Conference* (pp. 81–91). USENIX Association. https://www.usenix.org/legacy/events/usenix99/provos.html

Sweeney, L. (2002). k-anonymity: A model for protecting privacy. *International Journal of Uncertainty, Fuzziness and Knowledge-Based Systems, 10*(5), 557–570. https://doi.org/10.1142/S0218488502001648

### Scams, fraud and the problem domain

Australian Competition and Consumer Commission. (2024). *Targeting scams: Report of the ACCC on scams activity 2023*. https://www.accc.gov.au/system/files/targeting-scams-report-2023.pdf

Australian Competition and Consumer Commission. (n.d.). *Scamwatch: Types of scams*. National Anti-Scam Centre. Retrieved 20 August 2026, from https://www.scamwatch.gov.au/types-of-scams

IDCARE. (n.d.). *National identity and cyber support service*. Retrieved 20 August 2026, from https://www.idcare.org

Whitty, M. T. (2019). Predicting susceptibility to cyber-fraud victimhood. *Journal of Financial Crime, 26*(1), 277–292. https://doi.org/10.1108/JFC-10-2017-0095

### Local government and community context

Australian Bureau of Statistics. (2021). *2021 Census QuickStats: Hume (C) local government area*. https://abs.gov.au/census/find-census-data/quickstats/2021/LGA23270

Hume City Council. (2024). *Council plan 2021–2025*. https://www.hume.vic.gov.au/Council/Council-Plan

### Software engineering practice

Fowler, M. (2019, June 5). *Monolith first*. martinfowler.com. https://martinfowler.com/bliki/MonolithFirst.html

Martin, R. C. (2017). *Clean architecture: A craftsman's guide to software structure and design*. Prentice Hall.

Newman, S. (2019). *Monolith to microservices: Evolutionary patterns to transform your monolith*. O'Reilly Media.

### A note on sources

Two claims in this specification rest on figures that require confirmation against a current source before submission, and are marked here rather than left to be discovered: the resident population and demographic profile of the municipality (§2.1, §2.2.1), and the estimated local share of national reported scam losses used in the benefit case (§16.3). Both are cited above to the authoritative publisher, and both should be refreshed to the most recent release at the point of submission, since the figures move annually.

---

*Prepared by Group CyberKent for Hume City Council CyberSafe Services, CPRO306 Capstone Project, Kent Institute Australia — first issued 13 August 2026; version 1.2 issued 28 August 2026.*

*This document describes an advisory scam-detection service. Consistent with the ethical requirements it specifies, the system it describes does not constitute professional cybersecurity certification, does not guarantee protection from cyberattacks, and is not a substitute for qualified professional assistance or the relevant authorities.*

*End of Final SRS Report, version 1.2.*
