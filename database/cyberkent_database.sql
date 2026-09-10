-- =============================================================================
-- CyberKent — Online Scam Detection and Reporting System
-- Hume City Council CyberSafe Services · Group CyberKent · CPRO306
--
-- Database file (PostgreSQL 18, Neon serverless, region ap-southeast-2 Sydney)
-- Exported with pg_dump 18.6 on 10 September 2026 from the development database.
--
-- Contents
--   * Full physical schema: 26 domain tables + Prisma's _prisma_migrations
--     table, 14 enumerated types, 35 foreign keys, 86 indexes (incl. primary-key and unique), 11 CHECK
--     constraints (see migration 20260910100000_ai_interactions_and_ethics_controls).
--   * Reference data: 14 Scamwatch scam categories, 23 Hume suburbs and
--     postcodes, 4 awareness resources, a 6-step recovery checklist.
--   * Synthetic records only (ER-12): every person uses the reserved .test
--     domain or is the seed administrator; every report, alert and check is
--     labelled SYNTHETIC. No real resident's data exists in this file.
--   * Password hashes have been replaced with a placeholder (Avoid.md §6 — never
--     expose password hashes). The seeded accounts' real passwords were random
--     values that were never stored, so no credential is lost by the redaction.
--
-- Restore into an empty PostgreSQL 15+ database:
--   psql "$DATABASE_URL" -f cyberkent_database.sql
-- The schema source of truth is backend/prisma/schema.prisma and its migrations.
-- =============================================================================

--
-- PostgreSQL database dump
--

\restrict 2vpmcbwg1nLJH3PnpwgIRrMs7XIDh0fBr6XGA5OJKOIVVAlunSM4SfO0qd0P6VQ

-- Dumped from database version 18.6 (2078fcb)
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "public";


--
-- Name: AiFeature; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."AiFeature" AS ENUM (
    'TEXT_ANALYSIS',
    'IMAGE_ANALYSIS',
    'ASSISTANT'
);


--
-- Name: AiOutcome; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."AiOutcome" AS ENUM (
    'SUCCEEDED',
    'BLOCKED',
    'REFUSED',
    'UNAVAILABLE',
    'FAILED'
);


--
-- Name: AlertStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."AlertStatus" AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'PUBLISHED',
    'ARCHIVED'
);


--
-- Name: Channel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."Channel" AS ENUM (
    'SMS',
    'EMAIL',
    'PHONE',
    'WEBSITE',
    'SOCIAL',
    'POST',
    'OTHER'
);


--
-- Name: IndicatorStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."IndicatorStatus" AS ENUM (
    'UNVERIFIED',
    'VERIFIED',
    'DISPUTED',
    'REJECTED'
);


--
-- Name: IndicatorType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."IndicatorType" AS ENUM (
    'URL',
    'DOMAIN',
    'PHONE',
    'EMAIL',
    'BANK_ACCOUNT'
);


--
-- Name: IndicatorWeight; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."IndicatorWeight" AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW'
);


--
-- Name: NotificationKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."NotificationKind" AS ENUM (
    'REPORT_SUBMITTED',
    'REPORT_STATUS_CHANGED',
    'INFORMATION_REQUESTED',
    'ALERT_PUBLISHED'
);


--
-- Name: RelationKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."RelationKind" AS ENUM (
    'DUPLICATE',
    'RELATED'
);


--
-- Name: ReportStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."ReportStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'INFORMATION_REQUESTED',
    'APPROVED',
    'REJECTED',
    'WITHDRAWN'
);


--
-- Name: RiskBand; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."RiskBand" AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW',
    'UNCLEAR'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."Role" AS ENUM (
    'RESIDENT',
    'BUSINESS',
    'OFFICER',
    'ADMIN'
);


--
-- Name: Severity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."Severity" AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW'
);


--
-- Name: SubscriptionScope; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."SubscriptionScope" AS ENUM (
    'CATEGORY',
    'SUBURB',
    'ALL'
);


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: AccountDeletionRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."AccountDeletionRequest" (
    "id" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "reason" "text",
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "processedAt" timestamp(3) without time zone
);


--
-- Name: AiInteraction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."AiInteraction" (
    "id" "text" NOT NULL,
    "userId" "text",
    "feature" "public"."AiFeature" NOT NULL,
    "outcome" "public"."AiOutcome" NOT NULL,
    "provider" "text" NOT NULL,
    "model" "text" NOT NULL,
    "promptVersion" "text" NOT NULL,
    "inputSha256" "text" NOT NULL,
    "inputChars" integer NOT NULL,
    "redactions" integer DEFAULT 0 NOT NULL,
    "verdict" "text",
    "riskScore" integer,
    "confidence" double precision,
    "latencyMs" integer,
    "inputTokens" integer,
    "outputTokens" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "AiInteraction_confidence_range_chk" CHECK ((("confidence" IS NULL) OR (("confidence" >= (0)::double precision) AND ("confidence" <= (1)::double precision)))),
    CONSTRAINT "AiInteraction_hash_shape_chk" CHECK (("inputSha256" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "AiInteraction_risk_range_chk" CHECK ((("riskScore" IS NULL) OR (("riskScore" >= 0) AND ("riskScore" <= 100))))
);


--
-- Name: Alert; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Alert" (
    "id" "text" NOT NULL,
    "reference" "text" NOT NULL,
    "sourceReportId" "text",
    "categoryId" "text",
    "suburbId" "text",
    "channel" "public"."Channel" NOT NULL,
    "status" "public"."AlertStatus" DEFAULT 'DRAFT'::"public"."AlertStatus" NOT NULL,
    "severity" "public"."Severity" NOT NULL,
    "headline" "text" NOT NULL,
    "specimen" "text",
    "summary" "text" NOT NULL,
    "authorId" "text",
    "approvedById" "text",
    "publishedAt" timestamp(3) without time zone,
    "archivedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "Alert_published_is_severed_chk" CHECK ((("status" <> 'PUBLISHED'::"public"."AlertStatus") OR ("sourceReportId" IS NULL)))
);


--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."AuditLog" (
    "id" "text" NOT NULL,
    "userId" "text",
    "action" "text" NOT NULL,
    "entityType" "text" NOT NULL,
    "entityId" "text",
    "metadata" "jsonb",
    "ipAddress" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "retentionUntil" timestamp(3) without time zone
);


--
-- Name: AwarenessResource; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."AwarenessResource" (
    "id" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "body" "text" NOT NULL,
    "readingTime" "text" NOT NULL,
    "archivedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: EmailVerificationToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."EmailVerificationToken" (
    "id" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "tokenHash" "text" NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Evidence" (
    "id" "text" NOT NULL,
    "reportId" "text" NOT NULL,
    "description" "text",
    "originalName" "text" NOT NULL,
    "mimeType" "text" NOT NULL,
    "sizeBytes" integer NOT NULL,
    "sha256" "text" NOT NULL,
    "storageKey" "text" NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "metadataStrippedAt" timestamp(3) without time zone,
    "retentionUntil" timestamp(3) without time zone,
    CONSTRAINT "Evidence_size_positive_chk" CHECK (("sizeBytes" > 0))
);


--
-- Name: EvidenceAccessLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."EvidenceAccessLog" (
    "id" "text" NOT NULL,
    "evidenceId" "text" NOT NULL,
    "userId" "text",
    "action" "text" NOT NULL,
    "ipAddress" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Indicator; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Indicator" (
    "id" "text" NOT NULL,
    "type" "public"."IndicatorType" NOT NULL,
    "value" "text" NOT NULL,
    "reportCount" integer DEFAULT 0 NOT NULL,
    "firstSeenAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastSeenAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "confidence" double precision,
    "expiresAt" timestamp(3) without time zone,
    "verificationStatus" "public"."IndicatorStatus" DEFAULT 'UNVERIFIED'::"public"."IndicatorStatus" NOT NULL,
    CONSTRAINT "Indicator_confidence_range_chk" CHECK ((("confidence" IS NULL) OR (("confidence" >= (0)::double precision) AND ("confidence" <= (1)::double precision))))
);


--
-- Name: InformationRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."InformationRequest" (
    "id" "text" NOT NULL,
    "reportId" "text" NOT NULL,
    "requestedById" "text",
    "message" "text" NOT NULL,
    "respondedAt" timestamp(3) without time zone,
    "response" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Notification" (
    "id" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "kind" "public"."NotificationKind" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "linkPath" "text",
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "retentionUntil" timestamp(3) without time zone
);


--
-- Name: NotificationPreference; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."NotificationPreference" (
    "id" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "emailOnStatus" boolean DEFAULT true NOT NULL,
    "emailOnAlerts" boolean DEFAULT true NOT NULL,
    "emailOnRequest" boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PasswordResetToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."PasswordResetToken" (
    "id" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "tokenHash" "text" NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: RecoveryChecklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."RecoveryChecklist" (
    "id" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "situation" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: RecoveryProgress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."RecoveryProgress" (
    "id" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "stepId" "text" NOT NULL,
    "completedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: RecoveryStep; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."RecoveryStep" (
    "id" "text" NOT NULL,
    "checklistId" "text" NOT NULL,
    "position" integer NOT NULL,
    "title" "text" NOT NULL,
    "detail" "text" NOT NULL
);


--
-- Name: Report; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Report" (
    "id" "text" NOT NULL,
    "reference" "text" NOT NULL,
    "authorId" "text",
    "categoryId" "text",
    "suburbId" "text",
    "channel" "public"."Channel" NOT NULL,
    "status" "public"."ReportStatus" DEFAULT 'DRAFT'::"public"."ReportStatus" NOT NULL,
    "severity" "public"."Severity",
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "amountLostCents" integer,
    "occurredAt" timestamp(3) without time zone,
    "submittedAt" timestamp(3) without time zone,
    "withdrawnAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "reviewerId" "text",
    "retentionUntil" timestamp(3) without time zone,
    CONSTRAINT "Report_amount_nonnegative_chk" CHECK ((("amountLostCents" IS NULL) OR ("amountLostCents" >= 0)))
);


--
-- Name: ReportIndicator; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."ReportIndicator" (
    "reportId" "text" NOT NULL,
    "indicatorId" "text" NOT NULL
);


--
-- Name: ReportRelation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."ReportRelation" (
    "id" "text" NOT NULL,
    "sourceId" "text" NOT NULL,
    "targetId" "text" NOT NULL,
    "kind" "public"."RelationKind" NOT NULL,
    "similarity" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "ReportRelation_not_self_chk" CHECK (("sourceId" <> "targetId")),
    CONSTRAINT "ReportRelation_similarity_range_chk" CHECK ((("similarity" IS NULL) OR (("similarity" >= (0)::double precision) AND ("similarity" <= (1)::double precision))))
);


--
-- Name: ReportReview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."ReportReview" (
    "id" "text" NOT NULL,
    "reportId" "text" NOT NULL,
    "reviewerId" "text",
    "decision" "public"."ReportStatus" NOT NULL,
    "severity" "public"."Severity",
    "notes" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ScamCategory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."ScamCategory" (
    "id" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "archivedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ScamCheck; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."ScamCheck" (
    "id" "text" NOT NULL,
    "userId" "text",
    "channel" "public"."Channel" NOT NULL,
    "content" "text" NOT NULL,
    "score" integer NOT NULL,
    "band" "public"."RiskBand" NOT NULL,
    "confidence" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "retentionUntil" timestamp(3) without time zone,
    "ruleSetVersion" "text",
    CONSTRAINT "ScamCheck_confidence_range_chk" CHECK ((("confidence" >= (0)::double precision) AND ("confidence" <= (1)::double precision))),
    CONSTRAINT "ScamCheck_score_range_chk" CHECK ((("score" >= 0) AND ("score" <= 100)))
);


--
-- Name: ScamCheckIndicator; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."ScamCheckIndicator" (
    "id" "text" NOT NULL,
    "checkId" "text" NOT NULL,
    "ruleId" "text" NOT NULL,
    "label" "text" NOT NULL,
    "detail" "text" NOT NULL,
    "weight" "public"."IndicatorWeight" NOT NULL,
    "evidence" "text"
);


--
-- Name: Subscription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Subscription" (
    "id" "text" NOT NULL,
    "userId" "text",
    "email" "text" NOT NULL,
    "scope" "public"."SubscriptionScope" NOT NULL,
    "categoryId" "text",
    "suburbId" "text",
    "confirmedAt" timestamp(3) without time zone,
    "unsubscribedAt" timestamp(3) without time zone,
    "unsubscribeTokenHash" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Suburb; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Suburb" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "postcode" "text" NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."User" (
    "id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "passwordHash" "text" NOT NULL,
    "fullName" "text" NOT NULL,
    "organisation" "text",
    "phone" "text",
    "role" "public"."Role" DEFAULT 'RESIDENT'::"public"."Role" NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    "lastLoginAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "retentionUntil" timestamp(3) without time zone
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: AccountDeletionRequest; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: AiInteraction; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."AiInteraction" ("id", "userId", "feature", "outcome", "provider", "model", "promptVersion", "inputSha256", "inputChars", "redactions", "verdict", "riskScore", "confidence", "latencyMs", "inputTokens", "outputTokens", "createdAt") VALUES ('cmtvclz1j00003sobtzvuphy8', NULL, 'TEXT_ANALYSIS', 'UNAVAILABLE', 'openai', 'n/a', 'n/a', 'ada01fdc9c48e97ddcfe84471b119fba717542bd863e07bc260c350f62f789ca', 76, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 09:52:09.895');


--
-- Data for Name: Alert; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."Alert" ("id", "reference", "sourceReportId", "categoryId", "suburbId", "channel", "status", "severity", "headline", "specimen", "summary", "authorId", "approvedById", "publishedAt", "archivedAt", "createdAt", "updatedAt") VALUES ('cmtvcanyy001n8oobbjkaadc8', 'ALERT-SYN-0001', NULL, 'cmtvc9xo700023vobzj9k30sn', 'cmtvc9xwz000j3vobt7jymtew', 'SMS', 'PUBLISHED', 'MEDIUM', 'SYNTHETIC — Fake toll texts circulating in Craigieburn', 'LINKT: You have an unpaid toll of $4.20 … Settle now: [link removed]', 'Texts claiming an unpaid toll link to a fake payment page. Linkt does not send payment links by text; check your account at linkt.com.au.', 'cmtvcan9m001d8oob28sisklo', 'cmtvcamux001b8oobobhn0vv9', '2026-09-01 22:00:00', NULL, '2026-09-10 09:43:22.33', '2026-09-10 09:43:22.33');


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."AuditLog" ("id", "userId", "action", "entityType", "entityId", "metadata", "ipAddress", "createdAt", "retentionUntil") VALUES ('cmtvcanzz001o8oob6a4cq1rg', 'cmtvcamux001b8oobobhn0vv9', 'ALERT_PUBLISHED', 'Alert', 'ALERT-SYN-0001', '{"report": "HCC-SYN-0001", "synthetic": true, "sourceReportSevered": true}', NULL, '2026-09-10 09:43:22.367', '2033-09-01 14:00:00');


--
-- Data for Name: AwarenessResource; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."AwarenessResource" ("id", "slug", "title", "category", "summary", "body", "readingTime", "archivedAt", "createdAt", "updatedAt") VALUES ('cmtvc9ybf00113vobfowetbff', 'first-hour', 'The first hour after you have been scammed', 'Recovery', 'Who to call first, what to freeze, and what evidence to keep before anything is deleted from your phone.', 'Who to call first, what to freeze, and what evidence to keep before anything is deleted from your phone. Read the full guide at /learn/first-hour.', '4 min', NULL, '2026-09-10 09:42:49.083', '2026-09-10 09:43:20.251');
INSERT INTO "public"."AwarenessResource" ("id", "slug", "title", "category", "summary", "body", "readingTime", "archivedAt", "createdAt", "updatedAt") VALUES ('cmtvc9yc600123vob7qy6oj67', 'small-business', 'Payment redirection: a checklist for small teams', 'Small business', 'How invoice fraud reaches a business inbox, and the two verification habits that stop almost all of it.', 'How invoice fraud reaches a business inbox, and the two verification habits that stop almost all of it. Read the full guide at /learn/small-business.', '6 min', NULL, '2026-09-10 09:42:49.11', '2026-09-10 09:43:20.261');
INSERT INTO "public"."AwarenessResource" ("id", "slug", "title", "category", "summary", "body", "readingTime", "archivedAt", "createdAt", "updatedAt") VALUES ('cmtvc9ycf00133vobgcnmweom', 'older-residents', 'Talking to family about phone scams', 'Community', 'A conversation guide for supporting older relatives without taking away their independence or confidence.', 'A conversation guide for supporting older relatives without taking away their independence or confidence. Read the full guide at /learn/older-residents.', '5 min', NULL, '2026-09-10 09:42:49.119', '2026-09-10 09:43:20.27');
INSERT INTO "public"."AwarenessResource" ("id", "slug", "title", "category", "summary", "body", "readingTime", "archivedAt", "createdAt", "updatedAt") VALUES ('cmtvc9ycu00143vobv5qjy12w', 'not-for-profit', 'Protecting a volunteer-run organisation', 'Organisations', 'Practical account, donation and record-keeping controls that work when nobody on the committee is technical.', 'Practical account, donation and record-keeping controls that work when nobody on the committee is technical. Read the full guide at /learn/not-for-profit.', '7 min', NULL, '2026-09-10 09:42:49.134', '2026-09-10 09:43:20.279');


--
-- Data for Name: EmailVerificationToken; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Evidence; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: EvidenceAccessLog; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Indicator; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."Indicator" ("id", "type", "value", "reportCount", "firstSeenAt", "lastSeenAt", "confidence", "expiresAt", "verificationStatus") VALUES ('cmtvcansa001h8oobf8t6793w', 'DOMAIN', 'pay-toll.online', 1, '2026-09-10 09:43:22.09', '2026-09-10 09:43:22.09', 0.95, '2027-03-09 09:43:21.981', 'VERIFIED');


--
-- Data for Name: InformationRequest; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: NotificationPreference; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."NotificationPreference" ("id", "userId", "emailOnStatus", "emailOnAlerts", "emailOnRequest", "updatedAt") VALUES ('cmtvcamvd001c8oobp6wybgdc', 'cmtvcamux001b8oobobhn0vv9', true, true, true, '2026-09-10 09:43:20.889');
INSERT INTO "public"."NotificationPreference" ("id", "userId", "emailOnStatus", "emailOnAlerts", "emailOnRequest", "updatedAt") VALUES ('cmtvcan9v001e8oobad51fugx', 'cmtvcan9m001d8oob28sisklo', true, true, true, '2026-09-10 09:43:21.418');
INSERT INTO "public"."NotificationPreference" ("id", "userId", "emailOnStatus", "emailOnAlerts", "emailOnRequest", "updatedAt") VALUES ('cmtvcano3001g8oobi5oy6ok3', 'cmtvcannu001f8oob0md8u0oi', true, false, true, '2026-09-10 09:43:21.93');


--
-- Data for Name: PasswordResetToken; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: RecoveryChecklist; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."RecoveryChecklist" ("id", "slug", "title", "situation", "createdAt") VALUES ('cmtvc9yea00153vob0t1m8ymt', 'first-hour', 'The first hour after you have been scammed', 'You have paid, tapped a link, or shared details you should not have.', '2026-09-10 09:42:49.187');


--
-- Data for Name: RecoveryProgress; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: RecoveryStep; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmtvc9yfh00163vob0dggr6cv', 'cmtvc9yea00153vob0t1m8ymt', 1, 'Ring the number on the back of your card', 'Not a number from the message. Ask for the transaction to be stopped or recalled and write down the reference number.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmtvc9yg700173vobok3g7vh9', 'cmtvc9yea00153vob0t1m8ymt', 2, 'Change the password that was exposed', 'Start with email, then banking. Use a new passphrase you have not used anywhere else.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmtvc9ygi00183vob7md1e7wy', 'cmtvc9yea00153vob0t1m8ymt', 3, 'Turn on multi-factor authentication', 'On email and banking first, so a stolen password alone is no longer enough.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmtvc9ygx00193vobayowh2el', 'cmtvc9yea00153vob0t1m8ymt', 4, 'Keep the evidence', 'Screenshot the messages, the sender''s number or address and any payment receipts before anything is deleted.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmtvc9yh7001a3vobl74i4o5w', 'cmtvc9yea00153vob0t1m8ymt', 5, 'Report it', 'ReportCyber if money or documents were lost, Scamwatch for the national picture, and CyberKent so Council can warn Hume.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmtvc9yhg001b3vobrwwccho1', 'cmtvc9yea00153vob0t1m8ymt', 6, 'Contact IDCARE if identity documents were taken', 'Free national support on 1800 595 160, with a response plan for a stolen licence, passport or Medicare card.');


--
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."Report" ("id", "reference", "authorId", "categoryId", "suburbId", "channel", "status", "severity", "title", "description", "amountLostCents", "occurredAt", "submittedAt", "withdrawnAt", "deletedAt", "createdAt", "updatedAt", "reviewerId", "retentionUntil") VALUES ('cmtvcanu2001i8oobsld4udwr', 'HCC-SYN-0001', 'cmtvcannu001f8oob0md8u0oi', 'cmtvc9xo700023vobzj9k30sn', 'cmtvc9xwz000j3vobt7jymtew', 'SMS', 'APPROVED', 'MEDIUM', 'SYNTHETIC — fake toll text asking for $4.20', 'Synthetic record for development. A text claiming an unpaid toll with a link to a lookalike payment page.', NULL, '2026-08-31 23:30:00', '2026-09-01 00:05:00', NULL, NULL, '2026-09-10 09:43:22.154', '2026-09-10 09:43:22.154', 'cmtvcan9m001d8oob28sisklo', '2033-08-31 14:00:00');


--
-- Data for Name: ReportIndicator; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."ReportIndicator" ("reportId", "indicatorId") VALUES ('cmtvcanu2001i8oobsld4udwr', 'cmtvcansa001h8oobf8t6793w');


--
-- Data for Name: ReportRelation; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ReportReview; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."ReportReview" ("id", "reportId", "reviewerId", "decision", "severity", "notes", "createdAt") VALUES ('cmtvcanv1001j8oob504cmbz6', 'cmtvcanu2001i8oobsld4udwr', 'cmtvcan9m001d8oob28sisklo', 'APPROVED', 'MEDIUM', 'Synthetic review: lookalike domain confirmed; alert drafted with reporter details removed.', '2026-09-10 09:43:22.154');


--
-- Data for Name: ScamCategory; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmtvc9xi100003vob4hwdl5ru', 'phishing', 'Phishing', 'Messages impersonating a trusted organisation to capture passwords, codes or card details.', NULL, '2026-09-10 09:42:48.025');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmtvc9xnq00013vobx68qaevd', 'parcel-delivery', 'Parcel delivery', 'Fake missed-delivery, customs-fee and redelivery messages.', NULL, '2026-09-10 09:42:48.23');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmtvc9xo700023vobzj9k30sn', 'toll-and-fines', 'Tolls and fines', 'Fake unpaid toll, parking fine and infringement notices.', NULL, '2026-09-10 09:42:48.247');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmtvc9xom00033vobvggp825v', 'government-impersonation', 'Government impersonation', 'Messages claiming to be myGov, the ATO, Services Australia or Council.', NULL, '2026-09-10 09:42:48.262');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmtvc9xp100043vobafmwoqwx', 'bank-impersonation', 'Bank impersonation', 'Fake fraud alerts and security calls claiming to be from a bank.', NULL, '2026-09-10 09:42:48.277');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmtvc9xpd00053vobf9d6kamq', 'family-impersonation', 'Hi Mum / family impersonation', 'Someone claiming to be a relative on a new number, asking for money.', NULL, '2026-09-10 09:42:48.289');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmtvc9xpr00063vobzvfefseo', 'payment-redirection', 'Payment redirection', 'Invoice and business email compromise — changed bank details.', NULL, '2026-09-10 09:42:48.304');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmtvc9xq300073vobqnm0dq19', 'investment', 'Investment', 'Fake trading platforms, crypto schemes and guaranteed-return offers.', NULL, '2026-09-10 09:42:48.315');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmtvc9xqe00083vobh9zibqu5', 'romance', 'Romance', 'Relationships built online to extract money over time.', NULL, '2026-09-10 09:42:48.326');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmtvc9xqp00093vobj7x32mxn', 'jobs', 'Jobs and employment', 'Task-based, work-from-home and money-mule job offers.', NULL, '2026-09-10 09:42:48.337');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmtvc9xr2000a3vobx407qldv', 'remote-access', 'Remote access and tech support', 'Requests to install remote-access software to ''fix'' a problem.', NULL, '2026-09-10 09:42:48.35');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmtvc9xrd000b3vob6vd00r52', 'online-shopping', 'Online shopping and marketplace', 'Fake stores, fake sellers and overpayment scams.', NULL, '2026-09-10 09:42:48.361');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmtvc9xro000c3vob9y0pcxmv', 'prize-and-lottery', 'Prizes and lotteries', 'Unexpected winnings that require a fee to release.', NULL, '2026-09-10 09:42:48.372');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmtvc9xs2000d3vobfvckmo0a', 'identity-theft', 'Identity theft', 'Attempts to obtain identity documents or personal details.', NULL, '2026-09-10 09:42:48.386');


--
-- Data for Name: ScamCheck; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."ScamCheck" ("id", "userId", "channel", "content", "score", "band", "confidence", "createdAt", "retentionUntil", "ruleSetVersion") VALUES ('cmtvcanwy001k8oobcgb4pnpv', NULL, 'SMS', 'SYNTHETIC — LINKT: You have an unpaid toll of $4.20. Settle now: linkt-au.pay-toll.online', 96, 'HIGH', 0.86, '2026-09-10 09:43:22.258', '2026-12-09 09:43:22.245', '2026-09-10');


--
-- Data for Name: ScamCheckIndicator; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."ScamCheckIndicator" ("id", "checkId", "ruleId", "label", "detail", "weight", "evidence") VALUES ('cmtvcanxc001l8oobel2meys8', 'cmtvcanwy001k8oobcgb4pnpv', 'urgency', 'Urgency language', 'Pressure to act inside a deadline.', 'HIGH', 'Settle now');
INSERT INTO "public"."ScamCheckIndicator" ("id", "checkId", "ruleId", "label", "detail", "weight", "evidence") VALUES ('cmtvcanxd001m8oobqk7kys52', 'cmtvcanwy001k8oobcgb4pnpv', 'link-lookalike', 'Lookalike domain', 'Names linkt but is registered to pay-toll.online.', 'HIGH', 'linkt-au.pay-toll[.]online');


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Suburb; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9xsi000e3vobmx6vpulc', 'Attwood', '3049');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9xt7000f3vobkzws17en', 'Broadmeadows', '3047');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9xti000g3vobdfv4hv2z', 'Bulla', '3428');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9xwa000h3vobt9koz7iy', 'Campbellfield', '3061');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9xwp000i3vobufoupd8o', 'Coolaroo', '3048');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9xwz000j3vobt7jymtew', 'Craigieburn', '3064');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9xxr000k3voby0gbvszt', 'Dallas', '3047');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9xy2000l3vobmwngx7g5', 'Donnybrook', '3064');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9xyr000m3vobzbua516d', 'Gladstone Park', '3043');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9xz0000n3vobv76mrac4', 'Greenvale', '3059');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9xza000o3vobnb9x2655', 'Jacana', '3047');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9xzs000p3vobpijkl08m', 'Kalkallo', '3064');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9y03000q3vobttm8qffh', 'Meadow Heights', '3048');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9y0d000r3vobsq58pnda', 'Melbourne Airport', '3045');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9y0r000s3voblgx0t9u4', 'Mickleham', '3064');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9y1b000t3vob0e5yqkif', 'Oaklands Junction', '3063');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9y1p000u3vobm3f0d175', 'Roxburgh Park', '3064');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9y24000v3vob9qz5n7al', 'Somerton', '3062');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9y2l000w3vobl2s3oymj', 'Sunbury', '3429');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9y2x000x3vobd2o0mjjq', 'Tullamarine', '3043');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9y3t000y3vob8c4dn6d5', 'Westmeadows', '3049');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9y78000z3vob1l74ncfr', 'Wildwood', '3429');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmtvc9yaz00103voblzdg8gvj', 'Yuroke', '3063');


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."User" ("id", "email", "passwordHash", "fullName", "organisation", "phone", "role", "emailVerified", "lastLoginAt", "deletedAt", "createdAt", "updatedAt", "retentionUntil") VALUES ('cmtvcamux001b8oobobhn0vv9', 'admin@cybernova.local', '[bcrypt digest redacted for submission]', 'CyberKent Administrator', NULL, NULL, 'ADMIN', '2026-09-10 09:43:20.863', NULL, NULL, '2026-09-10 09:43:20.889', '2026-09-10 09:43:20.889', NULL);
INSERT INTO "public"."User" ("id", "email", "passwordHash", "fullName", "organisation", "phone", "role", "emailVerified", "lastLoginAt", "deletedAt", "createdAt", "updatedAt", "retentionUntil") VALUES ('cmtvcan9m001d8oob28sisklo', 'officer.synthetic@cyberkent.test', '[bcrypt digest redacted for submission]', 'Synthetic Officer', NULL, NULL, 'OFFICER', '2026-09-10 09:43:21.4', NULL, NULL, '2026-09-10 09:43:21.418', '2026-09-10 09:43:21.418', NULL);
INSERT INTO "public"."User" ("id", "email", "passwordHash", "fullName", "organisation", "phone", "role", "emailVerified", "lastLoginAt", "deletedAt", "createdAt", "updatedAt", "retentionUntil") VALUES ('cmtvcannu001f8oob0md8u0oi', 'resident.synthetic@cyberkent.test', '[bcrypt digest redacted for submission]', 'Synthetic Resident', NULL, NULL, 'RESIDENT', '2026-09-10 09:43:21.913', NULL, NULL, '2026-09-10 09:43:21.93', '2026-09-10 09:43:21.93', NULL);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('4d0e4846-6d95-40e8-b868-106769015cd3', '3769c22e4bc9e43e07317fac8a1b742b7d2e6b6ffd78b3151d632927662a3b7b', '2026-08-07 10:56:42.647503+00', '20260807105640_init_cybersafe_schema', NULL, NULL, '2026-08-07 10:56:40.511616+00', 1);
INSERT INTO "public"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('55a6149e-cfb6-4c56-a2ff-3782d1c6092a', '57d66cc7ac2b6ef8a091fafea7a69a4732dedce2600bbdf6e189872bf7b349e4', '2026-09-10 09:38:45.011523+00', '20260910100000_ai_interactions_and_ethics_controls', NULL, NULL, '2026-09-10 09:38:44.469004+00', 1);


--
-- Name: AccountDeletionRequest AccountDeletionRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."AccountDeletionRequest"
    ADD CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id");


--
-- Name: AiInteraction AiInteraction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."AiInteraction"
    ADD CONSTRAINT "AiInteraction_pkey" PRIMARY KEY ("id");


--
-- Name: Alert Alert_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Alert"
    ADD CONSTRAINT "Alert_pkey" PRIMARY KEY ("id");


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id");


--
-- Name: AwarenessResource AwarenessResource_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."AwarenessResource"
    ADD CONSTRAINT "AwarenessResource_pkey" PRIMARY KEY ("id");


--
-- Name: EmailVerificationToken EmailVerificationToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id");


--
-- Name: EvidenceAccessLog EvidenceAccessLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."EvidenceAccessLog"
    ADD CONSTRAINT "EvidenceAccessLog_pkey" PRIMARY KEY ("id");


--
-- Name: Evidence Evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Evidence"
    ADD CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id");


--
-- Name: Indicator Indicator_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Indicator"
    ADD CONSTRAINT "Indicator_pkey" PRIMARY KEY ("id");


--
-- Name: InformationRequest InformationRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."InformationRequest"
    ADD CONSTRAINT "InformationRequest_pkey" PRIMARY KEY ("id");


--
-- Name: NotificationPreference NotificationPreference_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id");


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY ("id");


--
-- Name: PasswordResetToken PasswordResetToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id");


--
-- Name: RecoveryChecklist RecoveryChecklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."RecoveryChecklist"
    ADD CONSTRAINT "RecoveryChecklist_pkey" PRIMARY KEY ("id");


--
-- Name: RecoveryProgress RecoveryProgress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."RecoveryProgress"
    ADD CONSTRAINT "RecoveryProgress_pkey" PRIMARY KEY ("id");


--
-- Name: RecoveryStep RecoveryStep_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."RecoveryStep"
    ADD CONSTRAINT "RecoveryStep_pkey" PRIMARY KEY ("id");


--
-- Name: ReportIndicator ReportIndicator_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ReportIndicator"
    ADD CONSTRAINT "ReportIndicator_pkey" PRIMARY KEY ("reportId", "indicatorId");


--
-- Name: ReportRelation ReportRelation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ReportRelation"
    ADD CONSTRAINT "ReportRelation_pkey" PRIMARY KEY ("id");


--
-- Name: ReportReview ReportReview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ReportReview"
    ADD CONSTRAINT "ReportReview_pkey" PRIMARY KEY ("id");


--
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY ("id");


--
-- Name: ScamCategory ScamCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ScamCategory"
    ADD CONSTRAINT "ScamCategory_pkey" PRIMARY KEY ("id");


--
-- Name: ScamCheckIndicator ScamCheckIndicator_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ScamCheckIndicator"
    ADD CONSTRAINT "ScamCheckIndicator_pkey" PRIMARY KEY ("id");


--
-- Name: ScamCheck ScamCheck_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ScamCheck"
    ADD CONSTRAINT "ScamCheck_pkey" PRIMARY KEY ("id");


--
-- Name: Subscription Subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id");


--
-- Name: Suburb Suburb_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Suburb"
    ADD CONSTRAINT "Suburb_pkey" PRIMARY KEY ("id");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");


--
-- Name: AccountDeletionRequest_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AccountDeletionRequest_userId_key" ON "public"."AccountDeletionRequest" USING "btree" ("userId");


--
-- Name: AiInteraction_feature_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AiInteraction_feature_createdAt_idx" ON "public"."AiInteraction" USING "btree" ("feature", "createdAt");


--
-- Name: AiInteraction_inputSha256_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AiInteraction_inputSha256_idx" ON "public"."AiInteraction" USING "btree" ("inputSha256");


--
-- Name: AiInteraction_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AiInteraction_userId_idx" ON "public"."AiInteraction" USING "btree" ("userId");


--
-- Name: Alert_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Alert_categoryId_idx" ON "public"."Alert" USING "btree" ("categoryId");


--
-- Name: Alert_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Alert_publishedAt_idx" ON "public"."Alert" USING "btree" ("publishedAt");


--
-- Name: Alert_reference_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Alert_reference_key" ON "public"."Alert" USING "btree" ("reference");


--
-- Name: Alert_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Alert_status_idx" ON "public"."Alert" USING "btree" ("status");


--
-- Name: Alert_suburbId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Alert_suburbId_idx" ON "public"."Alert" USING "btree" ("suburbId");


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog" USING "btree" ("createdAt");


--
-- Name: AuditLog_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog" USING "btree" ("entityType", "entityId");


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog" USING "btree" ("userId");


--
-- Name: AwarenessResource_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AwarenessResource_category_idx" ON "public"."AwarenessResource" USING "btree" ("category");


--
-- Name: AwarenessResource_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AwarenessResource_slug_key" ON "public"."AwarenessResource" USING "btree" ("slug");


--
-- Name: EmailVerificationToken_tokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "public"."EmailVerificationToken" USING "btree" ("tokenHash");


--
-- Name: EmailVerificationToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EmailVerificationToken_userId_idx" ON "public"."EmailVerificationToken" USING "btree" ("userId");


--
-- Name: EvidenceAccessLog_evidenceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EvidenceAccessLog_evidenceId_idx" ON "public"."EvidenceAccessLog" USING "btree" ("evidenceId");


--
-- Name: EvidenceAccessLog_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EvidenceAccessLog_userId_idx" ON "public"."EvidenceAccessLog" USING "btree" ("userId");


--
-- Name: Evidence_reportId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Evidence_reportId_idx" ON "public"."Evidence" USING "btree" ("reportId");


--
-- Name: Evidence_storageKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Evidence_storageKey_key" ON "public"."Evidence" USING "btree" ("storageKey");


--
-- Name: Indicator_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Indicator_type_idx" ON "public"."Indicator" USING "btree" ("type");


--
-- Name: Indicator_type_value_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Indicator_type_value_key" ON "public"."Indicator" USING "btree" ("type", "value");


--
-- Name: Indicator_verificationStatus_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Indicator_verificationStatus_idx" ON "public"."Indicator" USING "btree" ("verificationStatus");


--
-- Name: InformationRequest_reportId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InformationRequest_reportId_idx" ON "public"."InformationRequest" USING "btree" ("reportId");


--
-- Name: NotificationPreference_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "public"."NotificationPreference" USING "btree" ("userId");


--
-- Name: Notification_userId_readAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_userId_readAt_idx" ON "public"."Notification" USING "btree" ("userId", "readAt");


--
-- Name: PasswordResetToken_tokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "public"."PasswordResetToken" USING "btree" ("tokenHash");


--
-- Name: PasswordResetToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PasswordResetToken_userId_idx" ON "public"."PasswordResetToken" USING "btree" ("userId");


--
-- Name: RecoveryChecklist_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RecoveryChecklist_slug_key" ON "public"."RecoveryChecklist" USING "btree" ("slug");


--
-- Name: RecoveryProgress_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RecoveryProgress_userId_idx" ON "public"."RecoveryProgress" USING "btree" ("userId");


--
-- Name: RecoveryProgress_userId_stepId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RecoveryProgress_userId_stepId_key" ON "public"."RecoveryProgress" USING "btree" ("userId", "stepId");


--
-- Name: RecoveryStep_checklistId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RecoveryStep_checklistId_idx" ON "public"."RecoveryStep" USING "btree" ("checklistId");


--
-- Name: RecoveryStep_checklistId_position_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RecoveryStep_checklistId_position_key" ON "public"."RecoveryStep" USING "btree" ("checklistId", "position");


--
-- Name: ReportIndicator_indicatorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportIndicator_indicatorId_idx" ON "public"."ReportIndicator" USING "btree" ("indicatorId");


--
-- Name: ReportRelation_sourceId_targetId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ReportRelation_sourceId_targetId_key" ON "public"."ReportRelation" USING "btree" ("sourceId", "targetId");


--
-- Name: ReportRelation_targetId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportRelation_targetId_idx" ON "public"."ReportRelation" USING "btree" ("targetId");


--
-- Name: ReportReview_reportId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportReview_reportId_idx" ON "public"."ReportReview" USING "btree" ("reportId");


--
-- Name: ReportReview_reviewerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportReview_reviewerId_idx" ON "public"."ReportReview" USING "btree" ("reviewerId");


--
-- Name: Report_authorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_authorId_idx" ON "public"."Report" USING "btree" ("authorId");


--
-- Name: Report_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_categoryId_idx" ON "public"."Report" USING "btree" ("categoryId");


--
-- Name: Report_reference_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Report_reference_key" ON "public"."Report" USING "btree" ("reference");


--
-- Name: Report_reviewerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_reviewerId_idx" ON "public"."Report" USING "btree" ("reviewerId");


--
-- Name: Report_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_status_idx" ON "public"."Report" USING "btree" ("status");


--
-- Name: Report_submittedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_submittedAt_idx" ON "public"."Report" USING "btree" ("submittedAt");


--
-- Name: Report_suburbId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_suburbId_idx" ON "public"."Report" USING "btree" ("suburbId");


--
-- Name: ScamCategory_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ScamCategory_slug_key" ON "public"."ScamCategory" USING "btree" ("slug");


--
-- Name: ScamCheckIndicator_checkId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScamCheckIndicator_checkId_idx" ON "public"."ScamCheckIndicator" USING "btree" ("checkId");


--
-- Name: ScamCheckIndicator_ruleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScamCheckIndicator_ruleId_idx" ON "public"."ScamCheckIndicator" USING "btree" ("ruleId");


--
-- Name: ScamCheck_band_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScamCheck_band_idx" ON "public"."ScamCheck" USING "btree" ("band");


--
-- Name: ScamCheck_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScamCheck_createdAt_idx" ON "public"."ScamCheck" USING "btree" ("createdAt");


--
-- Name: ScamCheck_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScamCheck_userId_idx" ON "public"."ScamCheck" USING "btree" ("userId");


--
-- Name: Subscription_email_scope_categoryId_suburbId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Subscription_email_scope_categoryId_suburbId_key" ON "public"."Subscription" USING "btree" ("email", "scope", "categoryId", "suburbId");


--
-- Name: Subscription_unsubscribeTokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Subscription_unsubscribeTokenHash_key" ON "public"."Subscription" USING "btree" ("unsubscribeTokenHash");


--
-- Name: Subscription_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Subscription_userId_idx" ON "public"."Subscription" USING "btree" ("userId");


--
-- Name: Suburb_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Suburb_name_key" ON "public"."Suburb" USING "btree" ("name");


--
-- Name: Suburb_postcode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Suburb_postcode_idx" ON "public"."Suburb" USING "btree" ("postcode");


--
-- Name: User_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_deletedAt_idx" ON "public"."User" USING "btree" ("deletedAt");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON "public"."User" USING "btree" ("email");


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_role_idx" ON "public"."User" USING "btree" ("role");


--
-- Name: AccountDeletionRequest AccountDeletionRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."AccountDeletionRequest"
    ADD CONSTRAINT "AccountDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AiInteraction AiInteraction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."AiInteraction"
    ADD CONSTRAINT "AiInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Alert Alert_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Alert"
    ADD CONSTRAINT "Alert_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Alert Alert_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Alert"
    ADD CONSTRAINT "Alert_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Alert Alert_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Alert"
    ADD CONSTRAINT "Alert_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ScamCategory"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Alert Alert_sourceReportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Alert"
    ADD CONSTRAINT "Alert_sourceReportId_fkey" FOREIGN KEY ("sourceReportId") REFERENCES "public"."Report"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Alert Alert_suburbId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Alert"
    ADD CONSTRAINT "Alert_suburbId_fkey" FOREIGN KEY ("suburbId") REFERENCES "public"."Suburb"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EmailVerificationToken EmailVerificationToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvidenceAccessLog EvidenceAccessLog_evidenceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."EvidenceAccessLog"
    ADD CONSTRAINT "EvidenceAccessLog_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "public"."Evidence"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvidenceAccessLog EvidenceAccessLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."EvidenceAccessLog"
    ADD CONSTRAINT "EvidenceAccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Evidence Evidence_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Evidence"
    ADD CONSTRAINT "Evidence_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InformationRequest InformationRequest_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."InformationRequest"
    ADD CONSTRAINT "InformationRequest_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InformationRequest InformationRequest_requestedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."InformationRequest"
    ADD CONSTRAINT "InformationRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: NotificationPreference NotificationPreference_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PasswordResetToken PasswordResetToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RecoveryProgress RecoveryProgress_stepId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."RecoveryProgress"
    ADD CONSTRAINT "RecoveryProgress_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "public"."RecoveryStep"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RecoveryProgress RecoveryProgress_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."RecoveryProgress"
    ADD CONSTRAINT "RecoveryProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RecoveryStep RecoveryStep_checklistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."RecoveryStep"
    ADD CONSTRAINT "RecoveryStep_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "public"."RecoveryChecklist"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReportIndicator ReportIndicator_indicatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ReportIndicator"
    ADD CONSTRAINT "ReportIndicator_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "public"."Indicator"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReportIndicator ReportIndicator_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ReportIndicator"
    ADD CONSTRAINT "ReportIndicator_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReportRelation ReportRelation_sourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ReportRelation"
    ADD CONSTRAINT "ReportRelation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "public"."Report"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReportRelation ReportRelation_targetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ReportRelation"
    ADD CONSTRAINT "ReportRelation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "public"."Report"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReportReview ReportReview_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ReportReview"
    ADD CONSTRAINT "ReportReview_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReportReview ReportReview_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ReportReview"
    ADD CONSTRAINT "ReportReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Report Report_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Report"
    ADD CONSTRAINT "Report_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Report Report_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Report"
    ADD CONSTRAINT "Report_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ScamCategory"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Report Report_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Report"
    ADD CONSTRAINT "Report_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Report Report_suburbId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Report"
    ADD CONSTRAINT "Report_suburbId_fkey" FOREIGN KEY ("suburbId") REFERENCES "public"."Suburb"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ScamCheckIndicator ScamCheckIndicator_checkId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ScamCheckIndicator"
    ADD CONSTRAINT "ScamCheckIndicator_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "public"."ScamCheck"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScamCheck ScamCheck_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ScamCheck"
    ADD CONSTRAINT "ScamCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Subscription Subscription_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Subscription"
    ADD CONSTRAINT "Subscription_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ScamCategory"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subscription Subscription_suburbId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Subscription"
    ADD CONSTRAINT "Subscription_suburbId_fkey" FOREIGN KEY ("suburbId") REFERENCES "public"."Suburb"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subscription Subscription_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Subscription"
    ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 2vpmcbwg1nLJH3PnpwgIRrMs7XIDh0fBr6XGA5OJKOIVVAlunSM4SfO0qd0P6VQ

