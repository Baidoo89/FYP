const fs = require('fs/promises');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const confirmed = process.argv.includes('--confirm');
const workspaceRoot = path.resolve(process.cwd());
const storageRoot = path.join(workspaceRoot, 'storage');
const uploadDirectory = path.resolve(
  process.env.PROMOTION_UPLOAD_DIR || path.join(storageRoot, 'promotion-uploads')
);

const tableNames = [
  'admin_accounts',
  'faculties',
  'departments',
  'lecturers',
  'users',
  'promotion_requests',
  'documents',
  'verifications',
  'promotion_criteria',
  'scores',
  'review_comments',
  'audit_logs',
  'notifications',
  'email_verification_tokens',
  'status_history',
  'system_settings',
];

function assertSafeStoragePath(targetPath) {
  const relativePath = path.relative(storageRoot, targetPath);
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Refusing to clear unsafe storage path: ${targetPath}`);
  }
}

async function countRows(tableName) {
  const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${tableName}"`);
  return rows[0]?.count || 0;
}

async function clearDirectory(directoryPath) {
  assertSafeStoragePath(directoryPath);
  await fs.mkdir(directoryPath, { recursive: true });
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  await Promise.all(entries.map((entry) => fs.rm(path.join(directoryPath, entry.name), { recursive: true, force: true })));
  return entries.length;
}

async function main() {
  if (!confirmed) {
    throw new Error('Fresh-install wipe not confirmed. Re-run with --confirm.');
  }

  await prisma.$connect();

  const before = {};
  for (const tableName of tableNames) {
    before[tableName] = await countRows(tableName);
  }

  const blobTableExists = await prisma.$queryRawUnsafe(
    "SELECT to_regclass('public.document_file_blobs') IS NOT NULL AS exists"
  );
  if (blobTableExists[0]?.exists) {
    before.document_file_blobs = await countRows('document_file_blobs');
  }

  const tablesToTruncate = blobTableExists[0]?.exists
    ? [...tableNames, 'document_file_blobs']
    : tableNames;
  const quotedTables = tablesToTruncate.map((tableName) => `"${tableName}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`);

  const removedUploads = await clearDirectory(uploadDirectory);
  await fs.rm(path.join(storageRoot, 'local-db.json'), { force: true });
  await fs.rm(path.join(storageRoot, 'audit-log.jsonl'), { force: true });

  console.log('Fresh-install wipe complete.');
  console.log(`Database rows removed: ${Object.values(before).reduce((total, count) => total + count, 0)}`);
  console.log(`Upload entries removed: ${removedUploads}`);
  console.log('Database schema and migrations were preserved.');
}

main()
  .catch((error) => {
    console.error('Fresh-install wipe failed.');
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
