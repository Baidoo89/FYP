const test = require('node:test');
const assert = require('node:assert/strict');
const {
  completedYearsBetween,
  addUtcMonths,
  assessRouteAvailability,
} = require('../lib/policy/route-eligibility');

test('completed years use the rank anniversary rather than calendar-year subtraction', () => {
  assert.equal(completedYearsBetween('2022-08-11', '2026-08-10'), 3);
  assert.equal(completedYearsBetween('2022-08-10', '2026-08-10'), 4);
});

test('six-month cutoff handles month-end dates consistently', () => {
  assert.equal(addUtcMonths('2026-08-31T00:00:00.000Z', 6).toISOString(), '2027-02-28T00:00:00.000Z');
});

test('verified active staff can start a route when time and retirement controls pass', () => {
  const result = assessRouteAvailability({
    verificationState: 'VERIFIED',
    employmentStatus: 'ACTIVE',
    rankStartedAt: '2022-08-10',
    retirementDate: '2035-01-01',
    minimumYearsInRank: 4,
    routeStatus: 'ACTIVE',
    evidenceState: 'VERIFIED',
    asOf: '2026-08-10',
  });

  assert.equal(result.completedYears, 4);
  assert.equal(result.canStart, true);
  assert.deepEqual(result.warnings, []);
});

test('route start is blocked when the minimum time in rank is not complete', () => {
  const result = assessRouteAvailability({
    verificationState: 'VERIFIED',
    employmentStatus: 'ACTIVE',
    rankStartedAt: '2023-08-11',
    retirementDate: '2035-01-01',
    minimumYearsInRank: 4,
    routeStatus: 'ACTIVE',
    evidenceState: 'VERIFIED',
    asOf: '2026-08-10',
  });

  assert.equal(result.canStart, false);
  assert.equal(result.completedYears, 2);
  assert.match(result.warnings.join(' '), /4 completed years/);
});

test('route start is blocked inside the retirement cutoff', () => {
  const result = assessRouteAvailability({
    verificationState: 'VERIFIED',
    employmentStatus: 'ACTIVE',
    rankStartedAt: '2020-01-01',
    retirementDate: '2027-02-09',
    minimumYearsInRank: 4,
    routeStatus: 'ACTIVE',
    evidenceState: 'VERIFIED',
    asOf: '2026-08-10',
  });

  assert.equal(result.canStart, false);
  assert.match(result.warnings.join(' '), /six-month retirement cutoff/);
});

test('provisional conflict route permits a draft but exposes the policy warning', () => {
  const result = assessRouteAvailability({
    verificationState: 'VERIFIED',
    employmentStatus: 'ACTIVE',
    rankStartedAt: '2020-01-01',
    retirementDate: '2035-01-01',
    minimumYearsInRank: 4,
    routeStatus: 'PROVISIONAL',
    evidenceState: 'VERIFIED_CONFLICT',
    asOf: '2026-08-10',
  });

  assert.equal(result.canStart, true);
  assert.match(result.warnings.join(' '), /policy conflict/);
});
