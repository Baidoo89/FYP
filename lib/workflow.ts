import { RequestStatus } from '@prisma/client';
import type { AuthRole } from './auth';

const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  DRAFT: [RequestStatus.SUBMITTED],
  SUBMITTED: [RequestStatus.UNDER_DEPARTMENT_REVIEW],
  UNDER_DEPARTMENT_REVIEW: [RequestStatus.UNDER_HR_VERIFICATION, RequestStatus.RETURNED_FOR_CORRECTION, RequestStatus.REQUIRES_FURTHER_REVIEW],
  UNDER_REVIEW: [RequestStatus.UNDER_DEPARTMENT_REVIEW, RequestStatus.UNDER_HR_VERIFICATION, RequestStatus.RETURNED_FOR_CORRECTION],
  RETURNED_FOR_CORRECTION: [RequestStatus.SUBMITTED],
  UNDER_HR_VERIFICATION: [RequestStatus.UNDER_COMMITTEE_REVIEW, RequestStatus.RETURNED_FOR_CORRECTION, RequestStatus.REQUIRES_FURTHER_REVIEW],
  UNDER_COMMITTEE_REVIEW: [RequestStatus.RECOMMENDED, RequestStatus.NOT_RECOMMENDED, RequestStatus.REQUIRES_FURTHER_REVIEW],
  ELIGIBLE: [RequestStatus.UNDER_COMMITTEE_REVIEW],
  NOT_ELIGIBLE: [RequestStatus.REQUIRES_FURTHER_REVIEW, RequestStatus.NOT_RECOMMENDED],
  REQUIRES_FURTHER_REVIEW: [RequestStatus.UNDER_DEPARTMENT_REVIEW, RequestStatus.UNDER_HR_VERIFICATION, RequestStatus.UNDER_COMMITTEE_REVIEW],
  RECOMMENDED: [RequestStatus.APPROVED_BY_AUTHORITY],
  NOT_RECOMMENDED: [RequestStatus.COMPLETED],
  APPROVED_BY_AUTHORITY: [RequestStatus.COMPLETED],
  APPROVED: [RequestStatus.COMPLETED],
  REJECTED: [RequestStatus.COMPLETED],
  COMPLETED: [],
};

const ROLE_TRANSITION_TARGETS: Record<AuthRole, RequestStatus[]> = {
  LECTURER: [RequestStatus.SUBMITTED],
  HOD_DEAN: [RequestStatus.UNDER_DEPARTMENT_REVIEW, RequestStatus.UNDER_HR_VERIFICATION, RequestStatus.RETURNED_FOR_CORRECTION, RequestStatus.REQUIRES_FURTHER_REVIEW],
  HR_ADMIN: [
    RequestStatus.UNDER_HR_VERIFICATION,
    RequestStatus.UNDER_COMMITTEE_REVIEW,
    RequestStatus.RETURNED_FOR_CORRECTION,
    RequestStatus.REQUIRES_FURTHER_REVIEW,
    RequestStatus.APPROVED_BY_AUTHORITY,
    RequestStatus.REJECTED,
    RequestStatus.COMPLETED,
  ],
  COMMITTEE_REVIEWER: [RequestStatus.RECOMMENDED, RequestStatus.NOT_RECOMMENDED, RequestStatus.REQUIRES_FURTHER_REVIEW],
  SYSTEM_ADMIN: Object.values(RequestStatus),
};

export function canTransitionStatus(oldStatus: RequestStatus, newStatus: RequestStatus, role: AuthRole) {
  const legalTarget = TRANSITIONS[oldStatus]?.includes(newStatus);
  const roleAllowed = ROLE_TRANSITION_TARGETS[role]?.includes(newStatus);
  return Boolean(legalTarget && roleAllowed);
}

export function assertStatusTransition(oldStatus: RequestStatus, newStatus: RequestStatus, role: AuthRole) {
  if (!canTransitionStatus(oldStatus, newStatus, role)) {
    throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus} for ${role}`);
  }
}

export function getNextSubmissionStatus(role: AuthRole) {
  return role === 'LECTURER' ? RequestStatus.SUBMITTED : RequestStatus.UNDER_DEPARTMENT_REVIEW;
}
