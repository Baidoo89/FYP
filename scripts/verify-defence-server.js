const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = (process.env.DEFENCE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const PASSWORD = 'Password123!';
const ROLE_ACCOUNTS = [
  ['Computer Science HOD', 'hod.dean@live.gctu.edu.gh', 'HOD_DEAN'],
  ['FoCIS Dean', 'dean.focis@live.gctu.edu.gh', 'HOD_DEAN'],
  ['HR Administrator', 'hr.admin@live.gctu.edu.gh', 'HR_ADMIN'],
  ['Committee Reviewer', 'committee.reviewer@live.gctu.edu.gh', 'COMMITTEE_REVIEWER'],
  ['System Administrator', 'system.admin@live.gctu.edu.gh', 'SYSTEM_ADMIN'],
];
const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const TEST_ACCOUNT = {
  email: `defence.registration.${runId}@live.gctu.edu.gh`,
  password: 'Registration123!',
  staffId: `GCTU-REG-${runId}`,
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sessionCookie(response, label) {
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  assert(cookie, `${label} did not return a session cookie.`);
  return cookie;
}

async function jsonResponse(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function login(email, expectedRole) {
  const { response, payload } = await jsonResponse(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password: PASSWORD }),
  });
  assert(response.ok && payload?.success, `${email} login failed with HTTP ${response.status}.`);
  assert(payload.role === expectedRole, `${email} returned ${payload.role}; expected ${expectedRole}.`);
  return sessionCookie(response, email);
}

async function cleanupTestAccount() {
  const user = await prisma.user.findUnique({
    where: { email: TEST_ACCOUNT.email },
    select: { id: true },
  });
  if (!user) return;

  await prisma.$transaction(async (client) => {
    await client.auditLog.deleteMany({
      where: {
        OR: [
          { actorId: user.id },
          { entityType: 'User', entityId: String(user.id) },
        ],
      },
    });
    await client.promotionRequest.deleteMany({ where: { lecturerId: user.id } });
    await client.user.delete({ where: { id: user.id } });
  });
}

async function verifyRegistrationFlow() {
  await cleanupTestAccount();

  const registration = await jsonResponse(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_ACCOUNT.email,
      password: TEST_ACCOUNT.password,
      confirmPassword: TEST_ACCOUNT.password,
    }),
  });
  assert(registration.response.status === 201 && registration.payload?.success, `Lecturer registration failed with HTTP ${registration.response.status}.`);
  assert(registration.payload.verificationUrl, 'The local server did not return a development verification link. Run the defence check against next dev or configure a test mailbox.');
  const unverifiedCookie = sessionCookie(registration.response, 'Lecturer registration');
  console.log('OK registration: lecturer account created through the public signup API');

  const onboardingBody = {
    firstName: 'Defence',
    middleName: 'Flow',
    lastName: 'Check',
    staffId: TEST_ACCOUNT.staffId,
    faculty: 'Faculty of Computing and Information Systems',
    department: 'Computer Science',
    currentRank: 'LECTURER',
  };
  const blockedOnboarding = await jsonResponse(`${BASE_URL}/api/auth/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: unverifiedCookie },
    body: JSON.stringify(onboardingBody),
  });
  assert(blockedOnboarding.response.status === 403, `Unverified onboarding returned ${blockedOnboarding.response.status}; expected 403.`);
  console.log('OK verification gate: unverified lecturer cannot complete onboarding');

  const verificationUrl = new URL(registration.payload.verificationUrl, BASE_URL);
  const token = verificationUrl.searchParams.get('token');
  assert(token, 'Registration verification URL did not contain a token.');
  const verification = await jsonResponse(`${BASE_URL}/api/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  assert(verification.response.ok && verification.payload?.success, `Email verification failed with HTTP ${verification.response.status}.`);
  const verifiedCookie = sessionCookie(verification.response, 'Email verification');
  console.log('OK email verification: token activated the lecturer account');

  const onboarding = await jsonResponse(`${BASE_URL}/api/auth/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: verifiedCookie },
    body: JSON.stringify(onboardingBody),
  });
  assert(onboarding.response.ok && onboarding.payload?.success, `Verified onboarding failed with HTTP ${onboarding.response.status}.`);
  const onboardedCookie = sessionCookie(onboarding.response, 'Lecturer onboarding');
  console.log('OK onboarding: verified lecturer completed the staff profile');

  const application = await jsonResponse(`${BASE_URL}/api/promotion-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: onboardedCookie },
    body: JSON.stringify({
      action: 'create',
      targetRank: 'SENIOR_LECTURER',
      yearsInCurrentRank: 5,
    }),
  });
  assert(application.response.status === 201 && application.payload?.success, `Application creation failed with HTTP ${application.response.status}.`);
  assert(application.payload.data?.status === 'DRAFT', 'New promotion application was not created in Draft status.');
  console.log('OK application: self-registered lecturer created a Draft promotion request');

  const dashboard = await jsonResponse(`${BASE_URL}/api/lecturer/dashboard`, {
    headers: { Cookie: onboardedCookie },
  });
  assert(dashboard.response.ok && dashboard.payload?.success, 'New lecturer dashboard API failed.');
  assert(dashboard.payload.data?.user?.name === 'Defence Flow Check', 'New lecturer dashboard identity is incorrect.');
  assert(dashboard.payload.data?.activeRequest?.status === 'DRAFT', 'New lecturer Draft is missing from the dashboard.');
  console.log('OK lecturer dashboard: new identity and Draft application are visible');
}

async function main() {
  const health = await jsonResponse(`${BASE_URL}/api/health`);
  assert(health.response.ok && health.payload?.success && health.payload.database === 'connected', 'Health endpoint is not ready.');
  console.log(`OK health: application ready, database ${health.payload.database}`);

  const registerPage = await fetch(`${BASE_URL}/register`);
  assert(registerPage.ok, `Registration page returned HTTP ${registerPage.status}.`);
  console.log('OK registration page: public lecturer signup is available');

  for (const [name, email, role] of ROLE_ACCOUNTS) {
    await login(email, role);
    console.log(`OK login: ${name} (${role})`);
  }

  await verifyRegistrationFlow();
  console.log('Defence live-server check passed with registration-first lecturer creation.');
}

main()
  .catch((error) => {
    console.error('Defence live-server check failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanupTestAccount();
    } catch (error) {
      console.error('Temporary lecturer cleanup failed:', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
    await prisma.$disconnect();
  });