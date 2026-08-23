const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('public self-registration is closed at UI, page, middleware, and API boundaries', () => {
  const loginPage = source('app/login/page.tsx');
  const registerPage = source('app/register/page.tsx');
  const registerApi = source('app/api/auth/register/route.ts');
  const middleware = source('middleware.ts');

  assert.doesNotMatch(loginPage, /href=["']\/register/);
  assert.match(registerPage, /redirect\('\/login\?access=staff-issued'\)/);
  assert.match(registerApi, /PUBLIC_REGISTRATION_DISABLED/);
  assert.doesNotMatch(registerApi, /prisma\.user\.create/);
  assert.match(middleware, /pathname === '\/api\/auth\/register'/);
  assert.match(middleware, /status: 403/);
});

test('legacy onboarding and system administration cannot self-assert applicant records', () => {
  const onboardingPage = source('app/onboarding/page.tsx');
  const onboardingApi = source('app/api/auth/onboarding/route.ts');
  const systemUsersApi = source('app/api/system/users/route.ts');

  assert.doesNotMatch(onboardingPage, /OnboardingForm/);
  assert.match(onboardingApi, /HRODD_PROFILE_REQUIRED/);
  assert.doesNotMatch(onboardingApi, /prisma\.user\.update/);
  assert.match(systemUsersApi, /isApplicantAccountRole\(parsed\.data\.role\)/);
  assert.match(systemUsersApi, /Applicant access must be provisioned from a verified HRODD staff record/);
});

test('staff activation requires a namespaced single-use token and verified HRODD record', () => {
  const activation = source('lib/staff-activation.ts');
  const provisioning = source('app/api/hr/staff-records/provision/route.ts');

  assert.match(activation, /staff-activation:/);
  assert.match(activation, /verificationState !== RecordVerificationState\.VERIFIED/);
  assert.match(activation, /usedAt: null, expiresAt: \{ gte: now \}/);
  assert.match(activation, /passwordHash = hashPassword\(password\)/);
  assert.match(provisioning, /password: null/);
  assert.match(provisioning, /passwordHash: null/);
  assert.match(provisioning, /sendStaffActivationEmail/);
  assert.doesNotMatch(provisioning, /temporaryPassword/);
});

test('applicant start screen resolves single routes and only asks for genuine policy alternatives', () => {
  const startPage = source('app/lecturer-portal/start-application/page.tsx');
  const startControl = source('components/promotion/PolicyPromotionStart.tsx');
  const requestApi = source('app/api/promotion-requests/route.ts');

  assert.match(startPage, /PolicyPromotionStart/);
  assert.match(startPage, /lecturer-portal\/official-forms/);
  assert.match(startControl, /\/api\/lecturer\/promotion-routes/);
  assert.match(startControl, /routeResolvedAutomatically/);
  assert.match(startControl, /requiresRouteChoice/);
  assert.match(startControl, /Promotion route resolved automatically/);
  assert.match(startControl, /JSON\.stringify\(\{ routeCode: selectedRoute\.code \}\)/);
  assert.match(requestApi, /resolveVerifiedPromotionRoute/);
});
