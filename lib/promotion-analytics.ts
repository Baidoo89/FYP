import { Prisma } from '@prisma/client';
import type { AuthRole } from './auth';
import { prisma } from './prisma';

export type PromotionAnalyticsFilters = {
  department?: string;
  startDate?: string;
  endDate?: string;
};

export type PromotionAnalyticsScope = {
  role: AuthRole;
  department?: string | null;
};

export type PromotionAnalyticsSummary = {
  executive: {
    totalApplications: number;
    activeApplications: number;
    pendingDepartmentReview: number;
    pendingVerification: number;
    returnedForCorrection: number;
    underCommitteeReview: number;
    eligibleApplicants: number;
    notEligibleApplicants: number;
    recommended: number;
    completed: number;
    averageScore: number;
    completionRate: number;
  };
  documents: {
    total: number;
    pending: number;
    verified: number;
    correction: number;
    rejected: number;
    verifiedRate: number;
    categories: Array<{ category: string; label: string; value: number }>;
  };
  recommendations: {
    recommended: number;
    notRecommended: number;
    furtherReview: number;
    totalComments: number;
  };
  statusBreakdown: Array<{ status: string; label: string; value: number; tone: 'green' | 'amber' | 'red' | 'blue' | 'slate' }>;
  eligibilityBreakdown: Array<{ status: string; label: string; value: number; tone: 'green' | 'amber' | 'red' | 'blue' | 'slate' }>;
  departmentApplications: Array<{
    department: string;
    total: number;
    eligible: number;
    notEligible: number;
    committeeReview: number;
    completed: number;
    returned: number;
    pendingDocuments: number;
  }>;
  recentApplications: Array<{
    id: number;
    code: string;
    lecturerName: string;
    lecturerEmail: string;
    department: string;
    currentRank: string;
    targetRank: string;
    status: string;
    eligibilityStatus: string;
    submittedAt: string | null;
    createdAt: string;
    documentCount: number;
    verifiedDocumentCount: number;
    totalScore: number | null;
  }>;
  recentAudit: Array<{
    id: number;
    action: string;
    actor: string;
    description: string;
    createdAt: string;
  }>;
  filters: {
    department: string;
    startDate: string;
    endDate: string;
    enforcedDepartment?: string;
  };
};

const terminalStatuses = new Set(['APPROVED', 'APPROVED_BY_AUTHORITY', 'REJECTED', 'NOT_RECOMMENDED', 'COMPLETED']);

const statusRows = [
  { status: 'DRAFT', label: 'Draft', tone: 'slate' },
  { status: 'SUBMITTED', label: 'Submitted', tone: 'blue' },
  { status: 'UNDER_DEPARTMENT_REVIEW', label: 'Department Review', tone: 'blue' },
  { status: 'RETURNED_FOR_CORRECTION', label: 'Returned', tone: 'amber' },
  { status: 'UNDER_HR_VERIFICATION', label: 'HR Verification', tone: 'blue' },
  { status: 'UNDER_COMMITTEE_REVIEW', label: 'Committee Review', tone: 'blue' },
  { status: 'REQUIRES_FURTHER_REVIEW', label: 'Further Review', tone: 'amber' },
  { status: 'RECOMMENDED', label: 'Recommended', tone: 'green' },
  { status: 'NOT_RECOMMENDED', label: 'Not Recommended', tone: 'red' },
  { status: 'APPROVED_BY_AUTHORITY', label: 'Authority Approved', tone: 'green' },
  { status: 'COMPLETED', label: 'Completed', tone: 'green' },
] as const;

const eligibilityRows = [
  { status: 'NOT_CALCULATED', label: 'Not Calculated', tone: 'slate' },
  { status: 'ELIGIBLE', label: 'Eligible', tone: 'green' },
  { status: 'NOT_ELIGIBLE', label: 'Not Eligible', tone: 'red' },
  { status: 'INCOMPLETE_APPLICATION', label: 'Incomplete', tone: 'amber' },
  { status: 'REQUIRES_FURTHER_REVIEW', label: 'Further Review', tone: 'blue' },
  { status: 'NEEDS_REVIEW', label: 'Needs Review', tone: 'blue' },
] as const;

function clean(value?: string | null) {
  return (value || '').trim();
}

function parseStartDate(value?: string) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseEndDate(value?: string) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  date.setHours(23, 59, 59, 999);
  return date;
}

function labelFromEnum(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function promotionCode(id: number, createdAt: Date) {
  return `PR-${createdAt.getFullYear()}-${String(id).padStart(4, '0')}`;
}

function countBy<T>(rows: T[], selector: (row: T) => string) {
  return rows.reduce<Record<string, number>>((accumulator, row) => {
    const key = selector(row);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function buildWhere(filters: PromotionAnalyticsFilters, scope: PromotionAnalyticsScope) {
  const requestedDepartment = clean(filters.department);
  const enforcedDepartment = scope.role === 'HOD_DEAN' ? clean(scope.department) : '';
  const activeDepartment = enforcedDepartment || requestedDepartment;
  const where: Prisma.PromotionRequestWhereInput = {};

  if (activeDepartment) {
    where.lecturer = {
      department: {
        contains: activeDepartment,
        mode: 'insensitive',
      },
    };
  }

  const startDate = parseStartDate(filters.startDate);
  const endDate = parseEndDate(filters.endDate);

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  return { where, activeDepartment, enforcedDepartment };
}

export async function loadPromotionAnalytics(filters: PromotionAnalyticsFilters, scope: PromotionAnalyticsScope): Promise<PromotionAnalyticsSummary> {
  const normalizedFilters = {
    department: clean(filters.department),
    startDate: clean(filters.startDate),
    endDate: clean(filters.endDate),
  };
  const { where, activeDepartment, enforcedDepartment } = buildWhere(normalizedFilters, scope);

  const requests = await prisma.promotionRequest.findMany({
    where,
    include: {
      lecturer: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          currentRank: true,
        },
      },
      documents: {
        select: {
          id: true,
          category: true,
          status: true,
          verificationStatus: true,
        },
      },
      reviewComments: {
        select: {
          id: true,
          recommendation: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 1000,
  });

  const requestIds = requests.map((request) => request.id);
  const auditLogs = requestIds.length
    ? await prisma.auditLog.findMany({
        where: {
          requestId: {
            in: requestIds,
          },
        },
        include: {
          actor: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
      })
    : [];

  const allDocuments = requests.flatMap((request) => request.documents);
  const allComments = requests.flatMap((request) => request.reviewComments);
  const statusCounts = countBy(requests, (request) => request.status);
  const eligibilityCounts = countBy(requests, (request) => request.eligibilityStatus);
  const documentCategoryCounts = countBy(allDocuments, (document) => document.category);

  const pendingDocuments = allDocuments.filter((document) => document.verificationStatus === 'PENDING' || document.status === 'PENDING').length;
  const verifiedDocuments = allDocuments.filter((document) => document.verificationStatus === 'VERIFIED' || document.status === 'VERIFIED').length;
  const correctionDocuments = allDocuments.filter(
    (document) => document.verificationStatus === 'REQUIRES_CORRECTION' || document.status === 'REQUIRES_CORRECTION'
  ).length;
  const rejectedDocuments = allDocuments.filter((document) => document.verificationStatus === 'REJECTED' || document.status === 'REJECTED').length;

  const recommendedComments = allComments.filter((comment) => comment.recommendation === 'RECOMMENDED').length;
  const notRecommendedComments = allComments.filter((comment) => comment.recommendation === 'NOT_RECOMMENDED').length;
  const furtherReviewComments = allComments.filter((comment) => comment.recommendation === 'REQUIRES_FURTHER_REVIEW').length;

  const completedApplications = requests.filter((request) => ['APPROVED', 'APPROVED_BY_AUTHORITY', 'COMPLETED'].includes(request.status)).length;
  const recommendedApplications = requests.filter(
    (request) => request.status === 'RECOMMENDED' || request.reviewComments.some((comment) => comment.recommendation === 'RECOMMENDED')
  ).length;

  const departmentMap = new Map<string, PromotionAnalyticsSummary['departmentApplications'][number]>();
  for (const request of requests) {
    const department = request.lecturer.department || 'Unassigned';
    const row =
      departmentMap.get(department) ||
      {
        department,
        total: 0,
        eligible: 0,
        notEligible: 0,
        committeeReview: 0,
        completed: 0,
        returned: 0,
        pendingDocuments: 0,
      };

    row.total += 1;
    if (request.eligibilityStatus === 'ELIGIBLE') row.eligible += 1;
    if (request.eligibilityStatus === 'NOT_ELIGIBLE') row.notEligible += 1;
    if (request.status === 'UNDER_COMMITTEE_REVIEW') row.committeeReview += 1;
    if (['APPROVED', 'APPROVED_BY_AUTHORITY', 'COMPLETED'].includes(request.status)) row.completed += 1;
    if (request.status === 'RETURNED_FOR_CORRECTION') row.returned += 1;
    row.pendingDocuments += request.documents.filter((document) => document.verificationStatus === 'PENDING' || document.status === 'PENDING').length;
    departmentMap.set(department, row);
  }

  return {
    executive: {
      totalApplications: requests.length,
      activeApplications: requests.filter((request) => !terminalStatuses.has(request.status)).length,
      pendingDepartmentReview: requests.filter((request) => ['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW'].includes(request.status)).length,
      pendingVerification: requests.filter((request) => request.status === 'UNDER_HR_VERIFICATION').length,
      returnedForCorrection: requests.filter((request) => request.status === 'RETURNED_FOR_CORRECTION').length,
      underCommitteeReview: requests.filter((request) => request.status === 'UNDER_COMMITTEE_REVIEW').length,
      eligibleApplicants: requests.filter((request) => request.eligibilityStatus === 'ELIGIBLE').length,
      notEligibleApplicants: requests.filter((request) => request.eligibilityStatus === 'NOT_ELIGIBLE').length,
      recommended: recommendedApplications,
      completed: completedApplications,
      averageScore: average(requests.map((request) => (request.totalScore === null ? null : Number(request.totalScore))).filter((score): score is number => score !== null)),
      completionRate: percent(completedApplications, requests.length),
    },
    documents: {
      total: allDocuments.length,
      pending: pendingDocuments,
      verified: verifiedDocuments,
      correction: correctionDocuments,
      rejected: rejectedDocuments,
      verifiedRate: percent(verifiedDocuments, allDocuments.length),
      categories: Object.entries(documentCategoryCounts)
        .map(([category, value]) => ({ category, label: labelFromEnum(category), value }))
        .sort((left, right) => right.value - left.value),
    },
    recommendations: {
      recommended: recommendedComments,
      notRecommended: notRecommendedComments,
      furtherReview: furtherReviewComments,
      totalComments: allComments.length,
    },
    statusBreakdown: statusRows.map((row) => ({ ...row, value: statusCounts[row.status] || 0 })),
    eligibilityBreakdown: eligibilityRows.map((row) => ({ ...row, value: eligibilityCounts[row.status] || 0 })),
    departmentApplications: Array.from(departmentMap.values()).sort((left, right) => right.total - left.total),
    recentApplications: requests.slice(0, 8).map((request) => ({
      id: request.id,
      code: promotionCode(request.id, request.createdAt),
      lecturerName: request.lecturer.name,
      lecturerEmail: request.lecturer.email,
      department: request.lecturer.department || 'Unassigned',
      currentRank: request.currentRank,
      targetRank: request.targetRank,
      status: request.status,
      eligibilityStatus: request.eligibilityStatus,
      submittedAt: request.submittedAt ? request.submittedAt.toISOString() : null,
      createdAt: request.createdAt.toISOString(),
      documentCount: request.documents.length,
      verifiedDocumentCount: request.documents.filter((document) => document.verificationStatus === 'VERIFIED' || document.status === 'VERIFIED').length,
      totalScore: request.totalScore === null ? null : Number(request.totalScore),
    })),
    recentAudit: auditLogs.map((log) => ({
      id: log.id,
      action: labelFromEnum(log.action),
      actor: log.actor ? `${log.actor.name} (${log.actor.email})` : 'System',
      description: log.description || 'Workflow activity recorded',
      createdAt: log.createdAt.toISOString(),
    })),
    filters: {
      department: activeDepartment,
      startDate: normalizedFilters.startDate,
      endDate: normalizedFilters.endDate,
      enforcedDepartment: enforcedDepartment || undefined,
    },
  };
}

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return text.includes(',') || text.includes('"') || text.includes('\n') ? `"${text.replace(/"/g, '""')}"` : text;
}

function rowsToCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>) {
  return [headers.map(escapeCsvValue).join(','), ...rows.map((row) => row.map(escapeCsvValue).join(','))].join('\n');
}

export function promotionAnalyticsToCsv(summary: PromotionAnalyticsSummary) {
  const headers = [
    'Department',
    'Total Applications',
    'Eligible',
    'Not Eligible',
    'Committee Review',
    'Completed',
    'Returned',
    'Pending Documents',
  ];

  const rows = summary.departmentApplications.map((department) => [
    department.department,
    department.total,
    department.eligible,
    department.notEligible,
    department.committeeReview,
    department.completed,
    department.returned,
    department.pendingDocuments,
  ]);

  if (!rows.length) {
    rows.push(['No applications', 0, 0, 0, 0, 0, 0, 0]);
  }

  return rowsToCsv(headers, rows);
}
