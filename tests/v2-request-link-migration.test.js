const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(
  __dirname,
  '..',
  'prisma',
  'migrations',
  '20260810130000_link_requests_to_v2_policy',
  'migration.sql',
);

test('request-link migration adds only nullable V2 reference columns', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8').replace(/^\s*--.*$/gm, '');
  const columns = [...sql.matchAll(/ADD COLUMN "([^"]+)" ([^,;]+)/g)].map((match) => ({
    name: match[1],
    definition: match[2].trim(),
  }));

  assert.deepEqual(columns.map((column) => column.name), [
    'promotionRouteId',
    'staffRankHistoryId',
    'staffAssignmentId',
    'policySnapshot',
  ]);
  assert.ok(columns.every((column) => !/NOT NULL/i.test(column.definition)));

  const statements = sql.split(';').map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) {
    assert.doesNotMatch(statement, /^(DROP\b|DELETE\s+FROM\b|TRUNCATE\b|RENAME\b)/i);
    assert.doesNotMatch(statement, /^ALTER\s+TABLE[\s\S]*\b(DROP|RENAME)\b/i);
  }
});

test('request-link migration uses restrictive V2 foreign keys', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const foreignKeys = [...sql.matchAll(/ADD CONSTRAINT "([^"]+)" FOREIGN KEY/g)].map((match) => match[1]);

  assert.equal(foreignKeys.length, 3);
  assert.match(sql, /REFERENCES "promotion_routes"\("id"\) ON DELETE RESTRICT/);
  assert.match(sql, /REFERENCES "staff_rank_history"\("id"\) ON DELETE RESTRICT/);
  assert.match(sql, /REFERENCES "staff_organization_assignments"\("id"\) ON DELETE RESTRICT/);
});
