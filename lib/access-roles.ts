export const APPLICANT_ACCOUNT_ROLES = ['STAFF', 'LECTURER'] as const;

export type ApplicantAccountRole = (typeof APPLICANT_ACCOUNT_ROLES)[number];

export function isApplicantAccountRole(role?: string | null): role is ApplicantAccountRole {
  return Boolean(role && APPLICANT_ACCOUNT_ROLES.includes(role as ApplicantAccountRole));
}
