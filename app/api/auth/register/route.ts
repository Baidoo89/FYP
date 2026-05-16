import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { registerSchema } from '../../../../lib/validation/auth.schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const derivedName = email.split('@')[0] || email;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create user with onboarded: false
    const user = await prisma.user.create({
      data: {
        name: derivedName,
        email,
        password: hashPassword(password),
        role: 'LECTURER',
        onboarded: false, // User must complete onboarding
      },
    });

    // Auto-login the user with onboarded: false
    const response = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please complete your profile.',
        userId: user.id,
      },
      { status: 201 }
    );

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: createSessionToken({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboarded: false,
      }),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
