import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, createSessionToken, verifyPassword, hashLegacyPassword, type AuthRole } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { findLocalAdminAccount } from '../../../../lib/admin-storage';
import { writeAuditLog } from '../../../../lib/audit-logger';
import { getRequestSessionMetadata } from '../../../../lib/session-metadata';

type LoginSource = 'user' | 'adminAccount' | 'localAdmin';

type LoginSessionUser = {
  id: number;
  name: string;
  email: string;
  role: AuthRole;
  department?: string;
  legacy?: boolean;
  onboarded?: boolean;
  emailVerified?: boolean;
  source: LoginSource;
};

function isDatabaseUnavailableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === 'PrismaClientInitializationError' ||
    error.message.includes("Can't reach database server") ||
    error.message.includes('Timed out fetching a new connection') ||
    error.message.includes('Connection terminated')
  );
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

    const inputLegacyHash = hashLegacyPassword(password);
    const normalizedUsername = username.toLowerCase();

    const invalidCredentialsResponse = () => {
      const response = NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: '',
        path: '/',
        maxAge: 0,
      });

      return response;
    };

    let sessionUser: LoginSessionUser | null = null;

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

    if (matchedAdmin && verifyPassword(password, matchedAdmin.password_hash)) {
      sessionUser = {
        id: matchedAdmin.id,
        name: matchedAdmin.username,
        email: `${matchedAdmin.username}@admin.local`,
        role: 'HR_ADMIN',
        onboarded: true,
        emailVerified: true,
        source: 'adminAccount',
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

      const storedPassword = promotionUser?.passwordHash || promotionUser?.password;

      if (promotionUser && verifyPassword(password, storedPassword)) {
        sessionUser = {
          id: promotionUser.id,
          name: promotionUser.name,
          email: promotionUser.email,
          role: promotionUser.role,
          department: promotionUser.department || undefined,
          onboarded: promotionUser.onboarded,
          emailVerified: promotionUser.emailVerified,
          source: 'user',
        };
      }
    }

    if (!sessionUser) {
      const localAdmin = await findLocalAdminAccount(username, inputLegacyHash);

      if (!localAdmin) {
        return invalidCredentialsResponse();
      }

      sessionUser = {
        id: localAdmin.id,
        name: localAdmin.username,
        email: localAdmin.email || `${localAdmin.username}@admin.local`,
        role: 'HR_ADMIN',
        onboarded: true,
        emailVerified: true,
        source: 'localAdmin',
      };
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      name: sessionUser.name,
      role: sessionUser.role,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: createSessionToken({
        userId: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        role: sessionUser.role,
        department: sessionUser.department,
        onboarded: sessionUser.onboarded ?? true,
        emailVerified: sessionUser.emailVerified ?? true,
      }),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    if (sessionUser.source === 'user') {
      try {
        const metadata = getRequestSessionMetadata(request);
        await writeAuditLog(prisma, {
          actorId: sessionUser.id,
          action: 'USER_LOGIN',
          entityType: 'User',
          entityId: sessionUser.id,
          description: 'User signed in successfully.',
          ipAddress: metadata.ipAddress,
          metadata: {
            browser: metadata.browser,
            platform: metadata.platform,
            deviceType: metadata.deviceType,
            device: metadata.device,
            location: metadata.location,
          },
        });
      } catch (auditError) {
        console.error('Login audit failed:', auditError);
      }
    }

    return response;

  } catch (err) {
    console.error('LOGIN ERROR:', err);

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid login request payload' },
        { status: 400 }
      );
    }

    if (isDatabaseUnavailableError(err)) {
      return NextResponse.json(
        { success: false, error: 'Database temporarily unavailable. Please try again shortly.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}