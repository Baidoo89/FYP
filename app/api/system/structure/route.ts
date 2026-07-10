import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { writeAuditLog } from '../../../../lib/audit-logger';
import type { ApiResponse } from '../../../../types';

const structureSchema = z.object({
  type: z.enum(['FACULTY', 'DEPARTMENT']),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  facultyId: z.number().int().positive().optional().nullable(),
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

  const [faculties, departments] = await Promise.all([
    prisma.faculty.findMany({
      include: {
        _count: { select: { departments: true, users: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.department.findMany({
      include: {
        faculty: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: { faculties, departments },
  } as ApiResponse<{ faculties: typeof faculties; departments: typeof departments }>);
}

export async function POST(request: NextRequest) {
  const { session, response } = requireSystemAdmin(request);
  if (response) return response;

  const body = await request.json();
  const parsed = structureSchema.safeParse({
    ...body,
    facultyId: body.facultyId ? Number(body.facultyId) : null,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Validation failed' } as ApiResponse<null>,
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    if (parsed.data.type === 'FACULTY') {
      const faculty = await tx.faculty.upsert({
        where: { name: parsed.data.name },
        update: {
          description: parsed.data.description || null,
        },
        create: {
          name: parsed.data.name,
          description: parsed.data.description || null,
        },
      });

      await writeAuditLog(tx, {
        actorId: session!.userId,
        action: 'FACULTY_UPSERTED',
        entityType: 'Faculty',
        entityId: faculty.id,
        description: `Faculty configured: ${faculty.name}.`,
      });

      return faculty;
    }

    const department = await tx.department.upsert({
      where: { name: parsed.data.name },
      update: {
        description: parsed.data.description || null,
        facultyId: parsed.data.facultyId || null,
      },
      create: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        facultyId: parsed.data.facultyId || null,
      },
    });

    await writeAuditLog(tx, {
      actorId: session!.userId,
      action: 'DEPARTMENT_UPSERTED',
      entityType: 'Department',
      entityId: department.id,
      description: `Department configured: ${department.name}.`,
      metadata: { facultyId: department.facultyId },
    });

    return department;
  });

  return NextResponse.json({ success: true, message: 'Institution structure saved', data: result } as ApiResponse<typeof result>);
}
