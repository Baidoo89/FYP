const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password + 'lpads-salt-2026')
    .digest('hex');
}

async function main() {
  const username = 'admin_fyp';
  const password = 'admin123';

  const password_hash = hashPassword(password);

  await prisma.adminAccount.upsert({
    where: { username },
    update: {},
    create: {
      username,
      password_hash,
      is_active: true,
    },
  });

  console.log('======================');
  console.log('ADMIN SEEDED SUCCESS');
  console.log('Username:', username);
  console.log('Password:', password);
  console.log('======================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });