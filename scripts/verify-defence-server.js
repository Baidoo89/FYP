const BASE_URL = (process.env.DEFENCE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const PASSWORD = 'Password123!';
const ACCOUNTS = [
  ['Benjamin Baidoo', 'benjamin.baidoo@live.gctu.edu.gh', 'LECTURER'],
  ['Computer Science HOD', 'hod.dean@live.gctu.edu.gh', 'HOD_DEAN'],
  ['FoCIS Dean', 'dean.focis@live.gctu.edu.gh', 'HOD_DEAN'],
  ['HR Administrator', 'hr.admin@live.gctu.edu.gh', 'HR_ADMIN'],
  ['Committee Reviewer', 'committee.reviewer@live.gctu.edu.gh', 'COMMITTEE_REVIEWER'],
  ['System Administrator', 'system.admin@live.gctu.edu.gh', 'SYSTEM_ADMIN'],
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function login(email, expectedRole) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password: PASSWORD }),
  });
  const payload = await response.json();
  assert(response.ok && payload.success, `${email} login failed with HTTP ${response.status}.`);
  assert(payload.role === expectedRole, `${email} returned ${payload.role}; expected ${expectedRole}.`);
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  assert(cookie, `${email} login did not return a session cookie.`);
  return cookie;
}

async function main() {
  const healthResponse = await fetch(`${BASE_URL}/api/health`);
  const health = await healthResponse.json();
  assert(healthResponse.ok && health.success && health.database === 'connected', 'Health endpoint is not ready.');
  console.log(`OK health: application ready, database ${health.database}`);

  let benjaminCookie = '';
  for (const [name, email, role] of ACCOUNTS) {
    const cookie = await login(email, role);
    if (role === 'LECTURER') benjaminCookie = cookie;
    console.log(`OK login: ${name} (${role})`);
  }

  const dashboardResponse = await fetch(`${BASE_URL}/api/lecturer/dashboard`, {
    headers: { Cookie: benjaminCookie },
  });
  const dashboard = await dashboardResponse.json();
  assert(dashboardResponse.ok && dashboard.success, 'Benjamin dashboard API failed.');
  assert(dashboard.data?.user?.name === 'Benjamin Baidoo', 'Benjamin dashboard identity is incorrect.');
  assert(dashboard.data?.activeRequest?.status === 'DRAFT', 'Benjamin active application is not the prepared Draft.');
  console.log('OK lecturer dashboard: Benjamin Baidoo with active Draft application');

  const fileUrl = `${BASE_URL}/api/uploads/benjamin-defence-current-teaching.pdf`;
  const anonymousFile = await fetch(fileUrl);
  assert(anonymousFile.status === 401, `Anonymous PDF request returned ${anonymousFile.status}; expected 401.`);
  const protectedFile = await fetch(fileUrl, { headers: { Cookie: benjaminCookie, Range: 'bytes=0-7' } });
  const bytes = Buffer.from(await protectedFile.arrayBuffer());
  assert(protectedFile.status === 206, `Protected range request returned ${protectedFile.status}; expected 206.`);
  assert(bytes.subarray(0, 4).toString() === '%PDF', 'Protected evidence response is not a valid PDF header.');
  assert(protectedFile.headers.get('content-type') === 'application/pdf', 'Protected evidence has the wrong content type.');
  console.log('OK protected PDF: anonymous access denied; Benjamin range request returned valid PDF data');
  console.log('Defence live-server check passed.');
}

main().catch((error) => {
  console.error('Defence live-server check failed:', error.message);
  process.exitCode = 1;
});
