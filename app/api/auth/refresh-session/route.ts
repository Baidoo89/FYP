import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, getAuthSession, SESSION_COOKIE_NAME, type AuthRole } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { getDashboardForRole } from '../../../../lib/rbac';

// Re-issues the session cookie from the current database state. The session
// cookie is a signed snapshot (emailVerified/onboarded baked in at issue
// time), so a device that registered before email verification completed
// elsewhere (e.g. the link was opened on a different phone/machine) keeps
// seeing itself as unverified until this snapshot is refreshed.
export async function POST(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || !session.userId) {
    return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  if (!user || !user.isActive) {
    const response = NextResponse.json({ success: false, error: 'Account not found' }, { status: 401 });
    response.cookies.set({ name: SESSION_COOKIE_NAME, value: '', path: '/', maxAge: 0 });
    return response;
  }

  const role = user.role as AuthRole;
  const nextPath = role === 'LECTURER' && user.emailVerified && !user.onboarded
    ? '/onboarding'
    : getDashboardForRole(role);

  const response = NextResponse.json({
    success: true,
    emailVerified: user.emailVerified,
    onboarded: user.onboarded,
    nextPath,
  });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: createSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || undefined,
      onboarded: user.onboarded,
      emailVerified: user.emailVerified,
    }),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
