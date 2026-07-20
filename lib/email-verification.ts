import crypto from 'crypto';
import { NotificationType } from '@prisma/client';
import { getAppBaseUrl } from './app-url';
import { prisma } from './prisma';
import { sendEmail } from './email';
import { createNotification } from './notifications';

const TOKEN_BYTES = 32;
const TOKEN_TTL_HOURS = 24;

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createEmailVerificationToken(userId: number) {
  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  return {
    token,
    expiresAt,
    verificationUrl: `${getAppBaseUrl()}/verify-email?token=${token}`,
  };
}

export async function sendVerificationEmail(user: { id: number; name: string; email: string }) {
  const verification = await createEmailVerificationToken(user.id);

  await sendEmail({
    to: user.email,
    subject: 'Verify your GCTU Promotion System account',
    text: [
      `Hello ${user.name},`,
      '',
      'Please verify your email address to activate your Digital Staff Promotion Support System account.',
      verification.verificationUrl,
      '',
      'This link expires in 24 hours. If you did not create this account, ignore this message.',
    ].join('\n'),
  });

  await createNotification({
    userId: user.id,
    title: 'Email verification required',
    message: 'A verification link has been generated for your account. Please verify your email before continuing.',
    type: NotificationType.WARNING,
  });

  return verification;
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt) {
    return { success: false as const, error: 'Invalid or already used verification link' };
  }

  if (record.expiresAt < new Date()) {
    return { success: false as const, error: 'Verification link has expired. Please request a new one.' };
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    const user = await tx.user.update({
      where: { id: record.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        isActive: true,
      },
    });

    await tx.notification.create({
      data: {
        userId: record.userId,
        title: 'Email verified',
        message: 'Your email address has been verified successfully.',
        type: NotificationType.SUCCESS,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: record.userId,
        action: 'EMAIL_VERIFIED',
        entityType: 'User',
        entityId: String(record.userId),
        description: 'User verified their email address.',
      },
    });

    return user;
  });

  return { success: true as const, user: updatedUser };
}
