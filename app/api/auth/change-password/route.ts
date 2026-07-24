import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { NotificationType } from '@prisma/client';
import { getAuthSession, hashPassword, verifyPassword } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = passwordSchema.safeParse({
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return NextResponse.json(
      { success: false, error: 'Choose a new password that is different from the temporary/current password.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      password: true,
      passwordHash: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ success: false, error: 'Account not found or inactive.' }, { status: 404 });
  }

  const storedPassword = user.passwordHash || user.password;
  if (!verifyPassword(parsed.data.currentPassword, storedPassword)) {
    return NextResponse.json({ success: false, error: 'Current password is incorrect.' }, { status: 401 });
  }

  const nextHash = hashPassword(parsed.data.newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        password: nextHash,
        passwordHash: nextHash,
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        title: 'Password changed',
        message: 'Your account password was updated successfully.',
        type: NotificationType.SUCCESS,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: 'PASSWORD_CHANGED',
        entityType: 'User',
        entityId: String(user.id),
        description: 'User changed their account password.',
      },
    });
  });

  return NextResponse.json({
    success: true,
    message: 'Password changed successfully.',
  });
}
