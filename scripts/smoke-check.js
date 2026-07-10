const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const requiredUsers = [
  'lecturer.demo@live.gctu.edu.gh',
  'hod.demo@gctu.edu.gh',
  'hr.admin@gctu.edu.gh',
  'committee.demo@gctu.edu.gh',
  'system.admin@gctu.edu.gh',
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

  await assertCount('users', prisma.user.count(), 5);
  await assertCount('faculties', prisma.faculty.count(), 3);
  await assertCount('departments', prisma.department.count(), 5);
  await assertCount('promotion criteria', prisma.promotionCriteria.count(), 3);

  const users = await prisma.user.findMany({
    where: { email: { in: requiredUsers } },
    select: { email: true, role: true, emailVerified: true, isActive: true },
  });

  const foundEmails = new Set(users.map((user) => user.email));
  const missing = requiredUsers.filter((email) => !foundEmails.has(email));
  if (missing.length > 0) {
    throw new Error(`Missing demo users: ${missing.join(', ')}`);
  }

  const inactive = users.filter((user) => !user.isActive);
  if (inactive.length > 0) {
    throw new Error(`Inactive demo users: ${inactive.map((user) => user.email).join(', ')}`);
  }

  const unverified = users.filter((user) => !user.emailVerified);
  if (unverified.length > 0) {
    throw new Error(`Unverified demo users: ${unverified.map((user) => user.email).join(', ')}`);
  }

  console.log('OK demo users verified and active');
  console.log('Smoke check passed');
}

main()
  .catch((error) => {
    console.error('Smoke check failed');
    console.error(error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
