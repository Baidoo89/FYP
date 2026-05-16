import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { SESSION_COOKIE_NAME, createSessionToken } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { findLocalAdminAccount } from '../../../../lib/admin-storage';

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

    const inputHash = hashPassword(password);
    const normalizedUsername = username.toLowerCase();

    const invalidCredentialsResponse = () => {
      const response = NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );

      // Clear stale session cookie so users are not kept in previous portal context.
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: '',
        path: '/',
        maxAge: 0,
      });

      return response;
    };

    let sessionUser: { id: number; name: string; email: string; role: 'LECTURER' | 'HR_ADMIN'; department?: string; legacy?: boolean; onboarded?: boolean } | null = null;

    // Authenticate HR admin accounts first to avoid accidental lecturer-user collisions.
    const adminAccounts = await prisma.adminAccount.findMany({
      where: { is_active: true },
      select: {
        id: true,
        username: true,
        password_hash: true,
      },
    });

    const matchedAdmin = adminAccounts.find(
      (admin) => admin.username.toLowerCase() === normalizedUsername
    );

    if (matchedAdmin && inputHash === matchedAdmin.password_hash) {
      sessionUser = {
        id: matchedAdmin.id,
        name: matchedAdmin.username,
        email: `${matchedAdmin.username}@admin.local`,
        role: 'HR_ADMIN',
        onboarded: true,
      };
    }

    if (!sessionUser) {
      const promotionUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedUsername },
            { name: username },
          ],
        },
      });

      if (promotionUser && promotionUser.password === inputHash) {
        sessionUser = {
          id: promotionUser.id,
          name: promotionUser.name,
          email: promotionUser.email,
          role: promotionUser.role,
          department: promotionUser.department || undefined,
          onboarded: promotionUser.onboarded,
        };
      }
    }

    if (!sessionUser) {
      const localAdmin = await findLocalAdminAccount(username, inputHash);

      if (!localAdmin) {
        return invalidCredentialsResponse();
      }

      sessionUser = {
        id: localAdmin.id,
        name: localAdmin.username,
        email: localAdmin.email || `${localAdmin.username}@admin.local`,
        role: 'HR_ADMIN',
        onboarded: true,
      };
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      role: sessionUser!.role,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: createSessionToken({
        userId: sessionUser!.id,
        name: sessionUser!.name,
        email: sessionUser!.email,
        role: sessionUser!.role,
        department: sessionUser!.department,
        onboarded: sessionUser!.role === 'HR_ADMIN' ? true : (sessionUser! as any).onboarded,
      }),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
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