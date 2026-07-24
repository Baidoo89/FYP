import { NextRequest, NextResponse } from 'next/server';
import { WORKFLOW_TRANSACTION_OPTIONS, prisma } from '../../../lib/prisma';
import { getAuthSession } from '../../../lib/auth';
import { startPromotionRequestSchema } from '../../../lib/validation/promotion-request.schema';
import { createPromotionRequestWithWorkflow, submitPromotionRequest, WorkflowError } from '../../../lib/promotion-workflow';
import { isValidPromotionTarget } from '../../../lib/promotion-ranks';
import type { ApiResponse } from '../../../types';

function buildRequestSummary(requestRecord: any) {
  const documents = requestRecord.documents || [];
  const verifiedDocuments = documents.filter((document: any) => document.verificationStatus === 'VERIFIED').length;
  const requiredDocuments = 3;

  return {
    id: requestRecord.id,
    lecturerId: requestRecord.lecturerId,
    lecturerName: requestRecord.lecturer.name,
    lecturerEmail: requestRecord.lecturer.email,
    department: requestRecord.lecturer.department || 'Unassigned',
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

async function departmentScopeWhere(session: NonNullable<ReturnType<typeof getAuthSession>>) {
  const reviewer = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      department: true,
      departmentId: true,
      facultyId: true,
    },
  });

  const lecturerFilters: any[] = [];

  if (reviewer?.facultyId) {
    lecturerFilters.push({ facultyId: reviewer.facultyId });
  }

  if (reviewer?.departmentId) {
    lecturerFilters.push({ departmentId: reviewer.departmentId });
  }

  if (reviewer?.department || session.department) {
    lecturerFilters.push({ department: reviewer?.department || session.department });
  }

  return lecturerFilters.length > 0 ? { lecturer: { OR: lecturerFilters } } : { lecturerId: -1 };
}

export async function GET(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
  }

  const statusFilter = request.nextUrl.searchParams.get('status');
  const defaultScope = session.role === 'LECTURER' ? 'lecturer' : session.role === 'HOD_DEAN' ? 'department' : 'hr';
  const scope = request.nextUrl.searchParams.get('scope') || defaultScope;

  if (scope === 'lecturer' && session.role !== 'LECTURER') {
    return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
  }

  if (scope === 'department' && !['HOD_DEAN', 'SYSTEM_ADMIN'].includes(session.role)) {
    return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
  }

  if (scope === 'hr' && !['HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN', 'HOD_DEAN'].includes(session.role)) {
    return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
  }

  let where: any = statusFilter ? { status: statusFilter as any } : {};

  if (scope !== 'lecturer' && !statusFilter) {
    where = { ...where, status: { not: 'DRAFT' } };
  }

  if (scope === 'lecturer') {
    where = { ...where, lecturerId: session.userId };
  }

  if ((scope === 'department' || session.role === 'HOD_DEAN') && session.role !== 'SYSTEM_ADMIN') {
    where = {
      ...where,
      ...(await departmentScopeWhere(session)),
    };
  }

  const promotionRequests = await prisma.promotionRequest.findMany({
    where,
    include: {
      lecturer: true,
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

  return NextResponse.json({
    success: true,
    data: promotionRequests.map(buildRequestSummary),
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

      return NextResponse.json({
        success: true,
        message: 'Promotion request submitted',
        data: buildRequestSummary(updatedRequest),
      } as ApiResponse<ReturnType<typeof buildRequestSummary>>);
    } catch (error) {
      return workflowErrorResponse(error, 'Promotion request submission failed');
    }
  }

  if (session.role !== 'LECTURER') {
    return NextResponse.json({ success: false, error: 'Only lecturers can start promotion applications.' } as ApiResponse<null>, { status: 403 });
  }

  const parsed = startPromotionRequestSchema.safeParse({
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

  if (!lecturer.onboarded || !lecturer.currentRank) {
    return NextResponse.json({ success: false, error: 'Complete your staff profile before starting a promotion application.' } as ApiResponse<null>, { status: 400 });
  }

  if (!isValidPromotionTarget(lecturer.currentRank, parsed.data.targetRank)) {
    return NextResponse.json(
      {
        success: false,
        error: `You cannot apply from ${lecturer.currentRank.replace(/_/g, ' ')} to ${parsed.data.targetRank.replace(/_/g, ' ')}. Select the next approved promotion rank.`,
      } as ApiResponse<null>,
      { status: 400 }
    );
  }

  try {
    const requestRecord = await prisma.$transaction((tx) =>
      createPromotionRequestWithWorkflow(tx, {
        actor: {
          id: session.userId,
          role: session.role,
          name: session.name,
        },
        lecturerId: session.userId,
        currentRank: lecturer.currentRank,
        targetRank: parsed.data.targetRank,
        yearsInCurrentRank: parsed.data.yearsInCurrentRank || 0,
        adminComment: parsed.data.adminComment || null,
      }),
      WORKFLOW_TRANSACTION_OPTIONS
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Promotion request created',
        data: buildRequestSummary(requestRecord),
      } as ApiResponse<ReturnType<typeof buildRequestSummary>>,
      { status: 201 }
    );
  } catch (error) {
    return workflowErrorResponse(error, 'Promotion request creation failed');
  }
}
