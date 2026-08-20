const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('governed promotion workflow models every institutional stage', () => {
  const schema = fs.readFileSync(path.join(root, 'prisma', 'schema.prisma'), 'utf8');
  for (const name of ['PromotionStageRecord', 'PromotionAssessment', 'ExternalAssessor', 'CommitteeMeeting', 'AppealCase']) {
    assert.ok(schema.includes('model ' + name + ' {'));
  }
  for (const stage of ['DEPARTMENT', 'FACULTY', 'RAPC', 'EXTERNAL_ASSESSMENT', 'UAPC', 'COUNCIL', 'APPEAL']) {
    assert.ok(schema.includes('  ' + stage));
  }
});

test('formal submission initializes route-specific stage chains', () => {
  const workflow = fs.readFileSync(path.join(root, 'lib', 'promotion-workflow.ts'), 'utf8');
  assert.ok(workflow.includes('initializePromotionStages'));
  assert.ok(workflow.includes('PromotionStage.EXTERNAL_ASSESSMENT'));
  assert.ok(workflow.includes('PromotionStage.UAPC'));
  assert.ok(workflow.includes('PromotionStage.COUNCIL'));
});


test('governed stage decisions are protected by stage authority, self-review, and active-state checks', () => {
  const route = fs.readFileSync(path.join(root, 'app', 'api', 'promotion-requests', '[id]', 'governance', 'route.ts'), 'utf8');
  assert.ok(route.includes('export async function POST'));
  assert.ok(route.includes('STAGE_ROLES'));
  assert.ok(route.includes('You cannot review your own promotion file.'));
  assert.ok(route.includes('Only the active workflow stage can be decided.'));
  assert.ok(route.includes('promotion_workflow_stage_decided'));
});
test('external assessor lifecycle enforces official nomination and report controls', () => {
  const route = fs.readFileSync(path.join(root, 'app', 'api', 'promotion-requests', '[id]', 'external-assessors', 'route.ts'), 'utf8');
  const component = fs.readFileSync(path.join(root, 'components', 'promotion', 'ExternalAssessorLifecycle.tsx'), 'utf8');
  assert.ok(route.includes('export async function POST'));
  assert.ok(route.includes('export async function PATCH'));
  assert.ok(route.includes('canAccessDepartmentPromotionRequest'));
  assert.ok(route.includes('ExternalAssessorStatus.REPORT_RECEIVED'));
  assert.ok(route.includes('external_assessor_nominated'));
  assert.ok(component.includes('at least three assessor candidates'));
});
test('committee meeting records enforce authority, quorum, recommendation, and audit trail', () => {
  const route = fs.readFileSync(path.join(root, 'app', 'api', 'promotion-requests', '[id]', 'committee-meetings', 'route.ts'), 'utf8');
  const component = fs.readFileSync(path.join(root, 'components', 'promotion', 'CommitteeMeetingPanel.tsx'), 'utf8');
  assert.ok(route.includes('export async function POST'));
  assert.ok(route.includes('MEETING_ROLES'));
  assert.ok(route.includes('quorumPresent >= quorumRequired'));
  assert.ok(route.includes('committee_meeting_recorded'));
  assert.ok(component.includes('Committee Meeting Record'));
  assert.ok(component.includes('Formal resolution'));
});
test('appeal lifecycle protects applicant filing, decision controls, and audit trail', () => {
  const route = fs.readFileSync(path.join(root, 'app', 'api', 'promotion-requests', '[id]', 'appeals', 'route.ts'), 'utf8');
  const component = fs.readFileSync(path.join(root, 'components', 'promotion', 'AppealPanel.tsx'), 'utf8');
  assert.ok(route.includes('APPEALABLE_STATUSES'));
  assert.ok(route.includes('Only the applicant can file an appeal.'));
  assert.ok(route.includes('promotion_appeal_filed'));
  assert.ok(route.includes('promotion_appeal_status_updated'));
  assert.ok(component.includes('Appeal Record'));
  assert.ok(component.includes('File appeal'));
});
test('official promotion file pack exports the governed workflow record', () => {
  const route = fs.readFileSync(path.join(root, 'app', 'api', 'promotion-requests', '[id]', 'official-pack', 'route.ts'), 'utf8');
  const applicantPage = fs.readFileSync(path.join(root, 'app', 'lecturer-portal', 'application', 'page.tsx'), 'utf8');
  const hrPage = fs.readFileSync(path.join(root, 'app', 'hr', 'requests', 'page.tsx'), 'utf8');
  assert.ok(route.includes('GCTU STAFF PROMOTION OFFICIAL FILE PACK'));
  assert.ok(route.includes('workflowStages'));
  assert.ok(route.includes('externalAssessors'));
  assert.ok(route.includes('committeeMeetings'));
  assert.ok(route.includes('appealCases'));
  assert.ok(route.includes('promotion_official_pack_exported'));
  assert.ok(applicantPage.includes('/official-pack'));
  assert.ok(hrPage.includes('/official-pack'));
});