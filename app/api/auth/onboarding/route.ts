import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../../lib/prisma';
import { onboardingSchema } from '../../../../lib/validation/auth.schema';
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from '../../../../lib/auth';
import { isValidFacultyDepartment } from '../../../../lib/institution-structure';

function fullNameFromParts(firstName: string, middleName: string | undefined, lastName: string) {
  return [firstName, middleName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = verifySessionToken(sessionToken);

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = onboardingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { firstName, middleName, lastName, faculty, department, staffId, currentRank } = validation.data;

    if (!isValidFacultyDepartment(faculty, department)) {
      return NextResponse.json(
        { success: false, error: 'Select a valid GCTU faculty and department combination.' },
        { status: 400 }
      );
    }

    const displayName = fullNameFromParts(firstName, middleName, lastName);

    const updatedUser = await prisma.$transaction(async (tx) => {
      const facultyRecord = await tx.faculty.upsert({
        where: { name: faculty },
        update: {},
        create: { name: faculty },
      });

      const departmentRecord = await tx.department.upsert({
        where: { name: department },
        update: { facultyId: facultyRecord.id },
        create: { name: department, facultyId: facultyRecord.id },
      });

      return tx.user.update({
        where: { id: session.userId },
        data: {
          name: displayName,
          department,
          departmentId: departmentRecord.id,
          facultyId: facultyRecord.id,
          staffId: staffId.trim(),
          currentRank,
          onboarded: true,
        },
        include: {
          faculty: { select: { id: true, name: true } },
          departmentRef: { select: { id: true, name: true } },
        },
      });
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Profile completed successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          department: updatedUser.department,
          departmentId: updatedUser.departmentId,
          facultyId: updatedUser.facultyId,
          faculty: updatedUser.faculty?.name || null,
          staffId: updatedUser.staffId,
          currentRank: updatedUser.currentRank,
          onboarded: updatedUser.onboarded,
        },
      },
      { status: 200 }
    );

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: createSessionToken({
        userId: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department || undefined,
        onboarded: true,
        emailVerified: updatedUser.emailVerified,
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
        { success: false, error: 'This staff ID is already assigned to another account.' },
        { status: 409 }
      );
    }

    console.error('Onboarding error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
