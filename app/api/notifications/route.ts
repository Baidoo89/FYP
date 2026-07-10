import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getAuthSession } from '../../../lib/auth';
import type { ApiResponse } from '../../../types';

export async function GET(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
  }

  const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true';
  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ success: true, data: notifications } as ApiResponse<typeof notifications>);
}

export async function PATCH(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const notificationId = Number(body.notificationId);

  if (body.markAllRead === true) {
    await prisma.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, message: 'All notifications marked as read' } as ApiResponse<null>);
  }

  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    return NextResponse.json({ success: false, error: 'notificationId is required' } as ApiResponse<null>, { status: 400 });
  }

  const updated = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: session.userId,
    },
    data: { isRead: true },
  });

  if (updated.count === 0) {
    return NextResponse.json({ success: false, error: 'Notification not found' } as ApiResponse<null>, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Notification marked as read' } as ApiResponse<null>);
}
