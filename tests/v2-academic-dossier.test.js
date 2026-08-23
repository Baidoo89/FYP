const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  OUTPUT_EQUIVALENCE_UNITS,
  academicRequirementsFromRoute,
  evaluateAcademicDossier,
} = require('../lib/academic-dossier-rules');
const { ROUTES } = require('../lib/policy/v2-foundation');

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('Schedule J equivalence units match the controlling master blueprint', () => {
  assert.deepEqual(OUTPUT_EQUIVALENCE_UNITS, {
    REFEREED_JOURNAL_ARTICLE: 1,
    PEER_REVIEWED_HIGHER_EDUCATION_BOOK: 3,
    PEER_REVIEWED_EXHIBITION: 1,
    INDEXED_CONFERENCE_PROCEEDING: 1,
    NON_INDEXED_CONFERENCE_PROCEEDING: 0.5,
    DEPLOYED_TECHNOLOGY_PRODUCT_DESIGN: 2,
    PATENTED_INVENTION: 3,
    PEER_REVIEWED_BOOK_CHAPTER: 1,
    NON_PEER_REVIEWED_BOOK_CHAPTER: 0.5,
  });
});

test('Lecturer to Senior Lecturer resolves six-to-ten, six refereed, and best-six rules', () => {
  const route = ROUTES.find((item) => item.code === 'J-LECTURER-TO-SENIOR-LECTURER');
  assert.ok(route);
  assert.deepEqual(academicRequirementsFromRoute(route.requirements), {
    submittedMinimum: 6,
    submittedMaximum: 10,
    minimumRefereed: 6,
    bestOutputsRequired: 6,
  });
});

test('best-N readiness separates policy blockers from post-submission verification work', () => {
  const requirements = { submittedMinimum: 6, submittedMaximum: 10, minimumRefereed: 6, bestOutputsRequired: 6 };
  const outputs = Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    type: 'REFEREED_JOURNAL_ARTICLE',
    claimedForCurrentRoute: true,
    isRefereed: true,
    departmentVerificationStatus: 'PENDING',
    libraryVerificationStatus: 'PENDING',
  }));
  const result = evaluateAcademicDossier({
    requirements,
    outputs,
    selectedOutputIds: outputs.map((output) => output.id),
    applicantDeclaration: true,
  });

  assert.equal(result.readyForSubmission, true);
  assert.equal(result.blockers.length, 0);
  assert.equal(result.warnings[0].code, 'OUTPUT_VERIFICATION_PENDING');
  assert.equal(result.metrics.selectedEquivalentUnits, 6);
});

test('best-N readiness rejects incomplete, duplicate, and out-of-route selections', () => {
  const requirements = { submittedMinimum: 6, submittedMaximum: 10, minimumRefereed: 6, bestOutputsRequired: 6 };
  const outputs = Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    type: 'REFEREED_JOURNAL_ARTICLE',
    claimedForCurrentRoute: index !== 5,
    isRefereed: index !== 5,
    departmentVerificationStatus: 'PENDING',
    libraryVerificationStatus: 'PENDING',
  }));
  const result = evaluateAcademicDossier({
    requirements,
    outputs,
    selectedOutputIds: [1, 1, 2, 3, 4, 6],
    applicantDeclaration: false,
  });
  const blockerCodes = result.blockers.map((blocker) => blocker.code);

  assert.equal(result.readyForSubmission, false);
  assert.ok(blockerCodes.includes('DECLARATION_REQUIRED'));
  assert.ok(blockerCodes.includes('OUTPUT_MINIMUM_NOT_MET'));
  assert.ok(blockerCodes.includes('REFEREED_MINIMUM_NOT_MET'));
  assert.ok(blockerCodes.includes('BEST_N_INCOMPLETE'));
  assert.ok(blockerCodes.includes('DUPLICATE_SELECTION'));
  assert.ok(blockerCodes.includes('INVALID_SELECTION'));
});

test('Schedule J dossier migration is additive and packet snapshots are modeled', () => {
  const migration = source('prisma/migrations/20260810160000_schedule_j_dossier_foundation/migration.sql');
  const snapshotMigration = source('prisma/migrations/20260810170000_schedule_j_submission_snapshot/migration.sql');
  assert.match(migration, /CREATE TABLE "academic_dossiers"/);
  assert.match(migration, /CREATE TABLE "scholarly_outputs"/);
  assert.match(migration, /CREATE TABLE "academic_assessment_packets"/);
  assert.match(migration, /"outputSnapshot" JSONB/);
  assert.doesNotMatch(migration, /DROP\s+TABLE|DROP\s+COLUMN|DELETE\s+FROM|TRUNCATE/i);
  assert.match(snapshotMigration, /ADD COLUMN\s+"dossierSnapshot" JSONB/);
  assert.match(snapshotMigration, /ADD COLUMN\s+"dossierVersion" INTEGER/);
  assert.match(snapshotMigration, /ADD COLUMN\s+"receiptNumber" TEXT/);
  assert.match(snapshotMigration, /CREATE TABLE "scholarly_output_evidence"/);
  assert.doesNotMatch(snapshotMigration, /DROP\s+TABLE|DROP\s+COLUMN|DELETE\s+FROM|TRUNCATE/i);

  for (const schemaPath of ['prisma/schema.prisma', 'prisma/schema.postgres.prisma']) {
    const schema = source(schemaPath);
    assert.match(schema, /model AcademicDossier \{/);
    assert.match(schema, /model ScholarlyOutput \{/);
    assert.match(schema, /model ScholarlyOutputEvidence \{/);
    assert.match(schema, /model AcademicAssessmentPacket \{/);
    assert.match(schema, /dossierVersion\s+Int\?/);
    assert.match(schema, /dossierSnapshot\s+Json\?/);
    assert.match(schema, /receiptNumber\s+String\?\s+@unique/);
    assert.match(schema, /evidenceLinks\s+ScholarlyOutputEvidence\[\]/);
    assert.match(schema, /scholarlyOutputEvidence\s+ScholarlyOutputEvidence\[\]/);
    assert.match(schema, /departmentVerificationStatus\s+VerificationStatus/);
    assert.match(schema, /libraryVerificationStatus\s+VerificationStatus/);
  }
});

test('applicant dossier writes enforce ownership, editable status, and frozen packet protection', () => {
  const context = source('lib/academic-dossier-context.ts');
  const outputUpdate = source('app/api/lecturer/academic-dossier/outputs/[outputId]/route.ts');
  assert.match(context, /lecturerId: userId/);
  assert.match(context, /assertAcademicDossierEditable/);
  assert.match(outputUpdate, /AcademicPacketStatus\.FROZEN/);
  assert.match(outputUpdate, /verification was reset/);
});
