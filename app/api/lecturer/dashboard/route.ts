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

    // Fetch lecturer with onboarding data
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

    // Fetch active promotion request
    const activeRequest = await prisma.promotionRequest.findFirst({
      where: {
        lecturerId: session.userId,
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] },
      },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        targetRank: true,
        status: true,
        currentRank: true,
        submittedAt: true,
        totalScore: true,
        eligibilityStatus: true,
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
      },
    });

    // Calculate progress percentage
    let progressPercentage = 0;
    if (activeRequest) {
      if (activeRequest.status === 'APPROVED') progressPercentage = 100;
      else if (activeRequest.status === 'REJECTED') progressPercentage = 0;
      else if (activeRequest.status === 'UNDER_REVIEW') progressPercentage = 75;
      else if (activeRequest.submittedAt) progressPercentage = 50;
      else progressPercentage = 25;
    }

    // Fetch recent documents (last 3)
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
      take: 3,
    });

    const [totalDocuments, verifiedCount, pendingCount] = await Promise.all([
      prisma.document.count({
        where: { request: { lecturerId: session.userId } },
      }),
      prisma.document.count({
        where: {
          request: { lecturerId: session.userId },
          verificationStatus: 'VERIFIED',
        },
      }),
      prisma.document.count({
        where: {
          request: { lecturerId: session.userId },
          verificationStatus: 'PENDING',
        },
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
                targetRank: activeRequest.targetRank,
                status: activeRequest.status,
                progressPercentage,
                submittedAt: activeRequest.submittedAt,
                latestDocument: activeRequest.documents[0] || null,
              }
            : null,
          documentStats: {
            totalDocuments,
            verifiedCount,
            pendingCount,
          },
          recentDocuments,
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
