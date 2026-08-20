import { NextRequest, NextResponse } from 'next/server';
import { NotificationType, Prisma, RecordVerificationState, Role, StaffAccessRole, StaffCategory } from '@prisma/client';
import { getAuthSession } from '../../../../../lib/auth';
import { isApplicantAccountRole } from '../../../../../lib/access-roles';
import { writeAuditLog } from '../../../../../lib/audit-logger';
import { WORKFLOW_TRANSACTION_OPTIONS, prisma } from '../../../../../lib/prisma';
import { staffRecordVerificationSchema } from '../../../../../lib/validation/staff-record.schema';
import { isV2FoundationUnavailable, V2_FOUNDATION_NOT_READY } from '../../../../../lib/v2-foundation-status';
import type { ApiResponse } from '../../../../../types';

const ACADEMIC_LEGACY_RANKS = new Set([
  'ASSISTANT_LECTURER',
  'LECTURER',
  'SENIOR_LECTURER',
  'ASSOCIATE_PROFESSOR',
  'PROFESSOR',
]);

const staffRecordInclude = {
  rankHistory: {
    where: { endedAt: null },
    include: { rank: true },
    orderBy: { startedAt: 'desc' as const },
  },
  organizationAssignments: {
    where: { endedAt: null, isPrimary: true },
    include: { organizationUnit: { include: { parent: true } } },
    orderBy: { startedAt: 'desc' as const },
  },
};

class StaffRecordError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function requireHrodd(request: NextRequest) {
  const session = getAuthSession(request);
  if (!session || session.legacy) {
    return { session: null, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  if ((session.role as Role) !== Role.HR_ADMIN && (session.role as Role) !== Role.SYSTEM_ADMIN) {
    return { session: null, response: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return { session, response: null };
}

function foundationUnavailableResponse() {
  return NextResponse.json(
    {
      success: false,
      error: 'The V2 staff-record foundation has not been deployed to the database yet.',
      code: V2_FOUNDATION_NOT_READY,
    },
    { status: 503 },
  );
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function normalizeOptional(value?: string | null) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

function verificationWhere(value: string | null): Prisma.UserWhereInput {
  if (value === 'UNVERIFIED') return { staffMember: { is: null } };
  if (['PENDING', 'VERIFIED', 'DISPUTED', 'SUPERSEDED'].includes(String(value))) {
    return { staffMember: { is: { verificationState: value as RecordVerificationState } } };
  }
  return {};
}

function categoryWhere(value: string | null): Prisma.UserWhereInput {
  if (!value || !Object.values(StaffCategory).includes(value as StaffCategory)) return {};
  return { staffMember: { is: { category: value as StaffCategory } } };
}

function serializeUser(user: any) {
  const staffMember = user.staffMember || null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    staffId: user.staffId,
    department: user.departmentRef?.name || user.department || null,
    faculty: user.faculty?.name || user.departmentRef?.faculty?.name || null,
    legacyCurrentRank: user.currentRank,
    onboarded: user.onboarded,
    isActive: user.isActive,
    createdAt: user.createdAt,
    verificationState: staffMember?.verificationState || 'UNVERIFIED',
    staffMember: staffMember
      ? {
          id: staffMember.id,
          staffNumber: staffMember.staffNumber,
          officialEmail: staffMember.officialEmail,
          category: staffMember.category,
          employmentStatus: staffMember.employmentStatus,
          employmentStartedAt: staffMember.employmentStartedAt,
          retirementDate: staffMember.retirementDate,
          sourceRecordId: staffMember.sourceRecordId,
          recordVerifiedAt: staffMember.recordVerifiedAt,
          currentRank: staffMember.rankHistory?.[0] || null,
          primaryAssignment: staffMember.organizationAssignments?.[0] || null,
        }
      : null,
  };
}

export async function GET(request: NextRequest) {
  const { response } = requireHrodd(request);
  if (response) return response;

  const search = request.nextUrl.searchParams.get('search')?.trim() || '';
  const state = request.nextUrl.searchParams.get('state');
  const category = request.nextUrl.searchParams.get('category');
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1);
  const pageSize = Math.min(50, Math.max(10, Number(request.nextUrl.searchParams.get('pageSize')) || 20));

  const where: Prisma.UserWhereInput = {
    role: { in: [Role.STAFF, Role.LECTURER] },
    AND: [verificationWhere(state), categoryWhere(category)],
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { staffId: { contains: search, mode: 'insensitive' } },
            { staffMember: { is: { staffNumber: { contains: search, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };

  try {
    const [users, filteredCount, total, unverified, pending, verified, disputed, ranks, organizationUnits] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          departmentRef: { include: { faculty: true } },
          faculty: true,
          staffMember: { include: staffRecordInclude },
        },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { role: { in: [Role.STAFF, Role.LECTURER] } } }),
      prisma.user.count({ where: { role: { in: [Role.STAFF, Role.LECTURER] }, staffMember: { is: null } } }),
      prisma.staffMember.count({ where: { user: { role: { in: [Role.STAFF, Role.LECTURER] } }, verificationState: RecordVerificationState.PENDING } }),
      prisma.staffMember.count({ where: { user: { role: { in: [Role.STAFF, Role.LECTURER] } }, verificationState: RecordVerificationState.VERIFIED } }),
      prisma.staffMember.count({ where: { user: { role: { in: [Role.STAFF, Role.LECTURER] } }, verificationState: RecordVerificationState.DISPUTED } }),
      prisma.rankDefinition.findMany({ where: { isActive: true }, orderBy: [{ category: 'asc' }, { family: 'asc' }, { level: 'asc' }, { name: 'asc' }] }),
      prisma.organizationUnit.findMany({ where: { isActive: true }, include: { parent: true }, orderBy: [{ type: 'asc' }, { name: 'asc' }] }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        records: users.map(serializeUser),
        options: { ranks, organizationUnits, categories: Object.values(StaffCategory) },
        metrics: { total, unverified, pending, verified, disputed },
        pagination: { page, pageSize, total: filteredCount, totalPages: Math.max(1, Math.ceil(filteredCount / pageSize)) },
      },
    } as ApiResponse<unknown>);
  } catch (error) {
    if (isV2FoundationUnavailable(error)) return foundationUnavailableResponse();
    console.error('HRODD staff records load error:', error);
    return NextResponse.json({ success: false, error: 'Unable to load authoritative staff records.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { session, response } = requireHrodd(request);
  if (response) return response;

  const body = await request.json();
  const parsed = staffRecordVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid staff record.', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const employmentStartedAt = dateOnly(input.employmentStartedAt);
  const retirementDate = dateOnly(input.retirementDate);
  const rankStartedAt = dateOnly(input.rankStartedAt);
  const assignmentStartedAt = dateOnly(input.assignmentStartedAt);
  const now = new Date();

  if (employmentStartedAt > rankStartedAt) {
    return NextResponse.json({ success: false, error: 'Rank start date cannot be earlier than employment start date.' }, { status: 400 });
  }
  if (retirementDate <= rankStartedAt || retirementDate <= now) {
    return NextResponse.json({ success: false, error: 'Retirement date must be later than the verified rank start date and today.' }, { status: 400 });
  }

  try {
    const [user, rank, organizationUnit] = await Promise.all([
      prisma.user.findUnique({ where: { id: input.userId }, include: { staffMember: true } }),
      prisma.rankDefinition.findUnique({ where: { code: input.rankCode } }),
      prisma.organizationUnit.findUnique({ where: { code: input.organizationUnitCode }, include: { parent: true } }),
    ]);

    if (!user || !isApplicantAccountRole(user.role) || !user.isActive) throw new StaffRecordError('Active applicant account not found.', 404);
    if (!user.emailVerified) throw new StaffRecordError('The applicant must verify the official GCTU email before HRODD verification.');
    if (!rank || !rank.isActive) throw new StaffRecordError('Selected rank is not active in the policy catalogue.');
    if (rank.category !== input.category) throw new StaffRecordError('Selected rank does not belong to the selected staff category.');
    if (!organizationUnit || !organizationUnit.isActive) throw new StaffRecordError('Selected organization unit is not active.');

    const result = await prisma.$transaction(async (tx) => {
      const staffMember = await tx.staffMember.upsert({
        where: { userId: user.id },
        update: {
          staffNumber: input.staffNumber,
          officialEmail: user.email.toLowerCase(),
          category: input.category,
          employmentStatus: input.employmentStatus,
          employmentStartedAt,
          retirementDate,
          authoritativeSource: 'HRODD',
          sourceRecordId: normalizeOptional(input.sourceRecordId),
          verificationState: RecordVerificationState.VERIFIED,
          recordVerifiedAt: now,
        },
        create: {
          userId: user.id,
          staffNumber: input.staffNumber,
          officialEmail: user.email.toLowerCase(),
          category: input.category,
          employmentStatus: input.employmentStatus,
          employmentStartedAt,
          retirementDate,
          authoritativeSource: 'HRODD',
          sourceRecordId: normalizeOptional(input.sourceRecordId),
          verificationState: RecordVerificationState.VERIFIED,
          recordVerifiedAt: now,
        },
      });

      let applicantAccess = await tx.staffAccessAssignment.findFirst({
        where: { staffMemberId: staffMember.id, role: StaffAccessRole.APPLICANT, endedAt: null },
      });
      if (!applicantAccess) {
        applicantAccess = await tx.staffAccessAssignment.create({
          data: {
            staffMemberId: staffMember.id,
            role: StaffAccessRole.APPLICANT,
            organizationUnitId: organizationUnit.id,
            startedAt: now,
            appointingAuthority: 'HRODD',
            sourceReference: normalizeOptional(input.sourceRecordId) || normalizeOptional(input.appointmentRef),
            verificationState: RecordVerificationState.VERIFIED,
          },
        });
      }

      const activeRanks = await tx.staffRankHistory.findMany({
        where: { staffMemberId: staffMember.id, endedAt: null },
        orderBy: { startedAt: 'desc' },
      });
      const matchingRank = activeRanks.find((item) => item.rankId === rank.id) || null;
      let rankHistory;

      if (matchingRank) {
        rankHistory = await tx.staffRankHistory.update({
          where: { id: matchingRank.id },
          data: {
            startedAt: rankStartedAt,
            appointmentRef: normalizeOptional(input.appointmentRef),
            authoritativeSource: 'HRODD',
            verificationState: RecordVerificationState.VERIFIED,
            verifiedAt: now,
            notes: normalizeOptional(input.notes),
          },
        });
        await tx.staffRankHistory.updateMany({
          where: { staffMemberId: staffMember.id, endedAt: null, id: { not: matchingRank.id } },
          data: { endedAt: rankStartedAt, verificationState: RecordVerificationState.SUPERSEDED },
        });
      } else {
        const latestActiveRank = activeRanks[0];
        if (latestActiveRank && rankStartedAt <= latestActiveRank.startedAt) {
          throw new StaffRecordError('A replacement rank must start after the current active rank. Correct the active record instead.');
        }
        await tx.staffRankHistory.updateMany({
          where: { staffMemberId: staffMember.id, endedAt: null },
          data: { endedAt: rankStartedAt, verificationState: RecordVerificationState.SUPERSEDED },
        });
        rankHistory = await tx.staffRankHistory.create({
          data: {
            staffMemberId: staffMember.id,
            rankId: rank.id,
            startedAt: rankStartedAt,
            appointmentRef: normalizeOptional(input.appointmentRef),
            authoritativeSource: 'HRODD',
            verificationState: RecordVerificationState.VERIFIED,
            verifiedAt: now,
            notes: normalizeOptional(input.notes),
          },
        });
      }

      const activeAssignments = await tx.staffOrganizationAssignment.findMany({
        where: { staffMemberId: staffMember.id, endedAt: null, isPrimary: true },
        orderBy: { startedAt: 'desc' },
      });
      const matchingAssignment = activeAssignments.find((item) => item.organizationUnitId === organizationUnit.id) || null;
      let assignment;

      if (matchingAssignment) {
        assignment = await tx.staffOrganizationAssignment.update({
          where: { id: matchingAssignment.id },
          data: {
            startedAt: assignmentStartedAt,
            positionTitle: normalizeOptional(input.positionTitle),
            isPrimary: true,
            verificationState: RecordVerificationState.VERIFIED,
          },
        });
        await tx.staffOrganizationAssignment.updateMany({
          where: { staffMemberId: staffMember.id, endedAt: null, isPrimary: true, id: { not: matchingAssignment.id } },
          data: { endedAt: assignmentStartedAt, isPrimary: false, verificationState: RecordVerificationState.SUPERSEDED },
        });
      } else {
        const latestAssignment = activeAssignments[0];
        if (latestAssignment && assignmentStartedAt <= latestAssignment.startedAt) {
          throw new StaffRecordError('A replacement primary assignment must start after the current assignment.');
        }
        await tx.staffOrganizationAssignment.updateMany({
          where: { staffMemberId: staffMember.id, endedAt: null, isPrimary: true },
          data: { endedAt: assignmentStartedAt, isPrimary: false, verificationState: RecordVerificationState.SUPERSEDED },
        });
        assignment = await tx.staffOrganizationAssignment.create({
          data: {
            staffMemberId: staffMember.id,
            organizationUnitId: organizationUnit.id,
            positionTitle: normalizeOptional(input.positionTitle),
            isPrimary: true,
            startedAt: assignmentStartedAt,
            verificationState: RecordVerificationState.VERIFIED,
          },
        });
      }

      const legacyDepartment = organizationUnit.type === 'DEPARTMENT'
        ? await tx.department.findUnique({ where: { name: organizationUnit.name } })
        : null;
      await tx.user.update({
        where: { id: user.id },
        data: {
          staffId: input.staffNumber,
          currentRank: ACADEMIC_LEGACY_RANKS.has(rank.code) ? (rank.code as any) : null,
          ...(legacyDepartment
            ? {
                department: legacyDepartment.name,
                departmentId: legacyDepartment.id,
                facultyId: legacyDepartment.facultyId,
              }
            : {}),
        },
      });

      await writeAuditLog(tx, {
        actorId: session!.userId,
        action: 'STAFF_RECORD_VERIFIED',
        entityType: 'StaffMember',
        entityId: staffMember.id,
        description: `HRODD verified the authoritative staff record for ${user.email}.`,
        metadata: {
          userId: user.id,
          staffNumber: input.staffNumber,
          category: input.category,
          rankCode: rank.code,
          rankHistoryId: rankHistory.id,
          organizationUnitCode: organizationUnit.code,
          assignmentId: assignment.id,
          accessAssignmentId: applicantAccess.id,
          retirementDate: input.retirementDate,
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SUCCESS,
          title: 'Staff record verified',
          message: `HRODD verified your ${rank.name} record. Policy-based promotion routes are now available.`,
        },
      });

      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          departmentRef: { include: { faculty: true } },
          faculty: true,
          staffMember: { include: staffRecordInclude },
        },
      });
    }, WORKFLOW_TRANSACTION_OPTIONS);

    return NextResponse.json({
      success: true,
      message: 'Authoritative staff record verified.',
      data: serializeUser(result),
    } as ApiResponse<unknown>);
  } catch (error) {
    if (isV2FoundationUnavailable(error)) return foundationUnavailableResponse();
    if (error instanceof StaffRecordError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'That staff number or official email is already assigned to another staff record.' }, { status: 409 });
    }
    console.error('HRODD staff verification error:', error);
    return NextResponse.json({ success: false, error: 'Unable to verify the authoritative staff record.' }, { status: 500 });
  }
}
