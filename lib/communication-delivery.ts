import {
  CommunicationDeliveryStatus,
  CommunicationPurpose,
  type Prisma,
} from '@prisma/client';
import { prisma } from './prisma';

export async function recordCommunicationDelivery(input: {
  promotionRequestId?: number | null;
  recipientUserId?: number | null;
  externalAssessorId?: number | null;
  purpose: CommunicationPurpose;
  recipientAddress: string;
  subject: string;
  provider: string;
  providerMessageId?: string | null;
  delivered?: boolean;
  errorMessage?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  const status = input.errorMessage
    ? CommunicationDeliveryStatus.FAILED
    : input.delivered
      ? CommunicationDeliveryStatus.SENT
      : CommunicationDeliveryStatus.LOGGED;

  try {
    return await prisma.communicationDelivery.create({
      data: {
        promotionRequestId: input.promotionRequestId || null,
        recipientUserId: input.recipientUserId || null,
        externalAssessorId: input.externalAssessorId || null,
        purpose: input.purpose,
        recipientAddress: input.recipientAddress,
        subject: input.subject,
        provider: input.provider,
        providerMessageId: input.providerMessageId || null,
        status,
        errorMessage: input.errorMessage || null,
        metadata: input.metadata,
        sentAt: input.delivered ? new Date() : null,
      },
    });
  } catch (error) {
    console.error('Communication delivery history could not be recorded:', error);
    return null;
  }
}
