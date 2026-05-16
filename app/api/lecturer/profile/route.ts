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

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        currentRank: true,
        department: true,
        staffId: true,
        onboarded: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          profile: {
            email: user.email,
            name: user.name,
            role: user.role,
            currentRank: user.currentRank,
            department: user.department,
            staffId: user.staffId,
            onboarded: user.onboarded,
            joinedAt: user.createdAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load profile data' },
      { status: 500 }
    );
  }
}
