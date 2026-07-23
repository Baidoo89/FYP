import { NextRequest, NextResponse } from 'next/server';
import { ReviewRecommendation } from '@prisma/client';
import { getAuthSession, type AuthSession } from '../../../../../lib/auth';
import { WORKFLOW_TRANSACTION_OPTIONS, prisma } from '../../../../../lib/prisma';
import {
  recordCommitteeReview,
  recordDepartmentReview,
  type DepartmentReviewDecision,
  WorkflowError,
} from '../../../../../lib/promotion-workflow';
import type { ApiResponse } from '../../../../../types';

const DEPARTMENT_DECISIONS: DepartmentReviewDecision[] = [
  'FORWARD_TO_HR',
  'RETURN_FOR_CORRECTION',
  'REQUIRES_FURTHER_REVIEW',
  'COMMENT_ONLY',
];

function workflowErrorResponse(error: unknown, fallback: string) {
  const status = error instanceof WorkflowError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status });
}

function clean(value?: string | null) {
  return value?.trim().toLowerCase() || '';
}

async function canAccessDepartmentRequest(session: AuthSession, requestId: number) {
  if (session.role !== 'HOD_DEAN') return true;

  const [reviewer, promotionRequest] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        department: true,
        departmentId: true,
        facultyId: true,
      },
    }),
    prisma.promotionRequest.findUnique({
      where: { id: requestId },
      select: {
        lecturer: {
          select: {
            department: true,
            departmentId: true,
            facultyId: true,
          },
        },
      },
    }),
  ]);

  if (!promotionRequest) return true;

  const lecturer = promotionRequest.lecturer;
  const reviewerDepartment = clean(reviewer?.department || session.department);

  return Boolean(
    (reviewer?.facultyId && lecturer.facultyId && reviewer.facultyId === lecturer.facultyId) ||
    (reviewer?.departmentId && lecturer.departmentId && reviewer.departmentId === lecturer.departmentId) ||
    (reviewerDepartment && clean(lecturer.department) === reviewerDepartment)
  );
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const { id } = await context.params;
  const requestId = Number(id);

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
  }

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid request id' } as ApiResponse<null>, { status: 400 });
  }

  const body = await request.json();
  const comment = String(body.comment || '').trim();
  const recommendation = body.recommendation ? String(body.recommendation) as ReviewRecommendation : null;
  const decision = String(body.decision || body.action || '').trim().toUpperCase() as DepartmentReviewDecision;

  if (comment.length < 5) {
    return NextResponse.json({ success: false, error: 'Review comment must be at least 5 characters' } as ApiResponse<null>, { status: 400 });
  }

  if (recommendation && !Object.values(ReviewRecommendation).includes(recommendation)) {
    return NextResponse.json({ success: false, error: 'Invalid recommendation' } as ApiResponse<null>, { status: 400 });
  }

  const inDepartmentScope = await canAccessDepartmentRequest(session, requestId);
  if (!inDepartmentScope) {
    return NextResponse.json({ success: false, error: 'This application is outside your department review scope' } as ApiResponse<null>, { status: 403 });
  }

  try {
    const actor = {
      id: session.userId,
      role: session.role,
      name: session.name,
    };

    if (decision || session.role === 'HOD_DEAN') {
      const departmentDecision = decision || 'COMMENT_ONLY';
      if (!DEPARTMENT_DECISIONS.includes(departmentDecision)) {
        return NextResponse.json({ success: false, error: 'Invalid department review decision' } as ApiResponse<null>, { status: 400 });
      }

      const result = await prisma.$transaction((tx) =>
        recordDepartmentReview(tx, {
          actor,
          requestId,
          decision: departmentDecision,
          comment,
        }),
        WORKFLOW_TRANSACTION_OPTIONS
      );

      return NextResponse.json({
        success: true,
        message: 'Department review saved',
        data: result,
      } as ApiResponse<typeof result>);
    }

    const result = await prisma.$transaction((tx) =>
      recordCommitteeReview(tx, {
        actor,
        requestId,
        comment,
        recommendation,
      }),
      WORKFLOW_TRANSACTION_OPTIONS
    );

    return NextResponse.json({
      success: true,
      message: 'Committee review saved',
      data: result,
    } as ApiResponse<typeof result>);
  } catch (error) {
    return workflowErrorResponse(error, 'Review failed');
  }
}
