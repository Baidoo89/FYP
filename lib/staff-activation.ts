import crypto from 'crypto';
import { NotificationType, RecordVerificationState, Role } from '@prisma/client';
import { getAppBaseUrl } from './app-url';
import { isApplicantAccountRole } from './access-roles';
import { sendEmail } from './email';
import { hashPassword } from './auth';
import { prisma, WORKFLOW_TRANSACTION_OPTIONS } from './prisma';

const TOKEN_BYTES = 32;
const TOKEN_TTL_HOURS = 24;
const ACTIVATION_TOKEN_NAMESPACE = 'staff-activation:';

export class StaffActivationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function hashStaffActivationToken(token: string) {
  return crypto
    .createHash('sha256')
    .update(`${ACTIVATION_TOKEN_NAMESPACE}${token}`)
    .digest('hex');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function activationEmailHtml(name: string, activationUrl: string) {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(activationUrl);

  return [
    '<div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 580px;">',
    '<p style="margin: 0 0 8px; color: #475569; font-size: 13px; font-weight: 700; text-transform: uppercase;">GCTU Digital Staff Promotion Support System</p>',
    '<h2 style="margin: 0 0 12px; color: #0b2d5b; font-size: 22px;">Activate your verified staff access</h2>',
    `<p>Hello ${safeName},</p>`,
    '<p>HRODD has issued access for your verified GCTU staff record. Set a private password to activate your promotion workspace.</p>',
    `<p><a href="${safeUrl}" style="display: inline-block; background: #0b2d5b; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 700;">Activate Staff Access</a></p>`,
    `<p style="font-size: 13px; color: #475569;">If the button does not work, open this link:<br />${safeUrl}</p>`,
    '<p style="font-size: 13px; color: #475569;">This single-use link expires in 24 hours. Contact HRODD if you did not expect this invitation.</p>',
    '</div>',
  ].join('');
}

export async function sendStaffActivationEmail(user: { id: number; name: string; email: string }) {
  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);
  const activationUrl = `${getAppBaseUrl()}/activate-account?token=${token}`;

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashStaffActivationToken(token),
      expiresAt,
    },
  });

  let emailDelivered = false;
  let emailProvider = 'unknown';
  let emailDeliveryError: string | null = null;

  try {
    const delivery = await sendEmail({
      to: user.email,
      subject: 'Activate your GCTU staff promotion access',
      text: [
        `Hello ${user.name},`,
        '',
        'HRODD has issued access for your verified GCTU staff record.',
        'Set a private password using this single-use activation link:',
        activationUrl,
        '',
        'This link expires in 24 hours. Contact HRODD if you did not expect this invitation.',
      ].join('\n'),
      html: activationEmailHtml(user.name, activationUrl),
    });
    emailDelivered = delivery.delivered;
    emailProvider = delivery.provider;
  } catch (error) {
    emailDeliveryError = error instanceof Error ? error.message : 'Activation email delivery failed.';
    console.error('Staff activation email delivery failed:', emailDeliveryError);
  }

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: emailDeliveryError ? 'Activation email delivery issue' : 'Staff access issued',
      message: emailDeliveryError
        ? 'Your staff access was issued, but the activation email could not be delivered. Contact HRODD.'
        : 'HRODD issued your verified staff access. Use the emailed link to choose a password.',
      type: emailDeliveryError ? NotificationType.ERROR : NotificationType.INFO,
    },
  });

  return { activationUrl, expiresAt, emailDelivered, emailProvider, emailDeliveryError };
}

export async function activateStaffAccount(token: string, password: string) {
  const tokenHash = hashStaffActivationToken(token);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { staffMember: true } } },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new StaffActivationError('This activation link is invalid, expired, or already used.');
  }

  const user = record.user;
  if (!isApplicantAccountRole(user.role) || !user.isActive) {
    throw new StaffActivationError('This staff account is not available for activation.', 403);
  }
  if (!user.staffMember || user.staffMember.verificationState !== RecordVerificationState.VERIFIED) {
    throw new StaffActivationError('HRODD verification is required before this account can be activated.', 403);
  }
  if (user.emailVerified || user.passwordHash || user.password) {
    throw new StaffActivationError('This staff account has already been activated.', 409);
  }

  const passwordHash = hashPassword(password);
  const now = new Date();
  const activatedUser = await prisma.$transaction(async (tx) => {
    const consumed = await tx.emailVerificationToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gte: now } },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) {
      throw new StaffActivationError('This activation link is invalid, expired, or already used.');
    }

    const updated = await tx.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        passwordHash,
        emailVerified: true,
        emailVerifiedAt: now,
        onboarded: true,
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        title: 'Staff access activated',
        message: 'Your verified staff account is active. You can now review available promotion routes.',
        type: NotificationType.SUCCESS,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: 'STAFF_ACCOUNT_ACTIVATED',
        entityType: 'User',
        entityId: String(user.id),
        description: 'Applicant activated HRODD-issued staff access and set a private password.',
      },
    });

    return updated;
  }, WORKFLOW_TRANSACTION_OPTIONS);

  return activatedUser;
}
