const {
  PERFORMANCE_OPTIONS,
  date,
  identitySection,
  repeater,
  select,
  text,
  textarea,
} = require('./form-schema-builders');

const FORM_2A_SOURCE = 'GCTU Form 2A - Promotion-Academic Staff (supplied official DOCX)';
const SCHEDULE_J_SOURCE = 'GCTU Basic Laws, Schedule J';

const academicApplicantSchema = {
  title: 'Form 2A - Application for Promotion: Academic Staff',
  instructions: 'Complete all applicable sections and attach evidence in the dossier. Empty required sections prevent formal submission.',
  declarationText: 'I certify that the information and evidence in this application are complete and accurate.',
  sections: [
    identitySection('Department / Faculty'),
    {
      id: 'personal_details',
      title: 'Personal and appointment details',
      fields: [
        date('dateOfBirth', 'Date of birth', { required: true }),
        text('presentDesignation', 'Present designation', { required: true }),
        date('lastPromotionDate', 'Date of last promotion', { required: true }),
        text('applicationTarget', 'Promotion sought', { required: true, autofill: 'request.targetRank', readOnly: true }),
      ],
    },
    {
      id: 'qualifications_and_experience',
      title: 'Qualifications and professional experience',
      fields: [
        repeater('degrees', 'Degrees and dates', [
          { id: 'qualification', label: 'Degree / qualification', required: true },
          { id: 'institution', label: 'Institution', required: true },
          { id: 'date', label: 'Date awarded', type: 'date', required: true },
        ], { required: true, minimumRows: 1 }),
        repeater('academicAppointments', 'Academic ranks held and subjects taught', [
          { id: 'rank', label: 'Rank', required: true },
          { id: 'institution', label: 'Institution', required: true },
          { id: 'period', label: 'Period', required: true },
          { id: 'subjects', label: 'Subjects taught', required: true },
        ], { required: true, minimumRows: 1 }),
        textarea('professionalExperience', 'Other professional experience', { required: true }),
        textarea('teachingExperience', 'Teaching experience', { required: true }),
      ],
    },
    {
      id: 'supervision_and_research',
      title: 'Supervision and research',
      fields: [
        repeater('studentSupervision', 'Student projects, theses and research supervised', [
          { id: 'student', label: 'Student / group' },
          { id: 'level', label: 'Level' },
          { id: 'topic', label: 'Topic', required: true },
          { id: 'year', label: 'Year' },
          { id: 'outcome', label: 'Outcome / status' },
        ]),
        repeater('researchProjects', 'Research topics and dates', [
          { id: 'topic', label: 'Research topic', required: true },
          { id: 'period', label: 'Date / period', required: true },
          { id: 'role', label: 'Role' },
          { id: 'status', label: 'Status' },
        ]),
        textarea('majorProjects', 'Major projects undertaken', { required: true }),
      ],
    },
    {
      id: 'scholarly_work',
      title: 'Scholarly work',
      fields: [
        repeater('researchPublications', 'Publications arising from research', [
          { id: 'citation', label: 'Full citation', required: true },
          { id: 'contribution', label: 'Applicant contribution' },
          { id: 'evidenceReference', label: 'Evidence reference' },
        ]),
        repeater('refereedJournalPapers', 'Refereed journal papers', [
          { id: 'citation', label: 'Full citation', required: true },
          { id: 'doi', label: 'DOI / URL' },
          { id: 'indexing', label: 'Indexing / peer-review evidence' },
        ]),
        repeater('booksAndChapters', 'Books and book chapters', [
          { id: 'citation', label: 'Full citation', required: true },
          { id: 'publisher', label: 'Publisher' },
          { id: 'peerReview', label: 'Peer-review status' },
        ]),
        repeater('conferencePapers', 'Conference papers and proceedings', [
          { id: 'citation', label: 'Full citation', required: true },
          { id: 'conference', label: 'Conference' },
          { id: 'date', label: 'Date' },
        ]),
        repeater('creativeOutputs', 'Peer-reviewed exhibitions, technology, inventions or designs', [
          { id: 'title', label: 'Output title', required: true },
          { id: 'type', label: 'Output type', required: true },
          { id: 'peerReview', label: 'Peer-review / deployment evidence' },
        ]),
        textarea('coAuthorContribution', 'Contribution to co-authored work'),
        repeater('selectedExternalOutputs', 'Publications selected for external assessment', [
          { id: 'citation', label: 'Full citation', required: true },
          { id: 'selectionOrder', label: 'Selection order', type: 'number', required: true },
          { id: 'dossierOutputId', label: 'Linked dossier output ID' },
        ], { required: true, minimumRows: 1 }),
      ],
    },
    {
      id: 'professional_and_service',
      title: 'Professional development and service',
      fields: [
        repeater('conferences', 'Conferences, seminars and workshops', [
          { id: 'event', label: 'Event', required: true },
          { id: 'date', label: 'Date / period' },
          { id: 'contribution', label: 'Contribution made' },
        ]),
        repeater('communityService', 'University, national and international service', [
          { id: 'scope', label: 'Scope', required: true },
          { id: 'activity', label: 'Service activity', required: true },
          { id: 'role', label: 'Role' },
          { id: 'period', label: 'Period' },
          { id: 'evidenceReference', label: 'Evidence reference' },
        ], { required: true, minimumRows: 1 }),
      ],
    },
    {
      id: 'self_assessment',
      title: 'Applicant self-assessment',
      fields: [
        textarea('teachingSelfAssessment', 'Teaching', { required: true }),
        textarea('knowledgeSelfAssessment', 'Promotion of knowledge', { required: true }),
        textarea('serviceSelfAssessment', 'Service', { required: true }),
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
          'Application form',
          'Application letter',
          'Curriculum vitae',
          'Academic and professional certificates',
          'Teaching evidence',
          'Promotion-of-knowledge evidence',
          'Service evidence',
        ],
      }],
    },
  ],
};

function academicReviewSchema(level) {
  return {
    title: `Schedule J - ${level} Assessment`,
    instructions: 'Record this level independently. Earlier and later assessors remain visible as separate records.',
    declarationText: 'I certify that this assessment is independent, evidence-based and completed within my authorised role.',
    confidential: true,
    sections: [
      identitySection('Department / Faculty'),
      {
        id: 'academic_assessment',
        title: `${level} classification and recommendation`,
        fields: [
          select('teaching', 'Teaching', PERFORMANCE_OPTIONS, { required: true }),
          select('promotionOfKnowledge', 'Promotion of knowledge', PERFORMANCE_OPTIONS, { required: true }),
          select('service', 'Service', PERFORMANCE_OPTIONS, { required: true }),
          textarea('evidenceSummary', 'Evidence and reasons', { required: true }),
          select('recommendation', 'Recommendation', ['RECOMMEND', 'DO_NOT_RECOMMEND', 'RETURN_FOR_CLARIFICATION', 'DEFER'], { required: true }),
        ],
      },
    ],
  };
}

const academicExternalSchema = {
  title: 'Schedule J - Independent External Assessment',
  declarationText: 'I declare that I have no unmanaged conflict and that this assessment is an independent evaluation of the assigned scholarly outputs.',
  confidential: true,
  sections: [
    identitySection('Department / Faculty'),
    {
      id: 'external_assessment',
      title: 'Scholarly output assessment',
      fields: [
        select('conflictStatus', 'Conflict-of-interest declaration', ['NO_CONFLICT', 'DISCLOSED_AND_MANAGED', 'CONFLICT_EXISTS'], { required: true }),
        textarea('conflictDetails', 'Conflict details or safeguards'),
        repeater('outputAssessments', 'Assigned scholarly outputs', [
          { id: 'outputReference', label: 'Output / citation', required: true },
          { id: 'originality', label: 'Originality and contribution', required: true },
          { id: 'rigour', label: 'Scholarly rigour', required: true },
          { id: 'impact', label: 'Academic / professional impact', required: true },
          { id: 'classification', label: 'Classification', required: true },
        ], { required: true, minimumRows: 1 }),
        select('overallClassification', 'Overall classification', PERFORMANCE_OPTIONS, { required: true }),
        textarea('report', 'Independent assessor report', { required: true }),
        select('recommendation', 'Recommendation', ['RECOMMEND', 'DO_NOT_RECOMMEND', 'RETURN_FOR_CLARIFICATION'], { required: true }),
      ],
    },
  ],
};

const ACADEMIC_FORM_TEMPLATES = [
  {
    code: 'GCTU_FORM_2A_ACADEMIC_APPLICATION',
    version: 1,
    name: 'GCTU Form 2A - Academic Promotion Application',
    audience: 'APPLICANT',
    staffCategory: 'ACADEMIC_SENIOR_MEMBER',
    trackType: 'SCHEDULE_J',
    routeCodePrefixes: ['J-'],
    sourceReference: FORM_2A_SOURCE,
    schema: academicApplicantSchema,
  },
  {
    code: 'GCTU_SCHEDULE_J_DEPARTMENT_ASSESSMENT',
    version: 1,
    name: 'Schedule J HOD / Dean Assessment',
    audience: 'DEPARTMENT',
    trackType: 'SCHEDULE_J',
    routeCodePrefixes: ['J-'],
    sourceReference: SCHEDULE_J_SOURCE,
    schema: academicReviewSchema('HOD / Dean'),
  },
  {
    code: 'GCTU_SCHEDULE_J_FAPC_ASSESSMENT',
    version: 1,
    name: 'Schedule J FAPC Assessment',
    audience: 'FACULTY',
    trackType: 'SCHEDULE_J',
    routeCodePrefixes: ['J-'],
    sourceReference: SCHEDULE_J_SOURCE,
    schema: academicReviewSchema('FAPC'),
  },
  {
    code: 'GCTU_SCHEDULE_J_EXTERNAL_ASSESSMENT',
    version: 1,
    name: 'Schedule J External Scholarly Assessment',
    audience: 'EXTERNAL_ASSESSOR',
    trackType: 'SCHEDULE_J',
    routeCodePrefixes: ['J-'],
    sourceReference: SCHEDULE_J_SOURCE,
    schema: academicExternalSchema,
  },
  {
    code: 'GCTU_SCHEDULE_J_UAPC_ASSESSMENT',
    version: 1,
    name: 'Schedule J UAPC Final Assessment',
    audience: 'UAPC',
    trackType: 'SCHEDULE_J',
    routeCodePrefixes: ['J-'],
    sourceReference: SCHEDULE_J_SOURCE,
    schema: academicReviewSchema('UAPC'),
  },
];

module.exports = {
  ACADEMIC_FORM_TEMPLATES,
  FORM_2A_SOURCE,
  SCHEDULE_J_SOURCE,
};
