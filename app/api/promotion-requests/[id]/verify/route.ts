import { NextRequest, NextResponse } from 'next/server';
import { Prisma, VerificationStatus } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';
import { getAuthSession } from '../../../../../lib/auth';
import { verificationSchema } from '../../../../../lib/validation/promotion-request.schema';
import { evaluateEligibility } from '../../../../../lib/promotion-engine';
import { writePromotionAudit } from '../../../../../lib/promotion-audit';
import type { ApiResponse } from '../../../../../types';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const { id } = await context.params;
  const requestId = Number(id);

  if (!session || session.role !== 'HR_ADMIN' || session.legacy) {
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
        verificationStatus: parsed.data.verificationStatus as VerificationStatus,
        verifiedById: session.userId,
        verificationComment: parsed.data.comment || null,
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

    const allDocuments = await tx.document.findMany({
      where: { requestId },
      orderBy: { uploadedAt: 'asc' },
    });

    const eligibility = evaluateEligibility(
      allDocuments.map((documentItem) => ({
        category: documentItem.category,
        verificationStatus: documentItem.verificationStatus,
      }))
    );

    const allRequiredVerified = eligibility.allRequiredVerified;
    const nextStatus =
      eligibility.eligibilityStatus === 'ELIGIBLE'
        ? 'APPROVED'
        : eligibility.eligibilityStatus === 'NOT_ELIGIBLE' && allRequiredVerified
          ? 'REJECTED'
          : 'UNDER_REVIEW';

    const updatedRequest = await tx.promotionRequest.update({
      where: { id: requestId },
      data: {
        status: nextStatus,
        totalScore: Number(eligibility.totalScore),
        eligibilityStatus: eligibility.eligibilityStatus,
        verifiedAt: allRequiredVerified ? new Date() : null,
        adminComment:
          parsed.data.comment ||
          (eligibility.eligibilityStatus === 'ELIGIBLE'
            ? 'All required documents verified. Lecturer is eligible for promotion review.'
            : eligibility.eligibilityStatus === 'NOT_ELIGIBLE'
              ? 'Promotion requirements were not met after verification.'
              : 'Request is under review pending additional verification.'),
      },
      include: {
        lecturer: true,
        documents: true,
      },
    });

    await writePromotionAudit(tx, {
      requestId,
      actorId: session.userId,
      action: 'promotion_request.status_updated',
      metadata: {
        status: updatedRequest.status,
        eligibilityStatus: updatedRequest.eligibilityStatus,
        totalScore: updatedRequest.totalScore?.toString() || null,
      },
    });

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
      eligibilityStatus: result.request.eligibilityStatus,
      totalScore: result.request.totalScore ? Number(result.request.totalScore) : null,
      document: result.document,
    },
  } as ApiResponse<Record<string, unknown>>);
}
