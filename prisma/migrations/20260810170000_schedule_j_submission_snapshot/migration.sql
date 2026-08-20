-- AlterTable
ALTER TABLE "promotion_requests" ADD COLUMN     "dossierSnapshot" JSONB,
ADD COLUMN     "dossierVersion" INTEGER,
ADD COLUMN     "receiptNumber" TEXT;

-- CreateTable
CREATE TABLE "scholarly_output_evidence" (
    "id" SERIAL NOT NULL,
    "scholarlyOutputId" INTEGER NOT NULL,
    "documentId" INTEGER NOT NULL,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scholarly_output_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scholarly_output_evidence_documentId_idx" ON "scholarly_output_evidence"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "scholarly_output_evidence_output_document_key" ON "scholarly_output_evidence"("scholarlyOutputId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_requests_receiptNumber_key" ON "promotion_requests"("receiptNumber");

-- AddForeignKey
ALTER TABLE "scholarly_output_evidence" ADD CONSTRAINT "scholarly_output_evidence_scholarlyOutputId_fkey" FOREIGN KEY ("scholarlyOutputId") REFERENCES "scholarly_outputs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarly_output_evidence" ADD CONSTRAINT "scholarly_output_evidence_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
