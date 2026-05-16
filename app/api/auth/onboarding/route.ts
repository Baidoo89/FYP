import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { onboardingSchema } from '../../../../lib/validation/auth.schema';
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = verifySessionToken(sessionToken);

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate with Zod
    const validation = onboardingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { department, staffId, currentRank } = validation.data;

    // Update user with onboarding data
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        department,
        staffId,
        currentRank,
        onboarded: true,
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Profile completed successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          department: updatedUser.department,
          staffId: updatedUser.staffId,
          currentRank: updatedUser.currentRank,
          onboarded: updatedUser.onboarded,
        },
      },
      { status: 200 }
    );

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: createSessionToken({
        userId: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department || undefined,
        onboarded: true,
      }),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
