import { NextRequest, NextResponse } from 'next/server';
import { WORKFLOW_TRANSACTION_OPTIONS, prisma } from '../../../lib/prisma';
import { getAuthSession } from '../../../lib/auth';
import { startPromotionRequestSchema } from '../../../lib/validation/promotion-request.schema';
import { createPromotionRequestWithWorkflow, submitPromotionRequest, WorkflowError } from '../../../lib/promotion-workflow';
import { isValidPromotionTarget } from '../../../lib/promotion-ranks';
import { REQUIRED_CATEGORIES } from '../../../lib/promotion-engine';
import { getDepartmentReviewScope } from '../../../lib/department-scope';
import { PolicyRouteError, resolveVerifiedPromotionRoute } from '../../../lib/policy/promotion-route-resolution';
import { isV2FoundationUnavailable, V2_FOUNDATION_NOT_READY } from '../../../lib/v2-foundation-status';
import type { ApiResponse } from '../../../types';

const COMMITTEE_VISIBLE_STATUSES = [
  'UNDER_COMMITTEE_REVIEW',
  'RECOMMENDED',
  'NOT_RECOMMENDED',
  'REQUIRES_FURTHER_REVIEW',
  'APPROVED_BY_AUTHORITY',
  'APPROVED',
  'COMPLETED',
];

function normalizeRank(value?: string | null) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
}

function criteriaKey(currentRank?: string | null, targetRank?: string | null) {
  return `${normalizeRank(currentRank)}:${normalizeRank(targetRank)}`;
}

const academicRankValues = new Set([
  'ASSISTANT_LECTURER',
  'LECTURER',
  'SENIOR_LECTURER',
  'ASSOCIATE_PROFESSOR',
  'PROFESSOR',
]);

function isAcademicCriteriaRank(currentRank: string, targetRank: string) {
  return academicRankValues.has(normalizeRank(currentRank)) && academicRankValues.has(normalizeRank(targetRank));
}

function countRequiredDocumentsFromCriteria(criteriaCounts: Map<string, number>, requestRecord: any) {
  return criteriaCounts.get(criteriaKey(requestRecord.currentRank, requestRecord.targetRank)) || REQUIRED_CATEGORIES.length;
}

async function getRequiredDocumentCount(currentRank: string, targetRank: string) {
  if (!isAcademicCriteriaRank(currentRank, targetRank)) {
    return REQUIRED_CATEGORIES.length;
  }

  const criteria = await prisma.promotionCriteria.findFirst({
    where: {
      currentRank: normalizeRank(currentRank) as any,
      targetRank: normalizeRank(targetRank) as any,
      isActive: true,
    },
    select: { requiredDocumentCategories: true },
  });

  return criteria?.requiredDocumentCategories?.length || REQUIRED_CATEGORIES.length;
}

function buildRequestSummary(requestRecord: any, requiredDocuments: number = REQUIRED_CATEGORIES.length) {
  const documents = requestRecord.documents || [];
  const verifiedDocuments = documents.filter((document: any) => document.verificationStatus === 'VERIFIED').length;

  return {
    id: requestRecord.id,
    lecturerId: requestRecord.lecturerId,
    lecturerName: requestRecord.lecturer.name,
    lecturerEmail: requestRecord.lecturer.email,
    lecturerStaffId: requestRecord.lecturer.staffId || null,
    department: requestRecord.lecturer.departmentRef?.name || requestRecord.lecturer.department || 'Unassigned',
    faculty: requestRecord.lecturer.faculty?.name || requestRecord.lecturer.departmentRef?.faculty?.name || null,
    currentRank: requestRecord.currentRank,
    targetRank: requestRecord.targetRank,
    status: requestRecord.status,
    submittedAt: requestRecord.submittedAt,
    verifiedAt: requestRecord.verifiedAt,
    totalScore: requestRecord.totalScore ? Number(requestRecord.totalScore) : null,
    eligibilityStatus: requestRecord.eligibilityStatus,
    eligibilityReason: requestRecord.eligibilityReason,
    yearsInCurrentRank: requestRecord.yearsInCurrentRank,
    adminComment: requestRecord.adminComment,
    createdAt: requestRecord.createdAt,
    updatedAt: requestRecord.updatedAt,
    documentCount: documents.length,
    verifiedDocumentCount: verifiedDocuments,
    requiredDocumentCount: requiredDocuments,
    documents,
    reviewComments: requestRecord.reviewComments || [],
    statusHistory: requestRecord.statusHistory || [],
  };
}

function workflowErrorResponse(error: unknown, fallback: string) {
  const status = error instanceof WorkflowError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status });
}

export async function GET(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
  }

  const statusFilter = request.nextUrl.searchParams.get('status');
  const defaultScope = ['STAFF', 'LECTURER'].includes(session.role) ? 'lecturer' : session.role === 'HOD_DEAN' ? 'department' : session.role === 'COMMITTEE_REVIEWER' ? 'committee' : 'hr';
  const scope = request.nextUrl.searchParams.get('scope') || defaultScope;

  if (scope === 'lecturer' && !['STAFF', 'LECTURER'].includes(session.role)) {
    return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
  }

  if (scope === 'department' && !['HOD_DEAN', 'SYSTEM_ADMIN'].includes(session.role)) {
    return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
  }

  if (scope === 'committee' && !['COMMITTEE_REVIEWER', 'SYSTEM_ADMIN'].includes(session.role)) {
    return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
  }

  if (scope === 'hr' && !['HR_ADMIN', 'SYSTEM_ADMIN'].includes(session.role)) {
    return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
  }

  let where: any = statusFilter ? { status: statusFilter as any } : {};

  if (scope === 'committee') {
    where = statusFilter
      ? COMMITTEE_VISIBLE_STATUSES.includes(statusFilter)
        ? where
        : { id: -1 }
      : { ...where, status: { in: COMMITTEE_VISIBLE_STATUSES } };
  } else if (scope !== 'lecturer') {
    where = statusFilter === 'DRAFT'
      ? { id: -1 }
      : statusFilter
        ? where
        : { ...where, status: { not: 'DRAFT' } };
  }

  if (scope === 'lecturer') {
    where = { ...where, lecturerId: session.userId };
  }

  if ((scope === 'department' || session.role === 'HOD_DEAN') && session.role !== 'SYSTEM_ADMIN') {
    const departmentScope = await getDepartmentReviewScope(prisma, {
      userId: session.userId,
      role: session.role,
      sessionDepartment: session.department,
    });

    where = {
      ...where,
      ...departmentScope.where,
    };
  }

  const promotionRequests = await prisma.promotionRequest.findMany({
    where,
    include: {
      lecturer: {
        include: {
          departmentRef: { include: { faculty: true } },
          faculty: true,
        },
      },
      requestedBy: true,
      documents: {
        include: {
          verifiedBy: true,
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      },
      reviewComments: {
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      },
      statusHistory: {
        include: {
          changedBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const criteriaRows = await prisma.promotionCriteria.findMany({
    where: { isActive: true },
    select: {
      currentRank: true,
      targetRank: true,
      requiredDocumentCategories: true,
    },
  });
  const criteriaCounts = new Map(
    criteriaRows.map((criteria) => [
      criteriaKey(criteria.currentRank, criteria.targetRank),
      criteria.requiredDocumentCategories.length || REQUIRED_CATEGORIES.length,
    ])
  );

  return NextResponse.json({
    success: true,
    data: promotionRequests.map((requestRecord) => buildRequestSummary(requestRecord, countRequiredDocumentsFromCriteria(criteriaCounts, requestRecord))),
  } as ApiResponse<ReturnType<typeof buildRequestSummary>[]>);
}

export async function POST(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
  }

  const body = await request.json();
  const action = String(body.action || 'create');

  if (action === 'submit') {
    const requestId = Number(body.requestId);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return NextResponse.json({ success: false, error: 'requestId is required' } as ApiResponse<null>, { status: 400 });
    }

    try {
      const updatedRequest = await prisma.$transaction((tx) =>
        submitPromotionRequest(tx, {
          actor: {
            id: session.userId,
            role: session.role,
            name: session.name,
          },
          requestId,
        }),
        WORKFLOW_TRANSACTION_OPTIONS
      );

      const requiredDocumentCount = await getRequiredDocumentCount(updatedRequest.currentRank, updatedRequest.targetRank);

      return NextResponse.json({
        success: true,
        message: 'Promotion request submitted',
        data: buildRequestSummary(updatedRequest, requiredDocumentCount),
      } as ApiResponse<ReturnType<typeof buildRequestSummary>>);
    } catch (error) {
      return workflowErrorResponse(error, 'Promotion request submission failed');
    }
  }

  if (!['STAFF', 'LECTURER'].includes(session.role)) {
    return NextResponse.json({ success: false, error: 'Only verified staff applicants can start promotion applications.' } as ApiResponse<null>, { status: 403 });
  }

  const parsed = startPromotionRequestSchema.safeParse({
    routeCode: body.routeCode,
    targetRank: body.targetRank,
    yearsInCurrentRank: body.yearsInCurrentRank,
    adminComment: body.adminComment,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message || 'Select the promotion rank you are applying for.',
        details: parsed.error.flatten().fieldErrors,
      } as ApiResponse<null>,
      { status: 400 }
    );
  }

  const lecturer = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      currentRank: true,
      onboarded: true,
      isActive: true,
    },
  });

  if (!lecturer || !lecturer.isActive) {
    return NextResponse.json({ success: false, error: 'Lecturer account not found or inactive.' } as ApiResponse<null>, { status: 404 });
  }

  if (!parsed.data.routeCode && (!lecturer.onboarded || !lecturer.currentRank)) {
    return NextResponse.json({ success: false, error: 'Complete your staff profile before starting a promotion application.' } as ApiResponse<null>, { status: 400 });
  }

  if (!parsed.data.routeCode && (!parsed.data.targetRank || !isValidPromotionTarget(lecturer.currentRank, parsed.data.targetRank))) {
    const selectedTarget = parsed.data.targetRank?.replace(/_/g, ' ') || 'selected rank';
    return NextResponse.json(
      {
        success: false,
        error: `You cannot apply from ${String(lecturer.currentRank).replace(/_/g, ' ')} to ${selectedTarget}. Select the next approved promotion rank.`,
      } as ApiResponse<null>,
      { status: 400 }
    );
  }

  try {
    const requestRecord = await prisma.$transaction(async (tx) => {
      const actor = { id: session.userId, role: session.role, name: session.name };

      if (parsed.data.routeCode) {
        const resolved = await resolveVerifiedPromotionRoute(tx, {
          userId: session.userId,
          routeCode: parsed.data.routeCode,
        });
        return createPromotionRequestWithWorkflow(tx, {
          actor,
          lecturerId: session.userId,
          currentRank: resolved.currentRank,
          targetRank: resolved.targetRank,
          yearsInCurrentRank: resolved.completedYearsInRank,
          promotionRouteId: resolved.promotionRouteId,
          staffRankHistoryId: resolved.staffRankHistoryId,
          staffAssignmentId: resolved.staffAssignmentId,
          policySnapshot: resolved.policySnapshot,
          adminComment: parsed.data.adminComment || null,
        });
      }

      return createPromotionRequestWithWorkflow(tx, {
        actor,
        lecturerId: session.userId,
        currentRank: String(lecturer.currentRank),
        targetRank: String(parsed.data.targetRank),
        yearsInCurrentRank: parsed.data.yearsInCurrentRank || 0,
        adminComment: parsed.data.adminComment || null,
      });
    }, WORKFLOW_TRANSACTION_OPTIONS);

    const requiredDocumentCount = await getRequiredDocumentCount(requestRecord.currentRank, requestRecord.targetRank);

    return NextResponse.json(
      {
        success: true,
        message: 'Promotion request created',
        data: buildRequestSummary(requestRecord, requiredDocumentCount),
      } as ApiResponse<ReturnType<typeof buildRequestSummary>>,
      { status: 201 }
    );
  } catch (error) {
    if (isV2FoundationUnavailable(error)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Policy-based application creation is waiting for the V2 database migration and seed.',
          code: V2_FOUNDATION_NOT_READY,
        } as ApiResponse<null> & { code: string },
        { status: 503 },
      );
    }
    if (error instanceof PolicyRouteError) {
      return NextResponse.json(
        { success: false, error: error.message } as ApiResponse<null>,
        { status: error.statusCode },
      );
    }
    return workflowErrorResponse(error, 'Promotion request creation failed');
  }
}
