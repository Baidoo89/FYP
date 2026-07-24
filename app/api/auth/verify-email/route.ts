import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE_NAME } from '../../../../lib/auth';
import { verifyEmailToken } from '../../../../lib/email-verification';
import { getDashboardForRole } from '../../../../lib/rbac';
import type { AuthRole } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token || '').trim();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Verification token is required' }, { status: 400 });
    }

    const result = await verifyEmailToken(token);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const userRole = result.user.role as AuthRole;
    const nextPath = userRole === 'LECTURER' && !result.user.onboarded
      ? '/onboarding'
      : getDashboardForRole(userRole);

    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      nextPath,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: createSessionToken({
        userId: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        department: result.user.department || undefined,
        onboarded: result.user.onboarded,
        emailVerified: true,
      }),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify email' }, { status: 500 });
  }
}
