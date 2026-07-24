const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const roleAccountMigrations = [
  {
    from: 'system.admin@gctu.edu.gh',
    to: 'system.admin@live.gctu.edu.gh',
    name: 'System Administrator',
    role: 'SYSTEM_ADMIN',
    staffId: 'GCTU-SYS-001',
  },
  {
    from: 'hr.admin@gctu.edu.gh',
    to: 'hr.admin@live.gctu.edu.gh',
    name: 'HR Administrator',
    role: 'HR_ADMIN',
    staffId: 'GCTU-HR-001',
  },
  {
    from: 'hod.demo@gctu.edu.gh',
    to: 'hod.dean@live.gctu.edu.gh',
    name: 'Prof. Kwame Boateng',
    role: 'HOD_DEAN',
    staffId: 'GCTU-HOD-001',
  },
  {
    from: 'committee.demo@gctu.edu.gh',
    to: 'committee.reviewer@live.gctu.edu.gh',
    name: 'Committee Reviewer',
    role: 'COMMITTEE_REVIEWER',
    staffId: 'GCTU-COM-001',
  },
];

const retiredSeedEmails = ['lecturer.demo@live.gctu.edu.gh'];
const freshStart = process.argv.includes('--fresh-start') || process.env.DELETE_SIGNUP_ACCOUNTS === 'true';

async function migrateRoleAccounts() {
  let migrated = 0;
  let refreshed = 0;

  for (const account of roleAccountMigrations) {
    const legacy = await prisma.user.findUnique({ where: { email: account.from } });
    const official = await prisma.user.findUnique({ where: { email: account.to } });

    const data = {
      email: account.to,
      name: account.name,
      role: account.role,
      staffId: account.staffId,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      onboarded: true,
    };

    if (legacy && official && legacy.id !== official.id) {
      await prisma.user.update({
        where: { id: legacy.id },
        data: {
          email: `archived.${legacy.id}.${account.from}`,
          isActive: false,
        },
      });
      await prisma.user.update({ where: { id: official.id }, data });
      refreshed += 1;
      console.log(`Archived duplicate legacy role account ${account.from} and refreshed ${account.to}`);
      continue;
    }

    if (legacy) {
      await prisma.user.update({ where: { id: legacy.id }, data });
      migrated += 1;
      console.log(`Migrated ${account.from} -> ${account.to}`);
      continue;
    }

    if (official) {
      await prisma.user.update({ where: { id: official.id }, data });
      refreshed += 1;
      console.log(`Refreshed ${account.to}`);
    }
  }

  return { migrated, refreshed };
}

async function deletePromotionRequests(requestIds) {
  if (requestIds.length === 0) return 0;

  const deleted = await prisma.promotionRequest.deleteMany({
    where: { id: { in: requestIds } },
  });

  return deleted.count;
}

async function removeSignupAndSmokeUsers() {
  const accountCleanupFilters = [
    { email: { in: retiredSeedEmails } },
    { email: { startsWith: 'workflow.smoke.' } },
    { staffId: { startsWith: 'SMOKE-' } },
  ];

  if (freshStart) {
    accountCleanupFilters.push({ role: 'LECTURER' });
  }

  const usersToRemove = await prisma.user.findMany({
    where: { OR: accountCleanupFilters },
    select: { id: true, email: true, role: true },
  });

  const userIds = usersToRemove.map((user) => user.id);

  const requestsToRemove = await prisma.promotionRequest.findMany({
    where: {
      OR: [
        userIds.length > 0 ? { lecturerId: { in: userIds } } : undefined,
        { adminComment: { contains: 'DEMO_WORKFLOW' } },
        { adminComment: { contains: 'Workflow smoke' } },
      ].filter(Boolean),
    },
    select: { id: true },
  });

  const deletedRequests = await deletePromotionRequests(requestsToRemove.map((request) => request.id));

  if (userIds.length > 0) {
    await prisma.reviewComment.deleteMany({ where: { reviewerId: { in: userIds } } });
    await prisma.verification.deleteMany({ where: { verifierId: { in: userIds } } });
    await prisma.statusHistory.deleteMany({ where: { changedById: { in: userIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.auditLog.updateMany({ where: { actorId: { in: userIds } }, data: { actorId: null } });
    await prisma.document.updateMany({ where: { uploadedById: { in: userIds } }, data: { uploadedById: null } });
    await prisma.document.updateMany({ where: { verifiedById: { in: userIds } }, data: { verifiedById: null } });
    await prisma.promotionRequest.updateMany({ where: { applicantId: { in: userIds } }, data: { applicantId: null } });
    await prisma.promotionRequest.updateMany({ where: { requestedById: { in: userIds } }, data: { requestedById: null } });
    await prisma.promotionRequest.updateMany({ where: { reviewedById: { in: userIds } }, data: { reviewedById: null } });
  }

  const deletedUsers = userIds.length > 0
    ? await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    : { count: 0 };

  const deletedLegacyAdmins = await prisma.adminAccount.deleteMany({
    where: { username: 'admin' },
  });

  return {
    deletedRequests,
    deletedUsers: deletedUsers.count,
    deletedLegacyAdmins: deletedLegacyAdmins.count,
    removedEmails: usersToRemove.map((user) => user.email),
  };
}

async function main() {
  await prisma.$connect();

  const migrated = await migrateRoleAccounts();
  const removed = await removeSignupAndSmokeUsers();

  console.log(freshStart ? 'Fresh-start cleanup complete.' : 'Cleanup complete.');
  console.log(`Role accounts migrated: ${migrated.migrated}`);
  console.log(`Role accounts refreshed: ${migrated.refreshed}`);
  console.log(`Promotion requests removed: ${removed.deletedRequests}`);
  console.log(`Test/signup users removed: ${removed.deletedUsers}`);
  console.log(`Legacy admin accounts removed: ${removed.deletedLegacyAdmins}`);

  if (removed.removedEmails.length > 0) {
    console.log(`Removed emails: ${removed.removedEmails.join(', ')}`);
  }
}

main()
  .catch((error) => {
    console.error('Cleanup failed');
    console.error(error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });