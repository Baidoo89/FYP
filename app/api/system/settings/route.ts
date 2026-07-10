import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { writeAuditLog } from '../../../../lib/audit-logger';
import type { ApiResponse } from '../../../../types';

const settingSchema = z.object({
  key: z.string().min(2).regex(/^[a-z0-9_.-]+$/i, 'Use letters, numbers, dots, dashes, or underscores only'),
  value: z.string().min(1),
  description: z.string().optional().nullable(),
});

function requireSystemAdmin(request: NextRequest) {
  const session = getAuthSession(request);
  if (!session || session.legacy || session.role !== 'SYSTEM_ADMIN') {
    return { session: null, response: NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 }) };
  }
  return { session, response: null };
}

export async function GET(request: NextRequest) {
  const { response } = requireSystemAdmin(request);
  if (response) return response;

  const settings = await prisma.systemSetting.findMany({
    orderBy: { key: 'asc' },
  });

  return NextResponse.json({ success: true, data: settings } as ApiResponse<typeof settings>);
}

export async function POST(request: NextRequest) {
  const { session, response } = requireSystemAdmin(request);
  if (response) return response;

  const body = await request.json();
  const parsed = settingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Validation failed' } as ApiResponse<null>,
      { status: 400 }
    );
  }

  const saved = await prisma.$transaction(async (tx) => {
    const setting = await tx.systemSetting.upsert({
      where: { key: parsed.data.key },
      update: {
        value: parsed.data.value,
        description: parsed.data.description || null,
      },
      create: {
        key: parsed.data.key,
        value: parsed.data.value,
        description: parsed.data.description || null,
      },
    });

    await writeAuditLog(tx, {
      actorId: session!.userId,
      action: 'SETTING_UPDATED',
      entityType: 'SystemSetting',
      entityId: setting.key,
      description: `System setting updated: ${setting.key}.`,
      metadata: {
        key: setting.key,
        value: setting.value,
      },
    });

    return setting;
  });

  return NextResponse.json({ success: true, message: 'System setting saved', data: saved } as ApiResponse<typeof saved>);
}
