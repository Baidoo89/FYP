const {
  PERFORMANCE_OPTIONS,
  identitySection,
  scoreMatrix,
  select,
  text,
  textarea,
} = require('./form-schema-builders');
const { SCHEDULE_K_SOURCES } = require('./schedule-k-application-forms');

const sharedAssessmentFields = [
  select('performanceClassification', 'Performance classification', PERFORMANCE_OPTIONS, { required: true }),
  textarea('comments', 'Comments supporting the assessment', { required: true }),
  text('assessorPosition', 'Assessor position', { required: true }),
];

function abilitySchema(title, rows) {
  return {
    title,
    instructions: 'Score each criterion up to its stated weight. The total is calculated by the system; comments and a classification are required.',
    declarationText: 'I certify that this assessment is independent, evidence-based and within my authorised role.',
    confidential: true,
    sections: [
      identitySection(),
      {
        id: 'ability_assessment',
        title: 'Ability in Work / Knowledge in Work',
        fields: [
          scoreMatrix('abilityScores', 'Profession-specific criteria', rows, { required: true }),
          ...sharedAssessmentFields,
        ],
      },
    ],
  };
}

const registryRows = [
  ['procedures', 'Knowledge of current administrative procedures, trends, policies and guidelines', 10],
  ['administration', 'Logistics, records, minutes, reports, follow-up and committee servicing', 30],
  ['confidentiality', 'Sense of responsibility and confidentiality', 10],
  ['initiative', 'Initiative, resourcefulness and drive', 10],
  ['supervision', 'Supervision of subordinate staff and mentorship', 10],
  ['independence', 'Assertiveness and ability to work independently', 10],
  ['sustainedWork', 'Capacity for sustained work', 10],
  ['appraisal', 'Reports on performance appraisal', 10],
];

const financeRows = [
  ['professionalCurrency', 'Current developments and skills in accountancy, finance and management information systems', 30],
  ['regulations', 'Ability to enforce financial regulations', 5],
  ['directives', 'Ability to adapt to government directives and policies', 5],
  ['confidentiality', 'Sense of responsibility and confidentiality', 10],
  ['initiative', 'Initiative, resourcefulness and drive', 10],
  ['supervision', 'Supervision of subordinate staff and mentorship', 10],
  ['independence', 'Assertiveness and ability to work independently', 10],
  ['sustainedWork', 'Capacity for sustained work', 5],
  ['timelyReports', 'Timely preparation and submission of reports', 5],
  ['appraisal', 'Reports on performance appraisal', 10],
];

const libraryRows = [
  ['professionalCurrency', 'Up-to-date knowledge in chosen field', 25],
  ['userAdvice', 'Ability to advise and support library users', 10],
  ['professionalism', 'Precision and professionalism', 10],
  ['initiative', 'Initiative, resourcefulness and drive', 10],
  ['software', 'Competence with library software', 20],
  ['independence', 'Assertiveness and ability to work independently', 10],
  ['sustainedWork', 'Capacity for sustained work', 5],
  ['appraisal', 'Reports on performance appraisal', 10],
];

const worksRows = [
  ['preContract', 'Pre-contract services, briefs, designs, drawings, bills of quantities, tenders, valuation, estate services, construction and facilities maintenance', 20],
  ['postContract', 'Post-contract services, contractor supervision, certificates, handover, defects liability, maintenance manuals and final accounts', 15],
  ['technicalQuality', 'Quality, precision and timely delivery of technical and professional work', 10],
  ['confidentiality', 'Sense of responsibility and confidentiality', 10],
  ['initiative', 'Initiative, resourcefulness and drive', 10],
  ['supervision', 'Supervision of subordinate staff and mentorship', 10],
  ['independence', 'Assertiveness and ability to work independently', 10],
  ['sustainedWork', 'Capacity for sustained work', 5],
  ['appraisal', 'Reports on performance appraisal', 10],
];

const SCHEDULE_K_ABILITY_TEMPLATES = [
  {
    code: 'GCTU_REGISTRY_ABILITY_ASSESSMENT',
    version: 1,
    name: 'Registry Ability / Knowledge in Work Assessment',
    audience: 'DEPARTMENT',
    trackType: 'SCHEDULE_K',
    routeCodePrefixes: ['K-REGISTRY-'],
    jobFamilyCodes: ['REGISTRY'],
    sourceReference: SCHEDULE_K_SOURCES.REGISTRY,
    schema: abilitySchema('Registry - Ability in Work / Knowledge in Work', registryRows),
  },
  {
    code: 'GCTU_FINANCE_AUDIT_PROCUREMENT_ABILITY_ASSESSMENT',
    version: 1,
    name: 'Finance, Audit and Procurement Ability / Knowledge in Work Assessment',
    audience: 'DEPARTMENT',
    trackType: 'SCHEDULE_K',
    routeCodePrefixes: ['K-FINANCE-', 'K-INTERNAL-AUDIT-', 'K-PROCUREMENT-'],
    jobFamilyCodes: ['FINANCE', 'INTERNAL_AUDIT', 'PROCUREMENT'],
    sourceReference: SCHEDULE_K_SOURCES.FINANCE,
    schema: abilitySchema('Finance, Audit and Procurement - Ability in Work / Knowledge in Work', financeRows),
  },
  {
    code: 'GCTU_LIBRARY_ABILITY_ASSESSMENT',
    version: 1,
    name: 'Library Ability / Knowledge in Work Assessment',
    audience: 'DEPARTMENT',
    trackType: 'SCHEDULE_K',
    routeCodePrefixes: ['K-LIBRARY-'],
    jobFamilyCodes: ['LIBRARY'],
    sourceReference: SCHEDULE_K_SOURCES.LIBRARY,
    schema: abilitySchema('Library - Ability in Work / Knowledge in Work', libraryRows),
  },
  {
    code: 'GCTU_WORKS_ABILITY_ASSESSMENT',
    version: 1,
    name: 'Works and Physical Development Ability / Knowledge in Work Assessment',
    audience: 'DEPARTMENT',
    trackType: 'SCHEDULE_K',
    routeCodePrefixes: ['K-WORKS-'],
    jobFamilyCodes: ['WORKS_AND_PHYSICAL_DEVELOPMENT'],
    sourceReference: SCHEDULE_K_SOURCES.WORKS,
    schema: abilitySchema('Works and Physical Development - Ability in Work / Knowledge in Work', worksRows),
  },
];

module.exports = {
  SCHEDULE_K_ABILITY_TEMPLATES,
};
