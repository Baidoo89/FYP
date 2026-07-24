import { NextRequest, NextResponse } from 'next/server';
import { AcademicRank, Prisma, RequestStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { getAuthSession } from '../../../../lib/auth';
import { hashPassword } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { writeAuditLog } from '../../../../lib/audit-logger';
import { sendAccountSetupEmail } from '../../../../lib/email-verification';
import type { ApiResponse } from '../../../../types';

const OFFICIAL_EMAIL_DOMAIN = '@live.gctu.edu.gh';

const userRecordSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  staffId: true,
  department: true,
  departmentId: true,
  facultyId: true,
  currentRank: true,
  phone: true,
  emailVerified: true,
  emailVerifiedAt: true,
  isActive: true,
  onboarded: true,
  createdAt: true,
  updatedAt: true,
  departmentRef: true,
  faculty: true,
  _count: {
    select: {
      lecturerRequests: true,
      notifications: true,
    },
  },
} satisfies Prisma.UserSelect;
const userCreateSchema = z.object({
  name: z.string().trim().min(2, 'Full name is required'),
  email: z.string().trim().email('Official GCTU email is required').transform((value) => value.toLowerCase()).refine(
    (value) => value.endsWith(OFFICIAL_EMAIL_DOMAIN),
    `Use an official ${OFFICIAL_EMAIL_DOMAIN} email address`
  ),
  password: z.string().min(8, 'Temporary password must be at least 8 characters'),
  role: z.nativeEnum(Role),
  staffId: z.string().trim().optional().nullable(),
  departmentId: z.number().int().positive().nullable().optional(),
  facultyId: z.number().int().positive().nullable().optional(),
  currentRank: z.nativeEnum(AcademicRank).nullable().optional(),
  phone: z.string().trim().optional().nullable(),
  emailVerified: z.boolean().default(false),
  sendSetupEmail: z.boolean().default(true),
  onboarded: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

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

function nullableNumber(value: unknown) {
  if (value === '' || value === null) return null;
  if (value === undefined) return undefined;
  return Number(value);
}

function nullableString(value: unknown) {
  const text = String(value || '').trim();
  return text ? text : null;
}

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

async function resolveInstitutionMapping(input: { facultyId?: number | null; departmentId?: number | null }) {
  const [department, faculty] = await Promise.all([
    input.departmentId ? prisma.department.findUnique({ where: { id: input.departmentId } }) : Promise.resolve(null),
    input.facultyId ? prisma.faculty.findUnique({ where: { id: input.facultyId } }) : Promise.resolve(null),
  ]);

  if (input.departmentId && !department) {
    return { response: jsonError('Selected department was not found', 404), department: null, facultyId: null };
  }

  if (input.facultyId && !faculty) {
    return { response: jsonError('Selected faculty was not found', 404), department: null, facultyId: null };
  }

  if (input.facultyId && department?.facultyId && department.facultyId !== input.facultyId) {
    return { response: jsonError('Selected department does not belong to the selected faculty'), department: null, facultyId: null };
  }

  return {
    response: null,
    department,
    facultyId: input.facultyId ?? department?.facultyId ?? null,
  };
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
    select: userRecordSelect,

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

export async function POST(request: NextRequest) {
  const { session, response } = requireSystemAdmin(request);
  if (response) return response;

  const body = await request.json();
  const parsed = userCreateSchema.safeParse({
    ...body,
    staffId: nullableString(body.staffId),
    departmentId: nullableNumber(body.departmentId),
    facultyId: nullableNumber(body.facultyId),
    currentRank: body.currentRank === '' ? null : body.currentRank,
    phone: nullableString(body.phone),
    emailVerified: body.emailVerified !== undefined ? Boolean(body.emailVerified) : false,
    sendSetupEmail: body.sendSetupEmail !== undefined ? Boolean(body.sendSetupEmail) : true,
    onboarded: body.onboarded !== undefined ? Boolean(body.onboarded) : true,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Validation failed' } as ApiResponse<null>,
      { status: 400 }
    );
  }

  const mapping = await resolveInstitutionMapping({
    facultyId: parsed.data.facultyId,
    departmentId: parsed.data.departmentId,
  });
  if (mapping.response) return mapping.response;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const passwordHash = hashPassword(parsed.data.password);
      const user = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          password: passwordHash,
          passwordHash,
          role: parsed.data.role,
          staffId: parsed.data.staffId || null,
          departmentId: parsed.data.departmentId || null,
          department: mapping.department?.name || null,
          facultyId: mapping.facultyId,
          currentRank: parsed.data.currentRank || null,
          phone: parsed.data.phone || null,
          emailVerified: parsed.data.emailVerified,
          emailVerifiedAt: parsed.data.emailVerified ? new Date() : null,
          onboarded: parsed.data.onboarded,
          isActive: parsed.data.isActive,
        },
        select: userRecordSelect,

      });

      await writeAuditLog(tx, {
        actorId: session!.userId,
        action: 'USER_CREATED_BY_SYSTEM_ADMIN',
        entityType: 'User',
        entityId: user.id,
        description: `System administrator created ${user.email}.`,
        metadata: {
          role: user.role,
          staffId: user.staffId,
          departmentId: user.departmentId,
          facultyId: user.facultyId,
          emailVerified: user.emailVerified,
          onboarded: user.onboarded,
        },
      });

      return user;
    });

    let setupEmail: Awaited<ReturnType<typeof sendAccountSetupEmail>> | null = null;
    if (!created.emailVerified && parsed.data.sendSetupEmail) {
      setupEmail = await sendAccountSetupEmail(
        {
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role,
        },
        {
          temporaryPassword: parsed.data.password,
          throwOnDeliveryFailure: false,
        }
      );
    }

    const setupDeliveryFailed = Boolean(setupEmail?.emailDeliveryError) || Boolean(setupEmail && process.env.NODE_ENV === 'production' && !setupEmail.emailDelivered);
    const message = setupEmail
      ? setupDeliveryFailed
        ? 'User account created, but the setup email could not be delivered. Check the email provider configuration and resend verification.'
        : 'User account created and setup email sent.'
      : 'User account created.';

    return NextResponse.json({
      success: true,
      message,
      data: {
        ...created,
        setupEmailSent: Boolean(setupEmail?.emailDelivered),
        setupEmailProvider: setupEmail?.emailProvider,
        setupEmailDeliveryError: setupEmail?.emailDeliveryError,
        verificationUrl: process.env.NODE_ENV === 'production' ? undefined : setupEmail?.verificationUrl,
      },
    } as ApiResponse<typeof created & Record<string, unknown>>, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return jsonError('An account with this email or staff ID already exists', 409);
    }

    console.error('System user create error:', error);
    return jsonError('Unable to create user account', 500);
  }
}

export async function PATCH(request: NextRequest) {
  const { session, response } = requireSystemAdmin(request);
  if (response) return response;

  const body = await request.json();
  const parsed = userUpdateSchema.safeParse({
    ...body,
    userId: Number(body.userId),
    departmentId: nullableNumber(body.departmentId),
    facultyId: nullableNumber(body.facultyId),
    currentRank: body.currentRank === '' ? null : body.currentRank,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Validation failed' } as ApiResponse<null>,
      { status: 400 }
    );
  }

  const current = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    include: { departmentRef: true, faculty: true },
  });

  if (!current) {
    return jsonError('User not found', 404);
  }

  if (parsed.data.userId === session!.userId && parsed.data.isActive === false) {
    return jsonError('You cannot deactivate your own active administrator session');
  }

  const nextRole = parsed.data.role ?? current.role;
  const nextActive = parsed.data.isActive ?? current.isActive;

  if (current.role === Role.SYSTEM_ADMIN && (nextRole !== Role.SYSTEM_ADMIN || !nextActive)) {
    const otherActiveAdmins = await prisma.user.count({
      where: {
        id: { not: current.id },
        role: Role.SYSTEM_ADMIN,
        isActive: true,
      },
    });

    if (otherActiveAdmins === 0) {
      return jsonError('At least one active System Admin account must remain.');
    }
  }

  const mapping = await resolveInstitutionMapping({
    facultyId: parsed.data.facultyId,
    departmentId: parsed.data.departmentId,
  });
  if (mapping.response) return mapping.response;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: parsed.data.userId },
      data: {
        role: parsed.data.role,
        isActive: parsed.data.isActive,
        departmentId: parsed.data.departmentId,
        department: mapping.department?.name || (parsed.data.departmentId === null ? null : undefined),
        facultyId: parsed.data.departmentId === undefined && parsed.data.facultyId === undefined ? undefined : mapping.facultyId,
        currentRank: parsed.data.currentRank,
        phone: parsed.data.phone,
      },
      select: userRecordSelect,

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
