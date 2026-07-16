import { NextRequest, NextResponse } from 'next/server';
import { WORKFLOW_TRANSACTION_OPTIONS, prisma } from '../../../lib/prisma';
import { getAuthSession } from '../../../lib/auth';
import { promotionRequestSchema } from '../../../lib/validation/promotion-request.schema';
import { createPromotionRequestWithWorkflow, submitPromotionRequest, WorkflowError } from '../../../lib/promotion-workflow';
import type { ApiResponse } from '../../../types';

function buildRequestSummary(requestRecord: any) {
  const verifiedDocuments = requestRecord.documents.filter((document: any) => document.verificationStatus === 'VERIFIED').length;
  const requiredDocuments = requestRecord.documents.length >= 3 ? 3 : requestRecord.documents.length;

  return {
    id: requestRecord.id,
    lecturerId: requestRecord.lecturerId,
    lecturerName: requestRecord.lecturer.name,
    lecturerEmail: requestRecord.lecturer.email,
    department: requestRecord.lecturer.department,
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
    documentCount: requestRecord.documents.length,
    verifiedDocumentCount: verifiedDocuments,
    requiredDocumentCount: requiredDocuments,
    documents: requestRecord.documents,
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
  const scope = request.nextUrl.searchParams.get('scope') || (session.role === 'LECTURER' ? 'lecturer' : 'hr');

  if (scope === 'hr' && !['HOD_DEAN', 'HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN'].includes(session.role)) {
    return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
  }

  if (scope === 'lecturer' && session.role !== 'LECTURER') {
    return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
  }

  let where: any;

  if (scope === 'lecturer') {
    where = { lecturerId: session.userId };
  } else {
    where = statusFilter ? { status: statusFilter as any } : {};

    if (session.role === 'HOD_DEAN') {
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

      where.lecturer = lecturerFilters.length > 0
        ? { OR: lecturerFilters }
        : { id: -1 };
    }
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

  const parsed = promotionRequestSchema.safeParse({
    lecturerId: Number(body.lecturerId),
    currentRank: body.currentRank,
    targetRank: body.targetRank,
    yearsInCurrentRank: Number(body.yearsInCurrentRank ?? 0),
    adminComment: body.adminComment,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        message: 'Please provide a valid promotion request payload',
        details: parsed.error.flatten().fieldErrors,
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
        lecturerId: parsed.data.lecturerId,
        currentRank: parsed.data.currentRank,
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
