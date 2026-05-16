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

    const queries = await prisma.document.findMany({
      where: {
        request: {
          lecturerId: session.userId,
        },
        verificationStatus: 'REJECTED',
      },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        category: true,
        verificationStatus: true,
        verificationComment: true,
        uploadedAt: true,
        request: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          queries: queries.map(q => ({
            documentId: q.id,
            requestId: q.request.id,
            title: q.title,
            fileUrl: q.fileUrl,
            category: q.category,
            verificationStatus: q.verificationStatus,
            adminComment: q.verificationComment,
            flaggedAt: q.uploadedAt,
          })),
          count: queries.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Queries fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load query data' },
      { status: 500 }
    );
  }
}
