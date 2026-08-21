const {
  PERFORMANCE_OPTIONS,
  identitySection,
  repeater,
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

const externalSchema = {
  title: 'Schedule K - Promotion of Work / Application of Knowledge',
  instructions: 'Assess only the outputs assigned to you. Record a weight and score for each submission and explain the evidence supporting the classification.',
  declarationText: 'I declare that I have no unmanaged conflict of interest and that this independent assessment is based only on the assigned dossier.',
  confidential: true,
  sections: [
    identitySection(),
    {
      id: 'conflict_and_outputs',
      title: 'Independent external assessment',
      fields: [
        select('conflictStatus', 'Conflict-of-interest declaration', ['NO_CONFLICT', 'DISCLOSED_AND_MANAGED', 'CONFLICT_EXISTS'], { required: true }),
        textarea('conflictDetails', 'Conflict details or safeguards'),
        repeater('outputScores', 'Assigned professional outputs', [
          { id: 'outputReference', label: 'Output / evidence reference', required: true },
          { id: 'weight', label: 'Weight', type: 'number', required: true },
          { id: 'score', label: 'Score', type: 'number', required: true },
          { id: 'assessment', label: 'Assessment comments', required: true },
        ], { required: true, minimumRows: 1 }),
        ...sharedAssessmentFields,
      ],
    },
  ],
};

const humanRelationsSchema = {
  title: 'Schedule K - Evaluation of Human Relations',
  declarationText: 'I certify that this assessment is based on relevant workplace evidence and authorised reports.',
  confidential: true,
  sections: [
    identitySection(),
    {
      id: 'human_relations',
      title: 'Human Relations',
      fields: [
        scoreMatrix('humanRelationsScores', 'Human Relations criteria', [
          ['comportment', 'Comportment and rapport with colleagues, subordinates, the public and students', 40],
          ['reports', 'Human Relations reports from mentors and Heads of Unit', 30],
          ['promptness', 'Promptness in serving the University community and general public', 30],
        ], { required: true }),
        ...sharedAssessmentFields,
      ],
    },
  ],
};

const serviceSchema = {
  title: 'Schedule K - Evaluation of Service',
  instructions: 'RAPC records verified service activities and the corresponding assessment. Each row must refer to supporting evidence.',
  declarationText: 'I certify that the listed service was verified and assessed by the authorised committee.',
  sections: [
    identitySection(),
    {
      id: 'service',
      title: 'Service to the University and wider community',
      fields: [
        repeater('serviceScores', 'Verified service activities', [
          { id: 'nature', label: 'Nature of service', required: true },
          { id: 'type', label: 'University / national / international', required: true },
          { id: 'position', label: 'Position / role' },
          { id: 'status', label: 'Status / period' },
          { id: 'evidenceReference', label: 'Evidence reference', required: true },
          { id: 'score', label: 'Score', type: 'number', required: true },
        ], { required: true, minimumRows: 1 }),
        text('totalPoints', 'Total points', { type: 'number', calculated: true, readOnly: true }),
        ...sharedAssessmentFields,
      ],
    },
  ],
};

const overallSchema = {
  title: 'Schedule K - Overall Assessment and Recommendation',
  instructions: 'Review the four independently completed area classifications. Eligibility is determined by the route-specific classification combination, not a simple average.',
  declarationText: 'I certify that the recommendation records the committee decision and does not alter any underlying assessment.',
  sections: [
    identitySection(),
    {
      id: 'overall',
      title: 'Overall assessment',
      fields: [
        select('abilityClassification', 'Ability / Knowledge in Work', PERFORMANCE_OPTIONS, { required: true, derivedFrom: 'ability' }),
        select('knowledgeClassification', 'Promotion / Application of Knowledge', PERFORMANCE_OPTIONS, { required: true, derivedFrom: 'external' }),
        select('humanRelationsClassification', 'Human Relations', PERFORMANCE_OPTIONS, { required: true, derivedFrom: 'humanRelations' }),
        select('serviceClassification', 'Service', PERFORMANCE_OPTIONS, { required: true, derivedFrom: 'service' }),
        select('policyResult', 'Route policy result', ['QUALIFIES', 'DOES_NOT_QUALIFY', 'PENDING_EVIDENCE', 'SPECIAL_CIRCUMSTANCES_REVIEW'], { required: true }),
        select('recommendation', 'Committee recommendation', ['RECOMMEND', 'DO_NOT_RECOMMEND', 'RETURN_FOR_CLARIFICATION', 'DEFER'], { required: true }),
        textarea('recommendationReasons', 'Reasons for recommendation', { required: true }),
        textarea('disagreementReasons', 'Areas and reasons for disagreement, if applicable'),
      ],
    },
  ],
};

const SCHEDULE_K_AREA_TEMPLATES = [
  {
    code: 'GCTU_SCHEDULE_K_EXTERNAL_OUTPUT_ASSESSMENT',
    version: 1,
    name: 'Schedule K External Assessment of Professional Outputs',
    audience: 'EXTERNAL_ASSESSOR',
    trackType: 'SCHEDULE_K',
    routeCodePrefixes: ['K-'],
    sourceReference: `${SCHEDULE_K_SOURCES.POLICY}; supplied Schedule K forms`,
    schema: externalSchema,
  },
  {
    code: 'GCTU_SCHEDULE_K_HUMAN_RELATIONS_ASSESSMENT',
    version: 1,
    name: 'Schedule K Human Relations Assessment',
    audience: 'RAPC',
    trackType: 'SCHEDULE_K',
    routeCodePrefixes: ['K-'],
    sourceReference: 'Supplied GCTU Schedule K profession forms',
    schema: humanRelationsSchema,
  },
  {
    code: 'GCTU_SCHEDULE_K_SERVICE_ASSESSMENT',
    version: 1,
    name: 'Schedule K RAPC Service Assessment',
    audience: 'RAPC',
    trackType: 'SCHEDULE_K',
    routeCodePrefixes: ['K-'],
    sourceReference: `${SCHEDULE_K_SOURCES.POLICY}; supplied Schedule K forms`,
    schema: serviceSchema,
  },
  {
    code: 'GCTU_SCHEDULE_K_OVERALL_RECOMMENDATION',
    version: 1,
    name: 'Schedule K Overall Assessment and Recommendation',
    audience: 'UAPC',
    trackType: 'SCHEDULE_K',
    routeCodePrefixes: ['K-'],
    sourceReference: SCHEDULE_K_SOURCES.POLICY,
    schema: overallSchema,
  },
];

module.exports = {
  SCHEDULE_K_AREA_TEMPLATES,
};
