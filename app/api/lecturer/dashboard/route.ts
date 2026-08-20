import { RequestStatus, VerificationStatus, type Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getAuthSession } from '../../../../lib/auth';

const requestSelect = {
  id: true,
  targetRank: true,
  currentRank: true,
  status: true,
  eligibilityStatus: true,
  eligibilityReason: true,
  submittedAt: true,
  totalScore: true,
  createdAt: true,
  updatedAt: true,
  documents: {
    select: {
      id: true,
      title: true,
      category: true,
      verificationStatus: true,
      uploadedAt: true,
    },
    orderBy: { uploadedAt: 'desc' },
    take: 1,
  },
} satisfies Prisma.PromotionRequestSelect;

function progressForStatus(status: RequestStatus, submittedAt: Date | null) {
  const progressByStatus: Record<RequestStatus, number> = {
    DRAFT: 10,
    SUBMITTED: 22,
    UNDER_DEPARTMENT_REVIEW: 35,
    UNDER_REVIEW: 48,
    RETURNED_FOR_CORRECTION: 38,
    UNDER_HR_VERIFICATION: 56,
    UNDER_COMMITTEE_REVIEW: 74,
    ELIGIBLE: 82,
    NOT_ELIGIBLE: 82,
    REQUIRES_FURTHER_REVIEW: 78,
    RECOMMENDED: 88,
    NOT_RECOMMENDED: 88,
    APPROVED_BY_AUTHORITY: 95,
    APPROVED: 100,
    REJECTED: 100,
    COMPLETED: 100,
  };

  return progressByStatus[status] ?? (submittedAt ? 25 : 10);
}

export async function GET(request: NextRequest) {
  try {
    const session = getAuthSession(request);

    if (!session?.userId || !['STAFF', 'LECTURER'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        staffId: true,
        currentRank: true,
        department: true,
        onboarded: true,
        createdAt: true,
      },
    });

    if (!user || !user.onboarded) {
      return NextResponse.json(
        { success: false, error: 'User not onboarded' },
        { status: 403 }
      );
    }

    const activeRequest =
      (await prisma.promotionRequest.findFirst({
        where: {
          lecturerId: session.userId,
          status: { notIn: [RequestStatus.COMPLETED] },
        },
        orderBy: { updatedAt: 'desc' },
        select: requestSelect,
      })) ||
      (await prisma.promotionRequest.findFirst({
        where: { lecturerId: session.userId },
        orderBy: { updatedAt: 'desc' },
        select: requestSelect,
      }));

    const recentDocuments = await prisma.document.findMany({
      where: { request: { lecturerId: session.userId } },
      select: {
        id: true,
        title: true,
        category: true,
        verificationStatus: true,
        uploadedAt: true,
      },
      orderBy: { uploadedAt: 'desc' },
      take: 4,
    });

    const [totalDocuments, verifiedCount, pendingCount, returnedCount, unreadNotifications, recentFeedback] = await Promise.all([
      prisma.document.count({
        where: { request: { lecturerId: session.userId } },
      }),
      prisma.document.count({
        where: {
          request: { lecturerId: session.userId },
          verificationStatus: VerificationStatus.VERIFIED,
        },
      }),
      prisma.document.count({
        where: {
          request: { lecturerId: session.userId },
          verificationStatus: VerificationStatus.PENDING,
        },
      }),
      prisma.document.count({
        where: {
          request: { lecturerId: session.userId },
          verificationStatus: { in: [VerificationStatus.REJECTED, VerificationStatus.REQUIRES_CORRECTION] },
        },
      }),
      prisma.notification.count({
        where: { userId: session.userId, isRead: false },
      }),
      prisma.document.findMany({
        where: {
          request: { lecturerId: session.userId },
          OR: [
            { verificationStatus: { in: [VerificationStatus.REJECTED, VerificationStatus.REQUIRES_CORRECTION] } },
            { verificationComment: { not: null } },
          ],
        },
        select: {
          id: true,
          title: true,
          category: true,
          verificationStatus: true,
          verificationComment: true,
          updatedAt: true,
          verifiedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 3,
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            name: user.name,
            email: user.email,
            staffId: user.staffId,
            currentRank: user.currentRank,
            department: user.department,
          },
          activeRequest: activeRequest
            ? {
                id: activeRequest.id,
                currentRank: activeRequest.currentRank,
                targetRank: activeRequest.targetRank,
                status: activeRequest.status,
                eligibilityStatus: activeRequest.eligibilityStatus,
                eligibilityReason: activeRequest.eligibilityReason,
                totalScore: activeRequest.totalScore,
                progressPercentage: progressForStatus(activeRequest.status, activeRequest.submittedAt),
                submittedAt: activeRequest.submittedAt,
                createdAt: activeRequest.createdAt,
                updatedAt: activeRequest.updatedAt,
                latestDocument: activeRequest.documents[0] || null,
              }
            : null,
          documentStats: {
            totalDocuments,
            verifiedCount,
            pendingCount,
            returnedCount,
            unreadNotifications,
          },
          recentDocuments,
          recentFeedback: recentFeedback.map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            verificationStatus: item.verificationStatus,
            comment: item.verificationComment,
            updatedAt: item.updatedAt,
            verifiedAt: item.verifiedAt,
          })),
          accountCreated: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
