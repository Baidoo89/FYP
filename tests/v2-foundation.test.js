const test = require('node:test');
const assert = require('node:assert/strict');
const {
  TRACKS,
  ROUTES,
  POLICY_CONFLICTS,
  SCHEDULE_K_TIER_RULES,
  validateFoundation,
} = require('../lib/policy/v2-foundation');

function route(code) {
  const result = ROUTES.find((item) => item.code === code);
  assert.ok(result, `Missing route ${code}`);
  return result;
}

function requirement(routeDefinition, code) {
  const result = routeDefinition.requirements.find((item) => item.code === code);
  assert.ok(result, `Missing requirement ${code} on ${routeDefinition.code}`);
  return result;
}

test('V2 foundation references and codes are internally valid', () => {
  assert.equal(validateFoundation(), true);
});

test('Schedule J uses the verified minimum years for senior academic routes', () => {
  assert.equal(route('J-LECTURER-TO-SENIOR-LECTURER').minimumYearsInRank, 4);
  assert.equal(route('J-SENIOR-LECTURER-TO-ASSOCIATE-PROFESSOR-CASE-I').minimumYearsInRank, 4);
  assert.equal(route('J-ASSOCIATE-PROFESSOR-TO-PROFESSOR-CASE-I').minimumYearsInRank, 3);
  assert.equal(route('J-ASSOCIATE-PROFESSOR-TO-PROFESSOR-CASE-II').minimumYearsInRank, 3);
});

test('Schedule J preserves exact output, best-N, assessor, and geography rules', () => {
  const seniorLecturer = route('J-LECTURER-TO-SENIOR-LECTURER');
  assert.equal(requirement(seniorLecturer, 'OUTPUTS_SUBMITTED_MIN').numberValue, 6);
  assert.equal(requirement(seniorLecturer, 'OUTPUTS_SUBMITTED_MAX').numberValue, 10);
  assert.equal(requirement(seniorLecturer, 'BEST_OUTPUTS_COUNT').numberValue, 6);
  assert.equal(requirement(seniorLecturer, 'EXTERNAL_ASSESSOR_COUNT').numberValue, 1);

  const professorCaseTwo = route('J-ASSOCIATE-PROFESSOR-TO-PROFESSOR-CASE-II');
  assert.equal(requirement(professorCaseTwo, 'OUTPUTS_SUBMITTED_MIN').numberValue, 20);
  assert.equal(requirement(professorCaseTwo, 'OUTPUTS_SUBMITTED_MAX').numberValue, 30);
  assert.equal(requirement(professorCaseTwo, 'REFEREED_OUTPUTS_MIN').numberValue, 20);
  assert.equal(requirement(professorCaseTwo, 'ASSESSORS_OUTSIDE_GHANA_MIN').numberValue, 1);
});

test('Schedule K is separated by staff category and keeps four areas with two core areas', () => {
  const scheduleKTracks = TRACKS.filter((track) => track.type === 'SCHEDULE_K');
  assert.equal(scheduleKTracks.length, 2);
  assert.deepEqual(
    scheduleKTracks.map((track) => track.staffCategory).sort(),
    ['ADMINISTRATIVE_SENIOR_MEMBER', 'PROFESSIONAL_SENIOR_MEMBER'],
  );

  for (const track of scheduleKTracks) {
    assert.equal(track.areas.length, 4);
    assert.equal(track.areas.filter((area) => area.isCore).length, 2);
  }

  assert.equal(route('K-REGISTRY-FIRST').trackCode, 'SCHEDULE_K_ADMINISTRATIVE');
  assert.equal(route('K-FINANCE-FIRST').trackCode, 'SCHEDULE_K_PROFESSIONAL');
});

test('Schedule K eligibility uses combinations instead of an arithmetic average', () => {
  assert.deepEqual(SCHEDULE_K_TIER_RULES.FIRST.combination, {
    minimumAtOrAbove: { SATISFACTORY: 4, GOOD: 1 },
    coreAtOrAbove: { GOOD: 1 },
  });
  assert.deepEqual(SCHEDULE_K_TIER_RULES.MIDDLE.combination, {
    minimumAtOrAbove: { GOOD: 4, VERY_GOOD: 2 },
    coreAtOrAbove: { VERY_GOOD: 1 },
  });
  assert.deepEqual(SCHEDULE_K_TIER_RULES.HIGHEST.combination, {
    minimumAtOrAbove: { VERY_GOOD: 4, EXCELLENT: 1 },
    coreAtOrAbove: { EXCELLENT: 1 },
  });
});

test('unknown policy streams and routes remain explicitly blocked or absent', () => {
  const blocked = TRACKS.filter((track) => track.status === 'BLOCKED');
  assert.deepEqual(
    blocked.map((track) => track.code).sort(),
    ['JUNIOR_STAFF_UNIFIED_SCHEME', 'SENIOR_STAFF_UNIFIED_SCHEME'],
  );
  assert.equal(ROUTES.some((item) => item.code === 'K-PROCUREMENT-HIGHER'), false);
  assert.equal(ROUTES.some((item) => item.code.includes('LEGAL')), false);
  assert.equal(ROUTES.some((item) => item.code.includes('SPORTS')), false);

  const conflictCodes = new Set(POLICY_CONFLICTS.map((conflict) => conflict.code));
  assert.ok(conflictCodes.has('PROCUREMENT-HIGHER-ROUTE'));
  assert.ok(conflictCodes.has('LEGAL-SPORTS-ROUTES'));
  assert.ok(conflictCodes.has('SENIOR-JUNIOR-UNIFIED-SCHEMES'));
});

test('all seeded routes enforce the verified six-month retirement cutoff', () => {
  for (const item of ROUTES) {
    assert.equal(requirement(item, 'RETIREMENT_LEAD_MONTHS').numberValue, 6);
  }
});
