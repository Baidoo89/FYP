const {
  acknowledgementSchema,
  identitySection,
  repeater,
  select,
  text,
  textarea,
} = require('./form-schema-builders');

const SCHEDULE_K_SOURCES = {
  REGISTRY: 'GCTU Registry Promotion Forms (supplied official DOCX)',
  FINANCE: 'GCTU Promotion Forms for Finance, Audit and Procurement (supplied official DOCX)',
  LIBRARY: 'GCTU Promotion Forms for Library (supplied official DOCX)',
  WORKS: 'GCTU Promotion Forms for Works and Physical Development (supplied official DOCX)',
  POLICY: 'GCTU Basic Laws, Schedule K',
};

const suppliedSources = [
  SCHEDULE_K_SOURCES.REGISTRY,
  SCHEDULE_K_SOURCES.FINANCE,
  SCHEDULE_K_SOURCES.LIBRARY,
  SCHEDULE_K_SOURCES.WORKS,
].join('; ');

const scheduleKApplicantSchema = {
  title: 'Schedule K - Application for Promotion',
  instructions: 'Complete Part A and link every claim to evidence in the dossier. The supervisor assessment is completed separately and remains confidential.',
  declarationText: 'I certify that this application and its supporting records are true, complete and have not reused outputs already counted for an earlier promotion.',
  sections: [
    identitySection('Directorate / Department / Unit'),
    {
      id: 'professional_record',
      title: 'Part A - Applicant record',
      fields: [
        repeater('qualifications', 'Academic and professional qualifications', [
          { id: 'qualification', label: 'Qualification', required: true },
          { id: 'institution', label: 'Institution', required: true },
          { id: 'date', label: 'Date awarded' },
        ], { required: true, minimumRows: 1 }),
        repeater('schedulesHeld', 'Schedules and positions held', [
          { id: 'schedule', label: 'Schedule / position', required: true },
          { id: 'unit', label: 'Unit' },
          { id: 'period', label: 'Period', required: true },
        ], { required: true, minimumRows: 1 }),
        repeater('majorAssignments', 'Major administrative or professional projects and assignments', [
          { id: 'title', label: 'Project / assignment', required: true },
          { id: 'role', label: 'Role' },
          { id: 'period', label: 'Period' },
          { id: 'impact', label: 'Outcome / institutional impact', required: true },
          { id: 'evidenceReference', label: 'Evidence reference' },
        ], { required: true, minimumRows: 1 }),
        repeater('professionalDevelopment', 'Conferences, seminars and workshops', [
          { id: 'event', label: 'Event', required: true },
          { id: 'date', label: 'Date' },
          { id: 'contribution', label: 'Contribution made' },
        ]),
        repeater('professionalOutputs', 'Publications, reports and memoranda', [
          { id: 'title', label: 'Title', required: true },
          { id: 'type', label: 'Output type', required: true },
          { id: 'date', label: 'Date' },
          { id: 'impact', label: 'Purpose / institutional impact', required: true },
          { id: 'evidenceReference', label: 'Evidence reference' },
          { id: 'previouslyCounted', label: 'Used for a previous promotion', type: 'checkbox' },
        ], { required: true, minimumRows: 1 }),
        text('cvEvidenceReference', 'Curriculum vitae evidence reference', { required: true }),
      ],
    },
    {
      id: 'dossier_checklist',
      title: 'Submission checklist',
      fields: [{
        id: 'dossierChecklist',
        type: 'checklist',
        label: 'Required dossier contents',
        required: true,
        options: [
          'Application letter',
          'Promotion assessment form',
          'Curriculum vitae',
          'Academic and professional certificates',
          'Ability or knowledge-in-work evidence',
          'Promotion or application-of-knowledge evidence',
          'Service evidence',
        ],
      }],
    },
  ],
};

const supervisorSchema = {
  title: 'Schedule K - Confidential Supervisor Assessment',
  declarationText: 'I certify that this assessment is confidential, accurate and based on the applicant records available to me.',
  confidential: true,
  sections: [
    identitySection(),
    {
      id: 'supervisor_assessment',
      title: 'Eligibility, performance and readiness',
      fields: [
        select('timeInRankVerified', 'Time in rank verified', ['YES', 'NO', 'REQUIRES_HRODD_CONFIRMATION'], { required: true }),
        select('outputsVerified', 'Required outputs and reports provided', ['YES', 'NO', 'PARTIAL'], { required: true }),
        textarea('performanceAssessment', 'Assessment of performance and readiness', { required: true }),
        select('recommendation', 'Supervisor recommendation', ['FAVOURABLE', 'NOT_FAVOURABLE', 'RETURN_FOR_CLARIFICATION'], { required: true }),
        text('assessorPosition', 'Supervisor position', { required: true }),
      ],
    },
  ],
};

const SCHEDULE_K_APPLICATION_TEMPLATES = [
  {
    code: 'GCTU_SCHEDULE_K_APPLICATION_PART_A',
    version: 1,
    name: 'GCTU Schedule K Promotion Application - Part A',
    audience: 'APPLICANT',
    trackType: 'SCHEDULE_K',
    routeCodePrefixes: ['K-'],
    sourceReference: suppliedSources,
    schema: scheduleKApplicantSchema,
  },
  {
    code: 'GCTU_SCHEDULE_K_SUPERVISOR_ASSESSMENT',
    version: 1,
    name: 'GCTU Schedule K Confidential Supervisor Assessment',
    audience: 'SUPERVISOR',
    trackType: 'SCHEDULE_K',
    routeCodePrefixes: ['K-'],
    sourceReference: SCHEDULE_K_SOURCES.POLICY,
    schema: supervisorSchema,
  },
  {
    code: 'GCTU_DEPARTMENT_APPLICATION_RECEIPT',
    version: 1,
    name: 'Head of Department / Unit Application Receipt',
    audience: 'DEPARTMENT',
    routeCodePrefixes: ['J-', 'K-'],
    sourceReference: `${suppliedSources}; GCTU Form 2A`,
    schema: acknowledgementSchema('Head of Department / Unit'),
  },
  {
    code: 'GCTU_HRODD_APPLICATION_RECEIPT',
    version: 1,
    name: 'HRODD Application Receipt and Registrar Routing',
    audience: 'HRODD',
    routeCodePrefixes: ['J-', 'K-'],
    sourceReference: `${suppliedSources}; GCTU Form 2A`,
    schema: acknowledgementSchema('HRODD'),
  },
];

module.exports = {
  SCHEDULE_K_APPLICATION_TEMPLATES,
  SCHEDULE_K_SOURCES,
};
