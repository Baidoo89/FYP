CREATE TABLE "committee_meeting_participants" (
  "id" SERIAL NOT NULL,
  "committeeMeetingId" INTEGER NOT NULL,
  "memberId" INTEGER,
  "memberName" TEXT NOT NULL,
  "memberRole" TEXT,
  "rankCodeSnapshot" TEXT,
  "attended" BOOLEAN NOT NULL DEFAULT true,
  "conflictDeclared" BOOLEAN NOT NULL DEFAULT false,
  "conflictDetails" TEXT,
  "recused" BOOLEAN NOT NULL DEFAULT false,
  "eligibleForCase" BOOLEAN NOT NULL DEFAULT true,
  "ineligibilityReason" TEXT,
  "isChair" BOOLEAN NOT NULL DEFAULT false,
  "isSecretary" BOOLEAN NOT NULL DEFAULT false,
  "declarationAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "committee_meeting_participants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "committee_meeting_participants_committeeMeetingId_attended_eligibleForCase_idx" ON "committee_meeting_participants"("committeeMeetingId", "attended", "eligibleForCase");
CREATE INDEX "committee_meeting_participants_memberId_idx" ON "committee_meeting_participants"("memberId");

ALTER TABLE "committee_meeting_participants" ADD CONSTRAINT "committee_meeting_participants_committeeMeetingId_fkey" FOREIGN KEY ("committeeMeetingId") REFERENCES "committee_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "committee_meeting_participants" ADD CONSTRAINT "committee_meeting_participants_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
