'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Clock3, FileCheck2, ShieldCheck } from 'lucide-react';
import StatusBadge from '../../../components/promotion/StatusBadge';
import PromotionApplicationDetail, { type PromotionApplicationDetailRecord } from '../../../components/promotion/PromotionApplicationDetail';
import GovernedStageWorkspace from '../../../components/promotion/GovernedStageWorkspace';
import CommitteeMeetingPanel from '../../../components/promotion/CommitteeMeetingPanel';
import OfficialFormsWorkspace from '../../../components/promotion/OfficialFormsWorkspace';
import { EmptyState, ErrorState, LoadingState } from '../../../components/enterprise-ui';
import { useToast } from '../../../components/Toast';


type PromotionRequest = PromotionApplicationDetailRecord & {
  submittedAt?: string | null;
  verifiedAt?: string | null;
};

const queueSegments = ['pending', 'decided', 'further', 'all'] as const;
type QueueSegment = typeof queueSegments[number];

type RecommendationValue = 'RECOMMENDED' | 'NOT_RECOMMENDED' | 'REQUIRES_FURTHER_REVIEW';

const recommendationOptions: Array<{ value: RecommendationValue; label: string; detail: string; tone: 'success' | 'danger' | 'warning' }> = [
  { value: 'RECOMMENDED', label: 'Recommend', detail: 'Applicant meets committee expectations for promotion consideration.', tone: 'success' },
  { value: 'REQUIRES_FURTHER_REVIEW', label: 'Recommend with Conditions', detail: 'Committee needs clarification before a final administrative decision.', tone: 'warning' },
  { value: 'NOT_RECOMMENDED', label: 'Do Not Recommend', detail: 'Committee does not support promotion based on the reviewed record.', tone: 'danger' },
];

const visibleStatuses = ['UNDER_COMMITTEE_REVIEW', 'RECOMMENDED', 'NOT_RECOMMENDED', 'REQUIRES_FURTHER_REVIEW', 'APPROVED_BY_AUTHORITY', 'COMPLETED'];

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
  if (segment === 'pending') return request.status === 'UNDER_COMMITTEE_REVIEW';
  if (segment === 'decided') return ['RECOMMENDED', 'NOT_RECOMMENDED', 'APPROVED_BY_AUTHORITY', 'COMPLETED'].includes(request.status);
  if (segment === 'further') return request.status === 'REQUIRES_FURTHER_REVIEW';
  return true;
}

function segmentForRequest(request: PromotionRequest): QueueSegment {
  if (segmentMatches(request, 'pending')) return 'pending';
  if (segmentMatches(request, 'decided')) return 'decided';
  if (segmentMatches(request, 'further')) return 'further';
  return 'all';
}

function committeeHealth(request: PromotionRequest) {
  const docs = request.documents || [];
  const verified = docs.filter((document) => document.verificationStatus === 'VERIFIED').length;
  const returned = docs.filter((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus || '')).length;

  if (request.status === 'UNDER_COMMITTEE_REVIEW') {
    return { title: 'Ready for Recommendation', detail: `${verified} verified document(s) available for board review.`, tone: 'primary' as const };
  }

  if (request.status === 'REQUIRES_FURTHER_REVIEW') {
    return { title: 'Clarification Requested', detail: 'This file has been flagged for further review before final close-out.', tone: 'warning' as const };
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

function reviewChecklist(request: PromotionRequest, comment: string, recommendation: RecommendationValue) {
  const documents = request.documents || [];
  const verifiedDocuments = request.verifiedDocumentCount ?? documents.filter((document) => document.verificationStatus === 'VERIFIED').length;
  const requiredDocuments = request.requiredDocumentCount || Math.max(3, documents.length || 3);
  const hasDepartmentReview = (request.reviewComments || []).some((review) => ['HOD_DEAN', 'SYSTEM_ADMIN'].includes(review.reviewer?.role || ''));
  const hasHrEvidence = verifiedDocuments >= Math.min(requiredDocuments, Math.max(1, documents.length));

  return [
    { label: 'Applicant summary reviewed', complete: Boolean(request.lecturerName && request.targetRank) },
    { label: 'Verified evidence available', complete: hasHrEvidence },
    { label: 'Eligibility outcome checked', complete: Boolean(request.eligibilityStatus) },
    { label: 'Department comments reviewed', complete: hasDepartmentReview || (request.reviewComments || []).length > 0 },
    { label: 'Committee decision selected', complete: Boolean(recommendation) },
    { label: 'Recommendation rationale entered', complete: comment.trim().length >= 5 },
  ];
}

export default function CommitteeReviewPage() {
  const toast = useToast();
  const searchParams = useSearchParams();
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
      const response = await fetch('/api/promotion-requests?scope=committee', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load committee applications');
      }

      const allRequests = (payload.data || []) as PromotionRequest[];
      const scoped = allRequests.filter((request) => visibleStatuses.includes(request.status));
      setRequests(scoped);

      const preferred = scoped.find((request) => request.id === preferredId) || null;
      const next = preferred
        || scoped.find((request) => request.status === 'UNDER_COMMITTEE_REVIEW')
        || scoped[0]
        || null;

      if (preferred) {
        setSegment(segmentForRequest(preferred));
      }
      setSelectedId(next?.id || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load committee applications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const requestId = Number(searchParams.get('request') || searchParams.get('requestId'));
    const nextSegment = searchParams.get('segment');

    if (isQueueSegment(nextSegment)) {
      setSegment(nextSegment);
    }

    loadRequests(Number.isInteger(requestId) && requestId > 0 ? requestId : null);
  }, [searchParams]);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRequest) return;

    const decisionLabel = recommendationOptions.find((option) => option.value === recommendation)?.label || label(recommendation);
    const confirmed = window.confirm(`Save "${decisionLabel}" for ${applicationCode(selectedRequest.id)}? This will be recorded in the workflow history, audit log, and lecturer notifications.`);
    if (!confirmed) return;

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

      const message = `${applicationCode(selectedRequest.id)} committee recommendation saved.`;
      setMessage(message);
      toast.success('Committee recommendation saved', message);
      setComment('');
      await loadRequests(selectedRequest.id);
    } catch (reviewError) {
      const message = reviewError instanceof Error ? reviewError.message : 'Unable to save committee review';
      setError(message);
      toast.error('Committee review failed', message);
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
  const checklist = selectedRequest ? reviewChecklist(selectedRequest, comment, recommendation) : [];
  const checklistComplete = checklist.filter((item) => item.complete).length;
  const completion = checklist.length > 0 ? Math.round((checklistComplete / checklist.length) * 100) : 0;

  return (
    <section className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <div className="relative overflow-hidden rounded-xl border border-brand-primary/15 bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-primary" aria-hidden="true" />
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="pro-eyebrow">Committee Review</div>
            <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">Application Review Board</h1>
          </div>
          <Link href="/committee/dashboard" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-brand-primary/20 bg-white px-4 py-2 text-sm font-semibold text-brand-primary shadow-sm transition hover:bg-brand-primarySoft sm:w-auto">
            Dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <section className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricCard icon={ClipboardCheck} label="Assigned" value={assignedCount} tone="brand" />
        <MetricCard icon={Clock3} label="Pending" value={pendingCount} tone="amber" />
        <MetricCard icon={ShieldCheck} label="Recommended" value={recommendedCount} tone="green" />
        <MetricCard icon={AlertTriangle} label="Not Recommended" value={notRecommendedCount} tone="rose" />
        <MetricCard icon={FileCheck2} label="Further Review" value={furtherReviewCount} tone="blue" />
      </section>

      {message && <div role="status" aria-live="polite" className="rounded-lg border border-brand-primary/20 bg-brand-primarySoft p-4 text-sm font-semibold text-brand-primary">{message}</div>}
      {error && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}

      <section className="pro-card min-w-0 p-4 sm:p-5">
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)_auto] lg:items-end">
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Search</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="brand-input"
              placeholder="Name, email, department, or PR code"
              type="text"
            />
          </label>
          <label className="block min-w-0">
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

      <div className="grid min-w-0 items-start gap-5 2xl:grid-cols-[minmax(18rem,0.82fr)_minmax(0,1.7fr)]">
        <div className="pro-card min-w-0 overflow-hidden">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-950">Review Queue</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">Select a verified application for board review and recommendation.</p>
          </div>
          {filteredRequests.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No matching applications"
                description={
                  selectedRequest
                    ? `No matches. ${applicationCode(selectedRequest.id)} remains open below.`
                    : 'Adjust the segment or search term to view committee files.'
                }
              />
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
                    className={`block w-full p-5 text-left transition hover:bg-gray-50 ${selectedRequest?.id === request.id ? 'bg-brand-primarySoft' : ''}`}
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
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-semibold text-gray-600">
                      <span className="rounded-lg bg-gray-100 px-2 py-1">Docs {request.documentCount || 0}</span>
                      <span className="rounded-lg bg-brand-primarySoft px-2 py-1 text-brand-primary">Verified {request.verifiedDocumentCount || 0}</span>
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
          <PromotionApplicationDetail application={selectedRequest} role="COMMITTEE_REVIEWER" showGuidance={false}>
            <GovernedStageWorkspace requestId={selectedRequest.id} role="COMMITTEE_REVIEWER" applicantName={selectedRequest.lecturerName} />
            <div className="my-6 border-y border-gray-200 py-6">
              <OfficialFormsWorkspace requestId={selectedRequest.id} heading="Committee Assessment Forms" embedded />
            </div>
            <CommitteeMeetingPanel requestId={selectedRequest.id} role="COMMITTEE_REVIEWER" />
            <form onSubmit={submitReview}>
              <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-white text-brand-primary">
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Review Completion</p>
                      <h3 className="mt-1 text-lg font-bold text-gray-950">{completion}% ready</h3>
                      <p className="mt-1 text-sm leading-6 text-gray-600">Complete the checklist before recording a formal committee decision.</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${completion}%` }} />
                  </div>
                  <div className="mt-4 grid gap-2">
                    {checklist.map((item) => (
                      <div key={item.label} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${item.complete ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                          {item.complete ? 'OK' : '!'}
                        </span>
                        <span className="min-w-0 break-words">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-gray-950">Committee Recommendation</h3>
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
                </section>
              </div>

              <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className={`rounded-lg border p-4 ${optionTone(selectedOption.tone, true)}`}>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-75">Selected Decision</p>
                  <p className="mt-2 text-lg font-bold">{selectedOption.label}</p>
                  <p className="mt-1 text-sm leading-6 opacity-80">{selectedOption.detail}</p>
                </div>
                <label className="block text-sm font-semibold text-gray-800">
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

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={saving || selectedRequest.status !== 'UNDER_COMMITTEE_REVIEW' || comment.trim().length < 5}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
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


function MetricCard({ icon: Icon, label, value, tone }: { icon: typeof ClipboardCheck; label: string; value: number; tone: 'brand' | 'amber' | 'blue' | 'green' | 'rose' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-900'
    : tone === 'blue'
      ? 'border-sky-200 bg-sky-50 text-sky-900'
      : tone === 'green'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : tone === 'rose'
          ? 'border-rose-200 bg-rose-50 text-rose-900'
          : 'border-brand-primary/15 bg-brand-primarySoft text-brand-primary';

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneClass}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-current/15 bg-white/70">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-75">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-current sm:text-3xl">{value}</p>
        </div>
      </div>
    </div>
  );
}

function HealthPill({ title, detail, tone }: { title: string; detail: string; tone: 'primary' | 'warning' | 'success' | 'danger' | 'slate' }) {
  const toneClass = tone === 'warning'
    ? 'border-amber-200 bg-amber-50 text-amber-950'
    : tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
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
  if (tone === 'success') return active ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-emerald-200 text-emerald-900';
  if (tone === 'danger') return active ? 'border-rose-200 bg-rose-50 text-rose-950' : 'border-rose-200 text-rose-900';
  return active ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-amber-200 text-amber-900';
}
