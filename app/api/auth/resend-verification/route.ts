import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { sendVerificationEmail } from '../../../../lib/email-verification';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('lpads_session')?.value;
    const session = verifySessionToken(sessionToken);

    if (!session?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: 'Email is already verified' });
    }

    const verification = await sendVerificationEmail(user);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
      verificationUrl: process.env.NODE_ENV === 'production' ? undefined : verification.verificationUrl,
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ success: false, error: 'Failed to resend verification email' }, { status: 500 });
  }
}
