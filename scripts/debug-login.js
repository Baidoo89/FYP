const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const password = process.argv[2] || 'Password123!';

function hashLegacyPassword(value) {
  return crypto.createHash('sha256').update(value + 'lpads-salt-2026').digest('hex');
}

function verifyPassword(value, storedHash) {
  if (!storedHash) return false;
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return bcrypt.compareSync(value, storedHash);
  }
  return hashLegacyPassword(value) === storedHash;
}

function summarizeHash(storedHash) {
  if (!storedHash) return 'missing';
  if (storedHash.startsWith('$2')) return `${storedHash.slice(0, 4)} bcrypt length=${storedHash.length}`;
  return `legacy/other length=${storedHash.length}`;
}

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      emailVerified: true,
      onboarded: true,
      password: true,
      passwordHash: true,
    },
  });

  console.log(`Checking ${users.length} users with supplied demo password.`);
  for (const user of users) {
    const storedHash = user.passwordHash || user.password;
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      onboarded: user.onboarded,
      passwordHash: summarizeHash(user.passwordHash),
      password: summarizeHash(user.password),
      verifies: verifyPassword(password, storedHash),
    });
  }

  const admins = await prisma.adminAccount.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      username: true,
      is_active: true,
      password_hash: true,
    },
  });

  console.log(`Checking ${admins.length} legacy/admin accounts with supplied demo password.`);
  for (const admin of admins) {
    console.log({
      id: admin.id,
      username: admin.username,
      isActive: admin.is_active,
      passwordHash: summarizeHash(admin.password_hash),
      verifies: verifyPassword(password, admin.password_hash),
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
