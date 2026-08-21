-- AlterTable
ALTER TABLE "external_assessors"
ADD COLUMN "invitationTokenHash" TEXT,
ADD COLUMN "invitationExpiresAt" TIMESTAMP(3),
ADD COLUMN "portalLastAccessAt" TIMESTAMP(3),
ADD COLUMN "conflictDeclaredAt" TIMESTAMP(3),
ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "promotion_form_submissions"
ADD COLUMN "externalAssessorId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "external_assessors_invitationTokenHash_key" ON "external_assessors"("invitationTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_form_external_assessor_version_key" ON "promotion_form_submissions"("promotionRequestId", "templateId", "externalAssessorId", "version");

-- CreateIndex
CREATE INDEX "promotion_form_submissions_externalAssessorId_idx" ON "promotion_form_submissions"("externalAssessorId");

-- AddForeignKey
ALTER TABLE "promotion_form_submissions" ADD CONSTRAINT "promotion_form_submissions_externalAssessorId_fkey" FOREIGN KEY ("externalAssessorId") REFERENCES "external_assessors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
