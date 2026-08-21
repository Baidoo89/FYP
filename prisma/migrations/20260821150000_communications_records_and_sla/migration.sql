-- CreateEnum
CREATE TYPE "CommunicationDeliveryStatus" AS ENUM ('LOGGED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "CommunicationPurpose" AS ENUM ('ACCOUNT_SETUP', 'STAFF_ACTIVATION', 'PROMOTION_MILESTONE', 'EXTERNAL_ASSESSOR_INVITATION', 'QUARTERLY_STATUS_UPDATE', 'DECISION_NOTICE', 'GENERAL');

-- CreateEnum
CREATE TYPE "RecordAccessClassification" AS ENUM ('OPEN', 'CONFIDENTIAL', 'CONFIDENTIAL_SENSITIVE', 'SECRET');

-- CreateEnum
CREATE TYPE "RecordLifecycleStatus" AS ENUM ('ACTIVE', 'CLOSED', 'UNDER_HOLD', 'ARCHIVED', 'DISPOSITION_AUTHORIZED', 'DISPOSED');

-- AlterTable
ALTER TABLE "promotion_requests"
ADD COLUMN "caseDueAt" TIMESTAMP(3),
ADD COLUMN "nextApplicantUpdateDueAt" TIMESTAMP(3),
ADD COLUMN "effectiveDate" TIMESTAMP(3),
ADD COLUMN "decisionCommunicatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "communication_deliveries" (
  "id" SERIAL NOT NULL,
  "promotionRequestId" INTEGER,
  "recipientUserId" INTEGER,
  "externalAssessorId" INTEGER,
  "purpose" "CommunicationPurpose" NOT NULL,
  "recipientAddress" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "status" "CommunicationDeliveryStatus" NOT NULL,
  "errorMessage" TEXT,
  "metadata" JSONB,
  "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "communication_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_record_controls" (
  "id" SERIAL NOT NULL,
  "promotionRequestId" INTEGER NOT NULL,
  "accessClassification" "RecordAccessClassification" NOT NULL DEFAULT 'CONFIDENTIAL_SENSITIVE',
  "retentionClass" TEXT NOT NULL DEFAULT 'EMPLOYMENT_END_PLUS_6_YEARS',
  "retentionTriggerDate" TIMESTAMP(3),
  "retainUntil" TIMESTAMP(3),
  "lifecycleStatus" "RecordLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
  "legalHold" BOOLEAN NOT NULL DEFAULT false,
  "holdReason" TEXT,
  "holdPlacedById" INTEGER,
  "holdPlacedAt" TIMESTAMP(3),
  "holdReleasedById" INTEGER,
  "holdReleasedAt" TIMESTAMP(3),
  "archiveReference" TEXT,
  "archivedById" INTEGER,
  "archivedAt" TIMESTAMP(3),
  "dispositionApprovedById" INTEGER,
  "dispositionApprovedAt" TIMESTAMP(3),
  "destructionCertificateReference" TEXT,
  "disposedById" INTEGER,
  "disposedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "promotion_record_controls_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "promotion_requests_caseDueAt_idx" ON "promotion_requests"("caseDueAt");
CREATE INDEX "communication_deliveries_promotionRequestId_attemptedAt_idx" ON "communication_deliveries"("promotionRequestId", "attemptedAt");
CREATE INDEX "communication_deliveries_recipientUserId_attemptedAt_idx" ON "communication_deliveries"("recipientUserId", "attemptedAt");
CREATE INDEX "communication_deliveries_externalAssessorId_attemptedAt_idx" ON "communication_deliveries"("externalAssessorId", "attemptedAt");
CREATE INDEX "communication_deliveries_status_attemptedAt_idx" ON "communication_deliveries"("status", "attemptedAt");
CREATE UNIQUE INDEX "promotion_record_controls_promotionRequestId_key" ON "promotion_record_controls"("promotionRequestId");
CREATE INDEX "promotion_record_controls_lifecycleStatus_retainUntil_idx" ON "promotion_record_controls"("lifecycleStatus", "retainUntil");
CREATE INDEX "promotion_record_controls_legalHold_idx" ON "promotion_record_controls"("legalHold");

ALTER TABLE "communication_deliveries" ADD CONSTRAINT "communication_deliveries_promotionRequestId_fkey" FOREIGN KEY ("promotionRequestId") REFERENCES "promotion_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "communication_deliveries" ADD CONSTRAINT "communication_deliveries_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "communication_deliveries" ADD CONSTRAINT "communication_deliveries_externalAssessorId_fkey" FOREIGN KEY ("externalAssessorId") REFERENCES "external_assessors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "promotion_record_controls" ADD CONSTRAINT "promotion_record_controls_promotionRequestId_fkey" FOREIGN KEY ("promotionRequestId") REFERENCES "promotion_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
