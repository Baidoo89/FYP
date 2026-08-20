-- Add the neutral staff account role while preserving legacy lecturer accounts.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STAFF';

-- Represent policy-disabled routes explicitly instead of overloading other evidence states.
ALTER TYPE "PolicyEvidenceState" ADD VALUE IF NOT EXISTS 'DISABLED_PENDING_POLICY';

CREATE TYPE "StaffAccessRole" AS ENUM (
    'APPLICANT',
    'HOD',
    'DEAN',
    'HEAD_OF_UNIT',
    'HRODD_OFFICER',
    'REGISTRAR_OFFICER',
    'FAPC_MEMBER',
    'RAPC_MEMBER',
    'UAPC_MEMBER',
    'COUNCIL_MEMBER',
    'SENIOR_STAFF_COMMITTEE_MEMBER',
    'JUNIOR_STAFF_COMMITTEE_MEMBER',
    'APPEALS_BOARD_MEMBER',
    'RECORDS_OFFICER',
    'LIBRARY_VERIFIER',
    'QA_VERIFIER'
);

-- HRODD may import an authoritative roster before issuing an account invitation.
ALTER TABLE "staff_members" ALTER COLUMN "userId" DROP NOT NULL;

CREATE TABLE "staff_access_assignments" (
    "id" SERIAL NOT NULL,
    "staffMemberId" INTEGER NOT NULL,
    "role" "StaffAccessRole" NOT NULL,
    "organizationUnitId" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "appointingAuthority" TEXT,
    "sourceReference" TEXT,
    "verificationState" "RecordVerificationState" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_access_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "staff_access_assignments_staffMemberId_role_organizationUnitId_startedAt_key"
ON "staff_access_assignments"("staffMemberId", "role", "organizationUnitId", "startedAt");

CREATE INDEX "staff_access_assignments_staffMemberId_endedAt_idx"
ON "staff_access_assignments"("staffMemberId", "endedAt");

CREATE INDEX "staff_access_assignments_role_organizationUnitId_endedAt_idx"
ON "staff_access_assignments"("role", "organizationUnitId", "endedAt");

ALTER TABLE "staff_access_assignments"
ADD CONSTRAINT "staff_access_assignments_staffMemberId_fkey"
FOREIGN KEY ("staffMemberId") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "staff_access_assignments"
ADD CONSTRAINT "staff_access_assignments_organizationUnitId_fkey"
FOREIGN KEY ("organizationUnitId") REFERENCES "organization_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
