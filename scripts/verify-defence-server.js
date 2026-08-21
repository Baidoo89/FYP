const BASE_URL = (process.env.DEFENCE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const ROLE_PASSWORD = 'Password123!';
const APPLICANT_PASSWORD = 'Applicant123!';

const roleAccounts = [
  ['Computer Science HOD', 'hod.dean@live.gctu.edu.gh', 'HOD_DEAN', '/hod/review-queue'],
  ['FoCIS Dean', 'dean.focis@live.gctu.edu.gh', 'HOD_DEAN', '/hod/review-queue'],
  ['HR Administrator', 'hr.admin@live.gctu.edu.gh', 'HR_ADMIN', '/hr/requests'],
  ['Committee Reviewer', 'committee.reviewer@live.gctu.edu.gh', 'COMMITTEE_REVIEWER', '/committee/review'],
  ['System Administrator', 'system.admin@live.gctu.edu.gh', 'SYSTEM_ADMIN', '/system-admin/dashboard'],
];
const applicants = [
  ['Benjamin Baidoo', '4231230141@live.gctu.edu.gh', 'J-'],
  ['Sucess Likem', '4231230154@live.gctu.edu.gh', 'K-'],
  ['Esther Appiah', '4231231237@live.gctu.edu.gh', 'K-'],
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function responseWithJson(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

function sessionCookie(response, label) {
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  assert(cookie, `${label} did not return a session cookie.`);
  return cookie;
}

async function login(email, password, expectedRole) {
  const { response, payload } = await responseWithJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });
  assert(response.ok && payload?.success, `${email} login failed with HTTP ${response.status}.`);
  assert(payload.role === expectedRole, `${email} returned ${payload.role}; expected ${expectedRole}.`);
  return sessionCookie(response, email);
}

async function verifyNoPublicRegistration() {
  const blocked = await responseWithJson('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@live.gctu.edu.gh', password: 'Blocked123!' }),
  });
  assert(blocked.response.status === 403 && blocked.payload?.code === 'PUBLIC_REGISTRATION_DISABLED', 'Public registration API is not closed.');
  const page = await fetch(`${BASE_URL}/register`, { redirect: 'manual' });
  assert([301, 302, 303, 307, 308].includes(page.status), `Registration page returned ${page.status}; expected a login redirect.`);
  assert((page.headers.get('location') || '').includes('/login?access=staff-issued'), 'Registration page did not redirect to staff-issued login.');
  console.log('OK identity boundary: public registration is blocked at API and page boundaries');
}

async function verifyRoleAccount([name, email, role, page]) {
  const cookie = await login(email, ROLE_PASSWORD, role);
  const pageResponse = await fetch(`${BASE_URL}${page}`, { headers: { Cookie: cookie } });
  assert(pageResponse.ok, `${name} workspace ${page} returned ${pageResponse.status}.`);
  console.log(`OK role login: ${name} (${role}) -> ${page}`);
}

async function verifyApplicant([name, email, routePrefix]) {
  const cookie = await login(email, APPLICANT_PASSWORD, 'STAFF');
  const me = await responseWithJson('/api/auth/me', { headers: { Cookie: cookie } });
  assert(me.response.ok && me.payload?.authenticated && me.payload?.role === 'STAFF', `${name} session lookup failed.`);
  const routes = await responseWithJson('/api/lecturer/promotion-routes', { headers: { Cookie: cookie } });
  assert(routes.response.ok && routes.payload?.success, `${name} route catalogue failed.`);
  const available = routes.payload.data.routes || [];
  assert(available.some((route) => route.code.startsWith(routePrefix) && route.canStart), `${name} has no startable ${routePrefix} route.`);
  const formsPage = await fetch(`${BASE_URL}/lecturer-portal/official-forms`, { headers: { Cookie: cookie } });
  assert(formsPage.ok, `${name} official forms workspace returned ${formsPage.status}.`);
  console.log(`OK applicant login: ${name} (STAFF) -> ${routePrefix} promotion routes`);
}

async function verifySystemAdminBoundary() {
  const cookie = await login('system.admin@live.gctu.edu.gh', ROLE_PASSWORD, 'SYSTEM_ADMIN');
  const headers = { Cookie: cookie };
  const cases = await responseWithJson('/api/promotion-requests?scope=hr', { headers });
  const audit = await responseWithJson('/api/audit/logs', { headers });
  const records = await responseWithJson('/api/promotion-requests/1/records', { headers });
  assert(cases.response.status === 403, `System administration received HTTP ${cases.response.status} for the HRODD case queue.`);
  assert([401, 403].includes(audit.response.status), 'System administration could read promotion audit content.');
  assert([401, 403].includes(records.response.status), 'System administration could read controlled promotion records.');
  console.log('OK duty separation: technical administration cannot view or decide promotion case content');
}

async function main() {
  const health = await responseWithJson('/api/health');
  assert(health.response.ok && health.payload?.success && health.payload.database === 'connected', 'Health endpoint is not ready.');
  console.log(`OK health: application ready, database ${health.payload.database}`);
  await verifyNoPublicRegistration();
  for (const account of roleAccounts) await verifyRoleAccount(account);
  await verifySystemAdminBoundary();
  for (const applicant of applicants) await verifyApplicant(applicant);

  const anonymousRecords = await responseWithJson('/api/promotion-requests/10/records');
  assert(anonymousRecords.response.status === 401, 'Anonymous records-control access was not denied.');
  console.log('OK records boundary: anonymous access denied');
  console.log('Defence live-server check passed with HRODD roster-first identity and all eight seeded logins.');
}

main().catch((error) => {
  console.error('Defence live-server check failed:', error.message || error);
  process.exitCode = 1;
});
