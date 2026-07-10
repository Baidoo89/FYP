import { NextRequest, NextResponse } from 'next/server';
import { AcademicRank, Role } from '@prisma/client';
import { z } from 'zod';
import { getAuthSession } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { writeAuditLog } from '../../../../lib/audit-logger';
import type { ApiResponse } from '../../../../types';

const userUpdateSchema = z.object({
  userId: z.number().int().positive(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  facultyId: z.number().int().positive().nullable().optional(),
  currentRank: z.nativeEnum(AcademicRank).nullable().optional(),
  phone: z.string().optional().nullable(),
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

  const search = request.nextUrl.searchParams.get('search')?.trim();
  const role = request.nextUrl.searchParams.get('role') as Role | null;
  const active = request.nextUrl.searchParams.get('active');

  const users = await prisma.user.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { staffId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(role && Object.values(Role).includes(role) ? { role } : {}),
      ...(active === 'true' ? { isActive: true } : active === 'false' ? { isActive: false } : {}),
    },
    include: {
      departmentRef: true,
      faculty: true,
      _count: {
        select: {
          lecturerRequests: true,
          notifications: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' },
      { name: 'asc' },
    ],
  });

  const [departments, faculties] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
    prisma.faculty.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      users,
      departments,
      faculties,
      roles: Object.values(Role),
      ranks: Object.values(AcademicRank),
    },
  } as ApiResponse<unknown>);
}

export async function PATCH(request: NextRequest) {
  const { session, response } = requireSystemAdmin(request);
  if (response) return response;

  const body = await request.json();
  const parsed = userUpdateSchema.safeParse({
    ...body,
    userId: Number(body.userId),
    departmentId: body.departmentId === '' || body.departmentId === undefined ? null : Number(body.departmentId),
    facultyId: body.facultyId === '' || body.facultyId === undefined ? null : Number(body.facultyId),
    currentRank: body.currentRank === '' ? null : body.currentRank,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Validation failed' } as ApiResponse<null>,
      { status: 400 }
    );
  }

  if (parsed.data.userId === session!.userId && parsed.data.isActive === false) {
    return NextResponse.json(
      { success: false, error: 'You cannot deactivate your own active administrator session' } as ApiResponse<null>,
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({
      where: { id: parsed.data.userId },
      include: { departmentRef: true, faculty: true },
    });

    if (!current) {
      throw new Error('User not found');
    }

    const department = parsed.data.departmentId
      ? await tx.department.findUnique({ where: { id: parsed.data.departmentId } })
      : null;

    const updated = await tx.user.update({
      where: { id: parsed.data.userId },
      data: {
        role: parsed.data.role,
        isActive: parsed.data.isActive,
        departmentId: parsed.data.departmentId,
        department: department?.name || (parsed.data.departmentId === null ? null : undefined),
        facultyId: parsed.data.facultyId,
        currentRank: parsed.data.currentRank,
        phone: parsed.data.phone,
      },
      include: {
        departmentRef: true,
        faculty: true,
      },
    });

    await writeAuditLog(tx, {
      actorId: session!.userId,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: updated.id,
      description: `System administrator updated ${updated.email}.`,
      metadata: {
        before: {
          role: current.role,
          isActive: current.isActive,
          departmentId: current.departmentId,
          facultyId: current.facultyId,
          currentRank: current.currentRank,
        },
        after: {
          role: updated.role,
          isActive: updated.isActive,
          departmentId: updated.departmentId,
          facultyId: updated.facultyId,
          currentRank: updated.currentRank,
        },
      },
    });

    return updated;
  });

  return NextResponse.json({ success: true, message: 'User updated', data: result } as ApiResponse<typeof result>);
}
