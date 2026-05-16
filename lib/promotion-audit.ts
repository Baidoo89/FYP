import type { Prisma, PrismaClient } from '@prisma/client';

export type AuditPayload = {
  requestId?: number;
  actorId: number;
  action: string;
  metadata?: Prisma.JsonValue;
};

export async function writePromotionAudit(
  client: PrismaClient | Prisma.TransactionClient,
  payload: AuditPayload
) {
  return client.auditLog.create({
    data: {
      requestId: payload.requestId,
      actorId: payload.actorId,
      action: payload.action,
      metadata: payload.metadata ?? {},
    },
  });
}
