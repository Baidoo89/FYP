'use client';

import { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../../../components/promotion/StatusBadge';
import PromotionApplicationDetail, { type PromotionApplicationDetailRecord } from '../../../components/promotion/PromotionApplicationDetail';
import { EmptyState, ErrorState, LoadingState } from '../../../components/enterprise-ui';

type PromotionRequest = PromotionApplicationDetailRecord & {
  submittedAt?: string | null;
  verifiedAt?: string | null;
};

type QueueSegment = 'active' | 'submitted' | 'forwarded' | 'returned' | 'further' | 'all';

type DepartmentDecision = 'FORWARD_TO_HR' | 'RETURN_FOR_CORRECTION' | 'REQUIRES_FURTHER_REVIEW' | 'COMMENT_ONLY';

const actionableStatuses = ['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW', 'REQUIRES_FURTHER_REVIEW'];
const departmentStatuses = ['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW', 'RETURNED_FOR_CORRECTION', 'REQUIRES_FURTHER_REVIEW', 'UNDER_HR_VERIFICATION', 'UNDER_COMMITTEE_REVIEW', 'RECOMMENDED', 'NOT_RECOMMENDED', 'APPROVED_BY_AUTHORITY', 'COMPLETED'];

function label(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function applicationCode(id: number) {
  return `PR-${String(id).padStart(5, '0')}`;
}

function segmentMatches(request: PromotionRequest, segment: QueueSegment) {
  if (segment === 'all') return true;
  if (segment === 'active') return actionableStatuses.includes(request.status);
  if (segment === 'submitted') return request.status === 'SUBMITTED' || request.status === 'UNDER_DEPARTMENT_REVIEW';
  if (segment === 'forwarded') return ['UNDER_HR_VERIFICATION', 'UNDER_COMMITTEE_REVIEW', 'RECOMMENDED', 'APPROVED_BY_AUTHORITY', 'COMPLETED'].includes(request.status);
  if (segment === 'returned') return request.status === 'RETURNED_FOR_CORRECTION';
  if (segment === 'further') return request.status === 'REQUIRES_FURTHER_REVIEW';
  return true;
}

function readinessFor(request: PromotionRequest) {
  const docs = request.documents || [];
  const verified = docs.filter((document) => document.verificationStatus === 'VERIFIED').length;
  const returned = docs.filter((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus || '')).length;
  const pending = docs.filter((document) => document.verificationStatus === 'PENDING').length;

  if (returned > 0 || request.status === 'RETURNED_FOR_CORRECTION') {
    return { title: 'Correction Required', detail: `${returned || 1} document issue(s) need applicant attention.`, tone: 'warning' as const };
  }

  if (request.status === 'SUBMITTED' || request.status === 'UNDER_DEPARTMENT_REVIEW') {
    return { title: 'Department Action', detail: 'Review evidence summary and record a department decision.', tone: 'primary' as const };
  }

  if (request.status === 'REQUIRES_FURTHER_REVIEW') {
    return { title: 'Further Review', detail: 'Resolve department concerns before returning the file to HR.', tone: 'warning' as const };
  }

  if (verified > 0) {
    return { title: 'Forwarded', detail: `${verified} verified document(s), ${pending} pending document(s).`, tone: 'success' as const };
  }

  return { title: 'Monitoring', detail: 'No direct department action is currently required.', tone: 'slate' as const };
}

export default function HodApplicationsPage() {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [segment, setSegment] = useState<QueueSegment>('active');
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
      const response = await fetch('/api/promotion-requests?scope=hr', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load department applications');
      }

      const allRequests = (payload.data || []) as PromotionRequest[];
      const scoped = allRequests.filter((request) => departmentStatuses.includes(request.status));
      setRequests(allRequests);

      const next = scoped.find((request) => request.id === preferredId)
        || scoped.find((request) => request.status === 'UNDER_DEPARTMENT_REVIEW')
        || scoped.find((request) => request.status === 'SUBMITTED')
        || scoped[0]
        || null;

      setSelectedId(next?.id || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load department applications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

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

      setMessage(`${applicationCode(selectedRequest.id)} department review saved.`);
      setComment('');
      await loadRequests(selectedRequest.id);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update department review');
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

  return (
    <section className="space-y-6">
      <div className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">HOD / Dean Review</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">Department Applications</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Review academic promotion files from your area, record formal department comments, return incomplete submissions, and forward complete applications to HR verification.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/hod/dashboard" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50">Dashboard</a>
            <a href="/analytics" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800">Reports</a>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard code="ALL" label="Department files" value={departmentRequests.length} tone="teal" />
        <MetricCard code="ACT" label="Active action" value={activeCount} tone="amber" />
        <MetricCard code="PEN" label="Pending review" value={pendingCount} tone="blue" />
        <MetricCard code="FWD" label="Forwarded" value={forwardedCount} tone="green" />
        <MetricCard code="RET" label="Returned" value={returnedCount + furtherReviewCount} tone="rose" />
      </section>

      {message && <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">{message}</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}

      <section className="pro-card p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_18rem_auto] lg:items-end">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Search</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="brand-input"
              placeholder="Name, email, department, or PR code"
              type="text"
            />
          </label>
          <label className="block">
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

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.65fr]">
        <div className="pro-card overflow-hidden">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-950">Department Queue</h2>
            <p className="mt-1 text-sm text-gray-600">Select an application to inspect evidence, history, and department actions.</p>
          </div>
          {filteredRequests.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No matching applications" description="Adjust the segment or search term to view department promotion files." />
            </div>
          ) : (
            <div className="max-h-[72rem] divide-y divide-gray-100 overflow-y-auto">
              {filteredRequests.map((request) => {
                const readiness = readinessFor(request);
                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedId(request.id)}
                    className={`block w-full p-5 text-left transition hover:bg-gray-50 ${selectedRequest?.id === request.id ? 'bg-teal-50/70' : ''}`}
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{applicationCode(request.id)}</p>
                        <p className="mt-2 truncate font-semibold text-gray-950">{request.lecturerName}</p>
                        <p className="mt-1 text-sm text-gray-600">{request.department}</p>
                        <p className="mt-1 text-xs text-gray-500">{label(request.currentRank)} to {label(request.targetRank)}</p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>
                    <HealthPill title={readiness.title} detail={readiness.detail} tone={readiness.tone} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!selectedRequest ? (
          <div className="pro-card p-6">
            <EmptyState title="Select an application" description="Choose a department file from the queue to begin review." />
          </div>
        ) : (
          <PromotionApplicationDetail application={selectedRequest} role="HOD_DEAN">
            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <h3 className="text-lg font-bold text-gray-950">Department Review Action</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Record a clear academic recommendation or correction note. This comment is saved to the application review history.
                </p>
                <label className="mt-4 block text-sm font-semibold text-gray-800">
                  Department review comment
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className="brand-input mt-1 min-h-32"
                    placeholder="Record department recommendation, evidence concerns, or correction instructions..."
                  />
                </label>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Decision Guidance</p>
                <div className="mt-3 space-y-3 text-sm leading-6 text-gray-700">
                  <p><span className="font-semibold text-gray-950">Forward:</span> Use when the department is satisfied the file can proceed to HR verification.</p>
                  <p><span className="font-semibold text-gray-950">Return:</span> Use when the applicant must correct or add evidence before review continues.</p>
                  <p><span className="font-semibold text-gray-950">Further review:</span> Use when additional department discussion is needed.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={saving || !actionableStatuses.includes(selectedRequest.status)}
                onClick={() => saveReview('FORWARD_TO_HR')}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {saving ? 'Saving...' : 'Forward to HR'}
              </button>
              <button
                type="button"
                disabled={saving || !['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW'].includes(selectedRequest.status)}
                onClick={() => saveReview('RETURN_FOR_CORRECTION')}
                className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-950 hover:bg-orange-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
              >
                Return for correction
              </button>
              <button
                type="button"
                disabled={saving || !['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW'].includes(selectedRequest.status)}
                onClick={() => saveReview('REQUIRES_FURTHER_REVIEW')}
                className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
              >
                Mark further review
              </button>
              <button
                type="button"
                disabled={saving || comment.trim().length < 5}
                onClick={() => saveReview('COMMENT_ONLY')}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                Save note only
              </button>
            </div>

            {!actionableStatuses.includes(selectedRequest.status) && (
              <p className="mt-3 text-xs font-medium text-gray-500">This application is not currently waiting for department action.</p>
            )}
          </PromotionApplicationDetail>
        )}
      </div>
    </section>
  );
}

function MetricCard({ code, label, value, tone }: { code: string; label: string; value: number; tone: 'teal' | 'amber' | 'blue' | 'green' | 'rose' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-900'
    : tone === 'blue'
      ? 'border-sky-200 bg-sky-50 text-sky-900'
      : tone === 'green'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : tone === 'rose'
          ? 'border-rose-200 bg-rose-50 text-rose-900'
          : 'border-teal-200 bg-teal-50 text-teal-900';

  return (
    <div className="pro-tile p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-950">{value}</p>
        </div>
        <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${toneClass}`}>{code}</span>
      </div>
    </div>
  );
}

function HealthPill({ title, detail, tone }: { title: string; detail: string; tone: 'primary' | 'warning' | 'success' | 'slate' }) {
  const toneClass = tone === 'warning'
    ? 'border-amber-200 bg-amber-50 text-amber-950'
    : tone === 'success'
      ? 'border-teal-200 bg-teal-50 text-teal-950'
      : tone === 'primary'
        ? 'border-sky-200 bg-sky-50 text-sky-950'
        : 'border-gray-200 bg-gray-50 text-gray-700';

  return (
    <div className={`mt-4 rounded-lg border p-3 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-75">{title}</p>
      <p className="mt-1 text-xs leading-5 opacity-85">{detail}</p>
    </div>
  );
}
