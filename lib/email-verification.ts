import crypto from 'crypto';
import { NotificationType } from '@prisma/client';
import { getAppBaseUrl } from './app-url';
import { prisma } from './prisma';
import { sendEmail } from './email';
import { createNotification } from './notifications';

const TOKEN_BYTES = 32;
const TOKEN_TTL_HOURS = 24;

type SendVerificationOptions = {
  throwOnDeliveryFailure?: boolean;
};

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function deliveryErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Verification email delivery failed';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function verificationEmailHtml(name: string, verificationUrl: string) {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(verificationUrl);

  return [
    '<div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 560px;">',
    '<p style="margin: 0 0 8px; color: #475569; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;">GCTU Digital Staff Promotion Support System</p>',
    '<h2 style="margin: 0 0 12px; color: #0b2d5b; font-size: 22px;">Verify your staff account</h2>',
    `<p>Hello ${safeName},</p>`,
    '<p>Please verify your email address to activate your secure GCTU promotion workspace.</p>',
    `<p><a href="${safeUrl}" style="display: inline-block; background: #0b2d5b; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 700;">Verify Email Address</a></p>`,
    `<p style="font-size: 13px; color: #475569;">If the button does not work, copy this link into your browser:<br />${safeUrl}</p>`,
    '<p style="font-size: 13px; color: #475569;">This link expires in 24 hours. If you did not create this account, ignore this message.</p>',
    '</div>',
  ].join('');
}

function accountSetupEmailHtml(name: string, verificationUrl: string, temporaryPassword: string, role?: string) {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(verificationUrl);
  const safePassword = escapeHtml(temporaryPassword);
  const safeRole = escapeHtml(role ? formatRoleLabel(role) : 'Staff User');
  const securityUrl = escapeHtml(`${getAppBaseUrl()}/account/security`);

  return [
    '<div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 600px;">',
    '<p style="margin: 0 0 8px; color: #475569; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;">GCTU Digital Staff Promotion Support System</p>',
    '<h2 style="margin: 0 0 12px; color: #0b2d5b; font-size: 22px;">Your staff account is ready</h2>',
    `<p>Hello ${safeName},</p>`,
    `<p>A ${safeRole} account has been created for you on the official GCTU Digital Staff Promotion Support System.</p>`,
    '<div style="margin: 16px 0; padding: 14px; border: 1px solid #dbe4ef; border-radius: 10px; background: #f8fafc;">',
    '<p style="margin: 0 0 6px; font-size: 13px; color: #475569; font-weight: 700; text-transform: uppercase;">Temporary password</p>',
    `<p style="margin: 0; font-family: Consolas, monospace; font-size: 18px; font-weight: 700; color: #0f172a;">${safePassword}</p>`,
    '</div>',
    '<p>First verify your email address, then sign in with the temporary password. After signing in, open Account Security and change the password to one only you know.</p>',
    `<p><a href="${safeUrl}" style="display: inline-block; background: #0b2d5b; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 700;">Verify and Continue</a></p>`,
    `<p style="font-size: 13px; color: #475569;">Account Security: ${securityUrl}</p>`,
    `<p style="font-size: 13px; color: #475569;">If the button does not work, copy this link into your browser:<br />${safeUrl}</p>`,
    '<p style="font-size: 13px; color: #475569;">This setup link expires in 24 hours. If you did not expect this account, contact the system administrator.</p>',
    '</div>',
  ].join('');
}

function formatRoleLabel(value: string) {
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
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

export async function sendVerificationEmail(
  user: { id: number; name: string; email: string },
  options: SendVerificationOptions = {}
) {
  const verification = await createEmailVerificationToken(user.id);
  let emailDelivered = false;
  let emailProvider = 'unknown';
  let emailDeliveryError: string | null = null;

  try {
    const delivery = await sendEmail({
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
      html: verificationEmailHtml(user.name, verification.verificationUrl),
    });

    emailDelivered = delivery.delivered;
    emailProvider = delivery.provider;
  } catch (error) {
    emailDeliveryError = deliveryErrorMessage(error);
    console.error('Verification email delivery failed:', emailDeliveryError);

    if (options.throwOnDeliveryFailure !== false) {
      throw error;
    }
  }

  await createNotification({
    userId: user.id,
    title: emailDeliveryError ? 'Verification email delivery issue' : 'Email verification required',
    message: emailDeliveryError
      ? 'Your verification link was generated, but the email could not be delivered automatically. Please use the resend option or contact system support.'
      : 'A verification link has been generated for your account. Please verify your email before continuing.',
    type: emailDeliveryError ? NotificationType.ERROR : NotificationType.WARNING,
  });

  return {
    ...verification,
    emailDelivered,
    emailProvider,
    emailDeliveryError,
  };
}

export async function sendAccountSetupEmail(
  user: { id: number; name: string; email: string; role?: string },
  options: SendVerificationOptions & { temporaryPassword: string } = { temporaryPassword: '' }
) {
  const verification = await createEmailVerificationToken(user.id);
  let emailDelivered = false;
  let emailProvider = 'unknown';
  let emailDeliveryError: string | null = null;

  try {
    const delivery = await sendEmail({
      to: user.email,
      subject: 'Set up your GCTU Promotion System account',
      text: [
        `Hello ${user.name},`,
        '',
        `A ${user.role ? formatRoleLabel(user.role) : 'Staff User'} account has been created for you on the GCTU Digital Staff Promotion Support System.`,
        `Temporary password: ${options.temporaryPassword}`,
        '',
        'Verify your email address, then sign in with the temporary password and change it from Account Security.',
        verification.verificationUrl,
        '',
        'This setup link expires in 24 hours. If you did not expect this account, contact the system administrator.',
      ].join('\n'),
      html: accountSetupEmailHtml(user.name, verification.verificationUrl, options.temporaryPassword, user.role),
    });

    emailDelivered = delivery.delivered;
    emailProvider = delivery.provider;
  } catch (error) {
    emailDeliveryError = deliveryErrorMessage(error);
    console.error('Account setup email delivery failed:', emailDeliveryError);

    if (options.throwOnDeliveryFailure !== false) {
      throw error;
    }
  }

  await createNotification({
    userId: user.id,
    title: emailDeliveryError ? 'Account setup email delivery issue' : 'Account setup email sent',
    message: emailDeliveryError
      ? 'Your account setup link was generated, but the email could not be delivered automatically. Ask an administrator to confirm the email service configuration.'
      : 'A setup email has been sent to your official GCTU staff email. Verify your address before using the workspace.',
    type: emailDeliveryError ? NotificationType.ERROR : NotificationType.INFO,
  });

  return {
    ...verification,
    emailDelivered,
    emailProvider,
    emailDeliveryError,
  };
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
