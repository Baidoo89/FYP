const POLICY_SOURCES = [
  {
    code: 'GCTU_ACT_1022',
    title: 'Ghana Communication Technology University Act, 2020 (Act 1022)',
    authority: 'ACT',
    issuingBody: 'Republic of Ghana',
    notes: 'Enabling legislation. The Appeals Board jurisdiction includes staff promotion matters.',
  },
  {
    code: 'GCTU_BASIC_LAWS',
    title: 'GCTU Basic Laws',
    authority: 'BASIC_LAWS',
    issuingBody: 'GCTU Council',
    sourceUrl: 'https://site.gctu.edu.gh/gctu-basic-laws',
    issuedOn: '2021-12-17',
    notes: 'Primary detailed source for Schedule J and Schedule K promotion rules.',
  },
  {
    code: 'GCTU_PROMOTION_FORMS',
    title: 'GCTU Staff Appointment and Promotion Forms',
    authority: 'OFFICIAL_FORM',
    issuingBody: 'GCTU',
    sourceUrl: 'https://site.gctu.edu.gh/staff-appointment-and-promotion-forms',
    notes: 'Current public catalogue for Forms 1A, 1B, 1C, 2A, 2B, and 3A.',
  },
  {
    code: 'GCTU_COS_SENIOR_MEMBERS_2023',
    title: 'Conditions of Service for Senior Members',
    authority: 'CONDITIONS_OF_SERVICE',
    issuingBody: 'GCTU Council',
    sourceUrl: 'https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/policies/CONDITIONS-OF-SERVICE-FOR-SENIOR-MEMBERS.pdf',
    notes: 'Document dated March 2023. Includes progression and retirement-cutoff controls.',
  },
  {
    code: 'GCTU_APPEALS_RULES_2023',
    title: 'Appeals Board Rules and Regulations',
    authority: 'COUNCIL_POLICY',
    issuingBody: 'GCTU Council',
    sourceUrl: 'https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/policies/Appeals-Board-Rules-and-Regulations.pdf',
    notes: 'Document dated June 2023. Contains an unresolved filing-window conflict between Rule 10 and Form 1.',
  },
  {
    code: 'GCTU_ADMIN_MANUAL_2024',
    title: 'Administrative Procedures Manual',
    authority: 'MANUAL_HANDBOOK',
    issuingBody: 'GCTU',
    sourceUrl: 'https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/Administrative-Procedures-Manual.pdf',
    notes: '2024 operating procedures for statutory committees, meetings, minutes, and action tracking.',
  },
  {
    code: 'GCTU_RECORDS_POLICY_2024',
    title: 'Records and Archives Management Policy',
    authority: 'COUNCIL_POLICY',
    issuingBody: 'GCTU Council',
    sourceUrl: 'https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/Records-and-Archieves-Policy-Final-Accepted.pdf',
    notes: 'Council-approved policy dated February 2024.',
  },
  {
    code: 'GCTU_WORKLOAD_POLICY_2024',
    title: 'Teaching, Research and Service Workload Policy and Guidelines',
    authority: 'COUNCIL_POLICY',
    issuingBody: 'GCTU Council',
    sourceUrl: 'https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/Teaching-Research-and-Service-Workload-Policy-and-Guidelines.pdf',
    notes: 'Annual performance evidence source. It does not replace Schedule J promotion classifications.',
  },
  {
    code: 'GCTU_HOD_HANDBOOK_2025',
    title: 'Heads of Academic Departments Handbook',
    authority: 'MANUAL_HANDBOOK',
    issuingBody: 'GCTU',
    sourceUrl: 'https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/policies/Heads-of-Academic-Departments-Handbook.pdf',
    notes: 'Current operating guidance for academic promotion dossier handling.',
  },
];

const POLICY_VERSIONS = [
  { sourceCode: 'GCTU_ACT_1022', versionLabel: 'Act 1022 (2020)', status: 'ACTIVE' },
  {
    sourceCode: 'GCTU_BASIC_LAWS',
    versionLabel: 'Public PDF dated 2021-12-17',
    status: 'ACTIVE',
    effectiveFrom: '2021-12-17',
    notes: 'Used provisionally as the controlling public version pending GCTU amendment-history confirmation.',
  },
  { sourceCode: 'GCTU_PROMOTION_FORMS', versionLabel: 'Current public forms catalogue', status: 'ACTIVE' },
  { sourceCode: 'GCTU_COS_SENIOR_MEMBERS_2023', versionLabel: 'March 2023', status: 'ACTIVE' },
  { sourceCode: 'GCTU_APPEALS_RULES_2023', versionLabel: 'June 2023', status: 'ACTIVE' },
  { sourceCode: 'GCTU_ADMIN_MANUAL_2024', versionLabel: '2024', status: 'ACTIVE' },
  { sourceCode: 'GCTU_RECORDS_POLICY_2024', versionLabel: 'February 2024', status: 'ACTIVE' },
  { sourceCode: 'GCTU_WORKLOAD_POLICY_2024', versionLabel: '2024', status: 'ACTIVE' },
  { sourceCode: 'GCTU_HOD_HANDBOOK_2025', versionLabel: '2025', status: 'ACTIVE' },
];

const ORGANIZATION_UNITS = [
  { code: 'GCTU', name: 'Ghana Communication Technology University', type: 'UNIVERSITY' },
  { code: 'FOCIS', name: 'Faculty of Computing and Information Systems', type: 'FACULTY', parentCode: 'GCTU' },
  { code: 'FOE', name: 'Faculty of Engineering', type: 'FACULTY', parentCode: 'GCTU' },
  { code: 'GBS', name: 'GCTU Business School', type: 'SCHOOL', parentCode: 'GCTU' },
  { code: 'FOCIS-MPC', name: 'Mobile & Pervasive Computing', type: 'DEPARTMENT', parentCode: 'FOCIS' },
  { code: 'FOCIS-IS', name: 'Information Systems', type: 'DEPARTMENT', parentCode: 'FOCIS' },
  { code: 'FOCIS-CS', name: 'Computer Science', type: 'DEPARTMENT', parentCode: 'FOCIS' },
  { code: 'FOCIS-IT', name: 'Information Technology', type: 'DEPARTMENT', parentCode: 'FOCIS' },
  { code: 'FOCIS-GS', name: 'General Studies', type: 'DEPARTMENT', parentCode: 'FOCIS' },
  { code: 'FOE-EEE', name: 'Electrical and Electronics Engineering', type: 'DEPARTMENT', parentCode: 'FOE' },
  { code: 'FOE-CE', name: 'Computer Engineering', type: 'DEPARTMENT', parentCode: 'FOE' },
  { code: 'FOE-TE', name: 'Telecommunications Engineering', type: 'DEPARTMENT', parentCode: 'FOE' },
  { code: 'FOE-MS', name: 'Mathematics and Statistics', type: 'DEPARTMENT', parentCode: 'FOE' },
  { code: 'GBS-PLSCM', name: 'Procurement, Logistics and Supply Chain Management', type: 'DEPARTMENT', parentCode: 'GBS' },
  { code: 'GBS-MGMT', name: 'Management Studies', type: 'DEPARTMENT', parentCode: 'GBS' },
  { code: 'GBS-ABF', name: 'Accounting, Banking and Finance', type: 'DEPARTMENT', parentCode: 'GBS' },
  { code: 'GBS-MKT', name: 'Marketing', type: 'DEPARTMENT', parentCode: 'GBS' },
  { code: 'GBS-ECON', name: 'Economics', type: 'DEPARTMENT', parentCode: 'GBS' },
  { code: 'HRODD', name: 'Human Resource and Organisational Development Directorate', type: 'DIRECTORATE', parentCode: 'GCTU' },
  { code: 'REGISTRY', name: 'Registry', type: 'DIRECTORATE', parentCode: 'GCTU' },
  { code: 'FINANCE', name: 'Finance Directorate', type: 'DIRECTORATE', parentCode: 'GCTU' },
  { code: 'INTERNAL-AUDIT', name: 'Internal Audit Directorate', type: 'DIRECTORATE', parentCode: 'GCTU' },
  { code: 'PROCUREMENT', name: 'Procurement Directorate', type: 'DIRECTORATE', parentCode: 'GCTU' },
  { code: 'LIBRARY', name: 'University Library', type: 'LIBRARY', parentCode: 'GCTU' },
  { code: 'WORKS-PD', name: 'Works and Physical Development Directorate', type: 'DIRECTORATE', parentCode: 'GCTU' },
  { code: 'ICT-DIR', name: 'Information and Communication Technology Directorate', type: 'DIRECTORATE', parentCode: 'GCTU' },
];

const OFFICE_DEFINITIONS = [
  { code: 'HOD', name: 'Head of Department', defaultUnitType: 'DEPARTMENT' },
  { code: 'DEAN', name: 'Dean', defaultUnitType: 'FACULTY' },
  { code: 'DIRECTOR', name: 'Director', defaultUnitType: 'DIRECTORATE' },
  { code: 'UNIT_HEAD', name: 'Head of Unit', defaultUnitType: 'UNIT' },
  { code: 'REGISTRAR', name: 'Registrar', defaultUnitType: 'UNIVERSITY' },
  { code: 'HRODD_DIRECTOR', name: 'Director of Human Resource and Organisational Development', defaultUnitType: 'DIRECTORATE' },
  { code: 'FAPC_CHAIR', name: 'Faculty Appointments and Promotions Committee Chair', defaultUnitType: 'FACULTY' },
  { code: 'FAPC_SECRETARY', name: 'Faculty Appointments and Promotions Committee Secretary', defaultUnitType: 'FACULTY' },
  { code: 'RAPC_CHAIR', name: 'Registry Appointments and Promotions Committee Chair', defaultUnitType: 'UNIVERSITY' },
  { code: 'RAPC_SECRETARY', name: 'Registry Appointments and Promotions Committee Secretary', defaultUnitType: 'UNIVERSITY' },
  { code: 'UAPC_CHAIR', name: 'University Appointments and Promotions Committee Chair', defaultUnitType: 'UNIVERSITY' },
  { code: 'UAPC_SECRETARY', name: 'University Appointments and Promotions Committee Secretary', defaultUnitType: 'UNIVERSITY' },
  { code: 'COMMITTEE_MEMBER', name: 'Appointments and Promotions Committee Member' },
  { code: 'APPEALS_CHAIR', name: 'Appeals Board Chair', defaultUnitType: 'UNIVERSITY' },
  { code: 'APPEALS_MEMBER', name: 'Appeals Board Member', defaultUnitType: 'UNIVERSITY' },
  { code: 'APPEALS_SECRETARY', name: 'Appeals Board Secretary', defaultUnitType: 'UNIVERSITY' },
];

const RANK_DEFINITIONS = [
  { code: 'ASSISTANT_LECTURER', name: 'Assistant Lecturer', category: 'ACADEMIC_SENIOR_MEMBER', family: 'ACADEMIC_TEACHING', level: 1 },
  { code: 'LECTURER', name: 'Lecturer', category: 'ACADEMIC_SENIOR_MEMBER', family: 'ACADEMIC_TEACHING', level: 2 },
  { code: 'SENIOR_LECTURER', name: 'Senior Lecturer', category: 'ACADEMIC_SENIOR_MEMBER', family: 'ACADEMIC_TEACHING', level: 3 },
  { code: 'ASSOCIATE_PROFESSOR', name: 'Associate Professor', category: 'ACADEMIC_SENIOR_MEMBER', family: 'ACADEMIC', level: 4 },
  { code: 'PROFESSOR', name: 'Professor', category: 'ACADEMIC_SENIOR_MEMBER', family: 'ACADEMIC', level: 5, isTerminal: true },
  { code: 'ASSISTANT_RESEARCH_FELLOW', name: 'Assistant Research Fellow', category: 'ACADEMIC_SENIOR_MEMBER', family: 'ACADEMIC_RESEARCH', level: 1 },
  { code: 'RESEARCH_FELLOW', name: 'Research Fellow', category: 'ACADEMIC_SENIOR_MEMBER', family: 'ACADEMIC_RESEARCH', level: 2 },
  { code: 'SENIOR_RESEARCH_FELLOW', name: 'Senior Research Fellow', category: 'ACADEMIC_SENIOR_MEMBER', family: 'ACADEMIC_RESEARCH', level: 3 },
  { code: 'JUNIOR_ASSISTANT_REGISTRAR', name: 'Junior Assistant Registrar', category: 'ADMINISTRATIVE_SENIOR_MEMBER', family: 'REGISTRY', level: 1 },
  { code: 'ASSISTANT_REGISTRAR', name: 'Assistant Registrar', category: 'ADMINISTRATIVE_SENIOR_MEMBER', family: 'REGISTRY', level: 2 },
  { code: 'SENIOR_ASSISTANT_REGISTRAR', name: 'Senior Assistant Registrar', category: 'ADMINISTRATIVE_SENIOR_MEMBER', family: 'REGISTRY', level: 3 },
  { code: 'DEPUTY_REGISTRAR', name: 'Deputy Registrar', category: 'ADMINISTRATIVE_SENIOR_MEMBER', family: 'REGISTRY', level: 4, isTerminal: true },
  { code: 'ASSISTANT_ACCOUNTANT', name: 'Assistant Accountant', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'FINANCE', level: 1 },
  { code: 'ACCOUNTANT', name: 'Accountant', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'FINANCE', level: 2 },
  { code: 'SENIOR_ACCOUNTANT', name: 'Senior Accountant', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'FINANCE', level: 3 },
  { code: 'DEPUTY_DIRECTOR_FINANCE', name: 'Deputy Director of Finance', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'FINANCE', level: 4, isTerminal: true },
  { code: 'ASSISTANT_INTERNAL_AUDITOR', name: 'Assistant Internal Auditor', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'INTERNAL_AUDIT', level: 1 },
  { code: 'INTERNAL_AUDITOR', name: 'Internal Auditor', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'INTERNAL_AUDIT', level: 2 },
  { code: 'SENIOR_INTERNAL_AUDITOR', name: 'Senior Internal Auditor', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'INTERNAL_AUDIT', level: 3 },
  { code: 'DEPUTY_DIRECTOR_INTERNAL_AUDIT', name: 'Deputy Director of Internal Audit', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'INTERNAL_AUDIT', level: 4, isTerminal: true },
  { code: 'JUNIOR_ASSISTANT_PROCUREMENT_OFFICER', name: 'Junior Assistant Procurement Officer', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'PROCUREMENT', level: 1 },
  { code: 'ASSISTANT_PROCUREMENT_OFFICER', name: 'Assistant Procurement Officer', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'PROCUREMENT', level: 2 },
  { code: 'SENIOR_ASSISTANT_PROCUREMENT_OFFICER', name: 'Senior Assistant Procurement Officer', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'PROCUREMENT', level: 3 },
  { code: 'JUNIOR_ASSISTANT_LIBRARIAN', name: 'Junior Assistant Librarian', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'LIBRARY', level: 1 },
  { code: 'ASSISTANT_LIBRARIAN', name: 'Assistant Librarian', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'LIBRARY', level: 2 },
  { code: 'SENIOR_ASSISTANT_LIBRARIAN', name: 'Senior Assistant Librarian', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'LIBRARY', level: 3 },
  { code: 'DEPUTY_LIBRARIAN', name: 'Deputy Librarian', category: 'PROFESSIONAL_SENIOR_MEMBER', family: 'LIBRARY', level: 4, isTerminal: true },
];

const TRACKS = [
  {
    code: 'SCHEDULE_J_ACADEMIC',
    name: 'Schedule J Academic Senior Member Promotion',
    type: 'SCHEDULE_J',
    staffCategory: 'ACADEMIC_SENIOR_MEMBER',
    status: 'ACTIVE',
    policyVersionKey: 'GCTU_BASIC_LAWS:Public PDF dated 2021-12-17',
    description: 'Academic teaching and research promotion routes under Schedule J.',
    areas: [
      { code: 'TEACHING', name: 'Teaching', sortOrder: 1 },
      { code: 'PROMOTION_OF_KNOWLEDGE', name: 'Promotion of Knowledge', sortOrder: 2 },
      { code: 'SERVICE', name: 'Service', sortOrder: 3 },
    ],
  },
  {
    code: 'SCHEDULE_K_ADMIN_PRO',
    name: 'Schedule K Administrative and Professional Senior Member Promotion',
    type: 'SCHEDULE_K',
    staffCategory: 'ADMINISTRATIVE_SENIOR_MEMBER',
    status: 'ACTIVE',
    policyVersionKey: 'GCTU_BASIC_LAWS:Public PDF dated 2021-12-17',
    description: 'Shared four-area framework with profession-specific route and rubric configuration.',
    areas: [
      { code: 'ABILITY_KNOWLEDGE_IN_WORK', name: 'Ability in Work / Knowledge in Work', sortOrder: 1, isCore: true },
      { code: 'PROMOTION_APPLICATION_OF_KNOWLEDGE', name: 'Promotion of Work / Application of Knowledge', sortOrder: 2, isCore: true },
      { code: 'HUMAN_RELATIONS', name: 'Human Relations', sortOrder: 3 },
      { code: 'SERVICE', name: 'Service', sortOrder: 4 },
    ],
  },
  {
    code: 'SENIOR_STAFF_UNIFIED_SCHEME',
    name: 'Senior Staff Promotion under the Unified Scheme of Service',
    type: 'SENIOR_STAFF_UNIFIED_SCHEME',
    staffCategory: 'SENIOR_STAFF',
    status: 'BLOCKED',
    policyVersionKey: 'GCTU_BASIC_LAWS:Public PDF dated 2021-12-17',
    description: 'Structure reserved. Eligibility activation is blocked until GCTU supplies the controlled current Unified Scheme.',
    areas: [],
  },
  {
    code: 'JUNIOR_STAFF_UNIFIED_SCHEME',
    name: 'Junior Staff Promotion under the Unified Scheme of Service',
    type: 'JUNIOR_STAFF_UNIFIED_SCHEME',
    staffCategory: 'JUNIOR_STAFF',
    status: 'BLOCKED',
    policyVersionKey: 'GCTU_BASIC_LAWS:Public PDF dated 2021-12-17',
    description: 'Structure reserved. Eligibility activation is blocked until GCTU supplies the controlled current Unified Scheme.',
    areas: [],
  },
];

const RETIREMENT_REQUIREMENT = {
  code: 'RETIREMENT_LEAD_MONTHS',
  name: 'Minimum lead time before compulsory retirement',
  type: 'RETIREMENT_LEAD_MONTHS',
  numberValue: 6,
  evidenceState: 'VERIFIED',
  sourceClause: 'Conditions of Service for Senior Members, March 2023',
  notes: 'Calculate only from the authoritative HRODD retirement date.',
};

function academicAreaRequirements(minimumCategory) {
  return ['TEACHING', 'PROMOTION_OF_KNOWLEDGE', 'SERVICE'].map((areaCode) => ({
    areaCode,
    minimumCategory,
    evidenceState: 'VERIFIED',
    sourceClause: 'GCTU Basic Laws, Schedule J',
  }));
}

function academicOutputRequirements({ submittedMin, submittedMax, refereedMin, bestCount, assessors, outsideGhana }) {
  return [
    { code: 'OUTPUTS_SUBMITTED_MIN', name: 'Minimum outputs submitted', type: 'OUTPUTS_SUBMITTED_MINIMUM', numberValue: submittedMin },
    { code: 'OUTPUTS_SUBMITTED_MAX', name: 'Maximum outputs submitted', type: 'OUTPUTS_SUBMITTED_MAXIMUM', numberValue: submittedMax },
    { code: 'REFEREED_OUTPUTS_MIN', name: 'Minimum refereed outputs', type: 'REFEREED_OUTPUTS_MINIMUM', numberValue: refereedMin },
    { code: 'BEST_OUTPUTS_COUNT', name: 'Outputs selected for assessment', type: 'BEST_OUTPUTS_COUNT', numberValue: bestCount },
    { code: 'EXTERNAL_ASSESSOR_COUNT', name: 'Required external assessors', type: 'EXTERNAL_ASSESSOR_COUNT', numberValue: assessors },
    { code: 'ASSESSORS_OUTSIDE_GHANA_MIN', name: 'Assessors required from outside Ghana', type: 'ASSESSOR_OUTSIDE_GHANA_MINIMUM', numberValue: outsideGhana },
    RETIREMENT_REQUIREMENT,
  ].map((item) => ({
    evidenceState: 'VERIFIED',
    sourceClause: 'GCTU Basic Laws, Schedule J',
    ...item,
  }));
}

const ACADEMIC_ROUTES = [
  {
    code: 'J-ASSISTANT-LECTURER-TO-LECTURER',
    trackCode: 'SCHEDULE_J_ACADEMIC',
    name: 'Assistant Lecturer to Lecturer',
    currentRankCode: 'ASSISTANT_LECTURER',
    targetRankCode: 'LECTURER',
    finalAuthority: 'UAPC',
    evidenceState: 'CONFIRMATION_REQUIRED',
    status: 'PROVISIONAL',
    sourceClause: 'GCTU Basic Laws, Schedule J PhD upgrade route',
    requirements: [
      {
        code: 'PHD_UPGRADE',
        name: 'PhD upgrade route',
        type: 'SPECIAL_ROUTE_CONDITION',
        textValue: 'Promotion follows the PhD upgrade route and is not a standard publication-count route.',
        evidenceState: 'VERIFIED',
        sourceClause: 'GCTU Basic Laws, Schedule J',
      },
      RETIREMENT_REQUIREMENT,
    ],
    areaRequirements: [],
  },
  {
    code: 'J-ASSISTANT-RESEARCH-FELLOW-TO-RESEARCH-FELLOW',
    trackCode: 'SCHEDULE_J_ACADEMIC',
    name: 'Assistant Research Fellow to Research Fellow',
    currentRankCode: 'ASSISTANT_RESEARCH_FELLOW',
    targetRankCode: 'RESEARCH_FELLOW',
    finalAuthority: 'UAPC',
    evidenceState: 'CONFIRMATION_REQUIRED',
    status: 'PROVISIONAL',
    sourceClause: 'GCTU Basic Laws, Schedule J PhD upgrade route',
    requirements: [
      {
        code: 'PHD_UPGRADE',
        name: 'PhD upgrade route',
        type: 'SPECIAL_ROUTE_CONDITION',
        textValue: 'Promotion follows the PhD upgrade route and is not a standard publication-count route.',
        evidenceState: 'VERIFIED',
        sourceClause: 'GCTU Basic Laws, Schedule J',
      },
      RETIREMENT_REQUIREMENT,
    ],
    areaRequirements: [],
  },
  {
    code: 'J-LECTURER-TO-SENIOR-LECTURER',
    trackCode: 'SCHEDULE_J_ACADEMIC',
    name: 'Lecturer to Senior Lecturer',
    currentRankCode: 'LECTURER',
    targetRankCode: 'SENIOR_LECTURER',
    minimumYearsInRank: 4,
    finalAuthority: 'UAPC',
    evidenceState: 'VERIFIED_CONFLICT',
    status: 'ACTIVE',
    sourceClause: 'GCTU Basic Laws, Schedule J',
    requirements: academicOutputRequirements({ submittedMin: 6, submittedMax: 10, refereedMin: 6, bestCount: 6, assessors: 1, outsideGhana: 0 }),
    areaRequirements: academicAreaRequirements('GOOD'),
  },
  {
    code: 'J-RESEARCH-FELLOW-TO-SENIOR-RESEARCH-FELLOW',
    trackCode: 'SCHEDULE_J_ACADEMIC',
    name: 'Research Fellow to Senior Research Fellow',
    currentRankCode: 'RESEARCH_FELLOW',
    targetRankCode: 'SENIOR_RESEARCH_FELLOW',
    minimumYearsInRank: 4,
    finalAuthority: 'UAPC',
    evidenceState: 'VERIFIED',
    status: 'ACTIVE',
    sourceClause: 'GCTU Basic Laws, Schedule J',
    requirements: academicOutputRequirements({ submittedMin: 8, submittedMax: 12, refereedMin: 8, bestCount: 8, assessors: 1, outsideGhana: 0 }),
    areaRequirements: academicAreaRequirements('GOOD'),
  },
  {
    code: 'J-SENIOR-LECTURER-TO-ASSOCIATE-PROFESSOR-CASE-I',
    trackCode: 'SCHEDULE_J_ACADEMIC',
    name: 'Senior Lecturer to Associate Professor (Case I)',
    currentRankCode: 'SENIOR_LECTURER',
    targetRankCode: 'ASSOCIATE_PROFESSOR',
    minimumYearsInRank: 4,
    finalAuthority: 'UAPC',
    evidenceState: 'VERIFIED',
    status: 'ACTIVE',
    sourceClause: 'GCTU Basic Laws, Schedule J, Case I',
    requirements: academicOutputRequirements({ submittedMin: 10, submittedMax: 15, refereedMin: 10, bestCount: 10, assessors: 2, outsideGhana: 1 }),
    areaRequirements: academicAreaRequirements('VERY_GOOD'),
  },
  {
    code: 'J-SENIOR-RESEARCH-FELLOW-TO-ASSOCIATE-PROFESSOR-CASE-II',
    trackCode: 'SCHEDULE_J_ACADEMIC',
    name: 'Senior Research Fellow to Associate Professor (Case II)',
    currentRankCode: 'SENIOR_RESEARCH_FELLOW',
    targetRankCode: 'ASSOCIATE_PROFESSOR',
    minimumYearsInRank: 4,
    finalAuthority: 'UAPC',
    evidenceState: 'VERIFIED',
    status: 'ACTIVE',
    sourceClause: 'GCTU Basic Laws, Schedule J, Case II',
    requirements: academicOutputRequirements({ submittedMin: 12, submittedMax: 16, refereedMin: 12, bestCount: 12, assessors: 2, outsideGhana: 1 }),
    areaRequirements: academicAreaRequirements('VERY_GOOD'),
  },
  {
    code: 'J-ASSOCIATE-PROFESSOR-TO-PROFESSOR-CASE-I',
    trackCode: 'SCHEDULE_J_ACADEMIC',
    name: 'Associate Professor to Professor (Case I)',
    currentRankCode: 'ASSOCIATE_PROFESSOR',
    targetRankCode: 'PROFESSOR',
    minimumYearsInRank: 3,
    finalAuthority: 'COUNCIL',
    evidenceState: 'VERIFIED',
    status: 'ACTIVE',
    sourceClause: 'GCTU Basic Laws, Schedule J, Case I',
    requirements: academicOutputRequirements({ submittedMin: 15, submittedMax: 20, refereedMin: 15, bestCount: 15, assessors: 2, outsideGhana: 1 }),
    areaRequirements: academicAreaRequirements('EXCELLENT'),
  },
  {
    code: 'J-ASSOCIATE-PROFESSOR-TO-PROFESSOR-CASE-II',
    trackCode: 'SCHEDULE_J_ACADEMIC',
    name: 'Research-track Associate Professor to Professor (Case II)',
    currentRankCode: 'ASSOCIATE_PROFESSOR',
    targetRankCode: 'PROFESSOR',
    minimumYearsInRank: 3,
    finalAuthority: 'COUNCIL',
    evidenceState: 'VERIFIED',
    status: 'ACTIVE',
    sourceClause: 'GCTU Basic Laws, Schedule J, Case II',
    requirements: [
      ...academicOutputRequirements({ submittedMin: 20, submittedMax: 30, refereedMin: 20, bestCount: 20, assessors: 2, outsideGhana: 1 }),
      {
        code: 'RESEARCH_TRACK_CASE',
        name: 'Research-track case condition',
        type: 'SPECIAL_ROUTE_CONDITION',
        textValue: 'Case II applies to the research-track progression stated in Schedule J.',
        evidenceState: 'VERIFIED',
        sourceClause: 'GCTU Basic Laws, Schedule J, Case II',
      },
    ],
    areaRequirements: academicAreaRequirements('EXCELLENT'),
  },
];

const SCHEDULE_K_TIER_RULES = {
  FIRST: {
    minimumCategory: 'SATISFACTORY',
    combination: { minimumAtOrAbove: { SATISFACTORY: 4, GOOD: 1 }, coreAtOrAbove: { GOOD: 1 } },
    outputs: 2,
  },
  MIDDLE: {
    minimumCategory: 'GOOD',
    combination: { minimumAtOrAbove: { GOOD: 4, VERY_GOOD: 2 }, coreAtOrAbove: { VERY_GOOD: 1 } },
    outputs: 5,
  },
  HIGHEST: {
    minimumCategory: 'VERY_GOOD',
    combination: { minimumAtOrAbove: { VERY_GOOD: 4, EXCELLENT: 1 }, coreAtOrAbove: { EXCELLENT: 1 } },
    outputs: 5,
    refereedOutputs: 2,
  },
};

function scheduleKAreaRequirements(tier) {
  const rule = SCHEDULE_K_TIER_RULES[tier];
  return ['ABILITY_KNOWLEDGE_IN_WORK', 'PROMOTION_APPLICATION_OF_KNOWLEDGE', 'HUMAN_RELATIONS', 'SERVICE'].map((areaCode) => ({
    areaCode,
    minimumCategory: rule.minimumCategory,
    evidenceState: 'VERIFIED',
    sourceClause: 'GCTU Basic Laws, Schedule K',
  }));
}

function scheduleKRequirements({ tier, assessors, interview }) {
  const tierRule = SCHEDULE_K_TIER_RULES[tier];
  const requirements = [
    {
      code: 'AREA_CLASSIFICATION_COMBINATION',
      name: 'Four-area classification combination',
      type: 'CLASSIFICATION_COMBINATION',
      jsonValue: tierRule.combination,
      evidenceState: 'VERIFIED',
      sourceClause: 'GCTU Basic Laws, Schedule K',
      notes: 'Evaluate classifications at or above each band. Do not substitute an arithmetic average.',
    },
    {
      code: 'OUTPUTS_REQUIRED_FOR_TIER',
      name: tier === 'FIRST' ? 'Minimum professional outputs' : 'Minimum additional professional outputs',
      type: 'OUTPUTS_SUBMITTED_MINIMUM',
      numberValue: tierRule.outputs,
      evidenceState: 'VERIFIED',
      sourceClause: 'GCTU Basic Laws, Schedule K',
    },
    {
      code: 'EXTERNAL_ASSESSOR_COUNT',
      name: 'Required external assessors',
      type: 'EXTERNAL_ASSESSOR_COUNT',
      numberValue: assessors,
      evidenceState: 'VERIFIED',
      sourceClause: 'GCTU Basic Laws, Schedule K',
    },
    {
      code: 'FAVOURABLE_HEAD_ASSESSMENT',
      name: 'Favourable Head assessment required',
      type: 'OTHER',
      booleanValue: true,
      evidenceState: 'VERIFIED',
      sourceClause: 'GCTU Basic Laws, Schedule K',
    },
    {
      code: 'OUTPUT_REUSE_PROHIBITED',
      name: 'Previously used outputs cannot be counted again',
      type: 'OTHER',
      booleanValue: true,
      evidenceState: 'VERIFIED',
      sourceClause: 'GCTU Basic Laws, Schedule K',
    },
    RETIREMENT_REQUIREMENT,
  ];

  if (tierRule.refereedOutputs) {
    requirements.push({
      code: 'REFEREED_OUTPUTS_MIN',
      name: 'Minimum refereed outputs',
      type: 'REFEREED_OUTPUTS_MINIMUM',
      numberValue: tierRule.refereedOutputs,
      evidenceState: 'VERIFIED',
      sourceClause: 'GCTU Basic Laws, Schedule K',
    });
  }

  if (interview) {
    requirements.push({
      code: 'INTERVIEW_REQUIRED',
      name: 'Promotion interview required',
      type: 'OTHER',
      booleanValue: true,
      evidenceState: 'VERIFIED',
      sourceClause: 'GCTU Basic Laws, Schedule K',
    });
  }

  if (tier === 'HIGHEST') {
    requirements.push({
      code: 'TENURED_TARGET_RANK',
      name: 'Tenured target rank',
      type: 'SPECIAL_ROUTE_CONDITION',
      booleanValue: true,
      evidenceState: 'VERIFIED',
      sourceClause: 'GCTU Basic Laws, Schedule K',
    });
  }

  return requirements;
}

function scheduleKRoute({ code, name, currentRankCode, targetRankCode, minimumYearsInRank, tier, assessors, interview = false }) {
  return {
    code,
    trackCode: 'SCHEDULE_K_ADMIN_PRO',
    name,
    currentRankCode,
    targetRankCode,
    minimumYearsInRank,
    finalAuthority: 'COUNCIL',
    evidenceState: 'VERIFIED_CONFLICT',
    status: 'PROVISIONAL',
    sourceClause: 'GCTU Basic Laws, Schedule K',
    requirements: scheduleKRequirements({ tier, assessors, interview }),
    areaRequirements: scheduleKAreaRequirements(tier),
  };
}

const SCHEDULE_K_ROUTES = [
  scheduleKRoute({ code: 'K-REGISTRY-FIRST', name: 'Junior Assistant Registrar to Assistant Registrar', currentRankCode: 'JUNIOR_ASSISTANT_REGISTRAR', targetRankCode: 'ASSISTANT_REGISTRAR', minimumYearsInRank: 2, tier: 'FIRST', assessors: 0, interview: true }),
  scheduleKRoute({ code: 'K-REGISTRY-MIDDLE', name: 'Assistant Registrar to Senior Assistant Registrar', currentRankCode: 'ASSISTANT_REGISTRAR', targetRankCode: 'SENIOR_ASSISTANT_REGISTRAR', minimumYearsInRank: 4, tier: 'MIDDLE', assessors: 1 }),
  scheduleKRoute({ code: 'K-REGISTRY-HIGHEST', name: 'Senior Assistant Registrar to Deputy Registrar', currentRankCode: 'SENIOR_ASSISTANT_REGISTRAR', targetRankCode: 'DEPUTY_REGISTRAR', minimumYearsInRank: 5, tier: 'HIGHEST', assessors: 2 }),
  scheduleKRoute({ code: 'K-FINANCE-FIRST', name: 'Assistant Accountant to Accountant', currentRankCode: 'ASSISTANT_ACCOUNTANT', targetRankCode: 'ACCOUNTANT', minimumYearsInRank: 2, tier: 'FIRST', assessors: 0, interview: true }),
  scheduleKRoute({ code: 'K-FINANCE-MIDDLE', name: 'Accountant to Senior Accountant', currentRankCode: 'ACCOUNTANT', targetRankCode: 'SENIOR_ACCOUNTANT', minimumYearsInRank: 4, tier: 'MIDDLE', assessors: 1 }),
  scheduleKRoute({ code: 'K-FINANCE-HIGHEST', name: 'Senior Accountant to Deputy Director of Finance', currentRankCode: 'SENIOR_ACCOUNTANT', targetRankCode: 'DEPUTY_DIRECTOR_FINANCE', minimumYearsInRank: 5, tier: 'HIGHEST', assessors: 2 }),
  scheduleKRoute({ code: 'K-INTERNAL-AUDIT-FIRST', name: 'Assistant Internal Auditor to Internal Auditor', currentRankCode: 'ASSISTANT_INTERNAL_AUDITOR', targetRankCode: 'INTERNAL_AUDITOR', minimumYearsInRank: 2, tier: 'FIRST', assessors: 0, interview: true }),
  scheduleKRoute({ code: 'K-INTERNAL-AUDIT-MIDDLE', name: 'Internal Auditor to Senior Internal Auditor', currentRankCode: 'INTERNAL_AUDITOR', targetRankCode: 'SENIOR_INTERNAL_AUDITOR', minimumYearsInRank: 4, tier: 'MIDDLE', assessors: 1 }),
  scheduleKRoute({ code: 'K-INTERNAL-AUDIT-HIGHEST', name: 'Senior Internal Auditor to Deputy Director of Internal Audit', currentRankCode: 'SENIOR_INTERNAL_AUDITOR', targetRankCode: 'DEPUTY_DIRECTOR_INTERNAL_AUDIT', minimumYearsInRank: 5, tier: 'HIGHEST', assessors: 2 }),
  scheduleKRoute({ code: 'K-PROCUREMENT-FIRST', name: 'Junior Assistant Procurement Officer to Assistant Procurement Officer', currentRankCode: 'JUNIOR_ASSISTANT_PROCUREMENT_OFFICER', targetRankCode: 'ASSISTANT_PROCUREMENT_OFFICER', minimumYearsInRank: 2, tier: 'FIRST', assessors: 0, interview: true }),
  scheduleKRoute({ code: 'K-PROCUREMENT-MIDDLE', name: 'Assistant Procurement Officer to Senior Assistant Procurement Officer', currentRankCode: 'ASSISTANT_PROCUREMENT_OFFICER', targetRankCode: 'SENIOR_ASSISTANT_PROCUREMENT_OFFICER', minimumYearsInRank: 4, tier: 'MIDDLE', assessors: 1 }),
  scheduleKRoute({ code: 'K-LIBRARY-FIRST', name: 'Junior Assistant Librarian to Assistant Librarian', currentRankCode: 'JUNIOR_ASSISTANT_LIBRARIAN', targetRankCode: 'ASSISTANT_LIBRARIAN', minimumYearsInRank: 2, tier: 'FIRST', assessors: 0, interview: true }),
  scheduleKRoute({ code: 'K-LIBRARY-MIDDLE', name: 'Assistant Librarian to Senior Assistant Librarian', currentRankCode: 'ASSISTANT_LIBRARIAN', targetRankCode: 'SENIOR_ASSISTANT_LIBRARIAN', minimumYearsInRank: 4, tier: 'MIDDLE', assessors: 1 }),
  scheduleKRoute({ code: 'K-LIBRARY-HIGHEST', name: 'Senior Assistant Librarian to Deputy Librarian', currentRankCode: 'SENIOR_ASSISTANT_LIBRARIAN', targetRankCode: 'DEPUTY_LIBRARIAN', minimumYearsInRank: 5, tier: 'HIGHEST', assessors: 2 }),
];

const ROUTES = [...ACADEMIC_ROUTES, ...SCHEDULE_K_ROUTES];

const POLICY_CONFLICTS = [
  {
    code: 'BASIC-LAWS-CONTROLLING-VERSION',
    title: 'Controlling Basic Laws version and amendment history',
    description: 'The public PDF date, later Statutes references, and public launch history do not provide a complete amendment chain.',
    status: 'PROVISIONALLY_RESOLVED',
    sourceReferences: ['GCTU Basic Laws public PDF dated 2021-12-17', 'GCTU public notices continuing to apply the Basic Laws'],
    provisionalResolution: 'Use the public 2021-12-17 version until the Registrar supplies a controlled amendment register.',
    owner: 'Registrar / Legal Unit',
  },
  {
    code: 'SCHEDULE-J-LOWER-FINAL-AUTHORITY',
    title: 'Final authority for non-professorial academic promotions',
    description: 'Schedule J wording treats UAPC as final in one place while committee functions refer some recommendations to Academic Board.',
    status: 'PROVISIONALLY_RESOLVED',
    sourceReferences: ['GCTU Basic Laws, Schedule J', 'GCTU Basic Laws, UAPC committee functions'],
    affectedRouteCodes: ['J-LECTURER-TO-SENIOR-LECTURER'],
    provisionalResolution: 'Record UAPC as final for non-professorial routes and retain any Academic Board step as configurable pending confirmation.',
    owner: 'Registrar / UAPC Secretariat',
  },
  {
    code: 'SCHEDULE-J-FORWARDING-CONTROL',
    title: 'Whether an adverse preliminary assessment can stop an academic application',
    description: 'One rule says no application may be withheld from FAPC while later guidance allows failure to meet next-stage requirements to be communicated.',
    status: 'OPEN',
    sourceReferences: ['GCTU Basic Laws, Schedule J', 'Heads of Academic Departments Handbook, 2025'],
    provisionalResolution: 'Preserve the dossier and adverse assessment; do not silently discard or delete it.',
    owner: 'HRODD / Registrar',
  },
  {
    code: 'SCHEDULE-K-FOUR-VS-FIVE-AREAS',
    title: 'Schedule K four-area versus five-area wording',
    description: 'Schedule K defines four composite assessment areas but one sentence refers to five areas.',
    status: 'PROVISIONALLY_RESOLVED',
    sourceReferences: ['GCTU Basic Laws, Schedule K', 'GCTU profession-specific promotion forms'],
    affectedRouteCodes: SCHEDULE_K_ROUTES.map((route) => route.code),
    provisionalResolution: 'Use the four consistently defined and form-supported areas.',
    owner: 'RAPC / Registrar',
  },
  {
    code: 'SCHEDULE-K-FINAL-AUTHORITY',
    title: 'Final authority for Schedule K promotion routes',
    description: 'Schedule K says UAPC communicates a final outcome while UAPC functions send administrative and professional recommendations to Council.',
    status: 'PROVISIONALLY_RESOLVED',
    sourceReferences: ['GCTU Basic Laws, Schedule K', 'GCTU Basic Laws, UAPC committee functions'],
    affectedRouteCodes: SCHEDULE_K_ROUTES.map((route) => route.code),
    provisionalResolution: 'Record Council as final authority and keep every Schedule K route provisional until the approval boundary is confirmed.',
    owner: 'Registrar / Council Secretariat',
  },
  {
    code: 'APPEALS-FILING-WINDOW',
    title: 'Appeals Board filing period',
    description: 'Rule 10 states one month while the Form 1 note states fourteen days.',
    status: 'PROVISIONALLY_RESOLVED',
    sourceReferences: ['Appeals Board Rules and Regulations, Rule 10', 'Appeals Board Rules and Regulations, Form 1 note'],
    provisionalResolution: 'Configure one month as the operative Rule 10 period, display the conflict, and allow an authorized policy-version override.',
    owner: 'Appeals Board Secretariat / Legal Unit',
  },
  {
    code: 'WORKLOAD-TO-PROMOTION-MAPPING',
    title: 'Workload scorecard relationship to Schedule J assessment',
    description: 'The workload policy supplies annual evidence but does not formally map its percentages and bands to Schedule J classifications.',
    status: 'PROVISIONALLY_RESOLVED',
    sourceReferences: ['Teaching, Research and Service Workload Policy, 2024', 'GCTU Basic Laws, Schedule J'],
    provisionalResolution: 'Store workload results as evidence only and do not convert them automatically into Schedule J scores.',
    owner: 'Academic Board / UAPC',
  },
  {
    code: 'PROCUREMENT-HIGHER-ROUTE',
    title: 'Missing higher Procurement promotion route',
    description: 'The reviewed Schedule K promotion text states Procurement routes only up to Senior Assistant Procurement Officer.',
    status: 'OPEN',
    sourceReferences: ['GCTU Basic Laws, Schedule K', 'Supervisor-supplied Finance, Audit and Procurement promotion forms'],
    affectedRouteCodes: ['K-PROCUREMENT-HIGHER'],
    owner: 'HRODD / Procurement Directorate',
  },
  {
    code: 'LEGAL-SPORTS-ROUTES',
    title: 'Unverified Legal and Sports promotion ladders',
    description: 'Complete approved ladders and profession-specific Ability in Work templates were not found in the controlled evidence set.',
    status: 'OPEN',
    sourceReferences: ['GCTU Basic Laws, Schedule K'],
    owner: 'HRODD / Registrar',
  },
  {
    code: 'SENIOR-JUNIOR-UNIFIED-SCHEMES',
    title: 'Missing controlled Senior Staff and Junior Staff Unified Schemes',
    description: 'The Basic Laws establish committees but refer eligibility and rank rules to separate Unified Schemes not present in the evidence set.',
    status: 'OPEN',
    sourceReferences: ['GCTU Basic Laws, Senior Staff Committee', 'GCTU Basic Laws, Junior Staff Committee'],
    provisionalResolution: 'Keep both tracks blocked from production eligibility decisions.',
    owner: 'HRODD / Registrar',
  },
  {
    code: 'PROFESSION-RANK-NOMENCLATURE',
    title: 'Controlled profession rank nomenclature for remaining Schedule K families',
    description: 'Works, ICT, Health, Legal, and Sports need an authoritative current rank catalogue before staff records and routes are activated.',
    status: 'OPEN',
    sourceReferences: ['GCTU Basic Laws, Schedule K', 'Supervisor-supplied profession-specific forms'],
    provisionalResolution: 'Do not create generic production ranks as substitutes for controlled HRODD rank names.',
    owner: 'HRODD',
  },
];

function assertUnique(items, key, label) {
  const seen = new Set();
  for (const item of items) {
    const value = item[key];
    if (!value || seen.has(value)) {
      throw new Error(`${label} contains a missing or duplicate ${key}: ${value}`);
    }
    seen.add(value);
  }
}

function validateFoundation() {
  assertUnique(POLICY_SOURCES, 'code', 'POLICY_SOURCES');
  assertUnique(ORGANIZATION_UNITS, 'code', 'ORGANIZATION_UNITS');
  assertUnique(OFFICE_DEFINITIONS, 'code', 'OFFICE_DEFINITIONS');
  assertUnique(RANK_DEFINITIONS, 'code', 'RANK_DEFINITIONS');
  assertUnique(TRACKS, 'code', 'TRACKS');
  assertUnique(ROUTES, 'code', 'ROUTES');
  assertUnique(POLICY_CONFLICTS, 'code', 'POLICY_CONFLICTS');

  const sourceCodes = new Set(POLICY_SOURCES.map((item) => item.code));
  const versionKeys = new Set(POLICY_VERSIONS.map((item) => `${item.sourceCode}:${item.versionLabel}`));
  const unitCodes = new Set(ORGANIZATION_UNITS.map((item) => item.code));
  const rankCodes = new Set(RANK_DEFINITIONS.map((item) => item.code));
  const trackCodes = new Set(TRACKS.map((item) => item.code));

  for (const version of POLICY_VERSIONS) {
    if (!sourceCodes.has(version.sourceCode)) throw new Error(`Unknown policy source ${version.sourceCode}`);
  }

  for (const unit of ORGANIZATION_UNITS) {
    if (unit.parentCode && !unitCodes.has(unit.parentCode)) throw new Error(`Unknown parent unit ${unit.parentCode}`);
  }

  for (const track of TRACKS) {
    if (!versionKeys.has(track.policyVersionKey)) throw new Error(`Unknown policy version ${track.policyVersionKey}`);
    assertUnique(track.areas, 'code', `${track.code} areas`);
  }

  for (const route of ROUTES) {
    if (!trackCodes.has(route.trackCode)) throw new Error(`Unknown track ${route.trackCode}`);
    if (!rankCodes.has(route.currentRankCode)) throw new Error(`Unknown current rank ${route.currentRankCode}`);
    if (!rankCodes.has(route.targetRankCode)) throw new Error(`Unknown target rank ${route.targetRankCode}`);
    if (!route.sourceClause) throw new Error(`Route ${route.code} has no source clause`);
    assertUnique(route.requirements, 'code', `${route.code} requirements`);
    assertUnique(route.areaRequirements, 'areaCode', `${route.code} area requirements`);
    const areaCodes = new Set(TRACKS.find((track) => track.code === route.trackCode).areas.map((area) => area.code));
    for (const requirement of route.areaRequirements) {
      if (!areaCodes.has(requirement.areaCode)) throw new Error(`Unknown area ${requirement.areaCode} on ${route.code}`);
    }
  }

  const blockedTrackCodes = new Set(TRACKS.filter((track) => track.status === 'BLOCKED').map((track) => track.code));
  for (const route of ROUTES) {
    if (blockedTrackCodes.has(route.trackCode)) throw new Error(`Blocked track ${route.trackCode} must not have active route data`);
  }

  return true;
}

module.exports = {
  POLICY_SOURCES,
  POLICY_VERSIONS,
  ORGANIZATION_UNITS,
  OFFICE_DEFINITIONS,
  RANK_DEFINITIONS,
  TRACKS,
  ROUTES,
  POLICY_CONFLICTS,
  SCHEDULE_K_TIER_RULES,
  validateFoundation,
};
