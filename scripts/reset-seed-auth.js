const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SEED_PASSWORD = process.argv[2] || 'Password123!';
const SEEDED_ROLE_EMAILS = [
  'system.admin@live.gctu.edu.gh',
  'hr.admin@live.gctu.edu.gh',
  'hod.dean@live.gctu.edu.gh',
  'committee.reviewer@live.gctu.edu.gh',
];

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const users = await prisma.user.updateMany({
    where: { email: { in: SEEDED_ROLE_EMAILS } },
    data: {
      password: passwordHash,
      passwordHash,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      onboarded: true,
    },
  });

  console.log(`Updated ${users.count} pre-created role accounts.`);
  console.log(`Seed role password is now: ${SEED_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
