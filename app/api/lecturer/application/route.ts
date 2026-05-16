import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getAuthSession } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = getAuthSession(request);

    if (!session?.userId || session.role !== 'LECTURER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const activeRequest = await prisma.promotionRequest.findFirst({
      where: {
        lecturerId: session.userId,
        status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!activeRequest) {
      return NextResponse.json(
        { success: true, data: { requestId: null, message: 'No active application' } },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          requestId: activeRequest.id,
          currentRank: activeRequest.currentRank,
          targetRank: activeRequest.targetRank,
          submittedAt: activeRequest.submittedAt,
          verifiedAt: activeRequest.verifiedAt,
          status: activeRequest.status,
          scores: {
            researchScore: activeRequest.totalScore ? (activeRequest.totalScore * 0.4) : null,
            teachingScore: activeRequest.totalScore ? (activeRequest.totalScore * 0.4) : null,
            serviceScore: activeRequest.totalScore ? (activeRequest.totalScore * 0.2) : null,
            totalScore: activeRequest.totalScore,
          },
          eligibilityStatus: activeRequest.eligibilityStatus,
          adminComment: activeRequest.adminComment,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Application fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load application data' },
      { status: 500 }
    );
  }
}
