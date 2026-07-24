const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const requiredRoleUsers = [
  { email: 'system.admin@live.gctu.edu.gh', role: 'SYSTEM_ADMIN' },
  { email: 'hr.admin@live.gctu.edu.gh', role: 'HR_ADMIN' },
  { email: 'hod.dean@live.gctu.edu.gh', role: 'HOD_DEAN' },
  { email: 'committee.reviewer@live.gctu.edu.gh', role: 'COMMITTEE_REVIEWER' },
];

async function assertCount(label, promise, minimum) {
  const count = await promise;
  if (count < minimum) {
    throw new Error(`${label} expected at least ${minimum}, found ${count}`);
  }
  console.log(`OK ${label}: ${count}`);
}

async function main() {
  await prisma.$connect();
  console.log('OK database connection');

  await assertCount('faculties', prisma.faculty.count(), 3);
  await assertCount('departments', prisma.department.count(), 5);
  await assertCount('promotion criteria', prisma.promotionCriteria.count(), 3);

  const users = await prisma.user.findMany({
    where: { email: { in: requiredRoleUsers.map((user) => user.email) } },
    select: { email: true, role: true, emailVerified: true, isActive: true, onboarded: true },
  });

  const byEmail = new Map(users.map((user) => [user.email, user]));

  for (const expected of requiredRoleUsers) {
    const user = byEmail.get(expected.email);
    if (!user) {
      throw new Error(`Missing pre-created role account: ${expected.email}`);
    }
    if (user.role !== expected.role) {
      throw new Error(`${expected.email} expected role ${expected.role}, found ${user.role}`);
    }
    if (!user.isActive || !user.emailVerified || !user.onboarded) {
      throw new Error(`${expected.email} must be active, verified, and onboarded`);
    }
  }

  console.log('OK pre-created role accounts verified and active');
  console.log('Database health check passed');
}

main()
  .catch((error) => {
    console.error('Database health check failed');
    console.error(error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });