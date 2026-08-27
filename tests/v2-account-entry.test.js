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

test('applicant application workspace uses verified routes and consolidated preparation', () => {
  const startPage = source('app/lecturer-portal/start-application/page.tsx');
  const applicationPage = source('app/lecturer-portal/application/page.tsx');
  const startControl = source('components/promotion/PolicyPromotionStart.tsx');
  const applicationNav = source('components/promotion/ApplicantApplicationNav.tsx');
  const appShell = source('components/AppShell.tsx');
  const evidencePage = source('app/lecturer-portal/evidence/page.tsx');
  const requestApi = source('app/api/promotion-requests/route.ts');

  assert.match(startPage, /redirect\('\/lecturer-portal\/application'\)/);
  assert.match(applicationPage, /PolicyPromotionStart/);
  assert.doesNotMatch(applicationPage, /StartPromotionRequestCard/);
  assert.match(applicationPage, /router\.push\('\/lecturer-portal\/official-forms'\)/);
  assert.match(applicationPage, /formsReady/);
  assert.match(applicationPage, /Application checklist/);
  assert.match(startControl, /\/api\/lecturer\/promotion-routes/);
  assert.match(startControl, /routeResolvedAutomatically/);
  assert.match(startControl, /requiresRouteChoice/);
  assert.match(startControl, /Promotion route resolved automatically/);
  assert.doesNotMatch(startControl, /StartPromotionRequestCard/);
  assert.match(startControl, /JSON\.stringify\(\{ routeCode: selectedRoute\.code \}\)/);
  assert.match(applicationNav, /Official Form/);
  assert.match(applicationNav, /Academic Dossier/);
  assert.match(appShell, /Application Workspace/);
  assert.doesNotMatch(appShell, /label: 'Start Application'/);
  assert.match(evidencePage, /Continue to Official Form/);
  assert.doesNotMatch(evidencePage, /draftReadyForSubmission/);
  assert.match(requestApi, /resolveVerifiedPromotionRoute/);
  assert.match(requestApi, /promotionRoute: requestRecord\.promotionRoute/);
  assert.match(requestApi, /promotionRoute:\s*\{\s*select:\s*\{\s*code: true,\s*name: true/s);
});
