import type { Prisma, PrismaClient, RequestStatus } from '@prisma/client';

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function writeAuditLog(
  client: DbClient,
  input: {
    actorId?: number | null;
    action: string;
    entityType?: string;
    entityId?: string | number;
    requestId?: number;
    description?: string;
    ipAddress?: string;
    metadata?: Prisma.JsonValue;
  }
) {
  return client.auditLog.create({
    data: {
      actorId: input.actorId || null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId === undefined ? undefined : String(input.entityId),
      requestId: input.requestId,
      description: input.description,
      ipAddress: input.ipAddress,
      metadata: input.metadata ?? {},
    },
  });
}

export async function writeStatusHistory(
  client: DbClient,
  input: {
    promotionRequestId: number;
    changedById: number;
    oldStatus?: RequestStatus | null;
    newStatus: RequestStatus;
    comment?: string | null;
  }
) {
  return client.statusHistory.create({
    data: {
      promotionRequestId: input.promotionRequestId,
      changedById: input.changedById,
      oldStatus: input.oldStatus,
      newStatus: input.newStatus,
      comment: input.comment,
    },
  });
}
