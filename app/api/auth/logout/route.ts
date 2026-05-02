import { NextRequest, NextResponse } from 'next/server';
import { appendAuditLog } from '../../../../lib/audit';
import { SESSION_COOKIE_NAME } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Logout successful',
  });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  await appendAuditLog({
    action: 'auth.logout',
    request,
  });

  return response;
}
