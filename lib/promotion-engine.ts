import { DocumentCategory, EligibilityStatus, NotificationType, VerificationStatus, type Prisma, type PrismaClient } from '@prisma/client';
import { writeAuditLog } from './audit-logger';

export const REQUIRED_CATEGORIES = [DocumentCategory.RESEARCH, DocumentCategory.TEACHING, DocumentCategory.SERVICE] as const;

export const CATEGORY_WEIGHTS: Record<DocumentCategory, number> = {
  [DocumentCategory.RESEARCH]: 40,
  [DocumentCategory.TEACHING]: 40,
  [DocumentCategory.SERVICE]: 20,
  [DocumentCategory.QUALIFICATIONS]: 0,
  [DocumentCategory.PUBLICATIONS]: 0,
  [DocumentCategory.PROFESSIONAL_DEVELOPMENT]: 0,
  [DocumentCategory.OTHER_SUPPORTING_EVIDENCE]: 0,
};

type DbClient = PrismaClient | Prisma.TransactionClient;

function normalizeRank(rank: string) {
  return rank.trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
}

function scoreBand(score?: number | null) {
  if (score === null || score === undefined) return null;
  if (score >= 70) return 'EXCELLENT';
  if (score >= 65) return 'VERY_GOOD';
  if (score >= 55) return 'GOOD';
  if (score >= 50) return 'SATISFACTORY';
  return 'UNSATISFACTORY';
}

export async function calculateEligibility(client: DbClient, promotionRequestId: number, actorId?: number) {
  const request = await client.promotionRequest.findUnique({
    where: { id: promotionRequestId },
    include: {
      lecturer: true,
      documents: true,
      scores: true,
    },
  });

  if (!request) {
    throw new Error('Promotion request not found');
  }

  const criteria = await client.promotionCriteria.findFirst({
    where: {
      currentRank: normalizeRank(request.currentRank) as any,
      targetRank: normalizeRank(request.targetRank) as any,
      isActive: true,
    },
  });

  if (!criteria) {
    const reason = `No active promotion criteria found for ${request.currentRank} to ${request.targetRank}.`;
    return saveEligibility(client, promotionRequestId, request.lecturerId, actorId, EligibilityStatus.REQUIRES_FURTHER_REVIEW, reason, request.totalScore);
  }

  if (request.yearsInCurrentRank < criteria.minimumYearsInCurrentRank) {
    const reason = `Applicant declared ${request.yearsInCurrentRank} year(s) in current rank; minimum required is ${criteria.minimumYearsInCurrentRank}. HOD/HR should verify the official rank history before final action.`;
    return saveEligibility(client, promotionRequestId, request.lecturerId, actorId, EligibilityStatus.NOT_ELIGIBLE, reason, request.totalScore);
  }

  const verifiedCategories = new Set(
    request.documents
      .filter((document) => document.verificationStatus === VerificationStatus.VERIFIED)
      .map((document) => document.category)
  );

  const missingCategories = criteria.requiredDocumentCategories.filter((category) => !verifiedCategories.has(category));
  if (missingCategories.length > 0) {
    const reason = `Required verified evidence missing: ${missingCategories.map((category) => category.toLowerCase().replace(/_/g, ' ')).join(', ')}.`;
    return saveEligibility(client, promotionRequestId, request.lecturerId, actorId, EligibilityStatus.INCOMPLETE_APPLICATION, reason, request.totalScore);
  }

  const rejectedCount = request.documents.filter((document) => document.verificationStatus === VerificationStatus.REJECTED).length;
  if (rejectedCount > 0) {
    const reason = `${rejectedCount} document(s) were rejected during verification.`;
    return saveEligibility(client, promotionRequestId, request.lecturerId, actorId, EligibilityStatus.REQUIRES_FURTHER_REVIEW, reason, request.totalScore);
  }

  const totalScore = REQUIRED_CATEGORIES.reduce((score, category) => {
    return verifiedCategories.has(category) ? score + CATEGORY_WEIGHTS[category] : score;
  }, 0);
  const band = scoreBand(totalScore);

  if (criteria.scoringEnabled && criteria.minimumTotalScore !== null && totalScore < Number(criteria.minimumTotalScore)) {
    const reason = `Verified evidence is complete, but total score ${totalScore} is below required minimum ${criteria.minimumTotalScore}.`;
    return saveEligibility(client, promotionRequestId, request.lecturerId, actorId, EligibilityStatus.NOT_ELIGIBLE, reason, totalScore);
  }

  const reason = `Verified evidence satisfies configured criteria. Performance band: ${band || 'not scored'}. This is an eligibility recommendation only; final promotion decisions remain with university authorities.`;
  return saveEligibility(client, promotionRequestId, request.lecturerId, actorId, EligibilityStatus.ELIGIBLE, reason, totalScore);
}

async function saveEligibility(
  client: DbClient,
  promotionRequestId: number,
  applicantId: number,
  actorId: number | undefined,
  eligibilityStatus: EligibilityStatus,
  eligibilityReason: string,
  totalScore?: number | null
) {
  const request = await client.promotionRequest.update({
    where: { id: promotionRequestId },
    data: {
      eligibilityStatus,
      eligibilityReason,
      totalScore: totalScore ?? undefined,
    },
  });

  await client.notification.create({
    data: {
      userId: applicantId,
      promotionRequestId,
      title: 'Eligibility recommendation updated',
      message: eligibilityReason,
      type: eligibilityStatus === EligibilityStatus.ELIGIBLE ? NotificationType.SUCCESS : NotificationType.WARNING,
    },
  });

  const hrUsers = await client.user.findMany({
    where: {
      role: { in: ['HR_ADMIN', 'SYSTEM_ADMIN'] },
      isActive: true,
    },
    select: { id: true },
  });

  if (hrUsers.length > 0) {
    await client.notification.createMany({
      data: hrUsers.map((user) => ({
        userId: user.id,
        promotionRequestId,
        title: 'Eligibility recommendation calculated',
        message: eligibilityReason,
        type: NotificationType.INFO,
      })),
    });
  }

  await writeAuditLog(client, {
    requestId: promotionRequestId,
    actorId,
    action: 'ELIGIBILITY_CALCULATED',
    entityType: 'PromotionRequest',
    entityId: promotionRequestId,
    description: eligibilityReason,
    metadata: {
      eligibilityStatus,
      totalScore: totalScore ?? null,
    },
  });

  return {
    request,
    eligibilityStatus,
    eligibilityReason,
    totalScore: totalScore ?? null,
  };
}
