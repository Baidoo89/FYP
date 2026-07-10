import { NextRequest, NextResponse } from 'next/server';
import { NotificationType, RequestStatus, ReviewRecommendation } from '@prisma/client';
import { getAuthSession } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';
import { writeAuditLog, writeStatusHistory } from '../../../../../lib/audit-logger';
import { assertStatusTransition } from '../../../../../lib/workflow';
import type { ApiResponse } from '../../../../../types';

const RECOMMENDATION_STATUS: Record<ReviewRecommendation, RequestStatus> = {
  RECOMMENDED: RequestStatus.RECOMMENDED,
  NOT_RECOMMENDED: RequestStatus.NOT_RECOMMENDED,
  REQUIRES_FURTHER_REVIEW: RequestStatus.REQUIRES_FURTHER_REVIEW,
};

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const { id } = await context.params;
  const requestId = Number(id);

  if (!session || !['COMMITTEE_REVIEWER', 'SYSTEM_ADMIN'].includes(session.role) || session.legacy) {
    return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
  }

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid request id' } as ApiResponse<null>, { status: 400 });
  }

  const body = await request.json();
  const comment = String(body.comment || '').trim();
  const recommendation = body.recommendation ? String(body.recommendation) as ReviewRecommendation : null;

  if (comment.length < 5) {
    return NextResponse.json({ success: false, error: 'Review comment must be at least 5 characters' } as ApiResponse<null>, { status: 400 });
  }

  if (recommendation && !Object.values(ReviewRecommendation).includes(recommendation)) {
    return NextResponse.json({ success: false, error: 'Invalid recommendation' } as ApiResponse<null>, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.promotionRequest.findUnique({
      where: { id: requestId },
      include: { lecturer: true },
    });

    if (!current) {
      throw new Error('Promotion request not found');
    }

    const review = await tx.reviewComment.create({
      data: {
        promotionRequestId: requestId,
        reviewerId: session.userId,
        comment,
        recommendation,
      },
    });

    let updatedRequest = current;
    if (recommendation) {
      const newStatus = RECOMMENDATION_STATUS[recommendation];
      assertStatusTransition(current.status, newStatus, session.role);

      updatedRequest = await tx.promotionRequest.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          reviewedAt: new Date(),
          reviewedById: session.userId,
          adminComment: comment,
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
    }

    await writeAuditLog(tx, {
      actorId: session.userId,
      requestId,
      action: 'REVIEW_COMMENT_ADDED',
      entityType: 'ReviewComment',
      entityId: review.id,
      description: 'Committee review comment was added.',
      metadata: { recommendation, comment },
    });

    await tx.notification.create({
      data: {
        userId: current.lecturerId,
        promotionRequestId: requestId,
        title: 'Committee review update',
        message: recommendation ? `Committee recommendation: ${recommendation.toLowerCase().replace(/_/g, ' ')}.` : 'A committee review comment was added.',
        type: recommendation === ReviewRecommendation.RECOMMENDED ? NotificationType.SUCCESS : NotificationType.INFO,
      },
    });

    return { review, request: updatedRequest };
  });

  return NextResponse.json({
    success: true,
    message: 'Review saved',
    data: result,
  } as ApiResponse<typeof result>);
}
