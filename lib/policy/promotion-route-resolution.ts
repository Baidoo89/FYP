import {
  PolicyVersionStatus,
  Prisma,
  PrismaClient,
  RecordVerificationState,
} from '@prisma/client';
import { assessRouteAvailability } from './route-eligibility';

type DbClient = PrismaClient | Prisma.TransactionClient;

export class PolicyRouteError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function resolveVerifiedPromotionRoute(
  client: DbClient,
  input: { userId: number; routeCode: string; asOf?: Date },
) {
  const staffMember = await client.staffMember.findUnique({
    where: { userId: input.userId },
    include: {
      rankHistory: {
        where: { endedAt: null, verificationState: RecordVerificationState.VERIFIED },
        include: { rank: true },
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
      organizationAssignments: {
        where: { endedAt: null, isPrimary: true, verificationState: RecordVerificationState.VERIFIED },
        include: { organizationUnit: true },
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!staffMember || staffMember.verificationState !== RecordVerificationState.VERIFIED) {
    throw new PolicyRouteError('HRODD must verify your authoritative staff record before you start an application.');
  }

  const rankHistory = staffMember.rankHistory[0] || null;
  const assignment = staffMember.organizationAssignments[0] || null;
  if (!rankHistory) throw new PolicyRouteError('No verified current rank is recorded for this staff member.');
  if (!assignment) throw new PolicyRouteError('No verified primary organization assignment is recorded for this staff member.');

  const route = await client.promotionRoute.findFirst({
    where: {
      code: input.routeCode,
      currentRankId: rankHistory.rankId,
      status: { in: [PolicyVersionStatus.ACTIVE, PolicyVersionStatus.PROVISIONAL] },
      promotionTrack: {
        staffCategory: staffMember.category,
        status: PolicyVersionStatus.ACTIVE,
      },
    },
    include: {
      targetRank: true,
      promotionTrack: {
        include: { policyVersion: { include: { policySource: true } } },
      },
      requirements: { orderBy: { code: 'asc' } },
      areaRequirements: {
        include: { assessmentArea: true },
        orderBy: { assessmentArea: { sortOrder: 'asc' } },
      },
    },
  });

  if (!route) {
    throw new PolicyRouteError('The selected policy route is no longer available for your verified rank.', 409);
  }

  const availability = assessRouteAvailability({
    verificationState: staffMember.verificationState,
    employmentStatus: staffMember.employmentStatus,
    rankStartedAt: rankHistory.startedAt,
    retirementDate: staffMember.retirementDate,
    minimumYearsInRank: route.minimumYearsInRank,
    routeStatus: route.status,
    evidenceState: route.evidenceState,
    asOf: input.asOf || new Date(),
  });

  if (!availability.canStart) {
    throw new PolicyRouteError(availability.warnings[0] || 'This promotion route is not available yet.');
  }

  const policySnapshot = {
    snapshotVersion: 1,
    capturedAt: (input.asOf || new Date()).toISOString(),
    staff: {
      staffMemberId: staffMember.id,
      staffNumber: staffMember.staffNumber,
      category: staffMember.category,
      employmentStatus: staffMember.employmentStatus,
      retirementDate: staffMember.retirementDate?.toISOString() || null,
      rankHistoryId: rankHistory.id,
      rankCode: rankHistory.rank.code,
      rankName: rankHistory.rank.name,
      rankStartedAt: rankHistory.startedAt.toISOString(),
      completedYearsInRank: availability.completedYears,
      assignmentId: assignment.id,
      organizationUnitCode: assignment.organizationUnit.code,
      organizationUnitName: assignment.organizationUnit.name,
    },
    route: {
      id: route.id,
      code: route.code,
      name: route.name,
      status: route.status,
      evidenceState: route.evidenceState,
      normalProgression: route.normalProgression,
      minimumYearsInRank: route.minimumYearsInRank,
      finalAuthority: route.finalAuthority,
      sourceClause: route.sourceClause,
      targetRankCode: route.targetRank.code,
      targetRankName: route.targetRank.name,
    },
    policy: {
      trackCode: route.promotionTrack.code,
      trackName: route.promotionTrack.name,
      versionId: route.promotionTrack.policyVersion.id,
      versionLabel: route.promotionTrack.policyVersion.versionLabel,
      sourceCode: route.promotionTrack.policyVersion.policySource.code,
      sourceTitle: route.promotionTrack.policyVersion.policySource.title,
    },
    requirements: route.requirements.map((requirement) => ({
      code: requirement.code,
      name: requirement.name,
      type: requirement.type,
      numberValue: requirement.numberValue,
      textValue: requirement.textValue,
      booleanValue: requirement.booleanValue,
      jsonValue: requirement.jsonValue,
      evidenceState: requirement.evidenceState,
      sourceClause: requirement.sourceClause,
    })),
    assessmentAreas: route.areaRequirements.map((requirement) => ({
      code: requirement.assessmentArea.code,
      name: requirement.assessmentArea.name,
      isCore: requirement.assessmentArea.isCore,
      minimumCategory: requirement.minimumCategory,
      evidenceState: requirement.evidenceState,
      sourceClause: requirement.sourceClause,
    })),
    warnings: availability.warnings,
  } satisfies Prisma.InputJsonValue;

  return {
    currentRank: rankHistory.rank.code,
    targetRank: route.targetRank.code,
    completedYearsInRank: availability.completedYears,
    promotionRouteId: route.id,
    staffRankHistoryId: rankHistory.id,
    staffAssignmentId: assignment.id,
    policySnapshot,
  };
}
