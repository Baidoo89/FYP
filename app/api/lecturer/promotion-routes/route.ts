import { NextRequest, NextResponse } from 'next/server';
import { PolicyVersionStatus, RecordVerificationState, Role } from '@prisma/client';
import { getAuthSession } from '../../../../lib/auth';
import { isApplicantAccountRole } from '../../../../lib/access-roles';
import { prisma } from '../../../../lib/prisma';
import { isV2FoundationUnavailable, V2_FOUNDATION_NOT_READY } from '../../../../lib/v2-foundation-status';
import { assessRouteAvailability } from '../../../../lib/policy/route-eligibility';
import type { ApiResponse } from '../../../../types';

function foundationUnavailableResponse() {
  return NextResponse.json(
    {
      success: false,
      error: 'Policy-based route selection is waiting for the V2 database migration and seed.',
      code: V2_FOUNDATION_NOT_READY,
    },
    { status: 503 },
  );
}

export async function GET(request: NextRequest) {
  const session = getAuthSession(request);
  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
  }
  if (!isApplicantAccountRole(session.role)) {
    return NextResponse.json({ success: false, error: 'Only promotion applicants can view applicant routes.' } as ApiResponse<null>, { status: 403 });
  }

  try {
    const staffMember = await prisma.staffMember.findUnique({
      where: { userId: session.userId },
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

    if (!staffMember) {
      return NextResponse.json({
        success: true,
        data: {
          mode: 'V2',
          verificationState: 'UNVERIFIED',
          message: 'HRODD must verify your staff record before a promotion route can be selected.',
          staff: null,
          routes: [],
        },
      } as ApiResponse<unknown>);
    }

    const currentRankHistory = staffMember.rankHistory[0] || null;
    const primaryAssignment = staffMember.organizationAssignments[0] || null;
    if (staffMember.verificationState !== RecordVerificationState.VERIFIED || !currentRankHistory) {
      return NextResponse.json({
        success: true,
        data: {
          mode: 'V2',
          verificationState: staffMember.verificationState,
          message: 'Your authoritative staff record is not fully verified by HRODD.',
          staff: {
            staffNumber: staffMember.staffNumber,
            category: staffMember.category,
            employmentStatus: staffMember.employmentStatus,
          },
          routes: [],
        },
      } as ApiResponse<unknown>);
    }

    const routes = await prisma.promotionRoute.findMany({
      where: {
        currentRankId: currentRankHistory.rankId,
        status: { in: [PolicyVersionStatus.ACTIVE, PolicyVersionStatus.PROVISIONAL] },
        promotionTrack: {
          staffCategory: staffMember.category,
          status: PolicyVersionStatus.ACTIVE,
        },
      },
      include: {
        targetRank: true,
        promotionTrack: {
          include: {
            policyVersion: { include: { policySource: true } },
          },
        },
        requirements: { orderBy: { code: 'asc' } },
        areaRequirements: {
          include: { assessmentArea: true },
          orderBy: { assessmentArea: { sortOrder: 'asc' } },
        },
      },
      orderBy: [{ normalProgression: 'desc' }, { name: 'asc' }],
    });

    const serializedRoutes = routes.map((route) => {
      const availability = assessRouteAvailability({
        verificationState: staffMember.verificationState,
        employmentStatus: staffMember.employmentStatus,
        rankStartedAt: currentRankHistory.startedAt,
        retirementDate: staffMember.retirementDate,
        minimumYearsInRank: route.minimumYearsInRank,
        routeStatus: route.status,
        evidenceState: route.evidenceState,
      });
      const assignmentWarning = primaryAssignment ? [] : ['A verified primary organization assignment is required.'];

      return {
        id: route.id,
        code: route.code,
        name: route.name,
        status: route.status,
        evidenceState: route.evidenceState,
        normalProgression: route.normalProgression,
        finalAuthority: route.finalAuthority,
        sourceClause: route.sourceClause,
        currentRank: currentRankHistory.rank,
        targetRank: route.targetRank,
        completedYearsInRank: availability.completedYears,
        minimumYearsInRank: availability.minimumYearsInRank,
        timeRequirementMet: availability.timeRequirementMet,
        retirementRequirementMet: availability.retirementRequirementMet,
        canStart: availability.canStart && Boolean(primaryAssignment),
        warnings: [...availability.warnings, ...assignmentWarning],
        policy: {
          trackCode: route.promotionTrack.code,
          trackName: route.promotionTrack.name,
          version: route.promotionTrack.policyVersion.versionLabel,
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
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        mode: 'V2',
        verificationState: staffMember.verificationState,
        message: serializedRoutes.length ? null : 'No active promotion route is configured for your verified rank.',
        staff: {
          staffNumber: staffMember.staffNumber,
          category: staffMember.category,
          employmentStatus: staffMember.employmentStatus,
          retirementDate: staffMember.retirementDate,
          currentRank: currentRankHistory.rank,
          rankStartedAt: currentRankHistory.startedAt,
          primaryAssignment: primaryAssignment
            ? {
                id: primaryAssignment.id,
                code: primaryAssignment.organizationUnit.code,
                name: primaryAssignment.organizationUnit.name,
                type: primaryAssignment.organizationUnit.type,
                startedAt: primaryAssignment.startedAt,
              }
            : null,
        },
        routes: serializedRoutes,
      },
    } as ApiResponse<unknown>);
  } catch (error) {
    if (isV2FoundationUnavailable(error)) return foundationUnavailableResponse();
    console.error('Applicant promotion route discovery error:', error);
    return NextResponse.json({ success: false, error: 'Unable to load policy-based promotion routes.' }, { status: 500 });
  }
}
