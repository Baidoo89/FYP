const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('Prisma models neutral staff accounts and effective-dated access assignments', () => {
  for (const schemaPath of ['prisma/schema.prisma', 'prisma/schema.postgres.prisma']) {
    const schema = source(schemaPath);
    assert.match(schema, /enum Role \{\s+STAFF\s+LECTURER/);
    assert.match(schema, /userId\s+Int\?\s+@unique/);
    assert.match(schema, /model StaffAccessAssignment \{/);
    assert.match(schema, /role\s+StaffAccessRole/);
    assert.match(schema, /appointingAuthority\s+String\?/);
    assert.match(schema, /verificationState\s+RecordVerificationState/);
    assert.match(schema, /DISABLED_PENDING_POLICY/);
  }
});

test('staff access migration preserves data while enabling roster-first provisioning', () => {
  const migration = source('prisma/migrations/20260810140000_staff_access_foundation/migration.sql');
  assert.match(migration, /ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STAFF'/);
  assert.match(migration, /ALTER COLUMN "userId" DROP NOT NULL/);
  assert.match(migration, /CREATE TABLE "staff_access_assignments"/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/);
});

test('HRODD provisions neutral accounts and verified applicant access assignments', () => {
  const provisioning = source('app/api/hr/staff-records/provision/route.ts');
  assert.match(provisioning, /role: Role\.STAFF/);
  assert.match(provisioning, /tx\.staffAccessAssignment\.create/);
  assert.match(provisioning, /role: StaffAccessRole\.APPLICANT/);
  assert.match(provisioning, /appointingAuthority: 'HRODD'/);
});

test('neutral and legacy applicant roles share the applicant portal without public registration', () => {
  const rbac = source('lib/rbac.ts');
  const activation = source('lib/staff-activation.ts');
  const routeDiscovery = source('app/api/lecturer/promotion-routes/route.ts');
  assert.match(rbac, /STAFF: '\/lecturer-portal'/);
  assert.match(rbac, /roles: \['STAFF', 'LECTURER'\]/);
  assert.match(activation, /isApplicantAccountRole\(user\.role\)/);
  assert.match(routeDiscovery, /isApplicantAccountRole\(session\.role\)/);
});
