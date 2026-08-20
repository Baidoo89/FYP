const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('both Prisma schemas own the document blob table and its document relation', () => {
  for (const schemaPath of ['prisma/schema.prisma', 'prisma/schema.postgres.prisma']) {
    const schema = source(schemaPath);
    assert.match(schema, /model DocumentFileBlob \{/);
    assert.match(schema, /documentId\s+Int\s+@id/);
    assert.match(schema, /data\s+Bytes/);
    assert.match(schema, /fileBlob\s+DocumentFileBlob\?/);
    assert.match(schema, /@@map\("document_file_blobs"\)/);
  }
});

test('blob preservation migration is idempotent and non-destructive', () => {
  const migration = source('prisma/migrations/20260810150000_document_blob_preservation/migration.sql');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "document_file_blobs"/);
  assert.match(migration, /REFERENCES "documents"\("id"\)\s+ON DELETE CASCADE/);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS "document_file_blobs_fileName_idx"/);
  assert.doesNotMatch(migration, /DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE|DELETE\s+FROM/i);
});

test('request handlers do not perform schema DDL at runtime', () => {
  const storage = source('lib/document-file-storage.ts');
  assert.doesNotMatch(storage, /CREATE TABLE|CREATE INDEX|ensureDocumentFileStorage/);

  for (const routePath of [
    'app/api/lecturer/evidence/route.ts',
    'app/api/promotion-requests/[id]/documents/route.ts',
    'app/api/uploads/[fileName]/route.ts',
  ]) {
    assert.doesNotMatch(source(routePath), /ensureDocumentFileStorage/);
  }
});

test('no committed migration removes document blob storage', () => {
  const migrationsPath = path.join(__dirname, '..', 'prisma', 'migrations');
  for (const migrationName of fs.readdirSync(migrationsPath)) {
    const migrationPath = path.join(migrationsPath, migrationName, 'migration.sql');
    if (!fs.existsSync(migrationPath)) continue;
    assert.doesNotMatch(
      fs.readFileSync(migrationPath, 'utf8'),
      /DROP\s+TABLE(?:\s+IF\s+EXISTS)?\s+"document_file_blobs"/i,
      `${migrationName} must preserve document_file_blobs`,
    );
  }
});
