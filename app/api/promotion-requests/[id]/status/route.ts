import { NextRequest, NextResponse } from 'next/server';
import { RequestStatus } from '@prisma/client';
import { getAuthSession } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';
import { transitionPromotionRequest, WorkflowError } from '../../../../../lib/promotion-workflow';
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
  const newStatus = String(body.status || '') as RequestStatus;
  const comment = String(body.comment || '').trim() || null;

  if (!Object.values(RequestStatus).includes(newStatus)) {
    return NextResponse.json({ success: false, error: 'Invalid status value' } as ApiResponse<null>, { status: 400 });
  }

  try {
    const result = await prisma.$transaction((tx) =>
      transitionPromotionRequest(tx, {
        actor: {
          id: session.userId,
          role: session.role,
          name: session.name,
        },
        requestId,
        newStatus,
        comment,
        action: 'promotion_request.status_changed',
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Status updated',
      data: result,
    } as ApiResponse<typeof result>);
  } catch (error) {
    return workflowErrorResponse(error, 'Status update failed');
  }
}
