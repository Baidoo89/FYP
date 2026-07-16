import { NextRequest, NextResponse } from 'next/server';
import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { getAuthSession } from '../../../lib/auth';
import type { ApiResponse } from '../../../types';

const MAX_TAKE = 100;

function validNotificationType(value?: string | null) {
  if (!value) return null;
  const normalized = value.toUpperCase();
  return Object.values(NotificationType).includes(normalized as NotificationType) ? (normalized as NotificationType) : null;
}

function parseTake(value?: string | null) {
  const take = Number(value || 75);
  if (!Number.isInteger(take) || take <= 0) return 75;
  return Math.min(take, MAX_TAKE);
}

export async function GET(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
  }

  const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true';
  const readState = request.nextUrl.searchParams.get('readState') || '';
  const type = validNotificationType(request.nextUrl.searchParams.get('type'));
  const text = (request.nextUrl.searchParams.get('q') || '').trim();
  const take = parseTake(request.nextUrl.searchParams.get('take'));

  const where: Prisma.NotificationWhereInput = {
    userId: session.userId,
  };

  if (unreadOnly || readState === 'unread') {
    where.isRead = false;
  } else if (readState === 'read') {
    where.isRead = true;
  }

  if (type) {
    where.type = type;
  }

  if (text) {
    where.OR = [
      { title: { contains: text, mode: 'insensitive' } },
      { message: { contains: text, mode: 'insensitive' } },
    ];
  }

  const [notifications, totalCount, unreadCount, typeCounts] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        promotionRequest: {
          select: {
            id: true,
            status: true,
            eligibilityStatus: true,
            currentRank: true,
            targetRank: true,
            lecturer: {
              select: {
                name: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    }),
    prisma.notification.count({ where: { userId: session.userId } }),
    prisma.notification.count({ where: { userId: session.userId, isRead: false } }),
    prisma.notification.groupBy({
      by: ['type'],
      where: { userId: session.userId },
      _count: { type: true },
    }),
  ]);

  const summary = {
    total: totalCount,
    unread: unreadCount,
    read: Math.max(totalCount - unreadCount, 0),
    filtered: notifications.length,
    typeCounts: Object.values(NotificationType).reduce<Record<NotificationType, number>>((accumulator, notificationType) => {
      accumulator[notificationType] = typeCounts.find((row) => row.type === notificationType)?._count.type || 0;
      return accumulator;
    }, {} as Record<NotificationType, number>),
  };

  return NextResponse.json({
    success: true,
    data: {
      notifications,
      summary,
      filters: {
        readState: readState || (unreadOnly ? 'unread' : 'all'),
        type: type || 'ALL',
        q: text,
        take,
      },
    },
  } as ApiResponse<unknown>);
}

export async function PATCH(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const notificationId = Number(body.notificationId);
  const isRead = body.isRead === false ? false : true;

  if (body.markAllRead === true) {
    const updated = await prisma.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, message: 'All notifications marked as read', data: { count: updated.count } } as ApiResponse<{ count: number }>);
  }

  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    return NextResponse.json({ success: false, error: 'notificationId is required' } as ApiResponse<null>, { status: 400 });
  }

  const updated = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: session.userId,
    },
    data: { isRead },
  });

  if (updated.count === 0) {
    return NextResponse.json({ success: false, error: 'Notification not found' } as ApiResponse<null>, { status: 404 });
  }

  return NextResponse.json({ success: true, message: isRead ? 'Notification marked as read' : 'Notification marked as unread' } as ApiResponse<null>);
}