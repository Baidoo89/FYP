const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BASE_URL = (process.env.WORKFLOW_SMOKE_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const PASSWORD = process.env.WORKFLOW_SMOKE_PASSWORD || 'Password123!';
const ROLE_PASSWORD = process.env.WORKFLOW_SMOKE_ROLE_PASSWORD || PASSWORD;

const REQUIRED_ROLE_USERS = {
  HOD_DEAN: 'hod.demo@gctu.edu.gh',
  HR_ADMIN: 'hr.admin@gctu.edu.gh',
  COMMITTEE_REVIEWER: 'committee.demo@gctu.edu.gh',
};

const REQUIRED_CATEGORIES = [
  'TEACHING',
  'RESEARCH',
  'SERVICE',
  'QUALIFICATIONS',
  'PUBLICATIONS',
  'PROFESSIONAL_DEVELOPMENT',
];

const PDF_BYTES = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n'
);

function absoluteUrl(path) {
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function cookieFrom(response) {
  const cookie = response.headers.get('set-cookie');
  if (!cookie) {
    throw new Error('Login response did not include a session cookie.');
  }

  return cookie.split(';')[0];
}

async function apiJson(session, path, options = {}) {
  const headers = new Headers(options.headers || {});
  const method = options.method || 'GET';

  if (session?.cookie) {
    headers.set('cookie', session.cookie);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(absoluteUrl(path), {
    ...options,
    method,
    headers,
  });

  const body = await parseResponse(response);
  const failed = !response.ok || body?.success === false;

  if (failed) {
    const detail = body?.error || body?.message || body?.raw || response.statusText;
    throw new Error(`${method} ${path} failed (${response.status}): ${detail}`);
  }

  return body;
}

async function login(username, password = ROLE_PASSWORD) {
  const response = await fetch(absoluteUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const body = await parseResponse(response);

  if (!response.ok || body?.success === false) {
    const detail = body?.error || body?.message || response.statusText;
    throw new Error(`Login failed for ${username}: ${detail}. Run npm run reset:demo-auth if demo passwords were changed.`);
  }

  return {
    username,
    role: body.role,
    cookie: cookieFrom(response),
  };
}

async function ensureServer() {
  try {
    const health = await apiJson(null, '/api/health');
    assert(health?.success === true, 'Health endpoint did not report success.');
    console.log(`OK server healthy at ${BASE_URL}`);
  } catch (error) {
    throw new Error(`Workflow smoke requires the Next.js server at ${BASE_URL}. Start it with npm run dev first. ${error.message}`);
  }
}

async function getRequiredUser(email, expectedRole) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      departmentId: true,
      facultyId: true,
      isActive: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw new Error(`Missing required ${expectedRole} demo user: ${email}. Run npm run db:seed first.`);
  }

  if (user.role !== expectedRole) {
    throw new Error(`${email} has role ${user.role}, expected ${expectedRole}.`);
  }

  return user;
}

async function createSmokeLecturer(hodUser) {
  const now = Date.now();
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const department = hodUser.department || 'Computer Science';

  return prisma.user.create({
    data: {
      name: `Workflow Smoke Lecturer ${now}`,
      email: `workflow.smoke.${now}@live.gctu.edu.gh`,
      staffId: `SMOKE-${now}`,
      password: passwordHash,
      passwordHash,
      role: 'LECTURER',
      currentRank: 'LECTURER',
      department,
      departmentId: hodUser.departmentId || null,
      facultyId: hodUser.facultyId || null,
      phone: '+233000000000',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      onboarded: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

async function seedScores(requestId, actorId) {
  await prisma.score.createMany({
    data: [
      {
        promotionRequestId: requestId,
        category: 'TEACHING',
        score: 78,
        weight: 0.4,
        weightedScore: 31.2,
        performanceCategory: 'EXCELLENT',
        createdById: actorId,
      },
      {
        promotionRequestId: requestId,
        category: 'RESEARCH',
        score: 72,
        weight: 0.4,
        weightedScore: 28.8,
        performanceCategory: 'EXCELLENT',
        createdById: actorId,
      },
      {
        promotionRequestId: requestId,
        category: 'SERVICE',
        score: 70,
        weight: 0.2,
        weightedScore: 14,
        performanceCategory: 'EXCELLENT',
        createdById: actorId,
      },
    ],
  });

  await prisma.promotionRequest.update({
    where: { id: requestId },
    data: { totalScore: 74 },
  });
}

async function uploadEvidence(session, category) {
  const form = new FormData();
  form.set('category', category);
  form.set('title', `${category.replace(/_/g, ' ')} smoke evidence`);
  form.set('file', new Blob([PDF_BYTES], { type: 'application/pdf' }), `${category.toLowerCase()}-smoke.pdf`);

  return apiJson(session, '/api/lecturer/evidence', {
    method: 'POST',
    body: form,
  });
}

async function assertFinalWorkflow(requestId) {
  const request = await prisma.promotionRequest.findUnique({
    where: { id: requestId },
    include: {
      documents: true,
      statusHistory: true,
      auditLogs: true,
      notifications: true,
      reviewComments: true,
    },
  });

  assert(request, 'Final promotion request was not found.');
  assert(request.status === 'COMPLETED', `Expected final status COMPLETED, found ${request.status}.`);
  assert(request.eligibilityStatus === 'ELIGIBLE', `Expected eligibility ELIGIBLE, found ${request.eligibilityStatus}.`);
  assert(Number(request.totalScore) >= 55, `Expected total score to meet criteria, found ${request.totalScore}.`);
  assert(request.submittedAt, 'Expected submittedAt to be set.');
  assert(request.reviewedAt, 'Expected reviewedAt to be set by committee recommendation.');
  assert(request.completedAt, 'Expected completedAt to be set by final admin action.');
  assert(request.documents.length === REQUIRED_CATEGORIES.length, `Expected ${REQUIRED_CATEGORIES.length} documents, found ${request.documents.length}.`);
  assert(request.documents.every((document) => document.verificationStatus === 'VERIFIED'), 'Expected every document to be verified.');
  assert(request.reviewComments.length >= 2, 'Expected department and committee review comments.');
  assert(request.notifications.length >= 4, 'Expected workflow notifications to be created.');

  const historyStatuses = new Set(request.statusHistory.map((entry) => entry.newStatus));
  for (const status of ['DRAFT', 'SUBMITTED', 'UNDER_DEPARTMENT_REVIEW', 'UNDER_HR_VERIFICATION', 'UNDER_COMMITTEE_REVIEW', 'RECOMMENDED', 'COMPLETED']) {
    assert(historyStatuses.has(status), `Missing status history entry for ${status}.`);
  }

  const auditActions = new Set(request.auditLogs.map((entry) => entry.action));
  for (const action of [
    'promotion_request.create',
    'promotion_request.submit',
    'department_review.comment_added',
    'promotion_document.verified',
    'ELIGIBILITY_CALCULATED',
    'committee_review.comment_added',
    'committee_review.recommended',
    'promotion_request.status_changed',
  ]) {
    assert(auditActions.has(action), `Missing audit log action ${action}.`);
  }

  const verificationCount = await prisma.verification.count({
    where: {
      document: {
        requestId,
      },
    },
  });

  assert(verificationCount === REQUIRED_CATEGORIES.length, `Expected ${REQUIRED_CATEGORIES.length} verification records, found ${verificationCount}.`);
}

async function main() {
  await prisma.$connect();
  await ensureServer();

  const hod = await getRequiredUser(REQUIRED_ROLE_USERS.HOD_DEAN, 'HOD_DEAN');
  const hr = await getRequiredUser(REQUIRED_ROLE_USERS.HR_ADMIN, 'HR_ADMIN');
  await getRequiredUser(REQUIRED_ROLE_USERS.COMMITTEE_REVIEWER, 'COMMITTEE_REVIEWER');

  const lecturer = await createSmokeLecturer(hod);
  console.log(`OK smoke lecturer created: ${lecturer.email}`);

  const lecturerSession = await login(lecturer.email, PASSWORD);
  const hodSession = await login(REQUIRED_ROLE_USERS.HOD_DEAN);
  const hrSession = await login(REQUIRED_ROLE_USERS.HR_ADMIN);
  const committeeSession = await login(REQUIRED_ROLE_USERS.COMMITTEE_REVIEWER);
  console.log('OK role logins completed');

  const created = await apiJson(lecturerSession, '/api/promotion-requests', {
    method: 'POST',
    body: JSON.stringify({
      lecturerId: lecturer.id,
      currentRank: 'LECTURER',
      targetRank: 'SENIOR_LECTURER',
      yearsInCurrentRank: 5,
      adminComment: 'Workflow smoke application created through the public API.',
    }),
  });

  const requestId = created.data.id;
  assert(Number.isInteger(requestId), 'Create promotion request did not return a numeric id.');
  console.log(`OK promotion request created: ${requestId}`);

  await seedScores(requestId, hr.id);
  console.log('OK eligibility score fixture prepared');

  const uploadedDocuments = [];
  for (const category of REQUIRED_CATEGORIES) {
    const uploaded = await uploadEvidence(lecturerSession, category);
    uploadedDocuments.push(uploaded.data.document);
  }
  console.log(`OK uploaded ${uploadedDocuments.length} required evidence documents`);

  await apiJson(lecturerSession, '/api/promotion-requests', {
    method: 'POST',
    body: JSON.stringify({
      action: 'submit',
      requestId,
    }),
  });
  console.log('OK lecturer submitted application');

  await apiJson(hodSession, `/api/promotion-requests/${requestId}/review`, {
    method: 'POST',
    body: JSON.stringify({
      decision: 'FORWARD_TO_HR',
      comment: 'Workflow smoke department review confirms evidence is ready for HR verification.',
    }),
  });
  console.log('OK HOD/Dean forwarded application to HR');

  for (const document of uploadedDocuments) {
    await apiJson(hrSession, `/api/promotion-requests/${requestId}/verify`, {
      method: 'POST',
      body: JSON.stringify({
        documentId: document.id,
        verificationStatus: 'VERIFIED',
        comment: `Workflow smoke verified ${document.category.toLowerCase().replace(/_/g, ' ')} evidence.`,
      }),
    });
  }
  console.log('OK HR verified required documents and eligibility routed');

  await apiJson(committeeSession, `/api/promotion-requests/${requestId}/review`, {
    method: 'POST',
    body: JSON.stringify({
      recommendation: 'RECOMMENDED',
      comment: 'Workflow smoke committee recommendation recorded after verified eligibility.',
    }),
  });
  console.log('OK committee recommendation recorded');

  await apiJson(hrSession, `/api/promotion-requests/${requestId}/status`, {
    method: 'POST',
    body: JSON.stringify({
      status: 'COMPLETED',
      comment: 'Workflow smoke final administrative completion recorded.',
    }),
  });
  console.log('OK HR completed final administrative status');

  await assertFinalWorkflow(requestId);
  console.log('Workflow smoke passed');
}

main()
  .catch((error) => {
    console.error('Workflow smoke failed');
    console.error(error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
