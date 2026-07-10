import type { Prisma, PrismaClient } from '@prisma/client';
import { writeAuditLog } from './audit-logger';

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
  return writeAuditLog(client, {
    requestId: payload.requestId,
    actorId: payload.actorId,
    action: payload.action,
    entityType: payload.requestId ? 'PromotionRequest' : undefined,
    entityId: payload.requestId,
    description: payload.action.replace(/_/g, ' ').replace(/\./g, ' '),
    metadata: payload.metadata ?? {},
  });
}
