import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { SESSION_COOKIE_NAME, getSessionCookieValue } from '../../../../lib/auth';
import { appendAuditLog } from '../../../../lib/audit';
import { getRows } from '../../../../lib/db';

function hashPassword(password: string) {
  return crypto
    .createHash('sha256')
    .update(password + 'lpads-salt-2026')
    .digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const username = (body.username || '').trim();
    const password = (body.password || '').trim();

    console.log('LOGIN ATTEMPT:', username);

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password required' },
        { status: 400 }
      );
    }

    // 1. Get user
    const rows = await getRows(
      `SELECT id, username, password_hash 
       FROM admin_accounts 
       WHERE username = $1 AND is_active = TRUE`,
      [username]
    );

    console.log('DB RESULT:', rows);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // 2. Compare password
    const inputHash = hashPassword(password);

    console.log('INPUT HASH:', inputHash);
    console.log('DB HASH:', user.password_hash);

    if (inputHash !== user.password_hash) {
      await appendAuditLog({
        action: 'auth.login.failure',
        actor: username,
        details: { reason: 'wrong_password' },
        request,
      });

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 3. Success
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: getSessionCookieValue(),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    await appendAuditLog({
      action: 'auth.login.success',
      actor: username,
      details: { authenticated: true },
      request,
    });

    return response;
  } catch (err) {
    console.error('LOGIN ERROR:', err);

    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}