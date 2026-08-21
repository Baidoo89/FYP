-- CreateEnum
CREATE TYPE "OfficialFormAudience" AS ENUM ('APPLICANT', 'SUPERVISOR', 'DEPARTMENT', 'FACULTY', 'RAPC', 'EXTERNAL_ASSESSOR', 'UAPC', 'COUNCIL', 'HRODD', 'REGISTRAR', 'LIBRARY');

-- CreateEnum
CREATE TYPE "OfficialFormSubmissionStatus" AS ENUM ('DRAFT', 'READY', 'SUBMITTED', 'FROZEN', 'RETURNED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "official_form_templates" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "audience" "OfficialFormAudience" NOT NULL,
    "staffCategory" "StaffCategory",
    "trackType" "PromotionTrackType",
    "routeCodePrefixes" JSONB,
    "jobFamilyCodes" JSONB,
    "sourceReference" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "official_form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_form_submissions" (
    "id" SERIAL NOT NULL,
    "promotionRequestId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "stageRecordId" INTEGER,
    "completedById" INTEGER,
    "status" "OfficialFormSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "templateSnapshot" JSONB NOT NULL,
    "responses" JSONB NOT NULL,
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "validationErrors" JSONB,
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "declared" BOOLEAN NOT NULL DEFAULT false,
    "declarationText" TEXT,
    "signedName" TEXT,
    "signedAt" TIMESTAMP(3),
    "signedIpAddress" TEXT,
    "signedUserAgent" TEXT,
    "submittedAt" TIMESTAMP(3),
    "frozenAt" TIMESTAMP(3),
    "returnedReason" TEXT,
    "supersedesId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "official_form_templates_code_version_key" ON "official_form_templates"("code", "version");

-- CreateIndex
CREATE INDEX "official_form_templates_audience_isActive_idx" ON "official_form_templates"("audience", "isActive");

-- CreateIndex
CREATE INDEX "official_form_templates_staffCategory_trackType_idx" ON "official_form_templates"("staffCategory", "trackType");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_form_submission_version_key" ON "promotion_form_submissions"("promotionRequestId", "templateId", "completedById", "version");

-- CreateIndex
CREATE INDEX "promotion_form_submissions_promotionRequestId_status_idx" ON "promotion_form_submissions"("promotionRequestId", "status");

-- CreateIndex
CREATE INDEX "promotion_form_submissions_templateId_status_idx" ON "promotion_form_submissions"("templateId", "status");

-- CreateIndex
CREATE INDEX "promotion_form_submissions_stageRecordId_idx" ON "promotion_form_submissions"("stageRecordId");

-- CreateIndex
CREATE INDEX "promotion_form_submissions_completedById_idx" ON "promotion_form_submissions"("completedById");

-- CreateIndex
CREATE INDEX "promotion_form_submissions_supersedesId_idx" ON "promotion_form_submissions"("supersedesId");

-- AddForeignKey
ALTER TABLE "promotion_form_submissions" ADD CONSTRAINT "promotion_form_submissions_promotionRequestId_fkey" FOREIGN KEY ("promotionRequestId") REFERENCES "promotion_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_form_submissions" ADD CONSTRAINT "promotion_form_submissions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "official_form_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_form_submissions" ADD CONSTRAINT "promotion_form_submissions_stageRecordId_fkey" FOREIGN KEY ("stageRecordId") REFERENCES "promotion_stage_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_form_submissions" ADD CONSTRAINT "promotion_form_submissions_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_form_submissions" ADD CONSTRAINT "promotion_form_submissions_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "promotion_form_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
