-- Iteration 5 migration: OpenAI integration audit table and the M8
-- database-ethics corrective actions (Final SRS §10.4.4).
--
--   ER-2   published alerts cannot keep a link to their source report
--   ER-5   evidence records whether its metadata was stripped
--   ER-6   retention dates on every table that holds personal data
--   ER-9   the rule-set version is stored with every score
--   ER-13  indicators carry verification status, confidence and expiry
--   Rule 8.3 / FR72  AiInteraction — audit of every AI call, holding no content
--
-- Additive only: no column is dropped or narrowed, so this applies to a
-- database holding data without loss.

-- CreateEnum
CREATE TYPE "IndicatorStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'DISPUTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AiFeature" AS ENUM ('TEXT_ANALYSIS', 'IMAGE_ANALYSIS', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "AiOutcome" AS ENUM ('SUCCEEDED', 'BLOCKED', 'REFUSED', 'UNAVAILABLE', 'FAILED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "retentionUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ScamCheck" ADD COLUMN     "retentionUntil" TIMESTAMP(3),
ADD COLUMN     "ruleSetVersion" TEXT;

-- AlterTable
ALTER TABLE "Indicator" ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "verificationStatus" "IndicatorStatus" NOT NULL DEFAULT 'UNVERIFIED';

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "retentionUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN     "metadataStrippedAt" TIMESTAMP(3),
ADD COLUMN     "retentionUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "retentionUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "retentionUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AiInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "feature" "AiFeature" NOT NULL,
    "outcome" "AiOutcome" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputSha256" TEXT NOT NULL,
    "inputChars" INTEGER NOT NULL,
    "redactions" INTEGER NOT NULL DEFAULT 0,
    "verdict" TEXT,
    "riskScore" INTEGER,
    "confidence" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiInteraction_feature_createdAt_idx" ON "AiInteraction"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "AiInteraction_userId_idx" ON "AiInteraction"("userId");

-- CreateIndex
CREATE INDEX "AiInteraction_inputSha256_idx" ON "AiInteraction"("inputSha256");

-- CreateIndex
CREATE INDEX "Indicator_verificationStatus_idx" ON "Indicator"("verificationStatus");

-- AddForeignKey
ALTER TABLE "AiInteraction" ADD CONSTRAINT "AiInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ── Constraints Prisma cannot express ───────────────────────────────────────
-- Enforced by PostgreSQL so no code path, present or future, can bypass them.

-- ER-2: a published alert must be severed from the report it came from.
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_published_is_severed_chk"
  CHECK ("status" <> 'PUBLISHED' OR "sourceReportId" IS NULL);

-- NFR-28: scores and confidences stay inside the ranges the service defines.
ALTER TABLE "ScamCheck" ADD CONSTRAINT "ScamCheck_score_range_chk"
  CHECK ("score" BETWEEN 0 AND 100);
ALTER TABLE "ScamCheck" ADD CONSTRAINT "ScamCheck_confidence_range_chk"
  CHECK ("confidence" BETWEEN 0 AND 1);
ALTER TABLE "Indicator" ADD CONSTRAINT "Indicator_confidence_range_chk"
  CHECK ("confidence" IS NULL OR "confidence" BETWEEN 0 AND 1);
ALTER TABLE "ReportRelation" ADD CONSTRAINT "ReportRelation_similarity_range_chk"
  CHECK ("similarity" IS NULL OR "similarity" BETWEEN 0 AND 1);
ALTER TABLE "AiInteraction" ADD CONSTRAINT "AiInteraction_risk_range_chk"
  CHECK ("riskScore" IS NULL OR "riskScore" BETWEEN 0 AND 100);
ALTER TABLE "AiInteraction" ADD CONSTRAINT "AiInteraction_confidence_range_chk"
  CHECK ("confidence" IS NULL OR "confidence" BETWEEN 0 AND 1);

-- Money and sizes cannot be negative.
ALTER TABLE "Report" ADD CONSTRAINT "Report_amount_nonnegative_chk"
  CHECK ("amountLostCents" IS NULL OR "amountLostCents" >= 0);
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_size_positive_chk"
  CHECK ("sizeBytes" > 0);

-- A report cannot be linked to itself.
ALTER TABLE "ReportRelation" ADD CONSTRAINT "ReportRelation_not_self_chk"
  CHECK ("sourceId" <> "targetId");

-- Data minimisation: the AI audit table stores a SHA-256 digest, never content.
ALTER TABLE "AiInteraction" ADD CONSTRAINT "AiInteraction_hash_shape_chk"
  CHECK ("inputSha256" ~ '^[0-9a-f]{64}$');
