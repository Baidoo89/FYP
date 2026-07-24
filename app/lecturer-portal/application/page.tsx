'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PromotionApplicationDetail, { type PromotionApplicationDetailRecord } from '../../../components/promotion/PromotionApplicationDetail';
import StatusBadge from '../../../components/promotion/StatusBadge';
import StartPromotionRequestCard from '../../../components/promotion/StartPromotionRequestCard';
import { EmptyState, ErrorState, LoadingState, PrintSummaryButton } from '../../../components/enterprise-ui';
import { useToast } from '../../../components/Toast';

type PromotionRequest = PromotionApplicationDetailRecord & {
  submittedAt?: string | null;
  verifiedAt?: string | null;
};

type LecturerProfile = {
  currentRank: string | null;
};

const activeStatuses = new Set([
  'DRAFT',
  'SUBMITTED',
  'UNDER_DEPARTMENT_REVIEW',
  'RETURNED_FOR_CORRECTION',
  'UNDER_HR_VERIFICATION',
  'UNDER_COMMITTEE_REVIEW',
  'ELIGIBLE',
  'NOT_ELIGIBLE',
  'REQUIRES_FURTHER_REVIEW',
  'RECOMMENDED',
  'NOT_RECOMMENDED',
  'APPROVED_BY_AUTHORITY',
  'APPROVED',
]);

function label(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function nextActionFor(request: PromotionRequest) {
  const docs = request.documents || [];
  const required = request.requiredDocumentCount && request.requiredDocumentCount > 0 ? request.requiredDocumentCount : 3;
  const pending = docs.filter((document) => document.verificationStatus === 'PENDING').length;
  const returned = docs.filter((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus || '')).length;

  if (request.status === 'DRAFT') {
    if (docs.length < required) {
      return {
        title: 'Upload required evidence',
        detail: `Upload all ${required} required evidence categories before submitting your application.`,
        action: 'Upload Evidence',
        href: '/lecturer-portal/evidence',
      };
    }

    return {
      title: 'Submit your application',
      detail: 'Your evidence is uploaded. Submit the application to begin department review.',
      action: 'Submit Application',
      href: null,
    };
  }

  if (request.status === 'RETURNED_FOR_CORRECTION') {
    if (returned > 0) {
      return {
        title: 'Correct returned evidence',
        detail: 'Review HR or department comments and replace the returned document before resubmission.',
        action: 'Open Evidence Portfolio',
        href: '/lecturer-portal/evidence',
      };
    }

    return {
      title: 'Resubmit corrected application',
      detail: 'Returned evidence has been replaced. Resubmit the corrected application so department review can continue.',
      action: 'Resubmit Application',
      href: null,
    };
  }

  if (returned > 0) {
    return {
      title: 'Correct returned evidence',
      detail: 'Review HR or department comments and replace the returned document before resubmission.',
      action: 'Open Evidence Portfolio',
      href: '/lecturer-portal/evidence',
    };
  }

  if (pending > 0 || request.status === 'UNDER_HR_VERIFICATION') {
    return {
      title: 'Await HR verification',
      detail: `${pending} document(s) are still pending verification. You will be notified after HR review.`,
      action: 'View Evidence',
      href: '/lecturer-portal/evidence',
    };
  }

  if (request.status === 'UNDER_COMMITTEE_REVIEW') {
    return {
      title: 'Await committee review',
      detail: 'Your verified application is with the promotion review committee.',
      action: 'View Feedback',
      href: '/lecturer-portal/queries',
    };
  }

  if (request.status === 'RECOMMENDED' || request.status === 'APPROVED_BY_AUTHORITY') {
    return {
      title: 'Recommendation recorded',
      detail: 'Your application has a recommendation and is awaiting final administrative completion.',
      action: 'Print Summary',
      href: null,
    };
  }

  return {
    title: 'Track application updates',
    detail: 'Monitor status history, feedback, and notifications as your application progresses.',
    action: 'View Notifications',
    href: '/notifications',
  };
}

export default function ApplicationPage() {
  const toast = useToast();
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [lecturerProfile, setLecturerProfile] = useState<LecturerProfile | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedId) || requests.find((request) => activeStatuses.has(request.status)) || requests[0] || null,
    [requests, selectedId]
  );

  const nextAction = selectedRequest ? nextActionFor(selectedRequest) : null;

  async function loadApplications(preferredId?: number | null) {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/promotion-requests?scope=lecturer');
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load application');
      }

      const data = (payload.data || []) as PromotionRequest[];
      setRequests(data);

      if (data[0]) {
        setLecturerProfile({ currentRank: data[0].currentRank });
      } else {
        const profileResponse = await fetch('/api/lecturer/dashboard', { cache: 'no-store' });
        const profilePayload = await profileResponse.json();
        if (profileResponse.ok && profilePayload.success) {
          setLecturerProfile({ currentRank: profilePayload.data.user.currentRank || null });
        }
      }

      const next = data.find((request) => request.id === preferredId) || data.find((request) => activeStatuses.has(request.status)) || data[0] || null;
      setSelectedId(next?.id || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load application data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function submitApplication() {
    if (!selectedRequest) return;

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/promotion-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', requestId: selectedRequest.id }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to submit application');
      }

      const message = selectedRequest.status === 'RETURNED_FOR_CORRECTION'
        ? 'Corrected application resubmitted successfully. Department review can now continue.'
        : 'Application submitted successfully. Department review can now begin.';
      setMessage(message);
      toast.success(selectedRequest.status === 'RETURNED_FOR_CORRECTION' ? 'Application resubmitted' : 'Application submitted', message);
      await loadApplications(selectedRequest.id);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to submit application';
      setError(message);
      toast.error('Submission failed', message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading application tracker..." />;
  }

  if (error && !selectedRequest) {
    return <ErrorState message={error} />;
  }

  if (!selectedRequest) {
    return (
      <div className="min-w-0 space-y-6">
        <section className="pro-hero px-4 py-6 sm:px-6 sm:py-8">
          <div className="pro-eyebrow">Active Application</div>
          <h1 className="mt-4 break-words text-2xl font-bold tracking-tight sm:text-4xl">Start Promotion Application</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Select the rank you are applying for before uploading evidence or submitting the promotion file.
          </p>
        </section>

        <StartPromotionRequestCard currentRank={lecturerProfile?.currentRank || null} onCreated={(request) => loadApplications(request.id)} />

        <EmptyState
          title="No application record yet"
          description="Once the target rank is selected, your draft application, workflow tracker, evidence checklist, and HOD/Dean visibility will be created from the same database record."
        />
      </div>
    );
  }

  const documents = selectedRequest.documents || [];
  const verified = documents.filter((document) => document.verificationStatus === 'VERIFIED').length;
  const pending = documents.filter((document) => document.verificationStatus === 'PENDING').length;
  const returned = documents.filter((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus || '')).length;

  return (
    <div className="min-w-0 space-y-6">
      <section className="pro-hero px-4 py-6 sm:px-6 sm:py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">Application Tracker</div>
            <h1 className="mt-4 break-words text-2xl font-bold tracking-tight sm:text-4xl">
              {selectedRequest.currentRank} to {selectedRequest.targetRank}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Track your promotion workflow, evidence decisions, eligibility recommendation, review comments, and next required action.
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
            <Link href="/lecturer-portal/evidence" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-teal-50">
              Upload Evidence
            </Link>
            <PrintSummaryButton />
          </div>
        </div>
      </section>

      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</div>}
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">{error}</div>}

      {requests.length > 1 && (
        <section className="pro-card p-4">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">My Applications</h2>
              <p className="mt-1 text-sm text-slate-600">Switch between your current and previous promotion records.</p>
            </div>
            <div className="pro-scroll-x -mx-4 px-4 pb-1 lg:mx-0 lg:px-0">
              <div className="flex min-w-max gap-2">
                {requests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedId(request.id)}
                    className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold transition ${selectedRequest.id === request.id ? 'border-teal-600 bg-teal-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    #{request.id} {label(request.status)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TrackerMetric code="DOC" label="Uploaded documents" value={documents.length} />
        <TrackerMetric code="VER" label="Verified" value={verified} />
        <TrackerMetric code="PEN" label="Pending" value={pending} tone="amber" />
        <TrackerMetric code="RET" label="Returned" value={returned} tone="rose" />
      </section>

      {nextAction && (
        <section className="pro-card p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Next Required Action</p>
              <h2 className="mt-2 text-xl font-bold text-slate-950">{nextAction.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{nextAction.detail}</p>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
              {nextAction.href ? (
                <Link href={nextAction.href} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
                  {nextAction.action}
                </Link>
              ) : ['Submit Application', 'Resubmit Application'].includes(nextAction.action) ? (
                <button type="button" onClick={submitApplication} disabled={submitting} className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60">
                  {submitting ? (nextAction.action === 'Resubmit Application' ? 'Resubmitting...' : 'Submitting...') : nextAction.action}
                </button>
              ) : (
                <PrintSummaryButton label={nextAction.action} />
              )}
              <Link href="/lecturer-portal/queries" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                View Feedback
              </Link>
            </div>
          </div>
        </section>
      )}

      <PromotionApplicationDetail application={selectedRequest} role="LECTURER">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Applicant Controls</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Use these actions to keep your promotion record complete and ready for review.
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
            <StatusBadge status={selectedRequest.status} />
            <Link href="/lecturer-portal/evidence" className="rounded-lg border border-teal-200 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">
              Evidence Portfolio
            </Link>
            <PrintSummaryButton />
          </div>
        </div>
      </PromotionApplicationDetail>

      <Link href="/lecturer-portal" className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        Back to Dashboard
      </Link>
    </div>
  );
}

function TrackerMetric({ code, label, value, tone = 'teal' }: { code: string; label: string; value: number; tone?: 'teal' | 'amber' | 'rose' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-teal-200 bg-teal-50 text-teal-800';

  return (
    <div className="pro-tile min-w-0 p-4 sm:p-5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">{value}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${toneClass}`}>{code}</span>
      </div>
    </div>
  );
}
