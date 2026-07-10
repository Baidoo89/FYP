const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DEMO_PASSWORD = process.argv[2] || 'Password123!';

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const users = await prisma.user.updateMany({
    data: {
      password: passwordHash,
      passwordHash,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      onboarded: true,
    },
  });

  const admins = await prisma.adminAccount.updateMany({
    data: {
      password_hash: passwordHash,
      is_active: true,
    },
  });

  console.log(`Updated ${users.count} users.`);
  console.log(`Updated ${admins.count} admin accounts.`);
  console.log(`Demo password is now: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
