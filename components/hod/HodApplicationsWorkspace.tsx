'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, FileText, MessageSquareText, RotateCcw, Search, Send, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import StatusBadge from '../promotion/StatusBadge';
import PromotionApplicationDetail, { type PromotionApplicationDetailRecord } from '../promotion/PromotionApplicationDetail';
import { EmptyState, ErrorState, LoadingState } from '../enterprise-ui';
import { useToast } from '../Toast';

type PromotionRequest = PromotionApplicationDetailRecord & {
  submittedAt?: string | null;
  verifiedAt?: string | null;
};

type QueueSegment = 'active' | 'submitted' | 'forwarded' | 'returned' | 'further' | 'all';
type QueueSort = 'newest' | 'oldest' | 'applicant' | 'targetRank';

type DepartmentDecision = 'FORWARD_TO_HR' | 'RETURN_FOR_CORRECTION' | 'REQUIRES_FURTHER_REVIEW' | 'COMMENT_ONLY';

const queueSegments: QueueSegment[] = ['active', 'submitted', 'forwarded', 'returned', 'further', 'all'];
const actionableStatuses = ['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW', 'REQUIRES_FURTHER_REVIEW'];
const returnableStatuses = ['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW'];
const departmentStatuses = [
  'SUBMITTED',
  'UNDER_DEPARTMENT_REVIEW',
  'RETURNED_FOR_CORRECTION',
  'REQUIRES_FURTHER_REVIEW',
  'UNDER_HR_VERIFICATION',
  'UNDER_COMMITTEE_REVIEW',
  'ELIGIBLE',
  'NOT_ELIGIBLE',
  'RECOMMENDED',
  'NOT_RECOMMENDED',
  'APPROVED_BY_AUTHORITY',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
];

function label(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function applicationCode(id: number) {
  return `PR-${String(id).padStart(5, '0')}`;
}

function uniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function requestTimestamp(request: PromotionRequest) {
  const value = request.submittedAt || request.updatedAt || request.createdAt || null;
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function sameOrAfter(value: number, dateValue: string) {
  if (!dateValue) return true;
  return value >= new Date(`${dateValue}T00:00:00`).getTime();
}

function sameOrBefore(value: number, dateValue: string) {
  if (!dateValue) return true;
  return value <= new Date(`${dateValue}T23:59:59`).getTime();
}

function isQueueSegment(value: string | null): value is QueueSegment {
  return Boolean(value && queueSegments.includes(value as QueueSegment));
}

function segmentMatches(request: PromotionRequest, segment: QueueSegment) {
  if (segment === 'all') return true;
  if (segment === 'active') return actionableStatuses.includes(request.status);
  if (segment === 'submitted') return request.status === 'SUBMITTED' || request.status === 'UNDER_DEPARTMENT_REVIEW';
  if (segment === 'forwarded') return ['UNDER_HR_VERIFICATION', 'UNDER_COMMITTEE_REVIEW', 'ELIGIBLE', 'NOT_ELIGIBLE', 'RECOMMENDED', 'NOT_RECOMMENDED', 'APPROVED_BY_AUTHORITY', 'APPROVED', 'REJECTED', 'COMPLETED'].includes(request.status);
  if (segment === 'returned') return request.status === 'RETURNED_FOR_CORRECTION';
  if (segment === 'further') return request.status === 'REQUIRES_FURTHER_REVIEW';
  return true;
}

function segmentForRequest(request: PromotionRequest): QueueSegment {
  if (segmentMatches(request, 'active')) return 'active';
  if (segmentMatches(request, 'returned')) return 'returned';
  if (segmentMatches(request, 'further')) return 'further';
  if (segmentMatches(request, 'forwarded')) return 'forwarded';
  return 'all';
}

function evidenceStats(request: PromotionRequest) {
  const docs = request.documents || [];
  return {
    total: docs.length,
    verified: docs.filter((document) => document.verificationStatus === 'VERIFIED').length,
    returned: docs.filter((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus || '')).length,
    pending: docs.filter((document) => !document.verificationStatus || document.verificationStatus === 'PENDING').length,
  };
}

function readinessFor(request: PromotionRequest) {
  const stats = evidenceStats(request);

  if (stats.returned > 0 || request.status === 'RETURNED_FOR_CORRECTION') {
    return { title: 'Correction Required', detail: `${stats.returned || 1} document issue(s) need applicant attention.`, tone: 'warning' as const, icon: RotateCcw };
  }

  if (request.status === 'SUBMITTED' || request.status === 'UNDER_DEPARTMENT_REVIEW') {
    return { title: 'Department Action', detail: 'Review evidence summary and record a department decision.', tone: 'primary' as const, icon: AlertTriangle };
  }

  if (request.status === 'REQUIRES_FURTHER_REVIEW') {
    return { title: 'Further Review', detail: 'Resolve department concerns before returning the file to HR.', tone: 'warning' as const, icon: Clock3 };
  }

  if (segmentMatches(request, 'forwarded')) {
    return { title: 'Forwarded', detail: 'This file has moved beyond department review. HR verification and later decisions will continue in the workflow record.', tone: 'success' as const, icon: CheckCircle2 };
  }

  return { title: 'Monitoring', detail: 'No direct department action is currently required.', tone: 'slate' as const, icon: ShieldCheck };
}

function canForward(request: PromotionRequest) {
  return actionableStatuses.includes(request.status);
}

function canReturn(request: PromotionRequest) {
  return returnableStatuses.includes(request.status);
}

function canMarkFurtherReview(request: PromotionRequest) {
  return returnableStatuses.includes(request.status);
}

type HodApplicationsWorkspaceProps = {
  initialSegment?: QueueSegment;
  eyebrow?: string;
  title?: string;
  description?: string;
};

export default function HodApplicationsWorkspace({
  initialSegment = 'active',
  eyebrow = 'HOD / Dean Review',
  title = 'Review Workspace',
  description = 'Review academic promotion files from your area, record formal department comments, return incomplete submissions, and forward complete applications to HR verification.',
}: HodApplicationsWorkspaceProps) {
  const toast = useToast();
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [segment, setSegment] = useState<QueueSegment>(initialSegment);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [facultyFilter, setFacultyFilter] = useState('all');
  const [targetRankFilter, setTargetRankFilter] = useState('all');
  const [workflowFilter, setWorkflowFilter] = useState('all');
  const [submittedFrom, setSubmittedFrom] = useState('');
  const [submittedTo, setSubmittedTo] = useState('');
  const [sortOrder, setSortOrder] = useState<QueueSort>('newest');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const departmentRequests = useMemo(
    () => requests.filter((request) => departmentStatuses.includes(request.status)),
    [requests]
  );

  const departmentOptions = useMemo(() => uniqueOptions(departmentRequests.map((request) => request.department)), [departmentRequests]);
  const facultyOptions = useMemo(() => uniqueOptions(departmentRequests.map((request) => request.faculty)), [departmentRequests]);
  const targetRankOptions = useMemo(() => uniqueOptions(departmentRequests.map((request) => request.targetRank)), [departmentRequests]);
  const workflowOptions = useMemo(() => uniqueOptions(departmentRequests.map((request) => request.status)), [departmentRequests]);

  const filteredRequests = useMemo(() => {
    let filtered = departmentRequests.filter((request) => segmentMatches(request, segment));

    if (departmentFilter !== 'all') {
      filtered = filtered.filter((request) => request.department === departmentFilter);
    }

    if (facultyFilter !== 'all') {
      filtered = filtered.filter((request) => request.faculty === facultyFilter);
    }

    if (targetRankFilter !== 'all') {
      filtered = filtered.filter((request) => request.targetRank === targetRankFilter);
    }

    if (workflowFilter !== 'all') {
      filtered = filtered.filter((request) => request.status === workflowFilter);
    }

    if (submittedFrom || submittedTo) {
      filtered = filtered.filter((request) => {
        const timestamp = requestTimestamp(request);
        return timestamp > 0 && sameOrAfter(timestamp, submittedFrom) && sameOrBefore(timestamp, submittedTo);
      });
    }

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((request) => {
        const fields = [
          request.lecturerName,
          request.lecturerEmail,
          request.lecturerStaffId || '',
          request.department,
          request.faculty || '',
          request.currentRank,
          request.targetRank,
          request.status,
          applicationCode(request.id),
        ];
        return fields.some((field) => String(field || '').toLowerCase().includes(query));
      });
    }

    return [...filtered].sort((left, right) => {
      if (sortOrder === 'oldest') return requestTimestamp(left) - requestTimestamp(right);
      if (sortOrder === 'applicant') return left.lecturerName.localeCompare(right.lecturerName);
      if (sortOrder === 'targetRank') return label(left.targetRank).localeCompare(label(right.targetRank));
      return requestTimestamp(right) - requestTimestamp(left);
    });
  }, [departmentRequests, departmentFilter, facultyFilter, searchTerm, segment, sortOrder, submittedFrom, submittedTo, targetRankFilter, workflowFilter]);

  const selectedRequest = filteredRequests.find((request) => request.id === selectedId)
    || departmentRequests.find((request) => request.id === selectedId)
    || filteredRequests[0]
    || null;

  async function loadRequests(preferredId?: number | null) {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/promotion-requests?scope=department', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load department applications');
      }

      const allRequests = (payload.data || []) as PromotionRequest[];
      const scoped = allRequests.filter((request) => departmentStatuses.includes(request.status));
      setRequests(allRequests);

      const preferred = scoped.find((request) => request.id === preferredId) || null;
      const next = preferred
        || scoped.find((request) => request.status === 'UNDER_DEPARTMENT_REVIEW')
        || scoped.find((request) => request.status === 'SUBMITTED')
        || scoped[0]
        || null;

      if (preferred) {
        setSegment(segmentForRequest(preferred));
      }
      setSelectedId(next?.id || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load department applications');
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setSearchTerm('');
    setDepartmentFilter('all');
    setFacultyFilter('all');
    setTargetRankFilter('all');
    setWorkflowFilter('all');
    setSubmittedFrom('');
    setSubmittedTo('');
    setSortOrder('newest');
  }

  useEffect(() => {
    const params = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search);
    const requestId = Number(params?.get('request'));
    const segmentParam = params?.get('segment') || null;

    setSegment(isQueueSegment(segmentParam) ? segmentParam : initialSegment);

    loadRequests(Number.isInteger(requestId) && requestId > 0 ? requestId : null);
  }, [initialSegment]);

  async function confirmAndSaveReview(decision: DepartmentDecision) {
    if (!selectedRequest) return;

    const decisionLabel: Record<DepartmentDecision, string> = {
      FORWARD_TO_HR: 'approve and forward this application to HR',
      RETURN_FOR_CORRECTION: 'return this application to the lecturer',
      REQUIRES_FURTHER_REVIEW: 'mark this application for further department review',
      COMMENT_ONLY: 'save this department note',
    };

    if (decision !== 'COMMENT_ONLY' && comment.trim().length < 5) {
      const continueWithoutComment = window.confirm('You have not entered a detailed department comment. Continue with the system-generated note?');
      if (!continueWithoutComment) return;
    }

    const confirmed = window.confirm(`Confirm that you want to ${decisionLabel[decision]}?`);
    if (!confirmed) return;

    await saveReview(decision);
  }

  async function saveReview(decision: DepartmentDecision) {
    if (!selectedRequest) return;

    const defaultCommentByDecision: Record<DepartmentDecision, string> = {
      FORWARD_TO_HR: 'Department review completed and application forwarded to HR verification.',
      RETURN_FOR_CORRECTION: 'Department reviewer returned this application for applicant correction.',
      REQUIRES_FURTHER_REVIEW: 'Department reviewer marked this application for further review before HR verification.',
      COMMENT_ONLY: 'Department reviewer added a review note.',
    };

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/promotion-requests/${selectedRequest.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          comment: comment.trim() || defaultCommentByDecision[decision],
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to update department review');
      }

      const message = `${applicationCode(selectedRequest.id)} department review saved.`;
      setMessage(message);
      toast.success('Department review saved', message);
      setComment('');
      await loadRequests(selectedRequest.id);
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update department review';
      setError(message);
      toast.error('Review update failed', message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading department applications..." />;
  if (error && requests.length === 0) return <ErrorState message={error} />;

  const activeCount = departmentRequests.filter((request) => actionableStatuses.includes(request.status)).length;
  const pendingCount = departmentRequests.filter((request) => ['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW'].includes(request.status)).length;
  const forwardedCount = departmentRequests.filter((request) => segmentMatches(request, 'forwarded')).length;
  const returnedCount = departmentRequests.filter((request) => request.status === 'RETURNED_FOR_CORRECTION').length;
  const furtherReviewCount = departmentRequests.filter((request) => request.status === 'REQUIRES_FURTHER_REVIEW').length;
  const selectedReadiness = selectedRequest ? readinessFor(selectedRequest) : null;
  const selectedStats = selectedRequest ? evidenceStats(selectedRequest) : null;
  const selectedRequiredCount = selectedRequest?.requiredDocumentCount && selectedRequest.requiredDocumentCount > 0 ? selectedRequest.requiredDocumentCount : 3;
  const selectedAvailableDocuments = selectedStats ? Math.min(selectedStats.total, selectedRequiredCount) : 0;
  const selectedReviewProgress = selectedRequest && selectedStats
    ? Math.min(100, Math.round(((selectedAvailableDocuments + (comment.trim().length >= 5 ? 1 : 0)) / (selectedRequiredCount + 1)) * 100))
    : 0;

  return (
    <section className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <div className="relative overflow-hidden rounded-xl border border-brand-primary/15 bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-primary" aria-hidden="true" />
        <div className="relative z-10 flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="pro-eyebrow">{eyebrow}</div>
            <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">{title}</h1>
          </div>
        </div>
      </div>

      <section className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricCard icon={FileText} label="Scoped Files" value={departmentRequests.length} tone="teal" />
        <MetricCard icon={AlertTriangle} label="Active Action" value={activeCount} tone="amber" />
        <MetricCard icon={Clock3} label="Department Pending" value={pendingCount} tone="blue" />
        <MetricCard icon={Send} label="Forwarded" value={forwardedCount} tone="green" />
        <MetricCard icon={RotateCcw} label="Returned / Further" value={returnedCount + furtherReviewCount} tone="rose" />
      </section>

      {message && <div role="status" aria-live="polite" className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">{message}</div>}
      {error && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}

      <section className="pro-card min-w-0 p-4 sm:p-5">
        <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.25fr)_repeat(3,minmax(10rem,0.75fr))_auto] xl:items-end">
          <label className="block min-w-0 xl:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Search</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="brand-input pl-9"
                placeholder="Applicant, staff ID, PR number, department, faculty, or rank"
                type="text"
                aria-label="Search department promotion applications"
              />
            </span>
          </label>
          <SelectControl label="Queue segment" value={segment} onChange={(value) => setSegment(value as QueueSegment)} options={[
            ['active', 'Active action'],
            ['submitted', 'Submitted / department review'],
            ['forwarded', 'Forwarded files'],
            ['returned', 'Returned files'],
            ['further', 'Further review'],
            ['all', 'All department files'],
          ]} />
          <SelectControl label="Target rank" value={targetRankFilter} onChange={setTargetRankFilter} options={[['all', 'All ranks'], ...targetRankOptions.map((rank) => [rank, label(rank)] as [string, string])]} />
          <SelectControl label="Sort" value={sortOrder} onChange={(value) => setSortOrder(value as QueueSort)} options={[
            ['newest', 'Newest first'],
            ['oldest', 'Oldest first'],
            ['applicant', 'Applicant name'],
            ['targetRank', 'Target rank'],
          ]} />
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
            Showing {filteredRequests.length} of {departmentRequests.length}
          </div>
        </div>
        <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <SelectControl label="Faculty" value={facultyFilter} onChange={setFacultyFilter} options={[['all', 'All faculties'], ...facultyOptions.map((faculty) => [faculty, faculty] as [string, string])]} />
          <SelectControl label="Department" value={departmentFilter} onChange={setDepartmentFilter} options={[['all', 'All departments'], ...departmentOptions.map((department) => [department, department] as [string, string])]} />
          <SelectControl label="Workflow stage" value={workflowFilter} onChange={setWorkflowFilter} options={[['all', 'All stages'], ...workflowOptions.map((status) => [status, label(status)] as [string, string])]} />
          <DateControl label="Submitted from" value={submittedFrom} onChange={setSubmittedFrom} />
          <DateControl label="Submitted to" value={submittedTo} onChange={setSubmittedTo} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-600">
            {searchTerm && <FilterChip label={`Search: ${searchTerm}`} />}
            {departmentFilter !== 'all' && <FilterChip label={`Department: ${departmentFilter}`} />}
            {facultyFilter !== 'all' && <FilterChip label={`Faculty: ${facultyFilter}`} />}
            {targetRankFilter !== 'all' && <FilterChip label={`Rank: ${label(targetRankFilter)}`} />}
            {workflowFilter !== 'all' && <FilterChip label={`Stage: ${label(workflowFilter)}`} />}
            {(submittedFrom || submittedTo) && <FilterChip label="Submission date filter" />}
          </div>
          <button type="button" onClick={resetFilters} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-brand-primary/20 hover:bg-brand-primarySoft hover:text-brand-primary">
            Clear filters
          </button>
        </div>
      </section>

      <div className="grid min-w-0 max-w-full gap-5 2xl:grid-cols-[minmax(19rem,0.85fr)_minmax(0,1.7fr)]">
        <div className="pro-card min-w-0 overflow-hidden">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-950">Review Workspace</h2>
            <p className="mt-1 text-sm text-gray-600">Filter and open scoped applications to inspect evidence, history, and academic review actions.</p>
          </div>
          {filteredRequests.length === 0 ? (
            <WorkspaceEmptyState onReset={resetFilters} />
          ) : (
            <div className="max-h-[72rem] divide-y divide-gray-100 overflow-y-auto">
              {filteredRequests.map((request) => {
                const readiness = readinessFor(request);
                const Icon = readiness.icon;
                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedId(request.id)}
                    className={`block w-full p-4 text-left transition hover:bg-gray-50 sm:p-5 ${selectedRequest?.id === request.id ? 'bg-brand-primarySoft' : ''}`}
                    aria-pressed={selectedRequest?.id === request.id}
                  >
                    <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{applicationCode(request.id)}</p>
                        <p className="mt-2 break-words font-semibold text-gray-950">{request.lecturerName}</p>
                        <p className="mt-1 break-words text-sm text-gray-600">{request.department}</p>
                        <p className="mt-1 text-xs text-gray-500">{label(request.currentRank)} to {label(request.targetRank)}</p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>
                    <HealthPill title={readiness.title} detail={readiness.detail} tone={readiness.tone} icon={Icon} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!selectedRequest ? (
          <div className="pro-card min-w-0 p-6">
            <EmptyState title="Select an application" description="Choose a department file from the queue to begin review." />
          </div>
        ) : (
          <div className="min-w-0 space-y-4">
            {selectedReadiness && (
              <ReviewContextBanner readiness={selectedReadiness} request={selectedRequest} stats={selectedStats} />
            )}

            <PromotionApplicationDetail application={selectedRequest} role="HOD_DEAN" showGuidance={false}>
              <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.9fr)]">
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-bold text-gray-950">Academic Review Action</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-brand-primary/15 bg-brand-primarySoft p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">Review completion</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-950">{selectedReviewProgress}%</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-brand-primary" style={{ width: `${selectedReviewProgress}%` }} />
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Evidence available</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-950">{selectedAvailableDocuments}/{selectedRequiredCount}</p>
                      <p className="mt-1 text-xs text-gray-600">Comment {comment.trim().length >= 5 ? 'ready' : 'still needed'}</p>
                    </div>
                  </div>
                  <label className="mt-4 block text-sm font-semibold text-gray-800">
                    Department review comment
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      className="brand-input mt-1 min-h-32 resize-y"
                      placeholder="Record department recommendation, evidence concerns, or correction instructions..."
                    />
                  </label>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Decision</p>
                  <dl className="mt-3 space-y-3 text-sm text-gray-700">
                    <div><dt className="font-semibold text-gray-950">Forward</dt><dd>Send to HR verification.</dd></div>
                    <div><dt className="font-semibold text-gray-950">Return</dt><dd>Request applicant correction.</dd></div>
                    <div><dt className="font-semibold text-gray-950">Further review</dt><dd>Request department clarification.</dd></div>
                  </dl>
                </div>
              </div>

              <div className="sticky bottom-20 z-10 mt-4 grid gap-2 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex sm:flex-wrap sm:gap-3 lg:bottom-4 [&>button]:w-full sm:[&>button]:w-auto">
                <button
                  type="button"
                  disabled={saving || !canForward(selectedRequest)}
                  onClick={() => confirmAndSaveReview('FORWARD_TO_HR')}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {saving ? 'Saving...' : 'Approve & Forward'}
                </button>
                <button
                  type="button"
                  disabled={saving || !canReturn(selectedRequest)}
                  onClick={() => confirmAndSaveReview('RETURN_FOR_CORRECTION')}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Return to Lecturer
                </button>
                <button
                  type="button"
                  disabled={saving || !canMarkFurtherReview(selectedRequest)}
                  onClick={() => confirmAndSaveReview('REQUIRES_FURTHER_REVIEW')}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  Mark further review
                </button>
                <button
                  type="button"
                  disabled={saving || comment.trim().length < 5}
                  onClick={() => confirmAndSaveReview('COMMENT_ONLY')}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                  Save note only
                </button>
              </div>

              {!actionableStatuses.includes(selectedRequest.status) && (
                <p className="mt-3 text-xs font-medium text-gray-500">This application is not currently waiting for department action.</p>
              )}
            </PromotionApplicationDetail>
          </div>
        )}
      </div>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: 'teal' | 'amber' | 'blue' | 'green' | 'rose' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-900'
    : tone === 'blue'
      ? 'border-sky-200 bg-sky-50 text-sky-900'
      : tone === 'green'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : tone === 'rose'
          ? 'border-rose-200 bg-rose-50 text-rose-900'
          : 'border-brand-primary/20 bg-brand-primarySoft text-brand-primary';

  return (
    <div className="pro-tile min-w-0 p-4 sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-950 sm:text-3xl">{value}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${toneClass}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function HealthPill({ title, detail, tone, icon: Icon }: { title: string; detail: string; tone: 'primary' | 'warning' | 'success' | 'slate'; icon: LucideIcon }) {
  const toneClass = tone === 'warning'
    ? 'border-amber-200 bg-amber-50 text-amber-950'
    : tone === 'success'
      ? 'border-teal-200 bg-teal-50 text-teal-950'
      : tone === 'primary'
        ? 'border-sky-200 bg-sky-50 text-sky-950'
        : 'border-gray-200 bg-gray-50 text-gray-700';

  return (
    <div className={`mt-4 flex min-w-0 items-start gap-3 rounded-lg border p-3 ${toneClass}`}>
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-current/15 bg-white/70">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-[0.12em] opacity-75">{title}</span>
        <span className="mt-1 block break-words text-xs leading-5 opacity-85">{detail}</span>
      </span>
    </div>
  );
}

function ReviewContextBanner({ readiness, request, stats }: { readiness: ReturnType<typeof readinessFor>; request: PromotionRequest; stats: ReturnType<typeof evidenceStats> | null }) {
  const Icon = readiness.icon;
  const toneClass = readiness.tone === 'warning'
    ? 'border-amber-200 bg-amber-50 text-amber-950'
    : readiness.tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
      : readiness.tone === 'primary'
        ? 'border-brand-primary/20 bg-brand-primarySoft text-brand-primary'
        : 'border-gray-200 bg-white text-gray-800';

  return (
    <section role="status" aria-live="polite" className={`flex min-w-0 max-w-full flex-col gap-3 rounded-xl border px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between ${toneClass}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/70">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold">{readiness.title}: {applicationCode(request.id)}</p>
          <p className="mt-1 break-words text-xs leading-5 opacity-80">{readiness.detail}</p>
        </div>
      </div>
      {stats && (
        <div className="grid grid-cols-4 gap-2 rounded-lg bg-white/70 p-2 text-center text-xs font-semibold shadow-sm sm:min-w-64">
          <span><span className="block text-gray-500">Docs</span>{stats.total}</span>
          <span><span className="block text-gray-500">HR Verified</span>{stats.verified}</span>
          <span><span className="block text-gray-500">Awaiting HR</span>{stats.pending}</span>
          <span><span className="block text-gray-500">Returned</span>{stats.returned}</span>
        </div>
      )}
    </section>
  );
}

function SelectControl({ label: title, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{title}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="brand-input" aria-label={title}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={`${title}-${optionValue}`} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function DateControl({ label: title, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{title}</span>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="brand-input" aria-label={title} />
    </label>
  );
}

function FilterChip({ label: title }: { label: string }) {
  return <span className="rounded-full border border-brand-primary/15 bg-brand-primarySoft px-2.5 py-1 text-brand-primary">{title}</span>;
}

function WorkspaceEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="p-5">
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-brand-primary/15 bg-white text-brand-primary">
          <Search className="h-5 w-5" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-base font-bold text-gray-950">No matching applications</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">Try clearing filters, widening the submission date range, or searching by applicant name, staff ID, PR number, department, faculty, or rank.</p>
        <button type="button" onClick={onReset} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-primaryDark">
          Clear filters
        </button>
      </div>
    </div>
  );
}
