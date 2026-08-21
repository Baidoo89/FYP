import { NextRequest, NextResponse } from 'next/server';
import { Prisma, RecordVerificationState, Role, StaffAccessRole } from '@prisma/client';
import { getAuthSession } from '../../../../../lib/auth';
import { writeAuditLog } from '../../../../../lib/audit-logger';
import { canExposeLocalVerificationUrl } from '../../../../../lib/local-verification';
import { WORKFLOW_TRANSACTION_OPTIONS, prisma } from '../../../../../lib/prisma';
import { sendStaffActivationEmail } from '../../../../../lib/staff-activation';
import { staffProvisionSchema } from '../../../../../lib/validation/staff-provision.schema';
import { isV2FoundationUnavailable, V2_FOUNDATION_NOT_READY } from '../../../../../lib/v2-foundation-status';

const ACADEMIC_LEGACY_RANKS = new Set([
  'ASSISTANT_LECTURER',
  'LECTURER',
  'SENIOR_LECTURER',
  'ASSOCIATE_PROFESSOR',
  'PROFESSOR',
]);

class ProvisioningError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function optional(value?: string | null) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

function fullName(firstName: string, middleName: string | null | undefined, lastName: string) {
  return [firstName, middleName, lastName].map((part) => String(part || '').trim()).filter(Boolean).join(' ');
}

export async function POST(request: NextRequest) {
  const session = getAuthSession(request);
  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== Role.HR_ADMIN) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const parsed = staffProvisionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid staff record.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const employmentStartedAt = dateOnly(input.employmentStartedAt);
    const rankStartedAt = dateOnly(input.rankStartedAt);
    const assignmentStartedAt = dateOnly(input.assignmentStartedAt);
    const retirementDate = dateOnly(input.retirementDate);
    const now = new Date();

    if (rankStartedAt < employmentStartedAt) {
      throw new ProvisioningError('Rank start date cannot be earlier than employment start date.');
    }
    if (assignmentStartedAt < employmentStartedAt) {
      throw new ProvisioningError('Assignment start date cannot be earlier than employment start date.');
    }
    if (retirementDate <= now || retirementDate <= rankStartedAt) {
      throw new ProvisioningError('Retirement date must be later than today and the verified rank start date.');
    }

    const [rank, organizationUnit] = await Promise.all([
      prisma.rankDefinition.findUnique({ where: { code: input.rankCode } }),
      prisma.organizationUnit.findUnique({ where: { code: input.organizationUnitCode } }),
    ]);
    if (!rank || !rank.isActive) throw new ProvisioningError('Selected rank is not active in the policy catalogue.');
    if (rank.category !== input.category) throw new ProvisioningError('Selected rank does not belong to the selected staff category.');
    if (!organizationUnit || !organizationUnit.isActive) throw new ProvisioningError('Selected organization unit is not active.');

    const legacyDepartment = organizationUnit.type === 'DEPARTMENT'
      ? await prisma.department.findUnique({ where: { name: organizationUnit.name } })
      : null;

    const provisioned = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: fullName(input.firstName, input.middleName, input.lastName),
          email: input.officialEmail,
          role: Role.STAFF,
          staffId: input.staffNumber,
          password: null,
          passwordHash: null,
          emailVerified: false,
          onboarded: true,
          isActive: true,
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

      const staffMember = await tx.staffMember.create({
        data: {
          userId: user.id,
          staffNumber: input.staffNumber,
          officialEmail: input.officialEmail,
          category: input.category,
          employmentStatus: input.employmentStatus,
          employmentStartedAt,
          retirementDate,
          authoritativeSource: 'HRODD',
          sourceRecordId: optional(input.sourceRecordId),
          verificationState: RecordVerificationState.VERIFIED,
          recordVerifiedAt: now,
        },
      });

      const rankHistory = await tx.staffRankHistory.create({
        data: {
          staffMemberId: staffMember.id,
          rankId: rank.id,
          startedAt: rankStartedAt,
          appointmentRef: optional(input.appointmentRef),
          authoritativeSource: 'HRODD',
          verificationState: RecordVerificationState.VERIFIED,
          verifiedAt: now,
          notes: optional(input.notes),
        },
      });
      const assignment = await tx.staffOrganizationAssignment.create({
        data: {
          staffMemberId: staffMember.id,
          organizationUnitId: organizationUnit.id,
          positionTitle: optional(input.positionTitle),
          isPrimary: true,
          startedAt: assignmentStartedAt,
          verificationState: RecordVerificationState.VERIFIED,
        },
      });

      const applicantAccess = await tx.staffAccessAssignment.create({
        data: {
          staffMemberId: staffMember.id,
          role: StaffAccessRole.APPLICANT,
          organizationUnitId: organizationUnit.id,
          startedAt: now,
          appointingAuthority: 'HRODD',
          sourceReference: optional(input.sourceRecordId) || optional(input.appointmentRef),
          verificationState: RecordVerificationState.VERIFIED,
        },
      });

      await writeAuditLog(tx, {
        actorId: session.userId,
        action: 'STAFF_ACCESS_PROVISIONED',
        entityType: 'StaffMember',
        entityId: staffMember.id,
        description: `HRODD provisioned verified staff access for ${user.email}.`,
        metadata: {
          userId: user.id,
          staffNumber: input.staffNumber,
          category: input.category,
          rankCode: rank.code,
          rankHistoryId: rankHistory.id,
          organizationUnitCode: organizationUnit.code,
          assignmentId: assignment.id,
          accessAssignmentId: applicantAccess.id,
        },
      });

      return { user, staffMember, rank, organizationUnit };
    }, WORKFLOW_TRANSACTION_OPTIONS);

    const invitation = await sendStaffActivationEmail(provisioned.user);
    return NextResponse.json({
      success: true,
      message: invitation.emailDeliveryError
        ? 'Staff record created, but the activation email could not be delivered.'
        : invitation.emailDelivered
          ? 'Verified staff record created and activation email sent.'
          : 'Verified staff record created. Use the local activation link for this development setup.',
      data: {
        userId: provisioned.user.id,
        staffMemberId: provisioned.staffMember.id,
        name: provisioned.user.name,
        email: provisioned.user.email,
        staffNumber: provisioned.staffMember.staffNumber,
        category: provisioned.staffMember.category,
        rank: { code: provisioned.rank.code, name: provisioned.rank.name },
        organizationUnit: { code: provisioned.organizationUnit.code, name: provisioned.organizationUnit.name },
        emailDelivered: invitation.emailDelivered,
        emailDeliveryFailed: Boolean(invitation.emailDeliveryError),
        activationUrl: canExposeLocalVerificationUrl(request, invitation.emailProvider) ? invitation.activationUrl : undefined,
      },
    }, { status: 201 });
  } catch (error) {
    if (isV2FoundationUnavailable(error)) {
      return NextResponse.json(
        { success: false, error: 'The V2 staff-record foundation has not been deployed to the database yet.', code: V2_FOUNDATION_NOT_READY },
        { status: 503 },
      );
    }
    if (error instanceof ProvisioningError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'That official email or staff number is already linked to a staff account.' },
        { status: 409 },
      );
    }
    console.error('HRODD staff provisioning error:', error);
    return NextResponse.json({ success: false, error: 'Unable to provision verified staff access.' }, { status: 500 });
  }
}
