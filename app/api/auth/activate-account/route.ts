import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSessionToken, SESSION_COOKIE_NAME } from '../../../../lib/auth';
import { activateStaffAccount, StaffActivationError } from '../../../../lib/staff-activation';

const activationSchema = z.object({
  token: z.string().trim().min(32, 'A valid activation token is required.'),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters.')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
    .regex(/[a-z]/, 'Password must contain a lowercase letter.')
    .regex(/[0-9]/, 'Password must contain a number.'),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

export async function POST(request: NextRequest) {
  try {
    const parsed = activationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid activation details.' },
        { status: 400 },
      );
    }

    const user = await activateStaffAccount(parsed.data.token, parsed.data.password);
    const response = NextResponse.json({
      success: true,
      message: 'Staff access activated successfully.',
      nextPath: '/lecturer-portal/start-application',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: createSessionToken({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || undefined,
        onboarded: true,
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
    if (error instanceof StaffActivationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('Staff account activation error:', error);
    return NextResponse.json({ success: false, error: 'Unable to activate staff access.' }, { status: 500 });
  }
}
