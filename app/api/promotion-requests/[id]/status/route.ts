import { NextRequest, NextResponse } from 'next/server';
import { NotificationType, RequestStatus } from '@prisma/client';
import { getAuthSession } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';
import { writeAuditLog, writeStatusHistory } from '../../../../../lib/audit-logger';
import { assertStatusTransition } from '../../../../../lib/workflow';
import type { ApiResponse } from '../../../../../types';

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

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.promotionRequest.findUnique({
      where: { id: requestId },
      include: { lecturer: true },
    });

    if (!current) {
      throw new Error('Promotion request not found');
    }

    assertStatusTransition(current.status, newStatus, session.role);

    const updated = await tx.promotionRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        reviewedAt: ['RECOMMENDED', 'NOT_RECOMMENDED'].includes(newStatus) ? new Date() : undefined,
        completedAt: newStatus === RequestStatus.COMPLETED ? new Date() : undefined,
        adminComment: comment || current.adminComment,
      },
      include: { lecturer: true },
    });

    await writeStatusHistory(tx, {
      promotionRequestId: requestId,
      changedById: session.userId,
      oldStatus: current.status,
      newStatus,
      comment,
    });

    await writeAuditLog(tx, {
      actorId: session.userId,
      requestId,
      action: 'STATUS_CHANGED',
      entityType: 'PromotionRequest',
      entityId: requestId,
      description: `Application status changed from ${current.status} to ${newStatus}.`,
      metadata: { oldStatus: current.status, newStatus, comment },
    });

    await tx.notification.create({
      data: {
        userId: current.lecturerId,
        promotionRequestId: requestId,
        title: 'Application status updated',
        message: comment || `Your promotion application status is now ${newStatus.toLowerCase().replace(/_/g, ' ')}.`,
        type: NotificationType.INFO,
      },
    });

    return updated;
  });

  return NextResponse.json({
    success: true,
    message: 'Status updated',
    data: result,
  } as ApiResponse<typeof result>);
}
