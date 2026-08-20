const bcrypt = require('bcrypt');
const { PrismaClient, RecordVerificationState, Role, StaffAccessRole } = require('@prisma/client');

const prisma = new PrismaClient();
const DEMO_PASSWORD = process.argv.find((arg) => arg.startsWith('--password='))?.split('=')[1] || 'Applicant123!';
const resetOnly = process.argv.includes('--reset-only');
const seedOnly = process.argv.includes('--seed-only');

const demoStaff = [
  {
    firstName: 'Benjamin',
    lastName: 'Baidoo',
    staffNumber: '4231230141',
    email: '4231230141@live.gctu.edu.gh',
    category: 'ACADEMIC_SENIOR_MEMBER',
    rankCode: 'LECTURER',
    organizationUnitCode: 'FOCIS-CS',
    positionTitle: 'Lecturer',
    employmentStartedAt: '2017-09-01',
    rankStartedAt: '2018-09-01',
    assignmentStartedAt: '2018-09-01',
    retirementDate: '2045-12-31',
    sourceRecordId: 'DEMO-SCHEDULE-J-001',
    appointmentRef: 'DEMO/APPT/ACADEMIC/001',
    notes: 'Demo applicant for Schedule J academic promotion testing.',
  },
  {
    firstName: 'Sucess',
    lastName: 'Likem',
    staffNumber: '4231230154',
    email: '4231230154@live.gctu.edu.gh',
    category: 'ADMINISTRATIVE_SENIOR_MEMBER',
    rankCode: 'JUNIOR_ASSISTANT_REGISTRAR',
    organizationUnitCode: 'REGISTRY',
    positionTitle: 'Junior Assistant Registrar',
    employmentStartedAt: '2020-08-01',
    rankStartedAt: '2021-08-01',
    assignmentStartedAt: '2021-08-01',
    retirementDate: '2046-12-31',
    sourceRecordId: 'DEMO-SCHEDULE-K-ADMIN-001',
    appointmentRef: 'DEMO/APPT/REGISTRY/001',
    notes: 'Demo applicant for Schedule K administrative senior member promotion testing.',
  },
  {
    firstName: 'Esther',
    lastName: 'Appiah',
    staffNumber: '4231231237',
    email: '4231231237@live.gctu.edu.gh',
    category: 'PROFESSIONAL_SENIOR_MEMBER',
    rankCode: 'ACCOUNTANT',
    organizationUnitCode: 'FINANCE',
    positionTitle: 'Accountant',
    employmentStartedAt: '2018-01-15',
    rankStartedAt: '2020-01-15',
    assignmentStartedAt: '2020-01-15',
    retirementDate: '2048-12-31',
    sourceRecordId: 'DEMO-SCHEDULE-K-PROF-001',
    appointmentRef: 'DEMO/APPT/FINANCE/001',
    notes: 'Demo applicant for Schedule K professional senior member promotion testing.',
  },
];

function dateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function currentRankForLegacy(rankCode) {
  return ['ASSISTANT_LECTURER', 'LECTURER', 'SENIOR_LECTURER', 'ASSOCIATE_PROFESSOR', 'PROFESSOR'].includes(rankCode)
    ? rankCode
    : null;
}

async function resetDemoApplicants() {
  const emails = demoStaff.map((staff) => staff.email);
  const staffNumbers = demoStaff.map((staff) => staff.staffNumber);
  const users = await prisma.user.findMany({
    where: { OR: [{ email: { in: emails } }, { staffId: { in: staffNumbers } }] },
    select: { id: true, email: true },
  });
  const userIds = users.map((user) => user.id);

  const staffMembers = await prisma.staffMember.findMany({
    where: { OR: [{ staffNumber: { in: staffNumbers } }, { officialEmail: { in: emails } }, userIds.length ? { userId: { in: userIds } } : undefined].filter(Boolean) },
    select: { id: true, userId: true },
  });
  for (const staffMember of staffMembers) {
    if (staffMember.userId && !userIds.includes(staffMember.userId)) userIds.push(staffMember.userId);
  }

  const requests = await prisma.promotionRequest.findMany({
    where: {
      OR: [
        userIds.length ? { lecturerId: { in: userIds } } : undefined,
        userIds.length ? { applicantId: { in: userIds } } : undefined,
        userIds.length ? { requestedById: { in: userIds } } : undefined,
        { adminComment: { contains: 'DEMO_PROMOTION_INSTANCE' } },
      ].filter(Boolean),
    },
    select: { id: true },
  });
  const requestIds = requests.map((request) => request.id);

  if (requestIds.length) await prisma.promotionRequest.deleteMany({ where: { id: { in: requestIds } } });
  if (userIds.length) {
    await prisma.appealCase.deleteMany({ where: { OR: [{ filedById: { in: userIds } }, { decisionById: { in: userIds } }] } });
    await prisma.promotionAssessment.deleteMany({ where: { assessorId: { in: userIds } } });
    await prisma.reviewComment.deleteMany({ where: { reviewerId: { in: userIds } } });
    await prisma.verification.deleteMany({ where: { verifierId: { in: userIds } } });
    await prisma.statusHistory.deleteMany({ where: { changedById: { in: userIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.document.updateMany({ where: { uploadedById: { in: userIds } }, data: { uploadedById: null } });
    await prisma.document.updateMany({ where: { verifiedById: { in: userIds } }, data: { verifiedById: null } });
    await prisma.promotionRequest.updateMany({ where: { applicantId: { in: userIds } }, data: { applicantId: null } });
    await prisma.promotionRequest.updateMany({ where: { requestedById: { in: userIds } }, data: { requestedById: null } });
    await prisma.promotionRequest.updateMany({ where: { reviewedById: { in: userIds } }, data: { reviewedById: null } });
    await prisma.auditLog.updateMany({ where: { actorId: { in: userIds } }, data: { actorId: null } });
  }
  if (staffMembers.length) await prisma.staffMember.deleteMany({ where: { id: { in: staffMembers.map((staffMember) => staffMember.id) } } });
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  return { users: users.length, staffMembers: staffMembers.length, promotionRequests: requestIds.length };
}

async function seedDemoApplicants() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const created = [];
  const now = new Date();

  for (const staff of demoStaff) {
    const [rank, unit] = await Promise.all([
      prisma.rankDefinition.findUnique({ where: { code: staff.rankCode } }),
      prisma.organizationUnit.findUnique({ where: { code: staff.organizationUnitCode } }),
    ]);
    if (!rank || !rank.isActive) throw new Error(`Missing active rank ${staff.rankCode}`);
    if (!unit || !unit.isActive) throw new Error(`Missing active organization unit ${staff.organizationUnitCode}`);
    if (rank.category !== staff.category) throw new Error(`${staff.rankCode} does not belong to ${staff.category}`);

    const legacyDepartment = unit.type === 'DEPARTMENT'
      ? await prisma.department.findUnique({ where: { name: unit.name } })
      : null;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: `${staff.firstName} ${staff.lastName}`,
          email: staff.email,
          password: passwordHash,
          passwordHash,
          role: Role.STAFF,
          staffId: staff.staffNumber,
          department: legacyDepartment ? legacyDepartment.name : null,
          departmentId: legacyDepartment ? legacyDepartment.id : null,
          facultyId: legacyDepartment ? legacyDepartment.facultyId : null,
          currentRank: currentRankForLegacy(staff.rankCode),
          emailVerified: true,
          emailVerifiedAt: now,
          onboarded: true,
          isActive: true,
        },
      });

      const staffMember = await tx.staffMember.create({
        data: {
          userId: user.id,
          staffNumber: staff.staffNumber,
          officialEmail: staff.email,
          category: staff.category,
          employmentStatus: 'ACTIVE',
          employmentStartedAt: dateOnly(staff.employmentStartedAt),
          retirementDate: dateOnly(staff.retirementDate),
          authoritativeSource: 'HRODD_DEMO_SEED',
          sourceRecordId: staff.sourceRecordId,
          verificationState: RecordVerificationState.VERIFIED,
          recordVerifiedAt: now,
        },
      });

      const rankHistory = await tx.staffRankHistory.create({
        data: {
          staffMemberId: staffMember.id,
          rankId: rank.id,
          startedAt: dateOnly(staff.rankStartedAt),
          appointmentRef: staff.appointmentRef,
          authoritativeSource: 'HRODD_DEMO_SEED',
          verificationState: RecordVerificationState.VERIFIED,
          verifiedAt: now,
          notes: staff.notes,
        },
      });

      const assignment = await tx.staffOrganizationAssignment.create({
        data: {
          staffMemberId: staffMember.id,
          organizationUnitId: unit.id,
          positionTitle: staff.positionTitle,
          isPrimary: true,
          startedAt: dateOnly(staff.assignmentStartedAt),
          verificationState: RecordVerificationState.VERIFIED,
        },
      });

      await tx.staffAccessAssignment.create({
        data: {
          staffMemberId: staffMember.id,
          role: StaffAccessRole.APPLICANT,
          organizationUnitId: unit.id,
          startedAt: now,
          appointingAuthority: 'HRODD_DEMO_SEED',
          sourceReference: staff.sourceRecordId,
          verificationState: RecordVerificationState.VERIFIED,
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Demo staff access ready',
          message: 'This verified HRODD demo account is ready for promotion workflow testing.',
          type: 'INFO',
        },
      });

      return { user, staffMember, rankHistory, assignment, rank, unit };
    });

    created.push({
      name: result.user.name,
      email: result.user.email,
      password: DEMO_PASSWORD,
      staffNumber: result.staffMember.staffNumber,
      category: staff.category,
      currentRank: result.rank.name,
      organizationUnit: result.unit.name,
      routeDemo: staff.notes,
    });
  }

  return created;
}

async function main() {
  await prisma.$connect();
  let resetResult = null;
  if (!seedOnly) {
    resetResult = await resetDemoApplicants();
    console.log(`Demo reset complete: removed ${resetResult.users} user(s), ${resetResult.staffMembers} staff record(s), ${resetResult.promotionRequests} promotion request(s).`);
  }

  if (!resetOnly) {
    const created = await seedDemoApplicants();
    console.log('Demo promotion applicants created and activated.');
    console.table(created);
  }
}

main()
  .catch((error) => {
    console.error('Demo promotion instance script failed.');
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });