const test = require('node:test');
const assert = require('node:assert/strict');
const { ROUTES, POLICY_CONFLICTS } = require('../lib/policy/v2-foundation');

function route(code) {
  const result = ROUTES.find((item) => item.code === code);
  assert.ok(result, `Missing route ${code}`);
  return result;
}

test('academic professorial routes use the Council working authority and retain the source conflict', () => {
  for (const code of [
    'J-SENIOR-LECTURER-TO-ASSOCIATE-PROFESSOR-CASE-I',
    'J-SENIOR-RESEARCH-FELLOW-TO-ASSOCIATE-PROFESSOR-CASE-II',
    'J-ASSOCIATE-PROFESSOR-TO-PROFESSOR-CASE-I',
    'J-ASSOCIATE-PROFESSOR-TO-PROFESSOR-CASE-II',
  ]) {
    assert.equal(route(code).finalAuthority, 'COUNCIL');
    assert.equal(route(code).evidenceState, 'VERIFIED_CONFLICT');
  }

  assert.ok(POLICY_CONFLICTS.some((item) => item.code === 'SCHEDULE-J-PROFESSORIAL-FINAL-AUTHORITY'));
});

test('Schedule K uses UAPC for ordinary routes and Council only for highest verified routes', () => {
  for (const item of ROUTES.filter((candidate) => candidate.code.startsWith('K-'))) {
    assert.equal(item.finalAuthority, item.code.endsWith('-HIGHEST') ? 'COUNCIL' : 'UAPC');
    assert.equal(item.evidenceState, 'VERIFIED_CONFLICT');
  }

  const conflict = POLICY_CONFLICTS.find((item) => item.code === 'SCHEDULE-K-FINAL-AUTHORITY');
  assert.ok(conflict);
  assert.match(conflict.provisionalResolution, /UAPC decides ordinary cases/);
});
