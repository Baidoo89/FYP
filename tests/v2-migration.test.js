const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(
  __dirname,
  '..',
  'prisma',
  'migrations',
  '20260810120000_v2_foundation',
  'migration.sql',
);

const EXPECTED_ENUMS = [
  'StaffCategory',
  'EmploymentStatus',
  'RecordVerificationState',
  'OrganizationUnitType',
  'PolicyAuthority',
  'PolicyVersionStatus',
  'PolicyEvidenceState',
  'PromotionTrackType',
  'DecisionAuthority',
  'PolicyRequirementType',
  'PolicyConflictStatus',
].sort();

const EXPECTED_TABLES = [
  'staff_members',
  'rank_definitions',
  'staff_rank_history',
  'organization_units',
  'staff_organization_assignments',
  'office_definitions',
  'office_appointments',
  'policy_sources',
  'policy_versions',
  'promotion_tracks',
  'promotion_routes',
  'assessment_area_definitions',
  'promotion_route_area_requirements',
  'promotion_route_requirements',
  'policy_conflicts',
].sort();

function executableStatements() {
  const sql = fs.readFileSync(migrationPath, 'utf8').replace(/^\s*--.*$/gm, '');
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

test('V2 migration contains the exact expected enums and tables', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const enums = [...sql.matchAll(/CREATE TYPE "([^"]+)"/g)].map((match) => match[1]).sort();
  const tables = [...sql.matchAll(/CREATE TABLE "([^"]+)"/g)].map((match) => match[1]).sort();

  assert.deepEqual(enums, EXPECTED_ENUMS);
  assert.deepEqual(tables, EXPECTED_TABLES);
});

test('V2 migration is additive and contains no destructive statement', () => {
  const statements = executableStatements();
  const allowed = [
    /^CREATE TYPE /,
    /^CREATE TABLE /,
    /^CREATE UNIQUE INDEX /,
    /^CREATE INDEX /,
    /^ALTER TABLE "[^"]+" ADD CONSTRAINT /,
  ];

  for (const statement of statements) {
    assert.ok(
      allowed.some((pattern) => pattern.test(statement)),
      `Unexpected or destructive migration statement: ${statement.slice(0, 100)}`,
    );
  }

  assert.equal(statements.filter((statement) => statement.startsWith('CREATE TYPE ')).length, 11);
  assert.equal(statements.filter((statement) => statement.startsWith('CREATE TABLE ')).length, 15);
  assert.equal(statements.filter((statement) => /^CREATE (UNIQUE )?INDEX /.test(statement)).length, 40);
  assert.equal(statements.filter((statement) => statement.startsWith('ALTER TABLE ')).length, 18);
});

test('V2 migration alters only newly introduced tables', () => {
  const newTables = new Set(EXPECTED_TABLES);
  const foreignKeyStatements = executableStatements().filter((statement) => statement.startsWith('ALTER TABLE '));

  for (const statement of foreignKeyStatements) {
    const match = statement.match(/^ALTER TABLE "([^"]+)"/);
    assert.ok(match);
    assert.ok(newTables.has(match[1]), `Migration alters legacy table ${match[1]}`);
    assert.match(statement, / ADD CONSTRAINT /);
  }
});
