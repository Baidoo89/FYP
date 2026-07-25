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
  title = 'Department Applications',
  description = 'Review academic promotion files from your area, record formal department comments, return incomplete submissions, and forward complete applications to HR verification.',
}: HodApplicationsWorkspaceProps) {
  const toast = useToast();
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [segment, setSegment] = useState<QueueSegment>(initialSegment);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const departmentRequests = useMemo(
    () => requests.filter((request) => departmentStatuses.includes(request.status)),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    let filtered = departmentRequests.filter((request) => segmentMatches(request, segment));

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.lecturerName.toLowerCase().includes(query) ||
          request.lecturerEmail.toLowerCase().includes(query) ||
          request.department.toLowerCase().includes(query) ||
          applicationCode(request.id).toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [departmentRequests, searchTerm, segment]);

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

  useEffect(() => {
    const params = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search);
    const requestId = Number(params?.get('request'));
    const segmentParam = params?.get('segment') || null;

    setSegment(isQueueSegment(segmentParam) ? segmentParam : initialSegment);

    loadRequests(Number.isInteger(requestId) && requestId > 0 ? requestId : null);
  }, [initialSegment]);

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

  return (
    <section className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <div className="relative overflow-hidden rounded-xl border border-brand-primary/15 bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-primary" aria-hidden="true" />
        <div className="relative z-10 flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="pro-eyebrow">{eyebrow}</div>
            <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              {description}
            </p>
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
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_18rem_auto] lg:items-end">
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Search</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="brand-input pl-9"
                placeholder="Name, email, department, or PR code"
                type="text"
              />
            </span>
          </label>
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Queue segment</span>
            <select value={segment} onChange={(event) => setSegment(event.target.value as QueueSegment)} className="brand-input">
              <option value="active">Active action</option>
              <option value="submitted">Submitted / department review</option>
              <option value="forwarded">Forwarded files</option>
              <option value="returned">Returned files</option>
              <option value="further">Further review</option>
              <option value="all">All department files</option>
            </select>
          </label>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
            Showing {filteredRequests.length} of {departmentRequests.length}
          </div>
        </div>
      </section>

      <div className="grid min-w-0 max-w-full gap-5 2xl:grid-cols-[minmax(19rem,0.85fr)_minmax(0,1.7fr)]">
        <div className="pro-card min-w-0 overflow-hidden">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-950">Review Queue</h2>
            <p className="mt-1 text-sm text-gray-600">Select an application to inspect evidence, history, and academic review actions.</p>
          </div>
          {filteredRequests.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No matching applications" description="Adjust the segment or search term to view department promotion files." />
            </div>
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

            <PromotionApplicationDetail application={selectedRequest} role="HOD_DEAN">
              <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.9fr)]">
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-bold text-gray-950">Academic Review Action</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Open each evidence file, check academic completeness and relevance, then record a clear recommendation or correction note. HR performs the official document verification after forwarding.
                  </p>
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
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Decision Guidance</p>
                  <div className="mt-3 space-y-3 text-sm leading-6 text-gray-700">
                    <p><span className="font-semibold text-gray-950">Forward:</span> Use when the department is satisfied the file can proceed to HR verification.</p>
                    <p><span className="font-semibold text-gray-950">Return:</span> Use when the applicant must correct or add evidence before review continues.</p>
                    <p><span className="font-semibold text-gray-950">Further review:</span> Use when additional department discussion is needed before HR receives the file.</p>
                    <p><span className="font-semibold text-gray-950">Document verification:</span> HOD/Dean reviews evidence academically. HR marks individual documents as verified, rejected, or requiring correction.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap sm:gap-3 [&>button]:w-full sm:[&>button]:w-auto">
                <button
                  type="button"
                  disabled={saving || !canForward(selectedRequest)}
                  onClick={() => saveReview('FORWARD_TO_HR')}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {saving ? 'Saving...' : 'Approve & Forward'}
                </button>
                <button
                  type="button"
                  disabled={saving || !canReturn(selectedRequest)}
                  onClick={() => saveReview('RETURN_FOR_CORRECTION')}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Return to Lecturer
                </button>
                <button
                  type="button"
                  disabled={saving || !canMarkFurtherReview(selectedRequest)}
                  onClick={() => saveReview('REQUIRES_FURTHER_REVIEW')}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  Mark further review
                </button>
                <button
                  type="button"
                  disabled={saving || comment.trim().length < 5}
                  onClick={() => saveReview('COMMENT_ONLY')}
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
