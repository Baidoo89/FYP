'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpenCheck, CheckCircle2, FileCheck2, Files, Send, type LucideIcon } from 'lucide-react';
import PromotionApplicationDetail, { type PromotionApplicationDetailRecord } from '../../../components/promotion/PromotionApplicationDetail';
import GovernedStageWorkspace from '../../../components/promotion/GovernedStageWorkspace';
import AppealPanel from '../../../components/promotion/AppealPanel';
import StatusBadge from '../../../components/promotion/StatusBadge';
import PolicyPromotionStart from '../../../components/promotion/PolicyPromotionStart';
import { ErrorState, LoadingState, PrintSummaryButton } from '../../../components/enterprise-ui';
import { useToast } from '../../../components/Toast';

type PromotionRequest = PromotionApplicationDetailRecord & {
  submittedAt?: string | null;
  verifiedAt?: string | null;
  promotionRoute?: { code: string; name: string } | null;
};

type PreparationReadiness = {
  requestId: number;
  loading: boolean;
  formsRequired: number;
  formsCompleted: number;
  formsReady: boolean;
  dossierRequired: boolean;
  dossierReady: boolean;
  error?: string;
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

function nextActionFor(request: PromotionRequest, preparation: PreparationReadiness | null) {
  const docs = request.documents || [];
  const required = request.requiredDocumentCount && request.requiredDocumentCount > 0 ? request.requiredDocumentCount : 3;
  const pending = docs.filter((document) => document.verificationStatus === 'PENDING').length;
  const returned = docs.filter((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus || '')).length;

  if (request.status === 'DRAFT') {
    if (!preparation || preparation.loading || !preparation.formsReady) {
      return {
        title: 'Complete the official promotion form',
        detail: preparation?.loading ? 'Checking your route-specific form status.' : 'Complete every required field, confirm the declaration, sign, and submit the controlled form.',
        action: 'Open Official Form',
        href: '/lecturer-portal/official-forms',
      };
    }

    if (docs.length < required) {
      return {
        title: 'Upload required evidence',
        detail: `Upload all ${required} required evidence categories that support the claims in your official form.`,
        action: 'Upload Evidence',
        href: '/lecturer-portal/evidence',
      };
    }

    if (preparation.dossierRequired && !preparation.dossierReady) {
      return {
        title: 'Complete the academic dossier',
        detail: 'Add the Schedule J scholarly outputs, select the required assessment set, and confirm the declaration.',
        action: 'Open Academic Dossier',
        href: '/lecturer-portal/academic-dossier',
      };
    }

    return {
      title: 'Submit your application',
      detail: 'The official form, required evidence, and route-specific dossier are ready. Submit to begin department review.',
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
  const router = useRouter();
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [preparation, setPreparation] = useState<PreparationReadiness | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedId) || requests.find((request) => activeStatuses.has(request.status)) || requests[0] || null,
    [requests, selectedId]
  );

  const currentPreparation = selectedRequest && preparation?.requestId === selectedRequest.id ? preparation : null;
  const nextAction = selectedRequest ? nextActionFor(selectedRequest, currentPreparation) : null;

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

  useEffect(() => {
    if (!selectedRequest) {
      setPreparation(null);
      return;
    }

    const dossierRequired = Boolean(selectedRequest.promotionRoute?.code.startsWith('J-'));
    let cancelled = false;
    setPreparation({
      requestId: selectedRequest.id,
      loading: true,
      formsRequired: 0,
      formsCompleted: 0,
      formsReady: false,
      dossierRequired,
      dossierReady: !dossierRequired,
    });

    async function loadPreparation() {
      try {
        const formsResponse = await fetch(`/api/promotion-requests/${selectedRequest.id}/forms`, { cache: "no-store" });
        const formsPayload = await formsResponse.json();
        if (!formsResponse.ok || !formsPayload.success) throw new Error(formsPayload.error || 'Unable to check official forms.');
        const forms = Array.isArray(formsPayload.data?.forms) ? formsPayload.data.forms : [];
        const completedForms = forms.filter((item: { submission?: { status?: string } | null }) => ['FROZEN', 'SUBMITTED', 'SUPERSEDED'].includes(item.submission?.status || '')).length;

        let dossierReady = !dossierRequired;
        if (dossierRequired) {
          const dossierResponse = await fetch('/api/lecturer/academic-dossier', { cache: 'no-store' });
          const dossierPayload = await dossierResponse.json();
          dossierReady = Boolean(dossierResponse.ok && dossierPayload.success && dossierPayload.data?.readiness?.readyForSubmission);
        }

        if (!cancelled) {
          setPreparation({
            requestId: selectedRequest.id,
            loading: false,
            formsRequired: forms.length,
            formsCompleted: completedForms,
            formsReady: forms.length > 0 && completedForms === forms.length,
            dossierRequired,
            dossierReady,
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setPreparation({
            requestId: selectedRequest.id,
            loading: false,
            formsRequired: 0,
            formsCompleted: 0,
            formsReady: false,
            dossierRequired,
            dossierReady: !dossierRequired,
            error: loadError instanceof Error ? loadError.message : 'Unable to check application preparation.',
          });
        }
      }
    }

    void loadPreparation();
    return () => {
      cancelled = true;
    };
  }, [selectedRequest?.id, selectedRequest?.promotionRoute?.code]);

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

        </section>

        <PolicyPromotionStart onCreated={() => router.push('/lecturer-portal/official-forms')} />


      </div>
    );
  }

  const documents = selectedRequest.documents || [];
  const requiredEvidence = selectedRequest.requiredDocumentCount && selectedRequest.requiredDocumentCount > 0 ? selectedRequest.requiredDocumentCount : 3;
  const evidenceReady = documents.length >= requiredEvidence;
  const formsReady = Boolean(currentPreparation?.formsReady);
  const dossierReady = Boolean(!currentPreparation?.dossierRequired || currentPreparation.dossierReady);
  const readyForFormalSubmission = formsReady && evidenceReady && dossierReady;

  return (
    <div className="min-w-0 space-y-6">
      <section className="pro-hero px-4 py-6 sm:px-6 sm:py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">Application Tracker</div>
            <h1 className="mt-4 break-words text-2xl font-bold tracking-tight sm:text-4xl">
              {label(selectedRequest.currentRank)} to {label(selectedRequest.targetRank)}
            </h1>

          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
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

      {selectedRequest.status === 'DRAFT' && (
        <section className="min-w-0 border-y border-slate-200 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">Draft Preparation</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Application checklist</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Complete the official form first, then attach its supporting evidence. Draft evidence may still be uploaded before the form when the files are already available.</p>
            </div>
            <span className={`w-fit rounded-md border px-2 py-1 text-xs font-bold ${readyForFormalSubmission ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              {readyForFormalSubmission ? 'Ready to submit' : 'Preparation in progress'}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <PreparationStep
              code="01"
              title="Official Form"
              detail={currentPreparation?.loading ? 'Checking form status' : `${currentPreparation?.formsCompleted || 0}/${currentPreparation?.formsRequired || 1} signed and frozen`}
              href="/lecturer-portal/official-forms"
              icon={FileCheck2}
              complete={formsReady}
            />
            <PreparationStep
              code="02"
              title="Supporting Evidence"
              detail={`${documents.length}/${requiredEvidence} required categories uploaded`}
              href="/lecturer-portal/evidence"
              icon={Files}
              complete={evidenceReady}
            />
            {currentPreparation?.dossierRequired ? (
              <PreparationStep
                code="03"
                title="Academic Dossier"
                detail={currentPreparation.dossierReady ? 'Schedule J dossier ready' : 'Scholarly outputs and declaration required'}
                href="/lecturer-portal/academic-dossier"
                icon={BookOpenCheck}
                complete={currentPreparation.dossierReady}
              />
            ) : null}
            <PreparationStep
              code={currentPreparation?.dossierRequired ? '04' : '03'}
              title="Review and Submit"
              detail={readyForFormalSubmission ? 'All applicant requirements complete' : 'Complete the outstanding items first'}
              href="/lecturer-portal/application"
              icon={Send}
              complete={readyForFormalSubmission}
            />
          </div>
          {currentPreparation?.error ? <p className="mt-3 text-sm font-semibold text-amber-800">{currentPreparation.error}</p> : null}
        </section>
      )}

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

      <PromotionApplicationDetail application={selectedRequest} role="LECTURER" showGuidance={false} showEvidenceDocuments={false} />
      <GovernedStageWorkspace requestId={selectedRequest.id} role="LECTURER" applicantName={selectedRequest.lecturerName} />
      <AppealPanel requestId={selectedRequest.id} role="LECTURER" requestStatus={selectedRequest.status} />
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
        <a href={`/api/promotion-requests/${selectedRequest.id}/official-pack`} className="inline-flex min-h-10 items-center rounded-lg border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primarySoft">Download official file pack</a>
      </div>

      <Link href="/lecturer-portal" className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        Back to Dashboard
      </Link>
    </div>
  );
}

function PreparationStep({
  code,
  title,
  detail,
  href,
  icon: Icon,
  complete,
}: {
  code: string;
  title: string;
  detail: string;
  href: string;
  icon: LucideIcon;
  complete: boolean;
}) {
  return (
    <Link href={href} className="group flex min-h-28 min-w-0 items-start gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-primary/30 hover:bg-brand-primarySoft">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${complete ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-brand-primary'}`}>
        {complete ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Step {code}</span>
        <span className="mt-1 block font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-600">{detail}</span>
      </span>
    </Link>
  );
}
