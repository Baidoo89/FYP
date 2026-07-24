'use client';

import { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../../../components/promotion/StatusBadge';
import PromotionApplicationDetail, { type PromotionApplicationDetailRecord } from '../../../components/promotion/PromotionApplicationDetail';
import { EmptyState, ErrorState, LoadingState } from '../../../components/enterprise-ui';
import { useToast } from '../../../components/Toast';

type DocumentItem = {
  id: number;
  title: string;
  category: string;
  fileUrl?: string;
  fileName?: string | null;
  fileSize?: number | null;
  verificationStatus?: string;
  verifiedById?: number | null;
  verificationComment?: string | null;
  uploadedAt?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: {
    name?: string | null;
    role?: string | null;
  } | null;
};

type PromotionRequest = PromotionApplicationDetailRecord & {
  submittedAt: string | null;
  verifiedAt: string | null;
  documentCount: number;
  verifiedDocumentCount?: number;
  requiredDocumentCount?: number;
  documents: DocumentItem[];
};

type VerificationDecision = 'VERIFIED' | 'REQUIRES_CORRECTION' | 'REJECTED';
type QueueSegment = 'pending' | 'returned' | 'committee' | 'completed' | 'all';

const queueSegments: QueueSegment[] = ['pending', 'returned', 'committee', 'completed', 'all'];

const decisionConfig: Record<VerificationDecision, { label: string; description: string; className: string; defaultComment: string; code: string }> = {
  VERIFIED: {
    label: 'Verify Document',
    description: 'Accept this evidence for eligibility calculation and workflow routing.',
    className: 'border-emerald-200 bg-emerald-700 text-white hover:bg-emerald-800',
    defaultComment: 'Document verified by HR.',
    code: 'OK',
  },
  REQUIRES_CORRECTION: {
    label: 'Request Correction',
    description: 'Return this evidence to the applicant with correction guidance.',
    className: 'border-orange-300 bg-orange-50 text-orange-950 hover:bg-orange-100',
    defaultComment: 'Document requires correction before eligibility can be calculated.',
    code: 'FIX',
  },
  REJECTED: {
    label: 'Reject Document',
    description: 'Reject this evidence when it does not satisfy verification requirements.',
    className: 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100',
    defaultComment: 'Document rejected by HR verification.',
    code: 'NO',
  },
};

const finalStatuses = new Set(['COMPLETED', 'REJECTED', 'NOT_RECOMMENDED', 'APPROVED', 'APPROVED_BY_AUTHORITY']);

function label(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function applicationCode(id: number) {
  return `PR-${String(id).padStart(5, '0')}`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function formatFileSize(value?: number | null) {
  if (!value) return 'Unknown size';
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function isQueueSegment(value: string | null): value is QueueSegment {
  return Boolean(value && queueSegments.includes(value as QueueSegment));
}

function queueMatches(request: PromotionRequest, segment: QueueSegment) {
  const docs = request.documents || [];
  const returned = docs.some((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus));

  if (segment === 'pending') return request.status === 'UNDER_HR_VERIFICATION';
  if (segment === 'returned') return request.status === 'RETURNED_FOR_CORRECTION' || returned;
  if (segment === 'committee') return request.status === 'UNDER_COMMITTEE_REVIEW';
  if (segment === 'completed') return finalStatuses.has(request.status) || request.status === 'RECOMMENDED';
  return true;
}

function documentCounts(request?: PromotionRequest | null) {
  const documents = request?.documents || [];
  return {
    total: documents.length,
    pending: documents.filter((document) => document.verificationStatus === 'PENDING').length,
    verified: documents.filter((document) => document.verificationStatus === 'VERIFIED').length,
    correction: documents.filter((document) => document.verificationStatus === 'REQUIRES_CORRECTION').length,
    rejected: documents.filter((document) => document.verificationStatus === 'REJECTED').length,
  };
}

function queueHealth(request: PromotionRequest) {
  const counts = documentCounts(request);

  if (counts.correction || counts.rejected || request.status === 'RETURNED_FOR_CORRECTION') {
    return { title: 'Applicant Action', detail: `${counts.correction + counts.rejected || 1} evidence issue(s) require correction or replacement.`, tone: 'warning' as const };
  }

  if (request.status === 'UNDER_HR_VERIFICATION') {
    return { title: 'HR Verification', detail: `${counts.pending} pending document(s) require HR decision.`, tone: 'primary' as const };
  }

  if (counts.pending > 0) {
    return { title: 'Awaiting Handoff', detail: 'Evidence is pending, but this application has not reached HR verification yet.', tone: 'slate' as const };
  }

  if (request.status === 'UNDER_COMMITTEE_REVIEW') {
    return { title: 'Committee Routed', detail: 'Required evidence is verified and the file is with committee.', tone: 'success' as const };
  }

  if (finalStatuses.has(request.status) || request.status === 'RECOMMENDED') {
    return { title: 'Final Stage', detail: 'This file is beyond active document verification.', tone: 'slate' as const };
  }

  return { title: 'Monitor', detail: 'No urgent HR verification issue detected.', tone: 'slate' as const };
}

export default function VerificationWorkspacePage() {
  const toast = useToast();
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [verificationComment, setVerificationComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [queueSegment, setQueueSegment] = useState<QueueSegment>('pending');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<VerificationDecision | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedRequest = requests.find((request) => request.id === selectedRequestId) || null;
  const selectedDocument = selectedRequest?.documents.find((document) => document.id === selectedDocumentId) || null;

  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      if (!queueMatches(request, queueSegment)) return false;
      if (!query) return true;

      return (
        request.lecturerName.toLowerCase().includes(query) ||
        request.lecturerEmail.toLowerCase().includes(query) ||
        request.department.toLowerCase().includes(query) ||
        request.targetRank.toLowerCase().includes(query) ||
        applicationCode(request.id).toLowerCase().includes(query)
      );
    });
  }, [requests, searchTerm, queueSegment]);

  const metrics = useMemo(() => {
    const documents = requests.flatMap((request) => request.documents || []);
    return {
      applications: requests.length,
      pending: documents.filter((document) => document.verificationStatus === 'PENDING').length,
      verified: documents.filter((document) => document.verificationStatus === 'VERIFIED').length,
      correction: documents.filter((document) => document.verificationStatus === 'REQUIRES_CORRECTION').length,
      rejected: documents.filter((document) => document.verificationStatus === 'REJECTED').length,
      committee: requests.filter((request) => request.status === 'UNDER_COMMITTEE_REVIEW').length,
    };
  }, [requests]);

  async function loadRequests(preferredRequestId?: number | null, preferredDocumentId?: number | null) {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const requestIdParam = params.get('requestId') || params.get('request');
      const targetRequestId = preferredRequestId || (requestIdParam ? Number(requestIdParam) : null);

      const response = await fetch('/api/promotion-requests?scope=hr', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load verification queue');
      }

      const allRequests = (payload.data || []) as PromotionRequest[];
      setRequests(allRequests);

      const nextRequest =
        allRequests.find((request) => request.id === targetRequestId) ||
        allRequests.find((request) => request.status === 'UNDER_HR_VERIFICATION') ||
        allRequests.find((request) => request.documents.some((document) => document.verificationStatus === 'PENDING')) ||
        allRequests[0] ||
        null;

      setSelectedRequestId(nextRequest?.id || null);

      const nextDocument = nextRequest
        ? nextRequest.documents.find((document) => document.id === preferredDocumentId && document.verificationStatus === 'PENDING') ||
          nextRequest.documents.find((document) => document.verificationStatus === 'PENDING') ||
          nextRequest.documents.find((document) => document.id === preferredDocumentId) ||
          nextRequest.documents[0] ||
          null
        : null;

      setSelectedDocumentId(nextDocument?.id || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search);
    const segmentParam = params?.get('segment') || null;

    if (isQueueSegment(segmentParam)) {
      setQueueSegment(segmentParam);
    }

    loadRequests();
  }, []);

  async function handleVerifyDocument(decision: VerificationDecision) {
    if (!selectedRequest || !selectedDocument) return;

    const comment = verificationComment.trim() || decisionConfig[decision].defaultComment;
    const confirmMessage = decision === 'VERIFIED'
      ? 'Verify this document and continue HR workflow processing?'
      : decision === 'REQUIRES_CORRECTION'
        ? 'Return this document to the lecturer for correction?'
        : 'Reject this document? This decision will be recorded in audit history.';

    if (!window.confirm(confirmMessage)) return;

    if ((decision === 'REQUIRES_CORRECTION' || decision === 'REJECTED') && comment.length < 8) {
      const message = 'Please provide a clear verification comment before returning or rejecting evidence.';
      setError(message);
      toast.warning('Verification comment required', message);
      return;
    }

    setVerifying(decision);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/promotion-requests/${selectedRequest.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: selectedDocument.id, verificationStatus: decision, comment }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Verification failed');
      }

      const routedMessage = payload.data?.status ? ` Application is now ${label(String(payload.data.status))}.` : '';
      const message = `${selectedDocument.title} marked as ${label(decision)}.${routedMessage}`;
      setMessage(message);
      toast.success('Document verification recorded', message);
      setVerificationComment('');
      await loadRequests(selectedRequest.id, selectedDocument.id);
    } catch (verifyError) {
      const message = verifyError instanceof Error ? verifyError.message : 'Verification failed';
      setError(message);
      toast.error('Verification failed', message);
    } finally {
      setVerifying(null);
    }
  }

  function selectRequest(request: PromotionRequest) {
    setSelectedRequestId(request.id);
    setSelectedDocumentId(request.documents.find((document) => document.verificationStatus === 'PENDING')?.id || request.documents[0]?.id || null);
    setVerificationComment('');
    setMessage('');
    setError('');
  }

  function selectDocument(document: DocumentItem) {
    setSelectedDocumentId(document.id);
    setVerificationComment(document.verificationComment || '');
    setMessage('');
    setError('');
  }

  if (loading && requests.length === 0) return <LoadingState label="Loading verification workspace..." />;
  if (error && requests.length === 0) return <ErrorState message={error} />;

  const selectedCounts = documentCounts(selectedRequest);
  const requiredCount = selectedRequest?.requiredDocumentCount || Math.min(3, selectedCounts.total);
  const readiness = requiredCount ? Math.round((selectedCounts.verified / requiredCount) * 100) : 0;
  const verificationDisabled = !selectedRequest || !selectedDocument || finalStatuses.has(selectedRequest.status) || selectedRequest.status !== 'UNDER_HR_VERIFICATION';

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <section className="relative overflow-hidden rounded-xl border border-brand-primary/15 bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-primary" aria-hidden="true" />
        <div className="relative z-10 flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">HR Document Verification</div>
            <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">Verification Workspace</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Verify promotion evidence, request corrections, reject invalid documents, and trigger eligibility routing only after required evidence is verified.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/hr/requests" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-primaryDark">Master Queue</a>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-6">
        <Metric code="AP" label="Applications" value={metrics.applications} tone="blue" />
        <Metric code="PD" label="Pending" value={metrics.pending} tone="amber" />
        <Metric code="VF" label="Verified" value={metrics.verified} tone="green" />
        <Metric code="CR" label="Corrections" value={metrics.correction} tone="orange" />
        <Metric code="RJ" label="Rejected" value={metrics.rejected} tone="rose" />
        <Metric code="CM" label="Committee" value={metrics.committee} tone="blue" />
      </section>

      {message && <div role="status" aria-live="polite" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</div>}
      {error && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}

      <section className="grid min-w-0 max-w-full gap-5 2xl:grid-cols-[minmax(19rem,0.82fr)_minmax(0,1.68fr)]">
        <aside className="pro-card min-w-0 overflow-hidden">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-950">Verification Queue</h2>
            <p className="mt-1 text-sm text-gray-600">Select an application and document to verify.</p>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search lecturer, email, department, PR code..."
                className="brand-input"
              />
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold sm:grid-cols-5 xl:grid-cols-2">
                <FilterButton active={queueSegment === 'pending'} onClick={() => setQueueSegment('pending')}>Pending</FilterButton>
                <FilterButton active={queueSegment === 'returned'} onClick={() => setQueueSegment('returned')}>Returned</FilterButton>
                <FilterButton active={queueSegment === 'committee'} onClick={() => setQueueSegment('committee')}>Committee</FilterButton>
                <FilterButton active={queueSegment === 'completed'} onClick={() => setQueueSegment('completed')}>Final</FilterButton>
                <FilterButton active={queueSegment === 'all'} onClick={() => setQueueSegment('all')}>All</FilterButton>
              </div>
            </div>
          </div>

          <div className="max-h-[72rem] overflow-y-auto">
            {filteredRequests.length === 0 ? (
              <div className="p-5"><EmptyState title="No matching applications" description="Adjust the queue segment or search term to find HR verification files." /></div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredRequests.map((request) => {
                  const counts = documentCounts(request);
                  const health = queueHealth(request);
                  return (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => selectRequest(request)}
                      className={`block w-full p-4 text-left transition hover:bg-gray-50 sm:p-5 ${selectedRequestId === request.id ? 'bg-brand-primarySoft' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{applicationCode(request.id)}</p>
                          <p className="mt-2 break-words font-semibold text-gray-950">{request.lecturerName}</p>
                          <p className="mt-1 break-words text-xs text-gray-500">{request.department}</p>
                          <p className="mt-1 text-xs font-medium text-gray-600">{label(request.currentRank)} to {label(request.targetRank)}</p>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-semibold text-gray-600">
                        <span className="rounded-lg bg-gray-100 px-2 py-1">Docs {counts.total}</span>
                        <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-900">Pending {counts.pending}</span>
                        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-800">Verified {counts.verified}</span>
                      </div>
                      <HealthPill title={health.title} detail={health.detail} tone={health.tone} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
          {!selectedRequest ? (
            <div className="pro-card p-6"><EmptyState title="Select an application" description="Choose an application from the verification queue to inspect its evidence." /></div>
          ) : (
            <PromotionApplicationDetail application={selectedRequest} role="HR_ADMIN">
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <div>
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-950">Evidence Register</h3>
                      <p className="mt-1 text-sm text-gray-600">Choose a document and record the HR decision.</p>
                    </div>
                    <span className="w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">{readiness}% ready</span>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {selectedRequest.documents.length === 0 ? (
                      <EmptyState title="No evidence attached" description="The applicant has not uploaded evidence for this request." />
                    ) : (
                      selectedRequest.documents.map((document) => (
                        <button
                          key={document.id}
                          type="button"
                          onClick={() => selectDocument(document)}
                          className={`w-full rounded-lg border p-3 text-left transition ${selectedDocumentId === document.id ? 'border-brand-primary bg-brand-primarySoft' : 'border-gray-200 bg-white hover:border-brand-primary/25 hover:bg-brand-primarySoft'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-950">{document.title}</p>
                              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label(document.category)}</p>
                              <p className="mt-1 text-xs text-gray-500">Uploaded {formatDate(document.uploadedAt)} | {formatFileSize(document.fileSize)}</p>
                            </div>
                            <StatusBadge status={document.verificationStatus || 'PENDING'} />
                          </div>
                          {document.verificationComment && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs leading-5 text-amber-950">{document.verificationComment}</p>}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-lg font-bold text-gray-950">Verification Decision</h3>
                  {selectedDocument ? (
                    <>
                      <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <p className="font-semibold text-gray-950">{selectedDocument.title}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label(selectedDocument.category)}</p>
                            <p className="mt-1 text-xs text-gray-500">{selectedDocument.fileName || 'Evidence file'} | {formatFileSize(selectedDocument.fileSize)}</p>
                          </div>
                          <StatusBadge status={selectedDocument.verificationStatus || 'PENDING'} />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <InfoTile label="Uploaded" value={formatDate(selectedDocument.uploadedAt)} />
                        <InfoTile label="Verified by" value={selectedDocument.verifiedBy?.name || 'Not verified'} />
                      </div>

                      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-950">
                        <p className="font-bold uppercase tracking-[0.14em] text-blue-800">Routing rule</p>
                        <p className="mt-1">When required evidence is verified, the system calculates eligibility and routes eligible applications to committee review automatically.</p>
                        {selectedDocument.fileUrl && (
                          <a href={selectedDocument.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-md border border-blue-200 bg-white px-2.5 py-1.5 font-semibold text-blue-800 hover:bg-blue-100">
                            Open source file
                          </a>
                        )}
                      </div>

                      <label className="mt-4 block text-sm font-semibold text-gray-800">
                        HR verification comment
                        <textarea
                          value={verificationComment}
                          onChange={(event) => setVerificationComment(event.target.value)}
                          placeholder="Record decision rationale, correction instructions, or verification note..."
                          className="brand-input mt-2 min-h-32"
                        />
                      </label>

                      <div className="mt-4 grid gap-3">
                        {(Object.keys(decisionConfig) as VerificationDecision[]).map((decision) => (
                          <button
                            key={decision}
                            type="button"
                            disabled={Boolean(verifying) || verificationDisabled}
                            onClick={() => handleVerifyDocument(decision)}
                            className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${decisionConfig[decision].className}`}
                          >
                            <span className="flex items-center justify-between gap-3">
                              <span>{verifying === decision ? 'Saving decision...' : decisionConfig[decision].label}</span>
                              <span className="rounded-md bg-white/50 px-2 py-1 text-[10px] font-black">{decisionConfig[decision].code}</span>
                            </span>
                            <span className="mt-1 block text-xs font-medium opacity-80">{decisionConfig[decision].description}</span>
                          </button>
                        ))}
                      </div>

                      {verificationDisabled && <p className="mt-3 text-xs font-medium text-gray-500">Verification decisions are enabled only while the application is under HR verification.</p>}
                    </>
                  ) : (
                    <EmptyState title="No document selected" description="Select evidence from the register to record an HR decision." />
                  )}
                </div>
              </div>
            </PromotionApplicationDetail>
          )}

          {selectedDocument?.fileUrl && (
            <section className="pro-card p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-950">Document Preview</h2>
                  <p className="mt-1 text-sm text-gray-600">{selectedDocument.title}</p>
                </div>
                <a href={selectedDocument.fileUrl} target="_blank" rel="noreferrer" className="w-fit rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50">Open in new tab</a>
              </div>
              <iframe title="Document preview" src={selectedDocument.fileUrl} className="mt-4 h-[640px] w-full rounded-xl border border-gray-200 bg-white" />
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ code, label, value, tone = 'blue' }: { code: string; label: string; value: number; tone?: 'teal' | 'amber' | 'rose' | 'green' | 'blue' | 'orange' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-900'
    : tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : tone === 'green'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : tone === 'blue'
          ? 'border-sky-200 bg-sky-50 text-sky-900'
          : tone === 'orange'
            ? 'border-orange-200 bg-orange-50 text-orange-900'
            : 'border-blue-200 bg-blue-50 text-blue-900';

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

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 transition ${active ? 'border-blue-700 bg-blue-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900'}`}
    >
      {children}
    </button>
  );
}

function HealthPill({ title, detail, tone }: { title: string; detail: string; tone: 'primary' | 'warning' | 'success' | 'slate' }) {
  const toneClass = tone === 'warning'
    ? 'border-amber-200 bg-amber-50 text-amber-950'
    : tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
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

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-950">{value}</p>
    </div>
  );
}
