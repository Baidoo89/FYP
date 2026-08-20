-- Additive GCTU promotion V2 foundation.
-- This migration creates new policy and institutional domain objects only.
-- It does not drop or alter any legacy table, column, enum value, or data row.

-- CreateEnum
CREATE TYPE "StaffCategory" AS ENUM ('ACADEMIC_SENIOR_MEMBER', 'ADMINISTRATIVE_SENIOR_MEMBER', 'PROFESSIONAL_SENIOR_MEMBER', 'SENIOR_STAFF', 'JUNIOR_STAFF');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RETIRED', 'RESIGNED', 'TERMINATED', 'DECEASED');

-- CreateEnum
CREATE TYPE "RecordVerificationState" AS ENUM ('PENDING', 'VERIFIED', 'DISPUTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "OrganizationUnitType" AS ENUM ('UNIVERSITY', 'FACULTY', 'SCHOOL', 'INSTITUTE', 'CENTRE', 'DIRECTORATE', 'DEPARTMENT', 'UNIT', 'SECTION', 'CAMPUS', 'LIBRARY', 'OTHER');

-- CreateEnum
CREATE TYPE "PolicyAuthority" AS ENUM ('ACT', 'BASIC_LAWS', 'COUNCIL_POLICY', 'CONDITIONS_OF_SERVICE', 'OFFICIAL_FORM', 'MANUAL_HANDBOOK', 'IMPLEMENTATION_DIRECTIVE', 'DESIGN_STANDARD');

-- CreateEnum
CREATE TYPE "PolicyVersionStatus" AS ENUM ('DRAFT', 'PROVISIONAL', 'ACTIVE', 'SUPERSEDED', 'RETIRED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PolicyEvidenceState" AS ENUM ('VERIFIED', 'VERIFIED_CONFLICT', 'CONFIRMATION_REQUIRED', 'DESIGN_CONTROL');

-- CreateEnum
CREATE TYPE "PromotionTrackType" AS ENUM ('SCHEDULE_J', 'SCHEDULE_K', 'SENIOR_STAFF_UNIFIED_SCHEME', 'JUNIOR_STAFF_UNIFIED_SCHEME');

-- CreateEnum
CREATE TYPE "DecisionAuthority" AS ENUM ('HRODD', 'FAPC', 'RAPC', 'SENIOR_STAFF_APPOINTMENTS_AND_PROMOTIONS_COMMITTEE', 'JUNIOR_STAFF_APPOINTMENTS_AND_PROMOTIONS_COMMITTEE', 'UAPC', 'ACADEMIC_BOARD', 'COUNCIL', 'APPEALS_BOARD');

-- CreateEnum
CREATE TYPE "PolicyRequirementType" AS ENUM ('MINIMUM_YEARS_IN_RANK', 'OUTPUTS_SUBMITTED_MINIMUM', 'OUTPUTS_SUBMITTED_MAXIMUM', 'REFEREED_OUTPUTS_MINIMUM', 'BEST_OUTPUTS_COUNT', 'MINIMUM_AREA_CLASSIFICATION', 'CLASSIFICATION_COMBINATION', 'EXTERNAL_ASSESSOR_COUNT', 'ASSESSOR_OUTSIDE_GHANA_MINIMUM', 'RETIREMENT_LEAD_MONTHS', 'EFFECTIVE_DATE_WINDOW', 'SPECIAL_ROUTE_CONDITION', 'OTHER');

-- CreateEnum
CREATE TYPE "PolicyConflictStatus" AS ENUM ('OPEN', 'PROVISIONALLY_RESOLVED', 'RESOLVED', 'ACCEPTED_RISK');

-- CreateTable
CREATE TABLE "staff_members" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "staffNumber" TEXT NOT NULL,
    "officialEmail" TEXT NOT NULL,
    "category" "StaffCategory" NOT NULL,
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "employmentStartedAt" TIMESTAMP(3),
    "retirementDate" TIMESTAMP(3),
    "authoritativeSource" TEXT NOT NULL DEFAULT 'HRODD',
    "sourceRecordId" TEXT,
    "verificationState" "RecordVerificationState" NOT NULL DEFAULT 'PENDING',
    "recordVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rank_definitions" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "StaffCategory" NOT NULL,
    "family" TEXT,
    "level" INTEGER NOT NULL,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rank_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_rank_history" (
    "id" SERIAL NOT NULL,
    "staffMemberId" INTEGER NOT NULL,
    "rankId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "appointmentRef" TEXT,
    "authoritativeSource" TEXT NOT NULL DEFAULT 'HRODD',
    "verificationState" "RecordVerificationState" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_rank_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_units" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationUnitType" NOT NULL,
    "parentId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_organization_assignments" (
    "id" SERIAL NOT NULL,
    "staffMemberId" INTEGER NOT NULL,
    "organizationUnitId" INTEGER NOT NULL,
    "positionTitle" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "verificationState" "RecordVerificationState" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_organization_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "office_definitions" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultUnitType" "OrganizationUnitType",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "office_appointments" (
    "id" SERIAL NOT NULL,
    "staffMemberId" INTEGER NOT NULL,
    "officeDefinitionId" INTEGER NOT NULL,
    "organizationUnitId" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "isActing" BOOLEAN NOT NULL DEFAULT false,
    "appointmentRef" TEXT,
    "verificationState" "RecordVerificationState" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_sources" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authority" "PolicyAuthority" NOT NULL,
    "issuingBody" TEXT NOT NULL DEFAULT 'GCTU',
    "sourceUrl" TEXT,
    "issuedOn" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_versions" (
    "id" SERIAL NOT NULL,
    "policySourceId" INTEGER NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "status" "PolicyVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "approvedBy" TEXT,
    "contentHash" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_tracks" (
    "id" SERIAL NOT NULL,
    "policyVersionId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PromotionTrackType" NOT NULL,
    "staffCategory" "StaffCategory" NOT NULL,
    "status" "PolicyVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_routes" (
    "id" SERIAL NOT NULL,
    "promotionTrackId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentRankId" INTEGER,
    "targetRankId" INTEGER NOT NULL,
    "minimumYearsInRank" INTEGER,
    "normalProgression" BOOLEAN NOT NULL DEFAULT true,
    "finalAuthority" "DecisionAuthority",
    "evidenceState" "PolicyEvidenceState" NOT NULL DEFAULT 'CONFIRMATION_REQUIRED',
    "status" "PolicyVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceClause" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_area_definitions" (
    "id" SERIAL NOT NULL,
    "promotionTrackId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCore" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_area_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_route_area_requirements" (
    "id" SERIAL NOT NULL,
    "promotionRouteId" INTEGER NOT NULL,
    "assessmentAreaId" INTEGER NOT NULL,
    "minimumCategory" "PerformanceCategory",
    "required" BOOLEAN NOT NULL DEFAULT true,
    "evidenceState" "PolicyEvidenceState" NOT NULL DEFAULT 'VERIFIED',
    "sourceClause" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_route_area_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_route_requirements" (
    "id" SERIAL NOT NULL,
    "promotionRouteId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PolicyRequirementType" NOT NULL,
    "numberValue" DOUBLE PRECISION,
    "textValue" TEXT,
    "booleanValue" BOOLEAN,
    "jsonValue" JSONB,
    "evidenceState" "PolicyEvidenceState" NOT NULL DEFAULT 'VERIFIED',
    "sourceClause" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_route_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_conflicts" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "PolicyConflictStatus" NOT NULL DEFAULT 'OPEN',
    "sourceReferences" JSONB NOT NULL,
    "affectedRouteCodes" JSONB,
    "provisionalResolution" TEXT,
    "resolution" TEXT,
    "owner" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_userId_key" ON "staff_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_staffNumber_key" ON "staff_members"("staffNumber");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_officialEmail_key" ON "staff_members"("officialEmail");

-- CreateIndex
CREATE INDEX "staff_members_category_employmentStatus_idx" ON "staff_members"("category", "employmentStatus");

-- CreateIndex
CREATE INDEX "staff_members_retirementDate_idx" ON "staff_members"("retirementDate");

-- CreateIndex
CREATE UNIQUE INDEX "rank_definitions_code_key" ON "rank_definitions"("code");

-- CreateIndex
CREATE INDEX "rank_definitions_category_level_idx" ON "rank_definitions"("category", "level");

-- CreateIndex
CREATE INDEX "rank_definitions_family_idx" ON "rank_definitions"("family");

-- CreateIndex
CREATE UNIQUE INDEX "rank_definitions_category_name_key" ON "rank_definitions"("category", "name");

-- CreateIndex
CREATE INDEX "staff_rank_history_staffMemberId_endedAt_idx" ON "staff_rank_history"("staffMemberId", "endedAt");

-- CreateIndex
CREATE INDEX "staff_rank_history_rankId_idx" ON "staff_rank_history"("rankId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_rank_history_staffMemberId_rankId_startedAt_key" ON "staff_rank_history"("staffMemberId", "rankId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "organization_units_code_key" ON "organization_units"("code");

-- CreateIndex
CREATE INDEX "organization_units_type_isActive_idx" ON "organization_units"("type", "isActive");

-- CreateIndex
CREATE INDEX "organization_units_parentId_idx" ON "organization_units"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_units_parentId_name_key" ON "organization_units"("parentId", "name");

-- CreateIndex
CREATE INDEX "staff_organization_assignments_staffMemberId_isPrimary_ende_idx" ON "staff_organization_assignments"("staffMemberId", "isPrimary", "endedAt");

-- CreateIndex
CREATE INDEX "staff_organization_assignments_organizationUnitId_endedAt_idx" ON "staff_organization_assignments"("organizationUnitId", "endedAt");

-- CreateIndex
CREATE UNIQUE INDEX "staff_organization_assignments_staffMemberId_organizationUn_key" ON "staff_organization_assignments"("staffMemberId", "organizationUnitId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "office_definitions_code_key" ON "office_definitions"("code");

-- CreateIndex
CREATE INDEX "office_appointments_organizationUnitId_endedAt_idx" ON "office_appointments"("organizationUnitId", "endedAt");

-- CreateIndex
CREATE INDEX "office_appointments_officeDefinitionId_endedAt_idx" ON "office_appointments"("officeDefinitionId", "endedAt");

-- CreateIndex
CREATE UNIQUE INDEX "office_appointments_staffMemberId_officeDefinitionId_starte_key" ON "office_appointments"("staffMemberId", "officeDefinitionId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "policy_sources_code_key" ON "policy_sources"("code");

-- CreateIndex
CREATE INDEX "policy_sources_authority_idx" ON "policy_sources"("authority");

-- CreateIndex
CREATE INDEX "policy_versions_status_effectiveFrom_idx" ON "policy_versions"("status", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "policy_versions_policySourceId_versionLabel_key" ON "policy_versions"("policySourceId", "versionLabel");

-- CreateIndex
CREATE INDEX "promotion_tracks_type_staffCategory_status_idx" ON "promotion_tracks"("type", "staffCategory", "status");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_tracks_policyVersionId_code_key" ON "promotion_tracks"("policyVersionId", "code");

-- CreateIndex
CREATE INDEX "promotion_routes_currentRankId_targetRankId_status_idx" ON "promotion_routes"("currentRankId", "targetRankId", "status");

-- CreateIndex
CREATE INDEX "promotion_routes_finalAuthority_idx" ON "promotion_routes"("finalAuthority");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_routes_promotionTrackId_code_key" ON "promotion_routes"("promotionTrackId", "code");

-- CreateIndex
CREATE INDEX "assessment_area_definitions_promotionTrackId_sortOrder_idx" ON "assessment_area_definitions"("promotionTrackId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_area_definitions_promotionTrackId_code_key" ON "assessment_area_definitions"("promotionTrackId", "code");

-- CreateIndex
CREATE INDEX "promotion_route_area_requirements_assessmentAreaId_idx" ON "promotion_route_area_requirements"("assessmentAreaId");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_route_area_requirements_promotionRouteId_assessme_key" ON "promotion_route_area_requirements"("promotionRouteId", "assessmentAreaId");

-- CreateIndex
CREATE INDEX "promotion_route_requirements_type_evidenceState_idx" ON "promotion_route_requirements"("type", "evidenceState");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_route_requirements_promotionRouteId_code_key" ON "promotion_route_requirements"("promotionRouteId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "policy_conflicts_code_key" ON "policy_conflicts"("code");

-- CreateIndex
CREATE INDEX "policy_conflicts_status_idx" ON "policy_conflicts"("status");

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_rank_history" ADD CONSTRAINT "staff_rank_history_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_rank_history" ADD CONSTRAINT "staff_rank_history_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "rank_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organization_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_organization_assignments" ADD CONSTRAINT "staff_organization_assignments_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_organization_assignments" ADD CONSTRAINT "staff_organization_assignments_organizationUnitId_fkey" FOREIGN KEY ("organizationUnitId") REFERENCES "organization_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "office_appointments" ADD CONSTRAINT "office_appointments_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "office_appointments" ADD CONSTRAINT "office_appointments_officeDefinitionId_fkey" FOREIGN KEY ("officeDefinitionId") REFERENCES "office_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "office_appointments" ADD CONSTRAINT "office_appointments_organizationUnitId_fkey" FOREIGN KEY ("organizationUnitId") REFERENCES "organization_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_versions" ADD CONSTRAINT "policy_versions_policySourceId_fkey" FOREIGN KEY ("policySourceId") REFERENCES "policy_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_tracks" ADD CONSTRAINT "promotion_tracks_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "policy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_routes" ADD CONSTRAINT "promotion_routes_promotionTrackId_fkey" FOREIGN KEY ("promotionTrackId") REFERENCES "promotion_tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_routes" ADD CONSTRAINT "promotion_routes_currentRankId_fkey" FOREIGN KEY ("currentRankId") REFERENCES "rank_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_routes" ADD CONSTRAINT "promotion_routes_targetRankId_fkey" FOREIGN KEY ("targetRankId") REFERENCES "rank_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_area_definitions" ADD CONSTRAINT "assessment_area_definitions_promotionTrackId_fkey" FOREIGN KEY ("promotionTrackId") REFERENCES "promotion_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_route_area_requirements" ADD CONSTRAINT "promotion_route_area_requirements_promotionRouteId_fkey" FOREIGN KEY ("promotionRouteId") REFERENCES "promotion_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_route_area_requirements" ADD CONSTRAINT "promotion_route_area_requirements_assessmentAreaId_fkey" FOREIGN KEY ("assessmentAreaId") REFERENCES "assessment_area_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_route_requirements" ADD CONSTRAINT "promotion_route_requirements_promotionRouteId_fkey" FOREIGN KEY ("promotionRouteId") REFERENCES "promotion_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
