import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password + 'lpads-salt-2026').digest('hex');
}

async function main() {
  const hrPassword = 'hradmin123';

  await prisma.user.upsert({
    where: { email: 'hr.admin@gctu.edu.gh' },
    update: {
      password: hashPassword(hrPassword),
      role: 'HR_ADMIN',
      department: 'Human Resources',
      name: 'HR Admin',
    },
    create: {
      name: 'HR Admin',
      email: 'hr.admin@gctu.edu.gh',
      password: hashPassword(hrPassword),
      role: 'HR_ADMIN',
      department: 'Human Resources',
    },
  });

  console.log('======================');
  console.log('HR admin seeded successfully');
  console.log('HR admin login:', 'hr.admin@gctu.edu.gh / hradmin123');
  console.log('Lecturers should self-register with @live.gctu.edu.gh');
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
