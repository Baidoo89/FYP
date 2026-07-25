'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DashboardCard, EmptyState, ErrorState, LoadingState, SectionCard, SimpleBarChart } from '../../components/enterprise-ui';
import StatusBadge from '../../components/promotion/StatusBadge';

type Tone = 'green' | 'amber' | 'red' | 'blue' | 'slate';
type ViewerRole = 'HOD_DEAN' | 'HR_ADMIN' | 'COMMITTEE_REVIEWER' | 'SYSTEM_ADMIN';

type PromotionAnalyticsSummary = {
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
  statusBreakdown: Array<{ status: string; label: string; value: number; tone: Tone }>;
  eligibilityBreakdown: Array<{ status: string; label: string; value: number; tone: Tone }>;
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
    scopeKind?: 'institution' | 'department' | 'faculty' | 'unassigned';
    scopeLabel?: string;
    scopeDetail?: string;
  };
  viewerRole: ViewerRole;
};

type AnalyticsResponse = {
  success: boolean;
  data?: PromotionAnalyticsSummary;
  error?: string;
};

function labelFromEnum(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return 'Not submitted';
  return new Intl.DateTimeFormat('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function activeRows(rows: Array<{ label: string; value: number; tone: Tone }>) {
  const visibleRows = rows.filter((row) => row.value > 0);
  return visibleRows.length ? visibleRows : rows;
}

function percentValue(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function statusTotal(summary: PromotionAnalyticsSummary, statuses: string[]) {
  return summary.statusBreakdown
    .filter((row) => statuses.includes(row.status))
    .reduce((total, row) => total + row.value, 0);
}

function dateWindow(summary: PromotionAnalyticsSummary) {
  const start = summary.filters.startDate || '';
  const end = summary.filters.endDate || '';
  if (start && end) return `${formatDate(start)} to ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  if (end) return `Until ${formatDate(end)}`;
  return 'All available promotion records';
}

function workspaceHref(role: ViewerRole) {
  if (role === 'HOD_DEAN') return '/hod/review-queue';
  if (role === 'COMMITTEE_REVIEWER') return '/committee/review?segment=pending';
  if (role === 'SYSTEM_ADMIN') return '/hr/requests';
  return '/hr/requests';
}

function workspaceLabel(role: ViewerRole) {
  if (role === 'HOD_DEAN') return 'Open Review Workspace';
  if (role === 'COMMITTEE_REVIEWER') return 'Open Committee Queue';
  if (role === 'SYSTEM_ADMIN') return 'Open Administrative Files';
  return 'Open HR Requests';
}

function applicationHref(role: ViewerRole, id: number) {
  if (role === 'HOD_DEAN') return `/hod/review-queue?request=${id}`;
  if (role === 'COMMITTEE_REVIEWER') return `/committee/review?request=${id}`;
  return `/hr/requests?request=${id}`;
}

export default function AnalyticsPage() {
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<PromotionAnalyticsSummary | null>(null);

  const exportQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (departmentFilter) params.set('department', departmentFilter);
    if (startDateFilter) params.set('startDate', startDateFilter);
    if (endDateFilter) params.set('endDate', endDateFilter);
    return params.toString();
  }, [departmentFilter, startDateFilter, endDateFilter]);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/analytics/summary?${exportQuery}`, { cache: 'no-store' });
        const payload = (await response.json()) as AnalyticsResponse;

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || 'Failed to load analytics summary');
        }

        setSummary(payload.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load analytics summary');
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [exportQuery]);

  if (loading) {
    return <LoadingState label="Loading promotion analytics..." />;
  }

  if (error || !summary) {
    return <ErrorState message={error || 'Failed to load analytics summary'} />;
  }

  const exportSuffix = exportQuery ? `&${exportQuery}` : '';
  const statusRows = activeRows(summary.statusBreakdown);
  const eligibilityRows = activeRows(summary.eligibilityBreakdown);
  const categoryRows = summary.documents.categories.map((category) => ({ label: category.label, value: category.value, tone: 'green' as Tone }));
  const evidenceAttention = summary.documents.pending + summary.documents.correction + summary.documents.rejected;
  const decidedRecommendations = summary.recommendations.recommended + summary.recommendations.notRecommended;
  const committeeDecisionRate = summary.recommendations.totalComments
    ? Math.round((decidedRecommendations / summary.recommendations.totalComments) * 100)
    : 0;
  const viewerRole = summary.viewerRole;
  const isDepartmentReviewer = viewerRole === 'HOD_DEAN';
  const reportScope = summary.filters.enforcedDepartment || summary.filters.scopeLabel || summary.filters.department || 'Institution-wide';
  const departmentPending = statusTotal(summary, ['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW']);
  const returnedOrFurther = statusTotal(summary, ['RETURNED_FOR_CORRECTION', 'REQUIRES_FURTHER_REVIEW']);
  const forwardedBeyondDepartment = statusTotal(summary, [
    'UNDER_HR_VERIFICATION',
    'UNDER_COMMITTEE_REVIEW',
    'RECOMMENDED',
    'NOT_RECOMMENDED',
    'APPROVED',
    'APPROVED_BY_AUTHORITY',
    'COMPLETED',
  ]);
  const departmentReviewRate = percentValue(forwardedBeyondDepartment, summary.executive.totalApplications);
  const nextActionText = departmentPending > 0
    ? `${departmentPending} application(s) require department review or forwarding.`
    : returnedOrFurther > 0
      ? `${returnedOrFurther} application(s) require correction follow-up or further review.`
      : summary.executive.pendingVerification > 0
        ? `${summary.executive.pendingVerification} application(s) are awaiting HR verification.`
        : 'No urgent review action is pending in this report scope.';
  const nextActionTone: Tone = departmentPending || returnedOrFurther || summary.executive.pendingVerification ? 'amber' : 'green';
  const scopeDetail = summary.filters.scopeDetail || (isDepartmentReviewer ? 'Department-scoped review analytics' : 'Institution-wide promotion analytics');
  const hasFilters = Boolean(departmentFilter || startDateFilter || endDateFilter);

  return (
    <div className="space-y-6">
      <div className="pro-hero px-6 py-7 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Promotion Intelligence</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Reports & Analytics</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Live workflow, eligibility, verification, department workload, and committee outcome reporting for the GCTU promotion process.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <a
              href={`/api/reports/export?type=analytics&format=csv${exportSuffix}`}
              className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900 sm:w-auto"
            >
              Export CSV
            </a>
            <a
              href={`/api/reports/export?type=analytics&format=pdf${exportSuffix}`}
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 sm:w-auto"
            >
              Export PDF
            </a>
          </div>
        </div>
      </div>

      <div className="pro-card grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Department</label>
          <input
            type="text"
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            placeholder="e.g. Computer Science"
            disabled={Boolean(summary.filters.enforcedDepartment)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-500"
          />
          {summary.filters.enforcedDepartment ? (
            <p className="mt-1 text-xs text-slate-500">Scoped to {summary.filters.enforcedDepartment}.</p>
          ) : summary.filters.scopeLabel ? (
            <p className="mt-1 text-xs text-slate-500">Scope: {summary.filters.scopeLabel}.</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Start Date</label>
          <input
            type="date"
            value={startDateFilter}
            onChange={(event) => setStartDateFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">End Date</label>
          <input
            type="date"
            value={endDateFilter}
            onChange={(event) => setEndDateFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setDepartmentFilter('');
              setStartDateFilter('');
              setEndDateFilter('');
            }}
            disabled={!hasFilters}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Executive Reporting Brief" description="High-level readout for HR, deans, committees, and university leadership.">
          <div className="grid gap-3 md:grid-cols-2">
            <ExecutiveInsight label="Completion Rate" value={`${summary.executive.completionRate}%`} detail={`${summary.executive.completed} completed of ${summary.executive.totalApplications} application(s).`} tone="green" />
            <ExecutiveInsight label="Active Workload" value={summary.executive.activeApplications} detail="Applications still moving through the workflow." tone="amber" />
            <ReportNote label="Evidence Attention" value={`${evidenceAttention} document(s) need verification, correction, or rejection follow-up.`} tone={evidenceAttention ? 'amber' : 'green'} />
            <ReportNote label="Committee Decisions" value={`${committeeDecisionRate}% of committee comments contain a final recommendation outcome.`} tone={committeeDecisionRate >= 70 ? 'green' : 'slate'} />
          </div>
        </SectionCard>

        <SectionCard title="Export Centre" description={`Current scope: ${reportScope}.`}>
          <div className="grid gap-2">
            <a href={`/api/reports/export?type=analytics&format=pdf${exportSuffix}`} className="rounded-lg bg-teal-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900">
              Download Analytics PDF
            </a>
            <a href={`/api/reports/export?type=analytics&format=csv${exportSuffix}`} className="rounded-lg border border-teal-200 bg-white px-4 py-3 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50">
              Download Analytics CSV
            </a>
            <a href="/api/reports/export?type=audit&format=csv" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white">
              Export Audit CSV
            </a>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={isDepartmentReviewer ? 'Department Review Brief' : 'Workflow Operations Brief'}
        description={`${scopeDetail}. ${dateWindow(summary)}.`}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ReportNote label="Current Scope" value={reportScope} tone="blue" />
          <ExecutiveInsight label="Review Completion" value={`${departmentReviewRate}%`} detail={`${forwardedBeyondDepartment} application(s) have moved beyond department review.`} tone={departmentReviewRate >= 70 ? 'green' : 'amber'} />
          <ReportNote label="Next Action Required" value={nextActionText} tone={nextActionTone} />
          <ReportNote label="Evidence Risk" value={`${evidenceAttention} evidence item(s) require attention across this scope.`} tone={evidenceAttention ? 'amber' : 'green'} />
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Department review movement</span>
            <span>{forwardedBeyondDepartment}/{summary.executive.totalApplications} moved forward</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-700" style={{ width: `${Math.max(departmentReviewRate, departmentReviewRate ? 8 : 0)}%` }} />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-600">Use this report to identify bottlenecks, then open the relevant workspace to act on the file.</p>
          <Link href={workspaceHref(viewerRole)} className="inline-flex w-full items-center justify-center rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900 sm:w-auto">
            {workspaceLabel(viewerRole)}
          </Link>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard label="Total Applications" value={summary.executive.totalApplications} description="All promotion requests" code="APP" tone="green" />
        <DashboardCard label="Pending Verification" value={summary.executive.pendingVerification} description="Awaiting HR document checks" code="HR" tone="green" />
        <DashboardCard label="Committee Review" value={summary.executive.underCommitteeReview} description="With promotion committee" code="COM" tone="amber" />
        <DashboardCard label="Eligible Applicants" value={summary.executive.eligibleApplicants} description="Criteria satisfied" code="EL" tone="green" />
        <DashboardCard label="Returned" value={summary.executive.returnedForCorrection} description="Needs correction" code="RET" tone="amber" />
        <DashboardCard label="Completed" value={summary.executive.completed} description={`${summary.executive.completionRate}% completion rate`} code="FIN" tone="green" />
        <DashboardCard label="Verified Documents" value={`${summary.documents.verifiedRate}%`} description={`${summary.documents.verified} of ${summary.documents.total} documents`} code="DOC" tone="green" />
        <DashboardCard label="Average Score" value={`${summary.executive.averageScore}%`} description="Across scored applications" code="SC" tone="slate" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Promotion Workflow Distribution" description="Current volume at each official workflow stage.">
          <SimpleBarChart rows={statusRows} />
        </SectionCard>

        <SectionCard title="Eligibility Outcomes" description="Server-side eligibility results after verified evidence is assessed.">
          <SimpleBarChart rows={eligibilityRows} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Document Verification" description="Evidence health across HR verification work.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniMetric label="Pending" value={summary.documents.pending} tone="amber" />
            <MiniMetric label="Verified" value={summary.documents.verified} tone="green" />
            <MiniMetric label="Correction" value={summary.documents.correction} tone="amber" />
            <MiniMetric label="Rejected" value={summary.documents.rejected} tone="red" />
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Verified Rate</span>
              <span>{summary.documents.verifiedRate}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-700" style={{ width: `${Math.max(summary.documents.verifiedRate, 4)}%` }} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Evidence Categories" description="Uploaded evidence grouped by promotion criteria area.">
          {categoryRows.length ? <SimpleBarChart rows={categoryRows} /> : <EmptyState title="No evidence uploaded yet" description="Document category analytics will appear after evidence is submitted." />}
        </SectionCard>
      </div>

      <SectionCard title="Department Workload" description="Application pressure, eligibility outcomes, and pending evidence by department.">
        {summary.departmentApplications.length === 0 ? (
          <EmptyState title="No applications found" description="Adjust the filters or create promotion applications to populate this report." />
        ) : (
          <div className="pro-scroll-x">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="brand-table-head">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Applications</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Eligible</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Not Eligible</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Committee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Returned</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Completed</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Pending Docs</th>
                </tr>
              </thead>
              <tbody>
                {summary.departmentApplications.map((department) => (
                  <tr key={department.department} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-950">{department.department}</td>
                    <td className="px-4 py-3 text-slate-700">{department.total}</td>
                    <td className="px-4 py-3 text-emerald-700">{department.eligible}</td>
                    <td className="px-4 py-3 text-rose-700">{department.notEligible}</td>
                    <td className="px-4 py-3 text-teal-700">{department.committeeReview}</td>
                    <td className="px-4 py-3 text-orange-700">{department.returned}</td>
                    <td className="px-4 py-3 text-slate-700">{department.completed}</td>
                    <td className="px-4 py-3 font-semibold text-slate-950">{department.pendingDocuments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <SectionCard title="Recent Applications" description="Latest promotion requests moving through the workflow.">
          {summary.recentApplications.length === 0 ? (
            <EmptyState title="No recent applications" description="Applications will appear here when lecturers submit promotion requests." />
          ) : (
            <div className="pro-scroll-x">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="brand-table-head">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Application</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Lecturer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Eligibility</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Documents</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentApplications.map((application) => (
                    <tr key={application.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-950">{application.code}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{application.lecturerName}</p>
                        <p className="text-xs text-slate-500">{application.department}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{labelFromEnum(application.currentRank)} to {labelFromEnum(application.targetRank)}</td>
                      <td className="px-4 py-3"><StatusBadge status={application.status} /></td>
                      <td className="px-4 py-3"><StatusBadge status={application.eligibilityStatus} /></td>
                      <td className="px-4 py-3 text-slate-700">{application.verifiedDocumentCount}/{application.documentCount} verified</td>
                      <td className="px-4 py-3 text-slate-700">{formatDate(application.submittedAt || application.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={applicationHref(viewerRole, application.id)} className="inline-flex rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50">
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Committee Recommendations" description="Recommendation activity captured from reviewer comments.">
          <div className="space-y-3">
            <MiniMetric label="Recommended" value={summary.recommendations.recommended} tone="green" />
            <MiniMetric label="Not Recommended" value={summary.recommendations.notRecommended} tone="red" />
            <MiniMetric label="Further Review" value={summary.recommendations.furtherReview} tone="amber" />
            <MiniMetric label="Total Comments" value={summary.recommendations.totalComments} tone="slate" />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Recent Audit Activity" description="Latest recorded workflow actions for the filtered application set.">
        {summary.recentAudit.length === 0 ? (
          <EmptyState title="No audit activity found" description="Audit activity will appear after workflow actions are performed." />
        ) : (
          <div className="grid gap-3">
            {summary.recentAudit.map((audit) => (
              <div key={audit.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-semibold text-slate-950">{audit.action}</p>
                  <p className="text-xs text-slate-500">{formatDate(audit.createdAt)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">{audit.description}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{audit.actor}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ExecutiveInsight({ label, value, detail, tone }: { label: string; value: string | number; detail: string; tone: Tone }) {
  const toneClass = {
    green: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    red: 'border-rose-100 bg-rose-50 text-rose-900',
    blue: 'border-teal-100 bg-teal-50 text-teal-900',
    slate: 'border-slate-200 bg-white text-slate-900',
  }[tone];

  return (
    <div className={`rounded-lg border px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs opacity-70">{detail}</p>
    </div>
  );
}

function ReportNote({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  const toneClass = {
    green: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    red: 'border-rose-100 bg-rose-50 text-rose-900',
    blue: 'border-teal-100 bg-teal-50 text-teal-900',
    slate: 'border-slate-200 bg-white text-slate-900',
  }[tone];

  return (
    <div className={`rounded-lg border px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-6">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  const toneClass = {
    green: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    red: 'border-rose-100 bg-rose-50 text-rose-900',
    blue: 'border-teal-100 bg-teal-50 text-teal-900',
    slate: 'border-slate-200 bg-white text-slate-900',
  }[tone];

  return (
    <div className={`rounded-lg border px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
