import { NextRequest, NextResponse } from 'next/server';
import { VerificationStatus } from '@prisma/client';
import { WORKFLOW_TRANSACTION_OPTIONS, prisma } from '../../../../../lib/prisma';
import { getAuthSession } from '../../../../../lib/auth';
import { verificationSchema } from '../../../../../lib/validation/promotion-request.schema';
import { verifyPromotionDocument, WorkflowError } from '../../../../../lib/promotion-workflow';
import type { ApiResponse } from '../../../../../types';

function workflowErrorResponse(error: unknown, fallback: string) {
  const status = error instanceof WorkflowError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status });
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
  const parsed = verificationSchema.safeParse({
    documentId: Number(body.documentId),
    verificationStatus: body.verificationStatus,
    comment: body.comment,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      } as ApiResponse<null>,
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction((tx) =>
      verifyPromotionDocument(tx, {
        actor: {
          id: session.userId,
          role: session.role,
          name: session.name,
        },
        requestId,
        documentId: parsed.data.documentId,
        verificationStatus: parsed.data.verificationStatus as VerificationStatus,
        comment: parsed.data.comment || null,
      }),
      WORKFLOW_TRANSACTION_OPTIONS
    );

    return NextResponse.json({
      success: true,
      message: 'Verification saved',
      data: {
        requestId,
        status: result.requestStatus,
        eligibilityStatus: result.eligibility?.eligibilityStatus || null,
        eligibilityReason: result.eligibility?.eligibilityReason || null,
        totalScore: result.eligibility?.totalScore ?? null,
        document: result.document,
      },
    } as ApiResponse<Record<string, unknown>>);
  } catch (error) {
    return workflowErrorResponse(error, 'Verification failed');
  }
}
