'use client';

import { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../../../components/promotion/StatusBadge';
import PromotionApplicationDetail, { type PromotionApplicationDetailRecord } from '../../../components/promotion/PromotionApplicationDetail';
import { EmptyState, ErrorState, LoadingState } from '../../../components/enterprise-ui';

type PromotionRequest = PromotionApplicationDetailRecord & {
  submittedAt?: string | null;
  verifiedAt?: string | null;
};

type QueueSegment = 'pending' | 'decided' | 'further' | 'all';

type RecommendationValue = 'RECOMMENDED' | 'NOT_RECOMMENDED' | 'REQUIRES_FURTHER_REVIEW';

const recommendationOptions: Array<{ value: RecommendationValue; label: string; detail: string; tone: 'success' | 'danger' | 'warning' }> = [
  { value: 'RECOMMENDED', label: 'Recommended', detail: 'Applicant meets committee expectations for promotion consideration.', tone: 'success' },
  { value: 'NOT_RECOMMENDED', label: 'Not Recommended', detail: 'Committee does not support promotion based on the reviewed record.', tone: 'danger' },
  { value: 'REQUIRES_FURTHER_REVIEW', label: 'Requires Further Review', detail: 'Committee needs clarification before a final recommendation.', tone: 'warning' },
];

const visibleStatuses = ['UNDER_COMMITTEE_REVIEW', 'RECOMMENDED', 'NOT_RECOMMENDED', 'REQUIRES_FURTHER_REVIEW', 'APPROVED_BY_AUTHORITY', 'COMPLETED'];

function label(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function applicationCode(id: number) {
  return `PR-${String(id).padStart(5, '0')}`;
}

function segmentMatches(request: PromotionRequest, segment: QueueSegment) {
  if (segment === 'all') return true;
  if (segment === 'pending') return request.status === 'UNDER_COMMITTEE_REVIEW';
  if (segment === 'decided') return ['RECOMMENDED', 'NOT_RECOMMENDED', 'APPROVED_BY_AUTHORITY', 'COMPLETED'].includes(request.status);
  if (segment === 'further') return request.status === 'REQUIRES_FURTHER_REVIEW';
  return true;
}

function committeeHealth(request: PromotionRequest) {
  const docs = request.documents || [];
  const verified = docs.filter((document) => document.verificationStatus === 'VERIFIED').length;
  const returned = docs.filter((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus || '')).length;

  if (request.status === 'UNDER_COMMITTEE_REVIEW') {
    return { title: 'Ready for Recommendation', detail: `${verified} verified document(s) available for board review.`, tone: 'primary' as const };
  }

  if (request.status === 'REQUIRES_FURTHER_REVIEW') {
    return { title: 'Clarification Requested', detail: 'This file has been sent back for additional review before final recommendation.', tone: 'warning' as const };
  }

  if (request.status === 'RECOMMENDED') {
    return { title: 'Recommended', detail: 'Committee recommendation is recorded and awaiting HR final action.', tone: 'success' as const };
  }

  if (request.status === 'NOT_RECOMMENDED') {
    return { title: 'Not Recommended', detail: 'Committee decision is recorded and awaits administrative close-out.', tone: 'danger' as const };
  }

  if (returned > 0) {
    return { title: 'Evidence Concern', detail: `${returned} returned document(s) remain visible in the file history.`, tone: 'warning' as const };
  }

  return { title: 'Final Tracking', detail: 'This file is beyond active committee decision stage.', tone: 'slate' as const };
}

export default function CommitteeReviewPage() {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationValue>('RECOMMENDED');
  const [comment, setComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [segment, setSegment] = useState<QueueSegment>('pending');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const visibleRequests = useMemo(
    () => requests.filter((request) => visibleStatuses.includes(request.status)),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    let filtered = visibleRequests.filter((request) => segmentMatches(request, segment));

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
  }, [visibleRequests, searchTerm, segment]);

  const selectedRequest = filteredRequests.find((request) => request.id === selectedId)
    || visibleRequests.find((request) => request.id === selectedId)
    || filteredRequests[0]
    || null;

  async function loadRequests(preferredId?: number | null) {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/promotion-requests?scope=hr', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load committee applications');
      }

      const allRequests = (payload.data || []) as PromotionRequest[];
      const scoped = allRequests.filter((request) => visibleStatuses.includes(request.status));
      setRequests(allRequests);

      const next = scoped.find((request) => request.id === preferredId)
        || scoped.find((request) => request.status === 'UNDER_COMMITTEE_REVIEW')
        || scoped[0]
        || null;

      setSelectedId(next?.id || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load committee applications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRequest) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/promotion-requests/${selectedRequest.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation, comment }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to save committee review');
      }

      setMessage(`${applicationCode(selectedRequest.id)} committee recommendation saved.`);
      setComment('');
      await loadRequests(selectedRequest.id);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to save committee review');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading committee review workspace..." />;
  if (error && requests.length === 0) return <ErrorState message={error} />;

  const assignedCount = visibleRequests.length;
  const pendingCount = visibleRequests.filter((request) => request.status === 'UNDER_COMMITTEE_REVIEW').length;
  const recommendedCount = visibleRequests.filter((request) => request.status === 'RECOMMENDED').length;
  const notRecommendedCount = visibleRequests.filter((request) => request.status === 'NOT_RECOMMENDED').length;
  const furtherReviewCount = visibleRequests.filter((request) => request.status === 'REQUIRES_FURTHER_REVIEW').length;
  const selectedOption = recommendationOptions.find((option) => option.value === recommendation) || recommendationOptions[0];

  return (
    <section className="space-y-6">
      <div className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">Committee Review</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">Application Review Board</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Review HR-verified promotion applications, inspect evidence readiness, consider eligibility recommendations, and record formal committee decisions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/committee/dashboard" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50">Dashboard</a>
            <a href="/analytics" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800">Reports</a>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard code="ASN" label="Assigned files" value={assignedCount} tone="teal" />
        <MetricCard code="PEN" label="Pending review" value={pendingCount} tone="amber" />
        <MetricCard code="REC" label="Recommended" value={recommendedCount} tone="green" />
        <MetricCard code="NR" label="Not recommended" value={notRecommendedCount} tone="rose" />
        <MetricCard code="FR" label="Further review" value={furtherReviewCount} tone="blue" />
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
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Review segment</span>
            <select value={segment} onChange={(event) => setSegment(event.target.value as QueueSegment)} className="brand-input">
              <option value="pending">Pending review</option>
              <option value="decided">Decided files</option>
              <option value="further">Further review</option>
              <option value="all">All committee files</option>
            </select>
          </label>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
            Showing {filteredRequests.length} of {visibleRequests.length}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.65fr]">
        <div className="pro-card overflow-hidden">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-950">Review Queue</h2>
            <p className="mt-1 text-sm text-gray-600">Select a verified application for board review and recommendation.</p>
          </div>
          {filteredRequests.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No matching applications" description="Adjust the segment or search term to view committee files." />
            </div>
          ) : (
            <div className="max-h-[72rem] divide-y divide-gray-100 overflow-y-auto">
              {filteredRequests.map((request) => {
                const health = committeeHealth(request);
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
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-semibold text-gray-600">
                      <span className="rounded-lg bg-gray-100 px-2 py-1">Docs {request.documentCount || 0}</span>
                      <span className="rounded-lg bg-teal-50 px-2 py-1 text-teal-800">Verified {request.verifiedDocumentCount || 0}</span>
                      <span className="rounded-lg bg-gray-100 px-2 py-1">Score {request.totalScore ?? 'N/A'}</span>
                    </div>
                    <HealthPill title={health.title} detail={health.detail} tone={health.tone} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!selectedRequest ? (
          <div className="pro-card p-6">
            <EmptyState title="Select an application" description="Choose a committee file from the queue to begin review." />
          </div>
        ) : (
          <PromotionApplicationDetail application={selectedRequest} role="COMMITTEE_REVIEWER">
            <form onSubmit={submitReview}>
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div>
                  <h3 className="text-lg font-bold text-gray-950">Committee Recommendation</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Record the formal committee position after reviewing evidence, eligibility status, and department/HR comments.
                  </p>
                  <div className="mt-4 grid gap-2">
                    {recommendationOptions.map((option) => (
                      <label key={option.value} className={`cursor-pointer rounded-lg border p-3 transition ${recommendation === option.value ? optionTone(option.tone, true) : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                        <span className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="recommendation"
                            value={option.value}
                            checked={recommendation === option.value}
                            onChange={(event) => setRecommendation(event.target.value as RecommendationValue)}
                            className="mt-1"
                          />
                          <span>
                            <span className="block text-sm font-bold">{option.label}</span>
                            <span className="mt-1 block text-xs leading-5 opacity-75">{option.detail}</span>
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className={`rounded-lg border p-4 ${optionTone(selectedOption.tone, true)}`}>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-75">Selected Decision</p>
                    <p className="mt-2 text-lg font-bold">{selectedOption.label}</p>
                    <p className="mt-1 text-sm leading-6 opacity-80">{selectedOption.detail}</p>
                  </div>
                  <label className="mt-4 block text-sm font-semibold text-gray-800">
                    Review comment
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      className="brand-input mt-1 min-h-36"
                      placeholder="Record committee observations, evidence rationale, and recommendation basis..."
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving || selectedRequest.status !== 'UNDER_COMMITTEE_REVIEW' || comment.trim().length < 5}
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {saving ? 'Saving review...' : 'Save committee review'}
                </button>
                <span className="text-xs font-medium text-gray-500">A comment of at least 5 characters is required.</span>
              </div>

              {selectedRequest.status !== 'UNDER_COMMITTEE_REVIEW' && (
                <p className="mt-3 text-xs font-medium text-gray-500">This application is not currently open for committee recommendation changes.</p>
              )}
            </form>
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

function HealthPill({ title, detail, tone }: { title: string; detail: string; tone: 'primary' | 'warning' | 'success' | 'danger' | 'slate' }) {
  const toneClass = tone === 'warning'
    ? 'border-amber-200 bg-amber-50 text-amber-950'
    : tone === 'success'
      ? 'border-teal-200 bg-teal-50 text-teal-950'
      : tone === 'danger'
        ? 'border-rose-200 bg-rose-50 text-rose-950'
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

function optionTone(tone: 'success' | 'danger' | 'warning', active: boolean) {
  if (tone === 'success') return active ? 'border-teal-200 bg-teal-50 text-teal-950' : 'border-teal-200 text-teal-900';
  if (tone === 'danger') return active ? 'border-rose-200 bg-rose-50 text-rose-950' : 'border-rose-200 text-rose-900';
  return active ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-amber-200 text-amber-900';
}
