import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { sendVerificationEmail } from '../../../../lib/email-verification';
import { canExposeLocalVerificationUrl } from '../../../../lib/local-verification';

function safeDeliveryMessage(message?: string | null) {
  if (!message) {
    return 'Email provider did not confirm delivery.';
  }

  return message
    .replace(/re_[A-Za-z0-9_-]+/g, '[redacted_api_key]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .slice(0, 280);
}

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

    const verification = await sendVerificationEmail(user, { throwOnDeliveryFailure: false });
    const deliveryFailed = Boolean(verification.emailDeliveryError) || (process.env.NODE_ENV === 'production' && !verification.emailDelivered);

    if (deliveryFailed) {
      const deliveryMessage = safeDeliveryMessage(verification.emailDeliveryError);

      return NextResponse.json(
        {
          success: false,
          error: `Verification email could not be sent. ${deliveryMessage}`,
          emailProvider: verification.emailProvider,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
      emailProvider: verification.emailProvider,
      verificationUrl: canExposeLocalVerificationUrl(request, verification.emailProvider) ? verification.verificationUrl : undefined,
    });
  } catch (error) {
    const deliveryMessage = safeDeliveryMessage(error instanceof Error ? error.message : null);
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: `Failed to resend verification email. ${deliveryMessage}` },
      { status: 500 }
    );
  }
}