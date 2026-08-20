const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const LEGACY_FIXTURE = {
  email: 'benjamin.baidoo@live.gctu.edu.gh',
  staffId: 'GCTU-BB-001',
  markerAction: 'defence_demo.application_prepared',
};
const ROLE_ACCOUNTS = [
  ['Computer Science HOD', 'hod.dean@live.gctu.edu.gh', 'HOD_DEAN'],
  ['FoCIS Dean', 'dean.focis@live.gctu.edu.gh', 'HOD_DEAN'],
  ['HR Administrator', 'hr.admin@live.gctu.edu.gh', 'HR_ADMIN'],
  ['Committee Reviewer', 'committee.reviewer@live.gctu.edu.gh', 'COMMITTEE_REVIEWER'],
  ['System Administrator', 'system.admin@live.gctu.edu.gh', 'SYSTEM_ADMIN'],
];

async function requireInstitutionalSetup(client) {
  const emails = ROLE_ACCOUNTS.map(([, email]) => email);
  const users = await client.user.findMany({
    where: { email: { in: emails } },
    select: {
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      onboarded: true,
      isActive: true,
    },
  });
  const byEmail = new Map(users.map((user) => [user.email, user]));

  for (const [name, email, role] of ROLE_ACCOUNTS) {
    const user = byEmail.get(email);
    if (!user) throw new Error(`Missing ${name} account (${email}). Run npm run db:seed first.`);
    if (user.role !== role) throw new Error(`${email} has role ${user.role}; expected ${role}.`);
    if (!user.emailVerified || !user.onboarded || !user.isActive) {
      throw new Error(`${email} is not verified, onboarded, and active.`);
    }
  }

  const [facultyCount, departmentCount, criteriaCount] = await Promise.all([
    client.faculty.count(),
    client.department.count(),
    client.promotionCriteria.count({ where: { isActive: true } }),
  ]);

  if (facultyCount < 3 || departmentCount < 14 || criteriaCount < 3) {
    throw new Error(
      `Institutional setup is incomplete: ${facultyCount} faculties, ${departmentCount} departments, ${criteriaCount} active criteria.`
    );
  }

  return { facultyCount, departmentCount, criteriaCount };
}

async function findLegacyFixture(client) {
  const user = await client.user.findUnique({
    where: { email: LEGACY_FIXTURE.email },
    select: {
      id: true,
      name: true,
      role: true,
      staffId: true,
      _count: { select: { lecturerRequests: true } },
    },
  });

  if (!user) return null;

  const markerCount = await client.auditLog.count({
    where: { actorId: user.id, action: LEGACY_FIXTURE.markerAction },
  });
  const isFixture = user.role === 'LECTURER'
    && user.staffId === LEGACY_FIXTURE.staffId
    && markerCount > 0;

  return { ...user, markerCount, isFixture };
}

async function removeLegacyFixture() {
  const fixture = await findLegacyFixture(prisma);
  if (!fixture || !fixture.isFixture) {
    return {
      removed: false,
      reason: fixture
        ? 'The former demonstration email belongs to a non-fixture account and was left untouched.'
        : 'No legacy lecturer fixture was present.',
    };
  }

  await prisma.$transaction(async (client) => {
    await client.auditLog.deleteMany({
      where: {
        OR: [
          { actorId: fixture.id },
          { entityType: 'User', entityId: String(fixture.id) },
        ],
      },
    });
    await client.promotionRequest.deleteMany({ where: { lecturerId: fixture.id } });
    await client.user.delete({ where: { id: fixture.id } });
  }, { timeout: 120000 });

  return {
    removed: true,
    name: fixture.name,
    email: LEGACY_FIXTURE.email,
    requestCount: fixture._count.lecturerRequests,
  };
}

function emailMode() {
  const provider = String(process.env.EMAIL_PROVIDER || 'development').trim().toLowerCase();
  if (provider === 'resend') {
    return {
      provider,
      realDeliveryReady: Boolean(process.env.RESEND_API_KEY && (process.env.EMAIL_FROM || process.env.SMTP_FROM)),
    };
  }
  return { provider, realDeliveryReady: false };
}

async function readiness() {
  const structure = await requireInstitutionalSetup(prisma);
  const [lecturers, legacyFixture, fixtureMarkers] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'LECTURER' },
      select: { name: true, email: true, emailVerified: true, onboarded: true },
      orderBy: { createdAt: 'asc' },
    }),
    findLegacyFixture(prisma),
    prisma.auditLog.count({ where: { action: { startsWith: 'defence_demo.' } } }),
  ]);

  if (legacyFixture?.isFixture || fixtureMarkers > 0) {
    throw new Error('Legacy representative lecturer data remains. Run npm run defence:prepare.');
  }

  return { structure, lecturers, email: emailMode() };
}

function printReadiness(result) {
  console.log('Registration-first defence setup is ready.');
  console.log(`Institutional setup: ${result.structure.facultyCount} faculties, ${result.structure.departmentCount} departments, ${result.structure.criteriaCount} active criteria.`);
  console.log(`Pre-created staff-role accounts: ${ROLE_ACCOUNTS.length}.`);
  console.log(`Self-registered lecturer accounts currently present: ${result.lecturers.length}.`);
  console.log(`Email provider: ${result.email.provider}.`);
  if (result.email.realDeliveryReady) {
    console.log('Real verification-email delivery is configured.');
  } else {
    console.log('Real inbox delivery is not configured; the local check-email screen will expose a clearly labelled verification action.');
  }
  console.log('Create the defence lecturer through http://localhost:3000/register, verify the email, complete onboarding, and start the application in the lecturer portal.');
}

async function main() {
  if (!process.argv.includes('--check')) {
    await requireInstitutionalSetup(prisma);
    const removal = await removeLegacyFixture();
    if (removal.removed) {
      console.log(`Removed legacy lecturer fixture: ${removal.name} <${removal.email}> and ${removal.requestCount} promotion applications.`);
    } else {
      console.log(removal.reason);
    }
  }

  const result = await readiness();
  printReadiness(result);
}

main()
  .catch((error) => {
    console.error('Defence registration setup failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });