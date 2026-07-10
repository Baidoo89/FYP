import { NotificationType } from '@prisma/client';
import { prisma } from './prisma';

export async function createNotification(input: {
  userId: number;
  title: string;
  message: string;
  type?: NotificationType;
  promotionRequestId?: number;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type || NotificationType.INFO,
      promotionRequestId: input.promotionRequestId,
    },
  });
}

export async function notifyRole(input: {
  roles: Array<'LECTURER' | 'HOD_DEAN' | 'HR_ADMIN' | 'COMMITTEE_REVIEWER' | 'SYSTEM_ADMIN'>;
  title: string;
  message: string;
  type?: NotificationType;
  promotionRequestId?: number;
}) {
  const users = await prisma.user.findMany({
    where: {
      role: { in: input.roles },
      isActive: true,
    },
    select: { id: true },
  });

  if (users.length === 0) {
    return { count: 0 };
  }

  return prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      title: input.title,
      message: input.message,
      type: input.type || NotificationType.INFO,
      promotionRequestId: input.promotionRequestId,
    })),
  });
}
