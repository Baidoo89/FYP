import crypto from 'crypto';
import { CommunicationPurpose } from '@prisma/client';
import { getAppBaseUrl } from './app-url';
import { recordCommunicationDelivery } from './communication-delivery';
import { sendEmail } from './email';
import { prisma } from './prisma';

const TOKEN_BYTES = 32;
const INVITATION_DAYS = 14;

export function hashExternalAssessorToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function createAndSendExternalAssessorInvitation(assessorId: number) {
  const assessor = await prisma.externalAssessor.findUnique({
    where: { id: assessorId },
    select: {
      id: true,
      name: true,
      officialEmail: true,
      promotionRequest: {
        select: {
          id: true,
          currentRank: true,
          targetRank: true,
          promotionRoute: { select: { name: true } },
        },
      },
    },
  });
  if (!assessor?.officialEmail) throw new Error('The external assessor does not have an official email address.');

  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const invitationExpiresAt = new Date(Date.now() + INVITATION_DAYS * 24 * 60 * 60 * 1000);
  const portalUrl = `${getAppBaseUrl()}/external-assessment/${token}`;

  await prisma.externalAssessor.update({
    where: { id: assessor.id },
    data: {
      invitationTokenHash: hashExternalAssessorToken(token),
      invitationExpiresAt,
      invitedAt: new Date(),
      status: 'INVITED',
    },
  });

  const safeName = escapeHtml(assessor.name);
  const safeUrl = escapeHtml(portalUrl);
  const subject = 'Confidential GCTU promotion assessment invitation';
  let delivery;
  try {
    delivery = await sendEmail({
    to: assessor.officialEmail,
    subject,
    text: [
      `Dear ${assessor.name},`,
      '',
      'You have been invited to provide an independent confidential assessment for a Ghana Communication Technology University promotion case.',
      `Route: ${assessor.promotionRequest.promotionRoute?.name || `${assessor.promotionRequest.currentRank} to ${assessor.promotionRequest.targetRank}`}`,
      '',
      'Open the secure assessment workspace:',
      portalUrl,
      '',
      `This single-assessor link expires on ${invitationExpiresAt.toUTCString()}. Do not forward it.`,
    ].join('\n'),
    html: [
      '<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;max-width:600px">',
      '<p style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase">GCTU Digital Staff Promotion Support System</p>',
      '<h2 style="color:#0b2d5b">Confidential external assessment invitation</h2>',
      `<p>Dear ${safeName},</p>`,
      '<p>You have been invited to provide an independent confidential assessment for a GCTU promotion case.</p>',
      `<p><a href="${safeUrl}" style="display:inline-block;background:#0b2d5b;color:white;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:700">Open Assessment Workspace</a></p>`,
      `<p style="font-size:13px;color:#475569">This link expires on ${escapeHtml(invitationExpiresAt.toUTCString())} and must not be forwarded.</p>`,
      '</div>',
    ].join(''),
    });
    await recordCommunicationDelivery({
      promotionRequestId: assessor.promotionRequest.id,
      externalAssessorId: assessor.id,
      purpose: CommunicationPurpose.EXTERNAL_ASSESSOR_INVITATION,
      recipientAddress: assessor.officialEmail,
      subject,
      provider: delivery.provider,
      providerMessageId: delivery.id,
      delivered: delivery.delivered,
      metadata: { invitationExpiresAt: invitationExpiresAt.toISOString() },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'External assessor invitation delivery failed.';
    await recordCommunicationDelivery({
      promotionRequestId: assessor.promotionRequest.id,
      externalAssessorId: assessor.id,
      purpose: CommunicationPurpose.EXTERNAL_ASSESSOR_INVITATION,
      recipientAddress: assessor.officialEmail,
      subject,
      provider: 'error',
      errorMessage: message,
      metadata: { invitationExpiresAt: invitationExpiresAt.toISOString() },
    });
    throw error;
  }

  return {
    assessorId: assessor.id,
    invitationExpiresAt,
    portalUrl,
    delivery,
  };
}
