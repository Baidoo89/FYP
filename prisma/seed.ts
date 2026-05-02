import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Generate admin credentials
  const username = 'admin_fyp';
  const password = crypto.randomBytes(8).toString('base64');
  const password_hash = crypto.createHash('sha256').update(password).digest('hex');

  // Create admin account
  const admin = await prisma.adminAccount.upsert({
    where: { username },
    update: {},
    create: {
      username,
      password_hash,
      is_active: true,
    },
  });

  // Seed example lecturers
  await prisma.lecturer.createMany({
    data: [
      {
        name: 'Dr. John Smith',
        email: 'john.smith@university.edu',
        department: 'Computer Science',
        rank: 'Associate Professor',
        hire_date: new Date('2015-09-01'),
        is_active: true,
      },
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@university.edu',
        department: 'Computer Science',
        rank: 'Lecturer',
        hire_date: new Date('2018-08-15'),
        is_active: true,
      },
    ],
    skipDuplicates: true,
  });

  // Output admin credentials
  console.log('Admin username:', username);
  console.log('Admin password:', password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
