import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { getAuthSession } from '../../../lib/auth';
import { promotionRequestSchema } from '../../../lib/validation/promotion-request.schema';
import { writePromotionAudit } from '../../../lib/promotion-audit';
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
    adminComment: requestRecord.adminComment,
    documentCount: requestRecord.documents.length,
    verifiedDocumentCount: verifiedDocuments,
    requiredDocumentCount: requiredDocuments,
    documents: requestRecord.documents,
  };
}

export async function GET(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
  }

  const statusFilter = request.nextUrl.searchParams.get('status');
  const scope = request.nextUrl.searchParams.get('scope') || (session.role === 'LECTURER' ? 'lecturer' : 'hr');

  if (scope === 'hr' && session.role !== 'HR_ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
  }

  if (scope === 'lecturer' && session.role !== 'LECTURER') {
    return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
  }

  const where = scope === 'lecturer'
    ? { lecturerId: session.userId }
    : statusFilter
      ? { status: statusFilter as any }
      : {};

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
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json({
    success: true,
    data: promotionRequests.map(buildRequestSummary),
  } as ApiResponse<ReturnType<typeof buildRequestSummary>[]>)
}

export async function POST(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
  }

  const body = await request.json();
  const action = String(body.action || 'create');

  if (action === 'submit') {
    if (session.role !== 'LECTURER') {
      return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
    }

    const requestId = Number(body.requestId);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return NextResponse.json({ success: false, error: 'requestId is required' } as ApiResponse<null>, { status: 400 });
    }

    const requestRecord = await prisma.promotionRequest.findFirst({
      where: {
        id: requestId,
        lecturerId: session.userId,
      },
      include: { lecturer: true, documents: true },
    });

    if (!requestRecord) {
      return NextResponse.json({ success: false, error: 'Promotion request not found' } as ApiResponse<null>, { status: 404 });
    }

    const updatedRequest = await prisma.promotionRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        lecturer: true,
        documents: true,
      },
    });

    await prisma.$transaction(async (tx) => {
      await writePromotionAudit(tx, {
        requestId: updatedRequest.id,
        actorId: session.userId,
        action: 'promotion_request.submit',
        metadata: {
          status: updatedRequest.status,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Promotion request submitted',
      data: buildRequestSummary(updatedRequest),
    } as ApiResponse<ReturnType<typeof buildRequestSummary>>);
  }

  const parsed = promotionRequestSchema.safeParse({
    lecturerId: Number(body.lecturerId),
    currentRank: body.currentRank,
    targetRank: body.targetRank,
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

  if (session.role !== 'LECTURER') {
    return NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 });
  }

  if (parsed.data.lecturerId !== session.userId) {
    return NextResponse.json(
      { success: false, error: 'You can only create a request for your own account' } as ApiResponse<null>,
      { status: 403 }
    );
  }

  const requestRecord = await prisma.promotionRequest.create({
    data: {
      lecturerId: parsed.data.lecturerId,
      requestedById: session.userId,
      status: 'DRAFT',
      currentRank: parsed.data.currentRank,
      targetRank: parsed.data.targetRank,
      adminComment: parsed.data.adminComment || null,
    },
    include: {
      lecturer: true,
      requestedBy: true,
      documents: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    await writePromotionAudit(tx, {
      requestId: requestRecord.id,
      actorId: session.userId,
      action: 'promotion_request.create',
      metadata: {
        lecturerId: parsed.data.lecturerId,
        currentRank: parsed.data.currentRank,
        targetRank: parsed.data.targetRank,
      },
    });
  });

  return NextResponse.json(
    {
      success: true,
      message: 'Promotion request created',
      data: buildRequestSummary(requestRecord),
    } as ApiResponse<ReturnType<typeof buildRequestSummary>>,
    { status: 201 }
  );
}
