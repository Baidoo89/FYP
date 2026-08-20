-- CreateEnum
CREATE TYPE "DossierStatus" AS ENUM ('DRAFT', 'READY_FOR_SUBMISSION', 'FROZEN', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "AcademicPacketStatus" AS ENUM ('DRAFT', 'FROZEN', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ScholarlyOutputType" AS ENUM ('REFEREED_JOURNAL_ARTICLE', 'PEER_REVIEWED_HIGHER_EDUCATION_BOOK', 'PEER_REVIEWED_EXHIBITION', 'INDEXED_CONFERENCE_PROCEEDING', 'NON_INDEXED_CONFERENCE_PROCEEDING', 'DEPLOYED_TECHNOLOGY_PRODUCT_DESIGN', 'PATENTED_INVENTION', 'PEER_REVIEWED_BOOK_CHAPTER', 'NON_PEER_REVIEWED_BOOK_CHAPTER');

-- CreateTable
CREATE TABLE "academic_dossiers" (
    "id" SERIAL NOT NULL,
    "promotionRequestId" INTEGER NOT NULL,
    "status" "DossierStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "orcid" TEXT,
    "googleScholarUrl" TEXT,
    "teachingStatement" TEXT,
    "researchStatement" TEXT,
    "serviceStatement" TEXT,
    "applicantDeclaration" BOOLEAN NOT NULL DEFAULT false,
    "declaredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarly_outputs" (
    "id" SERIAL NOT NULL,
    "academicDossierId" INTEGER NOT NULL,
    "type" "ScholarlyOutputType" NOT NULL,
    "title" TEXT NOT NULL,
    "citation" TEXT NOT NULL,
    "abstract" TEXT,
    "publicationDate" TIMESTAMP(3),
    "doi" TEXT,
    "url" TEXT,
    "issn" TEXT,
    "isbn" TEXT,
    "journalOrPublisher" TEXT,
    "volumeIssuePages" TEXT,
    "indexingSource" TEXT,
    "indexingVerifiedOn" TIMESTAMP(3),
    "authors" JSONB NOT NULL,
    "applicantAuthorPosition" INTEGER,
    "contributionStatement" TEXT NOT NULL,
    "isRefereed" BOOLEAN NOT NULL DEFAULT false,
    "isIndexed" BOOLEAN NOT NULL DEFAULT false,
    "claimedForCurrentRoute" BOOLEAN NOT NULL DEFAULT true,
    "equivalenceUnits" DOUBLE PRECISION NOT NULL,
    "departmentVerificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "departmentVerifiedById" INTEGER,
    "departmentVerificationNote" TEXT,
    "departmentVerifiedAt" TIMESTAMP(3),
    "libraryVerificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "libraryVerifiedById" INTEGER,
    "libraryVerificationNote" TEXT,
    "libraryVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarly_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_assessment_packets" (
    "id" SERIAL NOT NULL,
    "academicDossierId" INTEGER NOT NULL,
    "promotionRouteId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "AcademicPacketStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedOutputMinimum" INTEGER,
    "submittedOutputMaximum" INTEGER,
    "minimumRefereedOutputs" INTEGER,
    "bestOutputsRequired" INTEGER,
    "selectedOutputCount" INTEGER NOT NULL DEFAULT 0,
    "selectedEquivalentUnits" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ruleSnapshot" JSONB NOT NULL,
    "frozenById" INTEGER,
    "frozenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_assessment_packets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_assessment_packet_items" (
    "id" SERIAL NOT NULL,
    "academicAssessmentPacketId" INTEGER NOT NULL,
    "scholarlyOutputId" INTEGER NOT NULL,
    "selectionOrder" INTEGER NOT NULL,
    "equivalenceUnitsSnapshot" DOUBLE PRECISION NOT NULL,
    "outputSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_assessment_packet_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "academic_dossiers_promotionRequestId_key" ON "academic_dossiers"("promotionRequestId");
CREATE INDEX "academic_dossiers_status_idx" ON "academic_dossiers"("status");
CREATE INDEX "scholarly_outputs_academicDossierId_claimedForCurrentRoute_idx" ON "scholarly_outputs"("academicDossierId", "claimedForCurrentRoute");
CREATE INDEX "scholarly_outputs_departmentVerificationStatus_libraryVerif_idx" ON "scholarly_outputs"("departmentVerificationStatus", "libraryVerificationStatus");
CREATE UNIQUE INDEX "scholarly_outputs_academicDossierId_doi_key" ON "scholarly_outputs"("academicDossierId", "doi");
CREATE INDEX "academic_assessment_packets_promotionRouteId_status_idx" ON "academic_assessment_packets"("promotionRouteId", "status");
CREATE INDEX "academic_assessment_packets_frozenById_idx" ON "academic_assessment_packets"("frozenById");
CREATE UNIQUE INDEX "academic_assessment_packets_academicDossierId_version_key" ON "academic_assessment_packets"("academicDossierId", "version");
CREATE INDEX "academic_assessment_packet_items_scholarlyOutputId_idx" ON "academic_assessment_packet_items"("scholarlyOutputId");
CREATE UNIQUE INDEX "academic_packet_items_packet_output_key" ON "academic_assessment_packet_items"("academicAssessmentPacketId", "scholarlyOutputId");
CREATE UNIQUE INDEX "academic_packet_items_packet_order_key" ON "academic_assessment_packet_items"("academicAssessmentPacketId", "selectionOrder");

ALTER TABLE "academic_dossiers" ADD CONSTRAINT "academic_dossiers_promotionRequestId_fkey" FOREIGN KEY ("promotionRequestId") REFERENCES "promotion_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scholarly_outputs" ADD CONSTRAINT "scholarly_outputs_academicDossierId_fkey" FOREIGN KEY ("academicDossierId") REFERENCES "academic_dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scholarly_outputs" ADD CONSTRAINT "scholarly_outputs_departmentVerifiedById_fkey" FOREIGN KEY ("departmentVerifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "scholarly_outputs" ADD CONSTRAINT "scholarly_outputs_libraryVerifiedById_fkey" FOREIGN KEY ("libraryVerifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "academic_assessment_packets" ADD CONSTRAINT "academic_assessment_packets_academicDossierId_fkey" FOREIGN KEY ("academicDossierId") REFERENCES "academic_dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "academic_assessment_packets" ADD CONSTRAINT "academic_assessment_packets_promotionRouteId_fkey" FOREIGN KEY ("promotionRouteId") REFERENCES "promotion_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academic_assessment_packets" ADD CONSTRAINT "academic_assessment_packets_frozenById_fkey" FOREIGN KEY ("frozenById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "academic_assessment_packet_items" ADD CONSTRAINT "academic_assessment_packet_items_academicAssessmentPacketI_fkey" FOREIGN KEY ("academicAssessmentPacketId") REFERENCES "academic_assessment_packets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "academic_assessment_packet_items" ADD CONSTRAINT "academic_assessment_packet_items_scholarlyOutputId_fkey" FOREIGN KEY ("scholarlyOutputId") REFERENCES "scholarly_outputs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
