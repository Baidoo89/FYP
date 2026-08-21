const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { FORM_TEMPLATES, resolveApplicableTemplates, validateOfficialFormTemplates } = require('../lib/forms/gctu-official-forms');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('official form catalogue is versioned, route-scoped, and internally valid', () => {
  assert.equal(validateOfficialFormTemplates(), true);
  assert.equal(FORM_TEMPLATES.length, 17);
  assert.equal(new Set(FORM_TEMPLATES.map((item) => `${item.code}:${item.version}`)).size, FORM_TEMPLATES.length);
  const library = resolveApplicableTemplates({ routeCode: 'K-LIBRARY-MIDDLE', trackType: 'SCHEDULE_K', staffCategory: 'PROFESSIONAL_SENIOR_MEMBER' });
  assert.ok(library.some((item) => item.code === 'GCTU_LIBRARY_ABILITY_ASSESSMENT'));
  assert.ok(library.some((item) => item.code === 'GCTU_SCHEDULE_K_APPLICATION_PART_A'));
  assert.ok(!library.some((item) => item.code === 'GCTU_REGISTRY_ABILITY_ASSESSMENT'));
});

test('formal submission requires signed frozen applicant forms and route-specific stages', () => {
  const workflow = read('lib', 'promotion-workflow.ts');
  assert.ok(workflow.includes('assertOfficialApplicantFormsFrozen'));
  assert.ok(workflow.includes('OfficialFormSubmissionStatus.FROZEN'));
  assert.ok(workflow.includes('externalAssessorCount > 0'));
  assert.ok(workflow.includes('route.finalAuthority === DecisionAuthority.COUNCIL'));
  assert.ok(workflow.includes('PromotionStage.FINAL_NOTIFICATION'));
});

test('governance completion enforces forms, external report counts, quorum, and explicit recommendations', () => {
  const route = read('app', 'api', 'promotion-requests', '[id]', 'governance', 'route.ts');
  assert.ok(route.includes('stageCompletionError'));
  assert.ok(route.includes('Receive ${required} signed confidential external assessment'));
  assert.ok(route.includes('quorumMet: true'));
  assert.ok(route.includes('Select the committee recommendation before completing this stage.'));
});

test('Schedule K applicant forms enforce immutable cross-case output reuse checks', () => {
  const route = read('app', 'api', 'promotion-requests', '[id]', 'forms', 'route.ts');
  const service = read('lib', 'forms', 'official-form-service.ts');
  const component = read('components', 'promotion', 'DynamicOfficialForm.tsx');
  assert.ok(route.includes('professionalOutputReuseErrors'));
  assert.ok(route.includes('GCTU_SCHEDULE_K_APPLICATION_PART_A'));
  assert.ok(route.includes('Professional outputs already counted for promotion cannot be reused.'));
  assert.ok(service.includes('was already counted in'));
  assert.ok(component.includes("column.type === 'checkbox'"));
});

test('committee governance stores named attendance, conflicts, recusals, and rank eligibility', () => {
  const schema = read('prisma', 'schema.prisma');
  const route = read('app', 'api', 'promotion-requests', '[id]', 'committee-meetings', 'route.ts');
  assert.ok(schema.includes('model CommitteeMeetingParticipant {'));
  assert.ok(route.includes('Applicant excluded from own case'));
  assert.ok(route.includes('Member rank below target rank'));
  assert.ok(route.includes('Conflict declared'));
  assert.ok(route.includes('Math.ceil(participants.length / 2)'));
  assert.ok(route.includes('vice[- ]chancellor'));
});

test('failed FAPC constitution uses a controlled HRODD waiver without removing later evidence controls', () => {
  const route = read('app', 'api', 'promotion-requests', '[id]', 'governance', 'route.ts');
  const component = read('components', 'promotion', 'GovernedStageWorkspace.tsx');
  assert.ok(route.includes('facultyWaiverError'));
  assert.ok(route.includes('quorumMet: false'));
  assert.ok(route.includes("participants: { some: {} }"));
  assert.ok(route.includes("session.role !== 'HR_ADMIN'"));
  assert.ok(route.includes('decision === PromotionStageStatus.COMPLETED || decision === PromotionStageStatus.WAIVED'));
  assert.ok(component.includes('FAPC cannot be lawfully constituted'));
  assert.ok(component.includes('continues through every remaining required evidence stage'));
});

test('external assessor access uses hashed expiring tokens and a confidential signed submission', () => {
  const invitation = read('lib', 'external-assessor-invitation.ts');
  const portalRoute = read('app', 'api', 'external-assessment', '[token]', 'route.ts');
  const middleware = read('middleware.ts');
  assert.ok(invitation.includes("createHash('sha256')"));
  assert.ok(invitation.includes('invitationExpiresAt'));
  assert.ok(portalRoute.includes('termsAcceptedAt'));
  assert.ok(portalRoute.includes('conflictDeclaredAt'));
  assert.ok(portalRoute.includes('OfficialFormSubmissionStatus.FROZEN'));
  assert.ok(middleware.includes("'/external-assessment'"));
});

test('appeal, communication, and record controls are configurable and non-destructive', () => {
  const appeal = read('app', 'api', 'promotion-requests', '[id]', 'appeals', 'route.ts');
  const records = read('app', 'api', 'promotion-requests', '[id]', 'records', 'route.ts');
  const migration = read('prisma', 'migrations', '20260821150000_communications_records_and_sla', 'migration.sql');
  assert.ok(appeal.includes('promotion.appeal.initialWindowMonths'));
  assert.ok(appeal.includes('dueAt.setMonth'));
  assert.ok(records.includes('Disposition cannot be authorized while a hold is active.'));
  assert.ok(records.includes('destructionCertificateReference'));
  assert.ok(!/^\s*(?:DELETE\s+FROM|DROP\s+(?:TABLE|COLUMN)|TRUNCATE\s+TABLE)\b/im.test(migration));
  assert.ok(migration.includes('communication_deliveries'));
  assert.ok(migration.includes('promotion_record_controls'));
});

test('quarterly applicant updates and effective dates are controlled and auditable', () => {
  const records = read('app', 'api', 'promotion-requests', '[id]', 'records', 'route.ts');
  const email = read('lib', 'workflow-email.ts');
  const panel = read('components', 'promotion', 'RecordsControlPanel.tsx');
  const pack = read('app', 'api', 'promotion-requests', '[id]', 'official-pack', 'route.ts');
  assert.ok(email.includes('sendApplicantQuarterlyStatusEmail'));
  assert.ok(email.includes('CommunicationPurpose.QUARTERLY_STATUS_UPDATE'));
  assert.ok(records.includes("action === 'SEND_STATUS_UPDATE'"));
  assert.ok(records.includes('if (delivery.delivered)'));
  assert.ok(records.includes('nextApplicantUpdateDueAt.setMonth'));
  assert.ok(records.includes("action === 'SET_EFFECTIVE_DATE'"));
  assert.ok(records.includes('getUTCMonth() === 1'));
  assert.ok(records.includes('getUTCMonth() === 7'));
  assert.ok(records.includes('promotion_effective_date_set'));
  assert.ok(panel.includes('Quarterly applicant update'));
  assert.ok(pack.includes("if (session.role === 'HR_ADMIN')"));
});

test('technical system administration cannot view content or exercise promotion authority', () => {
  const workflow = read('lib', 'promotion-workflow.ts');
  const rbac = read('lib', 'rbac.ts');
  const forms = read('app', 'api', 'promotion-requests', '[id]', 'forms', 'route.ts');
  const governance = read('app', 'api', 'promotion-requests', '[id]', 'governance', 'route.ts');
  const meetings = read('app', 'api', 'promotion-requests', '[id]', 'committee-meetings', 'route.ts');
  const assessors = read('app', 'api', 'promotion-requests', '[id]', 'external-assessors', 'route.ts');
  const records = read('app', 'api', 'promotion-requests', '[id]', 'records', 'route.ts');
  const pack = read('app', 'api', 'promotion-requests', '[id]', 'official-pack', 'route.ts');
  assert.ok(forms.includes('Technical administration cannot view promotion-form content.'));
  assert.ok(!governance.match(/(?:DEPARTMENT|FACULTY|RAPC|UAPC|COUNCIL): \[[^\]]*SYSTEM_ADMIN/));
  assert.ok(!meetings.match(/MEETING_ROLES[^\n]*SYSTEM_ADMIN/));
  assert.ok(!assessors.match(/(?:NOMINATION|MANAGEMENT)_ROLES[^\n]*SYSTEM_ADMIN/));
  assert.ok(!records.match(/VIEW_ROLES[^\n]*SYSTEM_ADMIN/));
  assert.ok(!pack.match(/EXPORT_ROLES[^\n]*SYSTEM_ADMIN/));
  assert.ok(!workflow.match(/assertActorRole\([^\n]*SYSTEM_ADMIN/));
  assert.ok(rbac.includes("{ prefix: '/system-admin', roles: ['SYSTEM_ADMIN'] }"));
  assert.ok(!rbac.match(/prefix: '\/(?:hod|hr|committee|analytics|audit|promotions)'[^\n]*SYSTEM_ADMIN/));
});
