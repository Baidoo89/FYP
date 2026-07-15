'use client';

import { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../../../components/promotion/StatusBadge';
import PromotionApplicationDetail, { type PromotionApplicationDetailRecord } from '../../../components/promotion/PromotionApplicationDetail';

type DocumentItem = {
  id: number;
  title: string;
  category: string;
  fileUrl: string;
  verificationStatus: string;
  verifiedById: number | null;
  verificationComment: string | null;
  uploadedAt: string;
};

type PromotionRequest = PromotionApplicationDetailRecord & {
  submittedAt: string | null;
  verifiedAt: string | null;
  documents: DocumentItem[];
};

type VerificationDecision = 'VERIFIED' | 'REQUIRES_CORRECTION' | 'REJECTED';

const decisionConfig: Record<VerificationDecision, { label: string; description: string; buttonClass: string; defaultComment: string }> = {
  VERIFIED: {
    label: 'Verify Document',
    description: 'Approve this evidence as valid for eligibility calculation.',
    buttonClass: 'bg-teal-700 text-white hover:bg-teal-800',
    defaultComment: 'Document verified by HR.',
  },
  REQUIRES_CORRECTION: {
    label: 'Request Correction',
    description: 'Return this evidence for lecturer correction without final rejection.',
    buttonClass: 'border border-orange-300 bg-orange-50 text-orange-950 hover:bg-orange-100',
    defaultComment: 'Document requires correction before eligibility can be calculated.',
  },
  REJECTED: {
    label: 'Reject Document',
    description: 'Reject this evidence because it does not satisfy verification requirements.',
    buttonClass: 'border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100',
    defaultComment: 'Document rejected by HR verification.',
  },
};

function label(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function VerificationWorkspacePage() {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [verificationComment, setVerificationComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [queueFilter, setQueueFilter] = useState<'all' | 'pending' | 'returned' | 'committee'>('pending');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<VerificationDecision | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedRequest = requests.find((request) => request.id === selectedRequestId) || null;
  const selectedDocument = selectedRequest?.documents.find((document) => document.id === selectedDocumentId) || null;

  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      const hasPendingDocument = request.documents.some((document) => document.verificationStatus === 'PENDING');
      const hasReturnedDocument = request.documents.some((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus));
      const matchesFilter =
        queueFilter === 'all' ||
        (queueFilter === 'pending' && (request.status === 'UNDER_HR_VERIFICATION' || hasPendingDocument)) ||
        (queueFilter === 'returned' && (request.status === 'RETURNED_FOR_CORRECTION' || hasReturnedDocument)) ||
        (queueFilter === 'committee' && request.status === 'UNDER_COMMITTEE_REVIEW');

      if (!matchesFilter) return false;
      if (!query) return true;

      return (
        request.lecturerName.toLowerCase().includes(query) ||
        request.lecturerEmail.toLowerCase().includes(query) ||
        request.department.toLowerCase().includes(query) ||
        request.targetRank.toLowerCase().includes(query)
      );
    });
  }, [requests, searchTerm, queueFilter]);

  const metrics = useMemo(() => {
    const documents = requests.flatMap((request) => request.documents || []);
    return {
      applications: requests.length,
      pending: documents.filter((document) => document.verificationStatus === 'PENDING').length,
      verified: documents.filter((document) => document.verificationStatus === 'VERIFIED').length,
      returned: documents.filter((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus)).length,
    };
  }, [requests]);

  async function loadRequests(preferredRequestId?: number | null, preferredDocumentId?: number | null) {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const requestIdParam = params.get('requestId');
      const targetRequestId = preferredRequestId || (requestIdParam ? Number(requestIdParam) : null);

      const response = await fetch('/api/promotion-requests?scope=hr');
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
        ? nextRequest.documents.find((document) => document.id === preferredDocumentId) ||
          nextRequest.documents.find((document) => document.verificationStatus === 'PENDING') ||
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
    loadRequests();
  }, []);

  async function handleVerifyDocument(decision: VerificationDecision) {
    if (!selectedRequest || !selectedDocument) return;

    const comment = verificationComment.trim() || decisionConfig[decision].defaultComment;

    if ((decision === 'REQUIRES_CORRECTION' || decision === 'REJECTED') && comment.length < 8) {
      setError('Please provide a clear verification comment before returning or rejecting evidence.');
      return;
    }

    setVerifying(decision);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/promotion-requests/${selectedRequest.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          verificationStatus: decision,
          comment,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Verification failed');
      }

      setMessage(`${selectedDocument.title} marked as ${label(decision)}.`);
      setVerificationComment('');
      await loadRequests(selectedRequest.id, selectedDocument.id);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Verification failed');
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

  if (loading) {
    return <div className="pro-card p-6 text-sm text-slate-600">Loading verification workspace...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="pro-hero px-6 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">HR Document Verification</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Verification Workspace</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Verify promotion evidence, request corrections, reject invalid documents, and trigger eligibility routing only after required evidence is verified.
            </p>
          </div>
          <a href="/hr/requests" className="inline-flex w-fit rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-teal-50">
            Master queue
          </a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric code="AP" label="Applications" value={metrics.applications} />
        <Metric code="PD" label="Pending documents" value={metrics.pending} tone="amber" />
        <Metric code="VF" label="Verified documents" value={metrics.verified} />
        <Metric code="RT" label="Returned/rejected" value={metrics.returned} tone="rose" />
      </section>

      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</div>}
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.68fr]">
        <aside className="pro-card overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-950">Verification Queue</h2>
            <p className="mt-1 text-sm text-slate-600">Select an application and document to verify.</p>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search lecturer, email, department..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold sm:grid-cols-4 xl:grid-cols-2">
                <FilterButton active={queueFilter === 'pending'} onClick={() => setQueueFilter('pending')}>Pending</FilterButton>
                <FilterButton active={queueFilter === 'returned'} onClick={() => setQueueFilter('returned')}>Returned</FilterButton>
                <FilterButton active={queueFilter === 'committee'} onClick={() => setQueueFilter('committee')}>Committee</FilterButton>
                <FilterButton active={queueFilter === 'all'} onClick={() => setQueueFilter('all')}>All</FilterButton>
              </div>
            </div>
          </div>

          <div className="max-h-[58rem] overflow-y-auto">
            {filteredRequests.length === 0 ? (
              <div className="p-5 text-sm text-slate-600">No applications match the current queue filter.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredRequests.map((request) => {
                  const pendingDocs = request.documents.filter((document) => document.verificationStatus === 'PENDING').length;
                  return (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => selectRequest(request)}
                      className={`block w-full p-5 text-left transition hover:bg-slate-50 ${selectedRequestId === request.id ? 'bg-teal-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">{request.lecturerName}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{request.department}</p>
                          <p className="mt-1 text-xs font-medium text-slate-600">{request.currentRank} to {request.targetRank}</p>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold">{request.documents.length} docs</span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-900">{pendingDocs} pending</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <div className="space-y-6">
          {!selectedRequest ? (
            <div className="pro-card p-8 text-center text-sm text-slate-600">Select an application from the verification queue.</div>
          ) : (
            <PromotionApplicationDetail application={selectedRequest} role="HR_ADMIN">
              <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Selected Evidence</h3>
                  <p className="mt-1 text-sm text-slate-600">Choose a document from this application and record the HR decision.</p>
                  <div className="mt-4 space-y-2">
                    {selectedRequest.documents.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No evidence documents attached.</div>
                    ) : (
                      selectedRequest.documents.map((document) => (
                        <button
                          key={document.id}
                          type="button"
                          onClick={() => {
                            setSelectedDocumentId(document.id);
                            setVerificationComment(document.verificationComment || '');
                          }}
                          className={`w-full rounded-lg border p-3 text-left transition ${selectedDocumentId === document.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white hover:border-teal-200'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-950">{document.title}</p>
                              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label(document.category)}</p>
                            </div>
                            <StatusBadge status={document.verificationStatus || 'PENDING'} />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-lg font-bold text-slate-950">Verification Decision</h3>
                  {selectedDocument ? (
                    <>
                      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                        <p className="font-semibold text-slate-950">{selectedDocument.title}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label(selectedDocument.category)}</p>
                        <div className="mt-3"><StatusBadge status={selectedDocument.verificationStatus || 'PENDING'} /></div>
                      </div>

                      <label className="mt-4 block text-sm font-semibold text-slate-800">
                        HR verification comment
                        <textarea
                          value={verificationComment}
                          onChange={(event) => setVerificationComment(event.target.value)}
                          placeholder="Record decision rationale, correction instructions, or verification note..."
                          className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        />
                      </label>

                      <div className="mt-4 grid gap-3">
                        {(Object.keys(decisionConfig) as VerificationDecision[]).map((decision) => (
                          <button
                            key={decision}
                            type="button"
                            disabled={Boolean(verifying)}
                            onClick={() => handleVerifyDocument(decision)}
                            className={`rounded-lg px-4 py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${decisionConfig[decision].buttonClass}`}
                          >
                            <span className="block">{verifying === decision ? 'Saving decision...' : decisionConfig[decision].label}</span>
                            <span className="mt-1 block text-xs font-medium opacity-80">{decisionConfig[decision].description}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-slate-600">Select a document to begin verification.</p>
                  )}
                </div>
              </div>
            </PromotionApplicationDetail>
          )}

          {selectedDocument?.fileUrl && (
            <section className="pro-card p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Document Preview</h2>
                  <p className="mt-1 text-sm text-slate-600">{selectedDocument.title}</p>
                </div>
                <a href={selectedDocument.fileUrl} target="_blank" rel="noreferrer" className="w-fit rounded-lg border border-teal-200 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">
                  Open in new tab
                </a>
              </div>
              <iframe title="Document preview" src={selectedDocument.fileUrl} className="mt-4 h-[640px] w-full rounded-xl border border-slate-200 bg-white" />
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ code, label, value, tone = 'teal' }: { code: string; label: string; value: number; tone?: 'teal' | 'amber' | 'rose' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-teal-200 bg-teal-50 text-teal-800';

  return (
    <div className="pro-tile p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-bold ${toneClass}`}>{code}</span>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 transition ${active ? 'border-teal-600 bg-teal-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
    >
      {children}
    </button>
  );
}
