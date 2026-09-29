-- =============================================================================
-- CyberKent — Online Scam Detection and Reporting System
-- Hume City Council CyberSafe Services · Group CyberKent · CPRO306
--
-- Database file (PostgreSQL 17, the same major version as production on
-- Supabase, region ap-northeast-1). Re-exported with pg_dump 17 on
-- 28 September 2026 from a database built by applying every Prisma migration
-- (up to and including 20260925014720_admin_panel) and the reference seed
-- (backend/prisma/seed.ts). It supersedes the export of 10 September, which
-- predated the admin-panel migration.
--
-- Contents
--   * Full physical schema: 29 domain tables + Prisma's _prisma_migrations
--     table, 17 enumerated types, 42 foreign keys, 96 indexes (incl.
--     primary-key and unique), 11 CHECK constraints.
--   * New since 10 September (migration 20260925014720_admin_panel): Task,
--     TaskComment and SiteNotice, the TaskStatus, TaskPriority and NoticeTone
--     enums, and the SUPER_ADMIN role.
--   * Reference data: 14 Scamwatch scam categories, 23 Hume suburbs and
--     postcodes, 4 awareness resources, 6 recovery checklists (37 steps).
--   * Synthetic records only (ER-12): every person uses the reserved .test
--     domain; every report, alert and check is labelled SYNTHETIC. No real
--     resident's data exists in this file — production was deliberately not
--     dumped.
--   * Password hashes have been replaced with a placeholder (Avoid.md §6 — never
--     expose password hashes).
--
-- The tables are in the "public" schema here. Production keeps the same
-- tables in a "cyberkent" schema on the shared Supabase project; the
-- definitions are identical.
--
-- Restore into an empty PostgreSQL 15+ database:
--   psql "$DATABASE_URL" -f cyberkent_database.sql
-- The schema source of truth is backend/prisma/schema.prisma and its migrations.
-- =============================================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

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
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


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
-- Name: NoticeTone; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."NoticeTone" AS ENUM (
    'INFO',
    'WARNING',
    'CRITICAL'
);


--
-- Name: NotificationKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."NotificationKind" AS ENUM (
    'REPORT_SUBMITTED',
    'REPORT_STATUS_CHANGED',
    'INFORMATION_REQUESTED',
    'ALERT_PUBLISHED',
    'TASK_ASSIGNED'
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
    'ADMIN',
    'SUPER_ADMIN'
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


--
-- Name: TaskPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."TaskPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."TaskStatus" AS ENUM (
    'TODO',
    'IN_PROGRESS',
    'BLOCKED',
    'DONE'
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
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "authorId" "text",
    "content" "jsonb",
    "publishedAt" timestamp(3) without time zone
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
-- Name: SiteNotice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."SiteNotice" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "tone" "public"."NoticeTone" DEFAULT 'INFO'::"public"."NoticeTone" NOT NULL,
    "linkUrl" "text",
    "linkLabel" "text",
    "startsAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endsAt" timestamp(3) without time zone,
    "archivedAt" timestamp(3) without time zone,
    "createdById" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
-- Name: Task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Task" (
    "id" "text" NOT NULL,
    "reference" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."TaskStatus" DEFAULT 'TODO'::"public"."TaskStatus" NOT NULL,
    "priority" "public"."TaskPriority" DEFAULT 'MEDIUM'::"public"."TaskPriority" NOT NULL,
    "dueAt" timestamp(3) without time zone,
    "labels" "text"[] DEFAULT ARRAY[]::"text"[],
    "position" double precision DEFAULT 0 NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "assigneeId" "text",
    "createdById" "text",
    "reportId" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TaskComment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."TaskComment" (
    "id" "text" NOT NULL,
    "taskId" "text" NOT NULL,
    "authorId" "text",
    "body" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    "retentionUntil" timestamp(3) without time zone,
    "department" "text",
    "jobTitle" "text"
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



--
-- Data for Name: Alert; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."Alert" ("id", "reference", "sourceReportId", "categoryId", "suburbId", "channel", "status", "severity", "headline", "specimen", "summary", "authorId", "approvedById", "publishedAt", "archivedAt", "createdAt", "updatedAt") VALUES ('cmul8yuql002ogwobz0mmhoaj', 'ALERT-SYN-0001', NULL, 'cmul8ysli0002gwobyvuryphk', 'cmul8ysoa000jgwobq6dvvq3w', 'SMS', 'PUBLISHED', 'MEDIUM', 'SYNTHETIC — Fake toll texts circulating in Craigieburn', 'LINKT: You have an unpaid toll of $4.20 … Settle now: [link removed]', 'Texts claiming an unpaid toll link to a fake payment page. Linkt does not send payment links by text; check your account at linkt.com.au.', 'cmul8yu9w002egwobmsq5mvs3', 'cmul8ytwc002cgwobinib8xfs', '2026-09-01 22:00:00', NULL, '2026-09-28 12:52:12.957', '2026-09-28 12:52:12.957');


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."AuditLog" ("id", "userId", "action", "entityType", "entityId", "metadata", "ipAddress", "createdAt", "retentionUntil") VALUES ('cmul8yuqr002pgwobhlnu18b3', 'cmul8ytwc002cgwobinib8xfs', 'ALERT_PUBLISHED', 'Alert', 'ALERT-SYN-0001', '{"report": "HCC-SYN-0001", "synthetic": true, "sourceReportSevered": true}', NULL, '2026-09-28 12:52:12.963', '2033-09-01 14:00:00');


--
-- Data for Name: AwarenessResource; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."AwarenessResource" ("id", "slug", "title", "category", "summary", "body", "readingTime", "archivedAt", "createdAt", "updatedAt", "authorId", "content", "publishedAt") VALUES ('cmul8ysr50011gwob44hveh6p', 'first-hour', 'The first hour after you have been scammed', 'Recovery', 'Who to call first, what to freeze, and what evidence to keep before anything is deleted from your phone.', 'Who to call first, what to freeze, and what evidence to keep before anything is deleted from your phone. Read the full guide at /learn/first-hour.', '4 min', NULL, '2026-09-28 12:52:10.385', '2026-09-28 12:52:10.385', NULL, NULL, NULL);
INSERT INTO "public"."AwarenessResource" ("id", "slug", "title", "category", "summary", "body", "readingTime", "archivedAt", "createdAt", "updatedAt", "authorId", "content", "publishedAt") VALUES ('cmul8ysrn0012gwobne9qocq5', 'small-business', 'Payment redirection: a checklist for small teams', 'Small business', 'How invoice fraud reaches a business inbox, and the two verification habits that stop almost all of it.', 'How invoice fraud reaches a business inbox, and the two verification habits that stop almost all of it. Read the full guide at /learn/small-business.', '6 min', NULL, '2026-09-28 12:52:10.403', '2026-09-28 12:52:10.403', NULL, NULL, NULL);
INSERT INTO "public"."AwarenessResource" ("id", "slug", "title", "category", "summary", "body", "readingTime", "archivedAt", "createdAt", "updatedAt", "authorId", "content", "publishedAt") VALUES ('cmul8yss50013gwobjw9ecomm', 'older-residents', 'Talking to family about phone scams', 'Community', 'A conversation guide for supporting older relatives without taking away their independence or confidence.', 'A conversation guide for supporting older relatives without taking away their independence or confidence. Read the full guide at /learn/older-residents.', '5 min', NULL, '2026-09-28 12:52:10.421', '2026-09-28 12:52:10.421', NULL, NULL, NULL);
INSERT INTO "public"."AwarenessResource" ("id", "slug", "title", "category", "summary", "body", "readingTime", "archivedAt", "createdAt", "updatedAt", "authorId", "content", "publishedAt") VALUES ('cmul8yssm0014gwobx1fabmij', 'not-for-profit', 'Protecting a volunteer-run organisation', 'Organisations', 'Practical account, donation and record-keeping controls that work when nobody on the committee is technical.', 'Practical account, donation and record-keeping controls that work when nobody on the committee is technical. Read the full guide at /learn/not-for-profit.', '7 min', NULL, '2026-09-28 12:52:10.438', '2026-09-28 12:52:10.438', NULL, NULL, NULL);


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

INSERT INTO "public"."Indicator" ("id", "type", "value", "reportCount", "firstSeenAt", "lastSeenAt", "confidence", "expiresAt", "verificationStatus") VALUES ('cmul8yuor002igwobfj86bwlh', 'DOMAIN', 'pay-toll.online', 1, '2026-09-28 12:52:12.891', '2026-09-28 12:52:12.891', 0.95, '2027-03-27 12:52:12.88', 'VERIFIED');


--
-- Data for Name: InformationRequest; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: NotificationPreference; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."NotificationPreference" ("id", "userId", "emailOnStatus", "emailOnAlerts", "emailOnRequest", "updatedAt") VALUES ('cmul8ytwf002dgwob6l15t88u', 'cmul8ytwc002cgwobinib8xfs', true, true, true, '2026-09-28 12:52:11.868');
INSERT INTO "public"."NotificationPreference" ("id", "userId", "emailOnStatus", "emailOnAlerts", "emailOnRequest", "updatedAt") VALUES ('cmul8yu9y002fgwobwp91i9gl', 'cmul8yu9w002egwobmsq5mvs3', true, true, true, '2026-09-28 12:52:12.356');
INSERT INTO "public"."NotificationPreference" ("id", "userId", "emailOnStatus", "emailOnAlerts", "emailOnRequest", "updatedAt") VALUES ('cmul8yuo8002hgwobcj3mv7hf', 'cmul8yuo5002ggwob3ijzmrjm', true, false, true, '2026-09-28 12:52:12.869');


--
-- Data for Name: PasswordResetToken; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: RecoveryChecklist; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."RecoveryChecklist" ("id", "slug", "title", "situation", "createdAt") VALUES ('cmul8ysst0015gwob28ar5fbs', 'first-hour', 'The first hour after you have been scammed', 'You have paid, tapped a link, or shared details you should not have.', '2026-09-28 12:52:10.445');
INSERT INTO "public"."RecoveryChecklist" ("id", "slug", "title", "situation", "createdAt") VALUES ('cmul8ysum001cgwob4lu8vi2h', 'money-sent', 'I sent money to a scammer', 'You transferred money, paid an invoice or bought gift cards or crypto for someone who turned out to be a scammer.', '2026-09-28 12:52:10.51');
INSERT INTO "public"."RecoveryChecklist" ("id", "slug", "title", "situation", "createdAt") VALUES ('cmul8ysvp001kgwobib8tbwze', 'details-shared', 'I gave away my bank or card details', 'You typed card numbers, a one-time code or your online banking login into a site or read them to a caller.', '2026-09-28 12:52:10.549');
INSERT INTO "public"."RecoveryChecklist" ("id", "slug", "title", "situation", "createdAt") VALUES ('cmul8ysx0001rgwoboxobfegr', 'identity-stolen', 'My identity documents or personal details were taken', 'You sent a photo of your licence, passport or Medicare card, or gave your date of birth, address and tax file number to a scammer.', '2026-09-28 12:52:10.596');
INSERT INTO "public"."RecoveryChecklist" ("id", "slug", "title", "situation", "createdAt") VALUES ('cmul8ysyx001ygwobef5b107z', 'remote-access', 'I let someone into my computer or phone', 'A caller had you install an app such as AnyDesk or TeamViewer, or took control of your screen.', '2026-09-28 12:52:10.665');
INSERT INTO "public"."RecoveryChecklist" ("id", "slug", "title", "situation", "createdAt") VALUES ('cmul8yszu0025gwob6cozazyo', 'business-payment', 'Our organisation paid a fake invoice', 'Your business, club or community group paid an invoice after the bank details were changed by email.', '2026-09-28 12:52:10.698');


--
-- Data for Name: RecoveryProgress; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: RecoveryStep; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8yst90016gwobsi0emio9', 'cmul8ysst0015gwob28ar5fbs', 1, 'Ring the number on the back of your card', 'Not a number from the message. Ask for the transaction to be stopped or recalled and write down the reference number.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ystq0017gwobokzofbcd', 'cmul8ysst0015gwob28ar5fbs', 2, 'Change the password that was exposed', 'Start with email, then banking. Use a new passphrase you have not used anywhere else.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysu00018gwobrape53xf', 'cmul8ysst0015gwob28ar5fbs', 3, 'Turn on multi-factor authentication', 'On email and banking first, so a stolen password alone is no longer enough.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysu50019gwobuy0wwk2n', 'cmul8ysst0015gwob28ar5fbs', 4, 'Keep the evidence', 'Screenshot the messages, the sender''s number or address and any payment receipts before anything is deleted.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysua001agwoblc80uea0', 'cmul8ysst0015gwob28ar5fbs', 5, 'Report it', 'ReportCyber (cyber.gov.au) if money or documents were lost, Scamwatch for the national picture, and CyberKent so Council can warn Hume.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysuh001bgwobumidj8h2', 'cmul8ysst0015gwob28ar5fbs', 6, 'Contact IDCARE if identity documents were taken', 'Free national support on 1800 595 160, with a response plan for a stolen licence, passport or Medicare card.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysur001dgwobrxkdwrw6', 'cmul8ysum001cgwob4lu8vi2h', 1, 'Call your bank now, on the number on your card', 'Say it is a scam payment and ask for it to be recalled. The sooner you call, the better the chance of getting it back.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysux001egwobzprtm449', 'cmul8ysum001cgwob4lu8vi2h', 2, 'If you paid by gift card, call the card''s issuer', 'The phone number is on the back of the card or the retailer''s website. Have the card numbers and receipts ready.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysv2001fgwobbac337te', 'cmul8ysum001cgwob4lu8vi2h', 3, 'If you paid in cryptocurrency, contact the exchange you used', 'Report the wallet address you sent to. Exchanges can sometimes freeze funds that reach another account they hold.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysv7001ggwobvry3yeo1', 'cmul8ysum001cgwob4lu8vi2h', 4, 'Stop all contact with the scammer', 'Do not send more money to ''unlock'' or ''release'' what you paid. That is a second scam.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysvf001hgwob3qf68r3l', 'cmul8ysum001cgwob4lu8vi2h', 5, 'Report it to ReportCyber', 'At cyber.gov.au. Police use these reports, and your bank may ask for the reference number.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysvj001igwobpftn6udf', 'cmul8ysum001cgwob4lu8vi2h', 6, 'Beware of ''recovery'' offers', 'Anyone who contacts you offering to recover your money for a fee is running another scam. Legitimate help is free.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysvm001jgwobiuouqto6', 'cmul8ysum001cgwob4lu8vi2h', 7, 'Tell Council', 'Report it on CyberKent so officers can warn others in Hume. Your details are never published.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysvv001lgwobao629tdi', 'cmul8ysvp001kgwobib8tbwze', 1, 'Call your bank and cancel the card', 'Use the number on the back of the card. Ask them to block the card and watch for unusual transactions.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysvz001mgwobuj4rcdnn', 'cmul8ysvp001kgwobib8tbwze', 2, 'Change your online banking password', 'Do it on the bank''s own app or by typing its address yourself — never through a link in a message.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysw3001ngwobm4x491pd', 'cmul8ysvp001kgwobib8tbwze', 3, 'Check recent transactions', 'Look back over the last few weeks, not just today. Report anything you do not recognise to the bank.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8yswa001ogwobpxpnmjhw', 'cmul8ysvp001kgwobib8tbwze', 4, 'Change any password you reused', 'If the same password protects your email or other accounts, change those too, starting with email.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8yswe001pgwobefglp5zc', 'cmul8ysvp001kgwobib8tbwze', 5, 'Keep the message and the link', 'Screenshot the message and write down the site address before deleting anything.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8yswm001qgwob5kd7h1oh', 'cmul8ysvp001kgwobib8tbwze', 6, 'Report it', 'To ReportCyber at cyber.gov.au, and to Council on CyberKent.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysxb001sgwob2ivnmtcv', 'cmul8ysx0001rgwoboxobfegr', 1, 'Call IDCARE on 1800 595 160', 'Australia''s free identity and cyber support service. They will build a response plan with you.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysxh001tgwob824br4hs', 'cmul8ysx0001rgwoboxobfegr', 2, 'Replace the documents that were exposed', 'Your licence through VicRoads, your passport through the Australian Passport Office, your Medicare card through Services Australia.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysxv001ugwobdo8r11xp', 'cmul8ysx0001rgwoboxobfegr', 3, 'Ask for a free ban on your credit file', 'Contact one of the credit reporting bodies (Equifax, Experian or illion). A ban stops anyone opening credit in your name.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysyc001vgwobto37jr9r', 'cmul8ysx0001rgwoboxobfegr', 4, 'Secure your myGov account', 'Change the password and turn on multi-factor sign-in at my.gov.au, reached by typing the address yourself.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysyp001wgwobcwsvacp1', 'cmul8ysx0001rgwoboxobfegr', 5, 'Tell your bank and telco', 'Ask them to add extra identity checks to your accounts, so nobody can port your number or open an account in your name.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysyt001xgwobwotcps9y', 'cmul8ysx0001rgwoboxobfegr', 6, 'Report it', 'To ReportCyber at cyber.gov.au, then to Council on CyberKent.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysz3001zgwobi99t7zrb', 'cmul8ysyx001ygwobef5b107z', 1, 'Disconnect from the internet', 'Turn off Wi-Fi and unplug the network cable, so the connection is cut.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8ysz70020gwobgvyt9z3w', 'cmul8ysyx001ygwobef5b107z', 2, 'Call your bank from another phone', 'If they saw or used your banking, tell the bank now and ask them to secure your accounts.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8yszb0021gwob57ylwq1j', 'cmul8ysyx001ygwobef5b107z', 3, 'Remove the remote-access app', 'Uninstall anything they asked you to install. If you are unsure, take the device to a trusted technician.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8yszf0022gwob5wo5t65x', 'cmul8ysyx001ygwobef5b107z', 4, 'Change your passwords from a different device', 'Email first, then banking, then everything else. Assume anything typed while they were connected was seen.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8yszl0023gwobaleue8q9', 'cmul8ysyx001ygwobef5b107z', 5, 'Run a security scan', 'Use your device''s built-in security tools or reputable antivirus before you use the device for banking again.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8yszq0024gwobe9xsgq8n', 'cmul8ysyx001ygwobef5b107z', 6, 'Report it', 'To ReportCyber at cyber.gov.au, and to Council on CyberKent.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8yt000026gwob47qllyit', 'cmul8yszu0025gwob6cozazyo', 1, 'Call your bank''s business fraud line now', 'Ask for the payment to be recalled. Give them the amount, time and the account it went to.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8yt050027gwobw6di0gtf', 'cmul8yszu0025gwob6cozazyo', 2, 'Call the real supplier on a number you already have', 'Confirm the invoice was not theirs and tell them their email may have been compromised.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8yt0g0028gwoby9tahce7', 'cmul8yszu0025gwob6cozazyo', 3, 'Secure the mailbox that received it', 'Change the password, turn on multi-factor authentication and check for forwarding rules the scammer may have added.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8yt0m0029gwobzn6d83ae', 'cmul8yszu0025gwob6cozazyo', 4, 'Hold any other changed payment details', 'Pause payments to any supplier whose bank details changed recently until each is confirmed by phone.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8yt0p002agwobwfwg04fl', 'cmul8yszu0025gwob6cozazyo', 5, 'Report it to ReportCyber', 'At cyber.gov.au, choosing the business option. Your bank may ask for the reference.');
INSERT INTO "public"."RecoveryStep" ("id", "checklistId", "position", "title", "detail") VALUES ('cmul8yt0s002bgwoblcq3dv0c', 'cmul8yszu0025gwob6cozazyo', 6, 'Write the rule down', 'Agree that bank-detail changes are only ever confirmed by phone, on a number already on file, before the next invoice arrives.');


--
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."Report" ("id", "reference", "authorId", "categoryId", "suburbId", "channel", "status", "severity", "title", "description", "amountLostCents", "occurredAt", "submittedAt", "withdrawnAt", "deletedAt", "createdAt", "updatedAt", "reviewerId", "retentionUntil") VALUES ('cmul8yup4002jgwobj4ihvlq1', 'HCC-SYN-0001', 'cmul8yuo5002ggwob3ijzmrjm', 'cmul8ysli0002gwobyvuryphk', 'cmul8ysoa000jgwobq6dvvq3w', 'SMS', 'APPROVED', 'MEDIUM', 'SYNTHETIC — fake toll text asking for $4.20', 'Synthetic record for development. A text claiming an unpaid toll with a link to a lookalike payment page.', NULL, '2026-08-31 23:30:00', '2026-09-01 00:05:00', NULL, NULL, '2026-09-28 12:52:12.904', '2026-09-28 12:52:12.904', 'cmul8yu9w002egwobmsq5mvs3', '2033-08-31 14:00:00');


--
-- Data for Name: ReportIndicator; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."ReportIndicator" ("reportId", "indicatorId") VALUES ('cmul8yup4002jgwobj4ihvlq1', 'cmul8yuor002igwobfj86bwlh');


--
-- Data for Name: ReportRelation; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ReportReview; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."ReportReview" ("id", "reportId", "reviewerId", "decision", "severity", "notes", "createdAt") VALUES ('cmul8yupf002kgwobcmw0r4my', 'cmul8yup4002jgwobj4ihvlq1', 'cmul8yu9w002egwobmsq5mvs3', 'APPROVED', 'MEDIUM', 'Synthetic review: lookalike domain confirmed; alert drafted with reporter details removed.', '2026-09-28 12:52:12.904');


--
-- Data for Name: ScamCategory; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmul8ysii0000gwob6db23ovb', 'phishing', 'Phishing', 'Messages impersonating a trusted organisation to capture passwords, codes or card details.', NULL, '2026-09-28 12:52:10.074');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmul8ysld0001gwobsqf3ktiz', 'parcel-delivery', 'Parcel delivery', 'Fake missed-delivery, customs-fee and redelivery messages.', NULL, '2026-09-28 12:52:10.177');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmul8ysli0002gwobyvuryphk', 'toll-and-fines', 'Tolls and fines', 'Fake unpaid toll, parking fine and infringement notices.', NULL, '2026-09-28 12:52:10.182');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmul8yslm0003gwobzhhnounl', 'government-impersonation', 'Government impersonation', 'Messages claiming to be myGov, the ATO, Services Australia or Council.', NULL, '2026-09-28 12:52:10.187');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmul8yslq0004gwob2tl9hygy', 'bank-impersonation', 'Bank impersonation', 'Fake fraud alerts and security calls claiming to be from a bank.', NULL, '2026-09-28 12:52:10.191');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmul8yslv0005gwobnevzypen', 'family-impersonation', 'Hi Mum / family impersonation', 'Someone claiming to be a relative on a new number, asking for money.', NULL, '2026-09-28 12:52:10.195');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmul8ysly0006gwob4c473x87', 'payment-redirection', 'Payment redirection', 'Invoice and business email compromise — changed bank details.', NULL, '2026-09-28 12:52:10.198');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmul8ysm30007gwobs54n67aq', 'investment', 'Investment', 'Fake trading platforms, crypto schemes and guaranteed-return offers.', NULL, '2026-09-28 12:52:10.203');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmul8ysmc0008gwobeiywpb4o', 'romance', 'Romance', 'Relationships built online to extract money over time.', NULL, '2026-09-28 12:52:10.212');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmul8ysmg0009gwobx01d8rvw', 'jobs', 'Jobs and employment', 'Task-based, work-from-home and money-mule job offers.', NULL, '2026-09-28 12:52:10.216');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmul8ysmo000agwobxoibfhxd', 'remote-access', 'Remote access and tech support', 'Requests to install remote-access software to ''fix'' a problem.', NULL, '2026-09-28 12:52:10.224');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmul8ysmt000bgwobvs5e5m9m', 'online-shopping', 'Online shopping and marketplace', 'Fake stores, fake sellers and overpayment scams.', NULL, '2026-09-28 12:52:10.229');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmul8ysmz000cgwobg6yoam12', 'prize-and-lottery', 'Prizes and lotteries', 'Unexpected winnings that require a fee to release.', NULL, '2026-09-28 12:52:10.235');
INSERT INTO "public"."ScamCategory" ("id", "slug", "name", "description", "archivedAt", "createdAt") VALUES ('cmul8ysn6000dgwobw0tdkw96', 'identity-theft', 'Identity theft', 'Attempts to obtain identity documents or personal details.', NULL, '2026-09-28 12:52:10.242');


--
-- Data for Name: ScamCheck; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."ScamCheck" ("id", "userId", "channel", "content", "score", "band", "confidence", "createdAt", "retentionUntil", "ruleSetVersion") VALUES ('cmul8yuq5002lgwobhhx7wyvk', NULL, 'SMS', 'SYNTHETIC — LINKT: You have an unpaid toll of $4.20. Settle now: linkt-au.pay-toll.online', 96, 'HIGH', 0.86, '2026-09-28 12:52:12.941', '2026-12-27 12:52:12.935', '2026-09-10');


--
-- Data for Name: ScamCheckIndicator; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."ScamCheckIndicator" ("id", "checkId", "ruleId", "label", "detail", "weight", "evidence") VALUES ('cmul8yuq7002mgwobu6j1t485', 'cmul8yuq5002lgwobhhx7wyvk', 'urgency', 'Urgency language', 'Pressure to act inside a deadline.', 'HIGH', 'Settle now');
INSERT INTO "public"."ScamCheckIndicator" ("id", "checkId", "ruleId", "label", "detail", "weight", "evidence") VALUES ('cmul8yuq7002ngwobcs2puo6c', 'cmul8yuq5002lgwobhhx7wyvk', 'link-lookalike', 'Lookalike domain', 'Names linkt but is registered to pay-toll.online.', 'HIGH', 'linkt-au.pay-toll[.]online');


--
-- Data for Name: SiteNotice; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Suburb; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysnd000egwobyk5lpkva', 'Attwood', '3049');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysnm000fgwob3d8i4f0x', 'Broadmeadows', '3047');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysnt000ggwobatpvp8fy', 'Bulla', '3428');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8yso0000hgwob560wmaop', 'Campbellfield', '3061');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8yso6000igwobjkjb5umu', 'Coolaroo', '3048');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysoa000jgwobq6dvvq3w', 'Craigieburn', '3064');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysof000kgwoblugqtt4c', 'Dallas', '3047');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysok000lgwob9kshewka', 'Donnybrook', '3064');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysot000mgwobyrat90vh', 'Gladstone Park', '3043');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysox000ngwobhiw4kv64', 'Greenvale', '3059');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysp7000ogwob4t7gxk2y', 'Jacana', '3047');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8yspe000pgwobyqb59oo6', 'Kalkallo', '3064');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8yspi000qgwobr2xkzo7s', 'Meadow Heights', '3048');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8yspn000rgwob4gbfxz0e', 'Melbourne Airport', '3045');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8yspt000sgwobsc3833hc', 'Mickleham', '3064');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8yspy000tgwob9vol19zk', 'Oaklands Junction', '3063');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysq6000ugwobr90ya5vf', 'Roxburgh Park', '3064');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysqc000vgwob16yhx5c9', 'Somerton', '3062');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysqg000wgwob3jexoctj', 'Sunbury', '3429');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysqj000xgwobv4ek1jc5', 'Tullamarine', '3043');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysqm000ygwobyycf27km', 'Westmeadows', '3049');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysqt000zgwoba5ue9afq', 'Wildwood', '3429');
INSERT INTO "public"."Suburb" ("id", "name", "postcode") VALUES ('cmul8ysqx0010gwob1eku3i0x', 'Yuroke', '3063');


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: TaskComment; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."User" ("id", "email", "passwordHash", "fullName", "organisation", "phone", "role", "emailVerified", "lastLoginAt", "deletedAt", "createdAt", "updatedAt", "retentionUntil", "department", "jobTitle") VALUES ('cmul8ytwc002cgwobinib8xfs', 'admin.demo@cyberkent.test', '[bcrypt digest redacted for submission]', 'CyberKent Administrator', NULL, NULL, 'ADMIN', '2026-09-28 12:52:11.842', NULL, NULL, '2026-09-28 12:52:11.868', '2026-09-28 12:52:11.868', NULL, NULL, NULL);
INSERT INTO "public"."User" ("id", "email", "passwordHash", "fullName", "organisation", "phone", "role", "emailVerified", "lastLoginAt", "deletedAt", "createdAt", "updatedAt", "retentionUntil", "department", "jobTitle") VALUES ('cmul8yu9w002egwobmsq5mvs3', 'officer.synthetic@cyberkent.test', '[bcrypt digest redacted for submission]', 'Synthetic Officer', NULL, NULL, 'OFFICER', '2026-09-28 12:52:12.348', NULL, NULL, '2026-09-28 12:52:12.356', '2026-09-28 12:52:12.356', NULL, NULL, NULL);
INSERT INTO "public"."User" ("id", "email", "passwordHash", "fullName", "organisation", "phone", "role", "emailVerified", "lastLoginAt", "deletedAt", "createdAt", "updatedAt", "retentionUntil", "department", "jobTitle") VALUES ('cmul8yuo5002ggwob3ijzmrjm', 'resident.synthetic@cyberkent.test', '[bcrypt digest redacted for submission]', 'Synthetic Resident', NULL, NULL, 'RESIDENT', '2026-09-28 12:52:12.86', NULL, NULL, '2026-09-28 12:52:12.869', '2026-09-28 12:52:12.869', NULL, NULL, NULL);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO "public"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('5e40fea0-1a0b-47e1-a7d3-6d89868b5067', '3769c22e4bc9e43e07317fac8a1b742b7d2e6b6ffd78b3151d632927662a3b7b', '2026-09-28 12:52:08.780171+00', '20260807105640_init_cybersafe_schema', NULL, NULL, '2026-09-28 12:52:07.899826+00', 1);
INSERT INTO "public"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('110ad0ba-c777-40f4-b345-0c4dbede0710', '57d66cc7ac2b6ef8a091fafea7a69a4732dedce2600bbdf6e189872bf7b349e4', '2026-09-28 12:52:08.863594+00', '20260910100000_ai_interactions_and_ethics_controls', NULL, NULL, '2026-09-28 12:52:08.781079+00', 1);
INSERT INTO "public"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('9b450a57-ee7e-43f3-b427-67e6e2074205', '0c78b538284d117c0cdc84caa175afed4c962aa9bdaf09a13f1016407e0b0730', '2026-09-28 12:52:08.940998+00', '20260925014720_admin_panel', NULL, NULL, '2026-09-28 12:52:08.868958+00', 1);


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
-- Name: SiteNotice SiteNotice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."SiteNotice"
    ADD CONSTRAINT "SiteNotice_pkey" PRIMARY KEY ("id");


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
-- Name: TaskComment TaskComment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."TaskComment"
    ADD CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id");


--
-- Name: Task Task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY ("id");


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
-- Name: AwarenessResource_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AwarenessResource_publishedAt_idx" ON "public"."AwarenessResource" USING "btree" ("publishedAt");


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
-- Name: SiteNotice_startsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SiteNotice_startsAt_idx" ON "public"."SiteNotice" USING "btree" ("startsAt");


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
-- Name: TaskComment_taskId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TaskComment_taskId_idx" ON "public"."TaskComment" USING "btree" ("taskId");


--
-- Name: Task_assigneeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Task_assigneeId_idx" ON "public"."Task" USING "btree" ("assigneeId");


--
-- Name: Task_dueAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Task_dueAt_idx" ON "public"."Task" USING "btree" ("dueAt");


--
-- Name: Task_reference_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Task_reference_key" ON "public"."Task" USING "btree" ("reference");


--
-- Name: Task_reportId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Task_reportId_idx" ON "public"."Task" USING "btree" ("reportId");


--
-- Name: Task_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Task_status_idx" ON "public"."Task" USING "btree" ("status");


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
-- Name: AwarenessResource AwarenessResource_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."AwarenessResource"
    ADD CONSTRAINT "AwarenessResource_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: SiteNotice SiteNotice_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."SiteNotice"
    ADD CONSTRAINT "SiteNotice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: TaskComment TaskComment_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."TaskComment"
    ADD CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TaskComment TaskComment_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."TaskComment"
    ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Task Task_assigneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Task"
    ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Task"
    ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Task"
    ADD CONSTRAINT "Task_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--


