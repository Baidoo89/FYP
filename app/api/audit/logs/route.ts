import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getAuthSession } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || session.legacy || !['HR_ADMIN', 'SYSTEM_ADMIN'].includes(session.role)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limitParam = Number(searchParams.get('limit') || 100);
  const pageParam = Number(searchParams.get('page') || 1);
  const actor = (searchParams.get('actor') || '').trim();
  const action = (searchParams.get('action') || '').trim();
  const text = (searchParams.get('text') || '').trim();
  const startDate = (searchParams.get('startDate') || '').trim();
  const endDate = (searchParams.get('endDate') || '').trim();

  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 500)) : 100;
  const page = Number.isFinite(pageParam) ? Math.max(1, pageParam) : 1;

  const where: Prisma.AuditLogWhereInput = {};

  if (action) {
    where.action = { contains: action, mode: 'insensitive' };
  }

  if (actor) {
    where.actor = {
      OR: [
        { name: { contains: actor, mode: 'insensitive' } },
        { email: { contains: actor, mode: 'insensitive' } },
      ],
    };
  }

  if (text) {
    where.OR = [
      { action: { contains: text, mode: 'insensitive' } },
      { entityType: { contains: text, mode: 'insensitive' } },
      { entityId: { contains: text, mode: 'insensitive' } },
      { description: { contains: text, mode: 'insensitive' } },
      { ipAddress: { contains: text, mode: 'insensitive' } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};

    if (startDate) {
      const minDate = new Date(startDate);
      if (!Number.isNaN(minDate.getTime())) {
        where.createdAt.gte = minDate;
      }
    }

    if (endDate) {
      const maxDate = new Date(endDate);
      if (!Number.isNaN(maxDate.getTime())) {
        maxDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = maxDate;
      }
    }
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const data = logs.map((log) => ({
    timestamp: log.createdAt.toISOString(),
    action: log.action,
    actor: log.actor ? `${log.actor.name} (${log.actor.role})` : 'System',
    ip: log.ipAddress || '',
    userAgent: '',
    details: {
      entityType: log.entityType,
      entityId: log.entityId,
      description: log.description,
      metadata: log.metadata,
    },
  }));

  return NextResponse.json({
    success: true,
    data,
    meta: {
      total,
      returned: data.length,
      limit,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}
