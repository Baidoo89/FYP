import type { AuthRole } from '../auth';

export type FormField = {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  minimumRows?: number;
  options?: string[];
  columns?: Array<{ id: string; label: string; type?: string; required?: boolean }>;
  rows?: Array<{ id: string; label: string; weight: number }>;
};

export type FormSchema = {
  title: string;
  instructions?: string;
  declarationText?: string;
  confidential?: boolean;
  sections: Array<{ id: string; title: string; fields: FormField[] }>;
};

export type FormResponses = Record<string, unknown>;

type ProfessionalOutputRow = {
  title?: unknown;
  type?: unknown;
  date?: unknown;
  evidenceReference?: unknown;
  previouslyCounted?: unknown;
};

const ACCESS_ROLE_AUDIENCES: Record<string, string[]> = {
  APPLICANT: ['APPLICANT'],
  HOD: ['DEPARTMENT', 'SUPERVISOR'],
  DEAN: ['FACULTY', 'SUPERVISOR'],
  HEAD_OF_UNIT: ['DEPARTMENT', 'SUPERVISOR'],
  HRODD_OFFICER: ['HRODD'],
  REGISTRAR_OFFICER: ['REGISTRAR'],
  FAPC_MEMBER: ['FACULTY'],
  RAPC_MEMBER: ['RAPC'],
  UAPC_MEMBER: ['UAPC'],
  COUNCIL_MEMBER: ['COUNCIL'],
  SENIOR_STAFF_COMMITTEE_MEMBER: ['RAPC'],
  JUNIOR_STAFF_COMMITTEE_MEMBER: ['RAPC'],
  LIBRARY_VERIFIER: ['LIBRARY'],
};

const FALLBACK_ROLE_AUDIENCES: Record<AuthRole, string[]> = {
  STAFF: ['APPLICANT'],
  LECTURER: ['APPLICANT'],
  HOD_DEAN: ['DEPARTMENT', 'FACULTY', 'SUPERVISOR'],
  HR_ADMIN: ['HRODD', 'REGISTRAR'],
  COMMITTEE_REVIEWER: ['FACULTY', 'RAPC', 'UAPC', 'COUNCIL'],
  SYSTEM_ADMIN: [],
};

export function audiencesForActor(role: AuthRole, accessRoles: string[] = []) {
  const audiences = new Set<string>();
  for (const accessRole of accessRoles) {
    for (const audience of ACCESS_ROLE_AUDIENCES[accessRole] || []) audiences.add(audience);
  }
  for (const audience of FALLBACK_ROLE_AUDIENCES[role] || []) audiences.add(audience);
  return audiences;
}

function isFilled(value: unknown) {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value && typeof value === 'object');
}

function validateRepeater(field: FormField, value: unknown) {
  const errors: string[] = [];
  const rows = Array.isArray(value) ? value : [];
  const minimumRows = field.minimumRows || (field.required ? 1 : 0);
  if (rows.length < minimumRows) errors.push(`${field.label} requires at least ${minimumRows} entr${minimumRows === 1 ? 'y' : 'ies'}.`);

  rows.forEach((row, index) => {
    const record = row && typeof row === 'object' ? row as Record<string, unknown> : {};
    for (const column of field.columns || []) {
      if (column.required && !isFilled(record[column.id])) {
        errors.push(`${field.label}, row ${index + 1}: ${column.label} is required.`);
      }
    }
  });
  return errors;
}

function validateScoreMatrix(field: FormField, value: unknown) {
  const errors: string[] = [];
  const scores = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  for (const row of field.rows || []) {
    const score = Number(scores[row.id]);
    if (!Number.isFinite(score)) {
      errors.push(`${field.label}: score ${row.label}.`);
    } else if (score < 0 || score > row.weight) {
      errors.push(`${field.label}: ${row.label} must be between 0 and ${row.weight}.`);
    }
  }
  return errors;
}

function fieldErrors(field: FormField, value: unknown) {
  if (field.type === 'repeater') return validateRepeater(field, value);
  if (field.type === 'score_matrix') return validateScoreMatrix(field, value);
  if (field.type === 'checklist' && field.required) {
    const checked = Array.isArray(value) ? value : [];
    const missing = (field.options || []).filter((option) => !checked.includes(option));
    return missing.length ? [`${field.label}: confirm ${missing.join(', ')}.`] : [];
  }
  if (field.required && !isFilled(value)) return [`${field.label} is required.`];
  return [];
}

export function validateFormResponses(schema: FormSchema, responses: FormResponses) {
  const errors: string[] = [];
  let requiredCount = 0;
  let completedCount = 0;

  for (const section of schema.sections || []) {
    for (const field of section.fields || []) {
      if (!field.required) continue;
      requiredCount += 1;
      const nextErrors = fieldErrors(field, responses[field.id]);
      errors.push(...nextErrors);
      if (nextErrors.length === 0) completedCount += 1;
    }
  }

  return {
    errors,
    completionPercent: requiredCount === 0 ? 100 : Math.round((completedCount / requiredCount) * 100),
  };
}

function normalizedOutputPart(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';
}

export function professionalOutputRows(responses: FormResponses) {
  return Array.isArray(responses.professionalOutputs)
    ? responses.professionalOutputs.filter((row): row is ProfessionalOutputRow => Boolean(row && typeof row === 'object'))
    : [];
}

export function professionalOutputKey(row: ProfessionalOutputRow) {
  const reference = normalizedOutputPart(row.evidenceReference);
  if (reference) return `ref:${reference}`;
  return ['output', normalizedOutputPart(row.title), normalizedOutputPart(row.type), normalizedOutputPart(row.date)].join(':');
}

export function professionalOutputReuseErrors(
  responses: FormResponses,
  priorSubmissions: Array<{ requestLabel: string; responses: FormResponses }>,
) {
  const errors: string[] = [];
  const current = professionalOutputRows(responses);
  const prior = new Map<string, string>();
  for (const submission of priorSubmissions) {
    for (const row of professionalOutputRows(submission.responses)) {
      prior.set(professionalOutputKey(row), submission.requestLabel);
    }
  }

  const seen = new Set<string>();
  current.forEach((row, index) => {
    const key = professionalOutputKey(row);
    const title = normalizedOutputPart(row.title) || `output ${index + 1}`;
    if (row.previouslyCounted === true || normalizedOutputPart(row.previouslyCounted) === 'yes' || normalizedOutputPart(row.previouslyCounted) === 'true') {
      errors.push(`${title} is marked as already counted for an earlier promotion.`);
    }
    if (seen.has(key)) errors.push(`${title} appears more than once in this application.`);
    seen.add(key);
    const earlierCase = prior.get(key);
    if (earlierCase) errors.push(`${title} was already counted in ${earlierCase}.`);
  });
  return errors;
}

export function initialFormResponses(input: {
  applicantName: string;
  staffId?: string | null;
  currentRank: string;
  targetRank: string;
  unit?: string | null;
  dossierVersion?: number | null;
}) {
  return {
    applicantName: input.applicantName,
    staffId: input.staffId || '',
    currentRank: input.currentRank,
    targetRank: input.targetRank,
    unit: input.unit || '',
    dossierVersion: input.dossierVersion ? String(input.dossierVersion) : '',
  };
}

export function templateApplies(template: {
  trackType?: string | null;
  staffCategory?: string | null;
  routeCodePrefixes?: unknown;
}, request: { routeCode: string; trackType: string; staffCategory: string }) {
  if (template.trackType && template.trackType !== request.trackType) return false;
  if (template.staffCategory && template.staffCategory !== request.staffCategory) return false;
  const prefixes = Array.isArray(template.routeCodePrefixes) ? template.routeCodePrefixes.filter((item): item is string => typeof item === 'string') : [];
  return prefixes.length === 0 || prefixes.some((prefix) => request.routeCode.startsWith(prefix));
}

export function isApplicantRole(role: AuthRole) {
  return role === 'STAFF' || role === 'LECTURER';
}
