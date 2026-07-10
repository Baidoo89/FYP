import { NextRequest, NextResponse } from 'next/server';
import { NotificationType, RequestStatus, VerificationStatus } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';
import { getAuthSession } from '../../../../../lib/auth';
import { verificationSchema } from '../../../../../lib/validation/promotion-request.schema';
import { calculateEligibility } from '../../../../../lib/promotion-engine';
import { writePromotionAudit } from '../../../../../lib/promotion-audit';
import { writeStatusHistory } from '../../../../../lib/audit-logger';
import type { ApiResponse } from '../../../../../types';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const { id } = await context.params;
  const requestId = Number(id);

  if (!session || !['HR_ADMIN', 'HOD_DEAN', 'SYSTEM_ADMIN'].includes(session.role) || session.legacy) {
    return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
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

  const result = await prisma.$transaction(async (tx) => {
    const documentRecord = await tx.document.findUnique({
      where: { id: parsed.data.documentId },
      include: {
        request: true,
      },
    });

    if (!documentRecord || documentRecord.requestId !== requestId) {
      throw new Error('Document not found for this request');
    }

    const updatedDocument = await tx.document.update({
      where: { id: parsed.data.documentId },
      data: {
        status: parsed.data.verificationStatus as VerificationStatus,
        verificationStatus: parsed.data.verificationStatus as VerificationStatus,
        verifiedById: session.userId,
        verificationComment: parsed.data.comment || null,
        verifiedAt: new Date(),
      },
    });

    await tx.verification.create({
      data: {
        documentId: updatedDocument.id,
        verifierId: session.userId,
        decision: parsed.data.verificationStatus as VerificationStatus,
        comment: parsed.data.comment || null,
      },
    });

    await writePromotionAudit(tx, {
      requestId,
      actorId: session.userId,
      action: `promotion_document.${parsed.data.verificationStatus.toLowerCase()}`,
      metadata: {
        documentId: updatedDocument.id,
        category: updatedDocument.category,
        verificationComment: updatedDocument.verificationComment,
      },
    });

    const nextStatus =
      parsed.data.verificationStatus === VerificationStatus.REJECTED ||
      parsed.data.verificationStatus === VerificationStatus.REQUIRES_CORRECTION
        ? RequestStatus.RETURNED_FOR_CORRECTION
        : RequestStatus.UNDER_HR_VERIFICATION;

    const updatedRequest = await tx.promotionRequest.update({
      where: { id: requestId },
      data: {
        status: nextStatus,
        verifiedAt: parsed.data.verificationStatus === VerificationStatus.VERIFIED ? new Date() : null,
        adminComment:
          parsed.data.comment ||
          (nextStatus === RequestStatus.RETURNED_FOR_CORRECTION
            ? 'Document requires correction before eligibility can be calculated.'
            : 'Document verification saved. Application remains under HR verification.'),
      },
      include: {
        lecturer: true,
        documents: true,
      },
    });

    if (documentRecord.request.status !== nextStatus) {
      await writeStatusHistory(tx, {
        promotionRequestId: requestId,
        changedById: session.userId,
        oldStatus: documentRecord.request.status,
        newStatus: nextStatus,
        comment: updatedRequest.adminComment,
      });
    }

    await writePromotionAudit(tx, {
      requestId,
      actorId: session.userId,
      action: 'promotion_request.status_updated',
      metadata: {
        status: updatedRequest.status,
      },
    });

    await tx.notification.create({
      data: {
        userId: updatedRequest.lecturerId,
        promotionRequestId: requestId,
        title: parsed.data.verificationStatus === VerificationStatus.VERIFIED ? 'Document verified' : 'Document requires attention',
        message: parsed.data.comment || `Your ${updatedDocument.category.toLowerCase().replace(/_/g, ' ')} document was ${parsed.data.verificationStatus.toLowerCase().replace(/_/g, ' ')}.`,
        type: parsed.data.verificationStatus === VerificationStatus.VERIFIED ? NotificationType.SUCCESS : NotificationType.WARNING,
      },
    });

    const eligibility =
      parsed.data.verificationStatus === VerificationStatus.VERIFIED
        ? await calculateEligibility(tx, requestId, session.userId)
        : null;

    return {
      request: updatedRequest,
      document: updatedDocument,
      eligibility,
    };
  });

  return NextResponse.json({
    success: true,
    message: 'Verification saved',
    data: {
      requestId: result.request.id,
      status: result.request.status,
      eligibilityStatus: result.eligibility?.eligibilityStatus || result.request.eligibilityStatus,
      eligibilityReason: result.eligibility?.eligibilityReason || result.request.eligibilityReason,
      totalScore: result.eligibility?.totalScore ?? (result.request.totalScore ? Number(result.request.totalScore) : null),
      document: result.document,
    },
  } as ApiResponse<Record<string, unknown>>);
}
