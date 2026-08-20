const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000';

const applicants = [
  { name: 'Benjamin Baidoo', email: '4231230141@live.gctu.edu.gh', password: 'Applicant123!', expectedRoutePrefix: 'J-' },
  { name: 'Sucess Likem', email: '4231230154@live.gctu.edu.gh', password: 'Applicant123!', expectedRoutePrefix: 'K-' },
  { name: 'Esther Appiah', email: '4231231237@live.gctu.edu.gh', password: 'Applicant123!', expectedRoutePrefix: 'K-' },
];

const roleAccounts = [
  { name: 'HR/HRODD', email: 'hr.admin@live.gctu.edu.gh', password: 'Password123!', scope: 'hr', page: '/hr/requests' },
  { name: 'HOD/Dean', email: 'hod.dean@live.gctu.edu.gh', password: 'Password123!', scope: 'department', page: '/hod/review-queue' },
  { name: 'Committee Reviewer', email: 'committee.reviewer@live.gctu.edu.gh', password: 'Password123!', scope: 'committee', page: '/committee/review' },
  { name: 'System Admin', email: 'system.admin@live.gctu.edu.gh', password: 'Password123!', scope: 'hr', page: '/system-admin/dashboard' },
];

function cookieFrom(response) {
  const raw = response.headers.get('set-cookie');
  if (!raw) throw new Error('No session cookie returned');
  return raw.split(',').map((part) => part.split(';')[0]).join('; ');
}

async function jsonRequest(path, options = {}) {
  const response = await fetch(BASE_URL + path, options);
  let payload = null;
  try { payload = await response.json(); } catch (_) {}
  if (!response.ok || (payload && payload.success === false)) {
    throw new Error(`${path} failed (${response.status}): ${payload?.error || response.statusText}`);
  }
  return { response, payload };
}

async function login(email, password) {
  const { response, payload } = await jsonRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });
  return { cookie: cookieFrom(response), role: payload.role, name: payload.name };
}

async function smokeApplicant(account) {
  const session = await login(account.email, account.password);
  const routesResult = await jsonRequest('/api/lecturer/promotion-routes', { headers: { cookie: session.cookie } });
  const routes = routesResult.payload.data.routes || [];
  const route = routes.find((item) => item.canStart && item.code.startsWith(account.expectedRoutePrefix)) || routes.find((item) => item.canStart);
  if (!route) throw new Error(`${account.name} has no startable route. Routes: ${routes.map((item) => `${item.code}:${item.canStart}`).join(', ')}`);

  const created = await jsonRequest('/api/promotion-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: session.cookie },
    body: JSON.stringify({ routeCode: route.code, adminComment: `DEMO_PROMOTION_INSTANCE smoke test for ${account.name}` }),
  });
  const request = created.payload.data;
  if (!request || request.status !== 'DRAFT') throw new Error(`${account.name} did not create a draft application`);

  await jsonRequest(`/api/promotion-requests/${request.id}/governance`, { headers: { cookie: session.cookie } });
  const pack = await fetch(BASE_URL + `/api/promotion-requests/${request.id}/official-pack`, { headers: { cookie: session.cookie } });
  const contentType = pack.headers.get('content-type') || '';
  if (!pack.ok || !contentType.includes('application/pdf')) throw new Error(`${account.name} official pack did not return a PDF (${pack.status}, ${contentType})`);

  return { name: account.name, role: session.role, route: route.code, requestId: request.id, status: request.status, pack: 'PDF' };
}

async function smokeRole(account) {
  const session = await login(account.email, account.password);
  await jsonRequest(`/api/promotion-requests?scope=${account.scope}`, { headers: { cookie: session.cookie } });
  const page = await fetch(BASE_URL + account.page, { headers: { cookie: session.cookie } });
  if (!page.ok) throw new Error(`${account.name} page ${account.page} returned ${page.status}`);
  return { name: account.name, role: session.role, scope: account.scope, page: `${account.page} ${page.status}` };
}

async function main() {
  const applicantResults = [];
  for (const account of applicants) applicantResults.push(await smokeApplicant(account));
  const roleResults = [];
  for (const account of roleAccounts) roleResults.push(await smokeRole(account));
  console.log('Applicant smoke results');
  console.table(applicantResults);
  console.log('Reviewer/admin smoke results');
  console.table(roleResults);
}

main().catch((error) => {
  console.error('Smoke test failed.');
  console.error(error.message || error);
  process.exit(1);
});