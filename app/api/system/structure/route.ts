import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getAuthSession } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { writeAuditLog } from '../../../../lib/audit-logger';
import type { ApiResponse } from '../../../../types';

const structureSchema = z.object({
  id: z.number().int().positive().optional(),
  type: z.enum(['FACULTY', 'DEPARTMENT']),
  name: z.string().trim().min(2),
  description: z.string().trim().optional().nullable(),
  facultyId: z.number().int().positive().optional().nullable(),
});

const structureDeleteSchema = z.object({
  type: z.enum(['FACULTY', 'DEPARTMENT']),
  id: z.number().int().positive(),
});

function requireSystemAdmin(request: NextRequest) {
  const session = getAuthSession(request);
  if (!session || session.legacy || session.role !== 'SYSTEM_ADMIN') {
    return { session: null, response: NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 }) };
  }
  return { session, response: null };
}

function jsonError(error: string, status = 400) {
  return NextResponse.json({ success: false, error } as ApiResponse<null>, { status });
}

function nullableNumber(value: unknown) {
  if (value === '' || value === null) return null;
  if (value === undefined) return undefined;
  return Number(value);
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
    id: body.id ? Number(body.id) : undefined,
    facultyId: nullableNumber(body.facultyId),
    description: body.description ? String(body.description).trim() : null,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Validation failed' } as ApiResponse<null>,
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (parsed.data.type === 'FACULTY') {
        const faculty = parsed.data.id
          ? await tx.faculty.update({
              where: { id: parsed.data.id },
              data: {
                name: parsed.data.name,
                description: parsed.data.description || null,
              },
            })
          : await tx.faculty.upsert({
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
          action: parsed.data.id ? 'FACULTY_UPDATED' : 'FACULTY_UPSERTED',
          entityType: 'Faculty',
          entityId: faculty.id,
          description: `Faculty configured: ${faculty.name}.`,
        });

        return faculty;
      }

      if (parsed.data.facultyId) {
        const faculty = await tx.faculty.findUnique({ where: { id: parsed.data.facultyId } });
        if (!faculty) {
          throw new Error('Selected faculty was not found');
        }
      }

      const department = parsed.data.id
        ? await tx.department.update({
            where: { id: parsed.data.id },
            data: {
              name: parsed.data.name,
              description: parsed.data.description || null,
              facultyId: parsed.data.facultyId || null,
            },
          })
        : await tx.department.upsert({
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
        action: parsed.data.id ? 'DEPARTMENT_UPDATED' : 'DEPARTMENT_UPSERTED',
        entityType: 'Department',
        entityId: department.id,
        description: `Department configured: ${department.name}.`,
        metadata: { facultyId: department.facultyId },
      });

      return department;
    });

    return NextResponse.json({ success: true, message: 'Institution structure saved', data: result } as ApiResponse<typeof result>);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return jsonError('A faculty or department with this name already exists', 409);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return jsonError('Selected structure record was not found', 404);
    }

    if (error instanceof Error && error.message === 'Selected faculty was not found') {
      return jsonError(error.message, 404);
    }

    console.error('Structure save error:', error);
    return jsonError('Unable to save institution structure', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const { session, response } = requireSystemAdmin(request);
  if (response) return response;

  const body = await request.json();
  const parsed = structureDeleteSchema.safeParse({
    type: body.type,
    id: Number(body.id),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Validation failed' } as ApiResponse<null>,
      { status: 400 }
    );
  }

  if (parsed.data.type === 'FACULTY') {
    const faculty = await prisma.faculty.findUnique({
      where: { id: parsed.data.id },
      include: { _count: { select: { departments: true, users: true } } },
    });

    if (!faculty) {
      return NextResponse.json({ success: false, error: 'Faculty not found' } as ApiResponse<null>, { status: 404 });
    }

    if (faculty._count.departments > 0 || faculty._count.users > 0) {
      return NextResponse.json(
        { success: false, error: 'This faculty is still linked to departments or users. Reassign them before deleting it.' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.faculty.delete({ where: { id: faculty.id } });
      await writeAuditLog(tx, {
        actorId: session!.userId,
        action: 'FACULTY_DELETED',
        entityType: 'Faculty',
        entityId: faculty.id,
        description: `System administrator deleted faculty ${faculty.name}.`,
        metadata: { name: faculty.name },
      });
      return faculty;
    });

    return NextResponse.json({ success: true, message: 'Faculty deleted', data: result } as ApiResponse<typeof result>);
  }

  const department = await prisma.department.findUnique({
    where: { id: parsed.data.id },
    include: { faculty: true, _count: { select: { users: true } } },
  });

  if (!department) {
    return NextResponse.json({ success: false, error: 'Department not found' } as ApiResponse<null>, { status: 404 });
  }

  const legacyNameLinkCount = await prisma.user.count({
    where: {
      departmentId: null,
      department: department.name,
    },
  });

  if (department._count.users > 0 || legacyNameLinkCount > 0) {
    return NextResponse.json(
      { success: false, error: 'This department is still linked to users. Reassign those users before deleting it.' } as ApiResponse<null>,
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.department.delete({ where: { id: department.id } });
    await writeAuditLog(tx, {
      actorId: session!.userId,
      action: 'DEPARTMENT_DELETED',
      entityType: 'Department',
      entityId: department.id,
      description: `System administrator deleted department ${department.name}.`,
      metadata: {
        name: department.name,
        faculty: department.faculty?.name || null,
      },
    });
    return department;
  });

  return NextResponse.json({ success: true, message: 'Department deleted', data: result } as ApiResponse<typeof result>);
}
