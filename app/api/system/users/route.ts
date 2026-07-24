import { NextRequest, NextResponse } from 'next/server';
import { AcademicRank, RequestStatus, Role } from '@prisma/client';
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

const userDeleteSchema = z.object({
  userId: z.number().int().positive(),
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
export async function DELETE(request: NextRequest) {
  const { session, response } = requireSystemAdmin(request);
  if (response) return response;

  const body = await request.json();
  const parsed = userDeleteSchema.safeParse({
    userId: Number(body.userId),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Validation failed' } as ApiResponse<null>,
      { status: 400 }
    );
  }

  if (parsed.data.userId === session!.userId) {
    return NextResponse.json(
      { success: false, error: 'You cannot delete your own administrator account' } as ApiResponse<null>,
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    include: {
      lecturerRequests: {
        select: { id: true, status: true },
      },
      applicantRequests: {
        select: { id: true, status: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' } as ApiResponse<null>, { status: 404 });
  }

  if (user.role !== Role.LECTURER) {
    return NextResponse.json(
      { success: false, error: 'Only lecturer accounts can be deleted from this workspace. Deactivate or reassign privileged accounts instead.' } as ApiResponse<null>,
      { status: 400 }
    );
  }

  const relatedRequests = [...user.lecturerRequests, ...user.applicantRequests];
  const hasOfficialRecord = relatedRequests.some((promotionRequest) => promotionRequest.status !== RequestStatus.DRAFT);
  if (hasOfficialRecord) {
    return NextResponse.json(
      { success: false, error: 'This lecturer has an official promotion record. Deactivate the account instead so university records and audit history are preserved.' } as ApiResponse<null>,
      { status: 400 }
    );
  }

  const requestIds = [...new Set(relatedRequests.map((promotionRequest) => promotionRequest.id))];
  const documents = await prisma.document.findMany({
    where: {
      OR: [
        ...(requestIds.length ? [{ requestId: { in: requestIds } }] : []),
        { uploadedById: user.id },
        { verifiedById: user.id },
      ],
    },
    select: { id: true, fileName: true, fileUrl: true },
  });
  const documentIds = [...new Set(documents.map((document) => document.id))];

  const result = await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({
      where: {
        OR: [
          { userId: user.id },
          ...(requestIds.length ? [{ promotionRequestId: { in: requestIds } }] : []),
        ],
      },
    });
    await tx.emailVerificationToken.deleteMany({ where: { userId: user.id } });
    await tx.verification.deleteMany({
      where: {
        OR: [
          ...(documentIds.length ? [{ documentId: { in: documentIds } }] : []),
          { verifierId: user.id },
        ],
      },
    });
    await tx.reviewComment.deleteMany({
      where: {
        OR: [
          ...(requestIds.length ? [{ promotionRequestId: { in: requestIds } }] : []),
          { reviewerId: user.id },
        ],
      },
    });
    await tx.statusHistory.deleteMany({
      where: {
        OR: [
          ...(requestIds.length ? [{ promotionRequestId: { in: requestIds } }] : []),
          { changedById: user.id },
        ],
      },
    });
    await tx.auditLog.deleteMany({
      where: {
        OR: [
          ...(requestIds.length ? [{ requestId: { in: requestIds } }] : []),
          { actorId: user.id },
        ],
      },
    });
    await tx.score.deleteMany({
      where: {
        OR: [
          ...(requestIds.length ? [{ promotionRequestId: { in: requestIds } }] : []),
          { createdById: user.id },
        ],
      },
    });
    await tx.document.deleteMany({
      where: documentIds.length ? { id: { in: documentIds } } : { id: -1 },
    });
    await tx.promotionRequest.deleteMany({
      where: requestIds.length ? { id: { in: requestIds } } : { id: -1 },
    });
    await tx.user.delete({ where: { id: user.id } });

    await writeAuditLog(tx, {
      actorId: session!.userId,
      action: 'LECTURER_DELETED',
      entityType: 'User',
      entityId: user.id,
      description: `System administrator deleted lecturer account ${user.email}.`,
      metadata: {
        email: user.email,
        name: user.name,
        staffId: user.staffId,
        deletedDraftRequestIds: requestIds,
        deletedDocumentFiles: documents.map((document) => document.fileName),
      },
    });

    return {
      deletedUser: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      deletedDraftRequests: requestIds.length,
      deletedDocuments: documentIds.length,
    };
  }, { timeout: 60000, maxWait: 10000 });

  return NextResponse.json({ success: true, message: 'Lecturer account deleted', data: result } as ApiResponse<typeof result>);
}
