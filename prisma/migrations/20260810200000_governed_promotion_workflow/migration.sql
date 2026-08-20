-- CreateEnum
CREATE TYPE "PromotionStage" AS ENUM ('DEPARTMENT', 'FACULTY', 'RAPC', 'EXTERNAL_ASSESSMENT', 'UAPC', 'COUNCIL', 'ACADEMIC_BOARD', 'FINAL_NOTIFICATION', 'APPEAL');

-- CreateEnum
CREATE TYPE "PromotionStageStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RETURNED', 'COMPLETED', 'WAIVED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ExternalAssessorStatus" AS ENUM ('NOMINATED', 'CONFLICTED', 'INVITED', 'ACCEPTED', 'DECLINED', 'REPORT_REQUESTED', 'REPORT_RECEIVED', 'REPLACED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('APPLICANT_SELF', 'HEAD_OF_UNIT', 'HOD_TEACHING', 'DEAN', 'FAPC', 'RAPC', 'EXTERNAL_ASSESSOR', 'UAPC', 'COUNCIL');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('FILED', 'UNDER_REVIEW', 'HEARING_SCHEDULED', 'DECIDED', 'WITHDRAWN', 'CLOSED');

-- CreateTable
CREATE TABLE "promotion_stage_records" (
    "id" SERIAL NOT NULL,
    "promotionRequestId" INTEGER NOT NULL,
    "stage" "PromotionStage" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "PromotionStageStatus" NOT NULL DEFAULT 'PENDING',
    "assignedToId" INTEGER,
    "startedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "decision" "ReviewRecommendation",
    "decisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_stage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_assessments" (
    "id" SERIAL NOT NULL,
    "promotionRequestId" INTEGER NOT NULL,
    "stageRecordId" INTEGER,
    "assessorId" INTEGER NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "teachingCategory" "PerformanceCategory",
    "knowledgeCategory" "PerformanceCategory",
    "serviceCategory" "PerformanceCategory",
    "workKnowledgeCategory" "PerformanceCategory",
    "workApplicationCategory" "PerformanceCategory",
    "humanRelationsCategory" "PerformanceCategory",
    "narrative" TEXT,
    "recommendation" "ReviewRecommendation",
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_assessors" (
    "id" SERIAL NOT NULL,
    "promotionRequestId" INTEGER NOT NULL,
    "nominatedById" INTEGER,
    "appointedById" INTEGER,
    "name" TEXT NOT NULL,
    "institution" TEXT,
    "country" TEXT,
    "specialization" TEXT,
    "officialEmail" TEXT,
    "status" "ExternalAssessorStatus" NOT NULL DEFAULT 'NOMINATED',
    "conflictCheckedAt" TIMESTAMP(3),
    "conflictReason" TEXT,
    "invitedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "reportRequestedAt" TIMESTAMP(3),
    "reportReceivedAt" TIMESTAMP(3),
    "reportDocumentId" INTEGER,
    "reportSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_assessors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_meetings" (
    "id" SERIAL NOT NULL,
    "promotionRequestId" INTEGER NOT NULL,
    "stageRecordId" INTEGER,
    "authority" "DecisionAuthority" NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "quorumRequired" INTEGER,
    "quorumPresent" INTEGER,
    "quorumMet" BOOLEAN,
    "agendaReference" TEXT,
    "minutesDocumentId" INTEGER,
    "resolution" TEXT,
    "recommendation" "ReviewRecommendation",
    "chairId" INTEGER,
    "secretaryId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "committee_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_appeals" (
    "id" SERIAL NOT NULL,
    "promotionRequestId" INTEGER NOT NULL,
    "filedById" INTEGER NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'FILED',
    "grounds" TEXT NOT NULL,
    "filedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "decision" TEXT,
    "decisionById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_appeals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promotion_stage_records_assignedToId_status_idx" ON "promotion_stage_records"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "promotion_stage_records_promotionRequestId_status_idx" ON "promotion_stage_records"("promotionRequestId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_stage_records_promotionRequestId_stage_sequence_key" ON "promotion_stage_records"("promotionRequestId", "stage", "sequence");

-- CreateIndex
CREATE INDEX "promotion_assessments_promotionRequestId_type_idx" ON "promotion_assessments"("promotionRequestId", "type");

-- CreateIndex
CREATE INDEX "promotion_assessments_assessorId_idx" ON "promotion_assessments"("assessorId");

-- CreateIndex
CREATE INDEX "external_assessors_promotionRequestId_status_idx" ON "external_assessors"("promotionRequestId", "status");

-- CreateIndex
CREATE INDEX "external_assessors_reportDocumentId_idx" ON "external_assessors"("reportDocumentId");

-- CreateIndex
CREATE INDEX "committee_meetings_promotionRequestId_authority_idx" ON "committee_meetings"("promotionRequestId", "authority");

-- CreateIndex
CREATE INDEX "committee_meetings_chairId_idx" ON "committee_meetings"("chairId");

-- CreateIndex
CREATE INDEX "committee_meetings_secretaryId_idx" ON "committee_meetings"("secretaryId");

-- CreateIndex
CREATE INDEX "promotion_appeals_promotionRequestId_status_idx" ON "promotion_appeals"("promotionRequestId", "status");

-- CreateIndex
CREATE INDEX "promotion_appeals_filedById_idx" ON "promotion_appeals"("filedById");

-- CreateIndex
CREATE INDEX "promotion_appeals_decisionById_idx" ON "promotion_appeals"("decisionById");

-- AddForeignKey
ALTER TABLE "promotion_stage_records" ADD CONSTRAINT "promotion_stage_records_promotionRequestId_fkey" FOREIGN KEY ("promotionRequestId") REFERENCES "promotion_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_stage_records" ADD CONSTRAINT "promotion_stage_records_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_assessments" ADD CONSTRAINT "promotion_assessments_promotionRequestId_fkey" FOREIGN KEY ("promotionRequestId") REFERENCES "promotion_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_assessments" ADD CONSTRAINT "promotion_assessments_stageRecordId_fkey" FOREIGN KEY ("stageRecordId") REFERENCES "promotion_stage_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_assessments" ADD CONSTRAINT "promotion_assessments_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_assessors" ADD CONSTRAINT "external_assessors_promotionRequestId_fkey" FOREIGN KEY ("promotionRequestId") REFERENCES "promotion_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_assessors" ADD CONSTRAINT "external_assessors_nominatedById_fkey" FOREIGN KEY ("nominatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_assessors" ADD CONSTRAINT "external_assessors_appointedById_fkey" FOREIGN KEY ("appointedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_assessors" ADD CONSTRAINT "external_assessors_reportDocumentId_fkey" FOREIGN KEY ("reportDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_meetings" ADD CONSTRAINT "committee_meetings_promotionRequestId_fkey" FOREIGN KEY ("promotionRequestId") REFERENCES "promotion_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_meetings" ADD CONSTRAINT "committee_meetings_stageRecordId_fkey" FOREIGN KEY ("stageRecordId") REFERENCES "promotion_stage_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_meetings" ADD CONSTRAINT "committee_meetings_minutesDocumentId_fkey" FOREIGN KEY ("minutesDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_meetings" ADD CONSTRAINT "committee_meetings_chairId_fkey" FOREIGN KEY ("chairId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_meetings" ADD CONSTRAINT "committee_meetings_secretaryId_fkey" FOREIGN KEY ("secretaryId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_appeals" ADD CONSTRAINT "promotion_appeals_promotionRequestId_fkey" FOREIGN KEY ("promotionRequestId") REFERENCES "promotion_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_appeals" ADD CONSTRAINT "promotion_appeals_filedById_fkey" FOREIGN KEY ("filedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_appeals" ADD CONSTRAINT "promotion_appeals_decisionById_fkey" FOREIGN KEY ("decisionById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
