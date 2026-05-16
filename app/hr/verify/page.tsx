'use client';

import { useEffect, useMemo, useState } from 'react';

type Document = {
  id: number;
  title: string;
  category: 'RESEARCH' | 'TEACHING' | 'SERVICE';
  fileUrl: string;
  verificationStatus: string;
  verifiedById: number | null;
  verificationComment: string | null;
  uploadedAt: string;
};

type PromotionRequest = {
  id: number;
  lecturerName: string;
  lecturerEmail: string;
  department: string;
  currentRank: string;
  targetRank: string;
  status: string;
  submittedAt: string | null;
  verifiedAt: string | null;
  totalScore: number | null;
  eligibilityStatus: string;
  adminComment: string | null;
  documents: Document[];
};

export default function VerificationWorkspacePage() {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState('');
  const [verificationComment, setVerificationComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedRequest = requests.find((r) => r.id === selectedRequestId) || null;

  const selectedDocument =
    selectedRequest?.documents.find((d) => d.id === selectedDocumentId) || null;

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      setError('');

      try {
        // Parse requestId from URL params
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const requestIdParam = params.get('requestId');

        // Load ALL requests (not just UNDER_REVIEW) so Review link works from any status
        const response = await fetch('/api/promotion-requests?scope=hr');
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load requests');
        }

        const allRequests = payload.data || [];
        setRequests(allRequests);

        if (requestIdParam) {
          const matchingRequest = allRequests.find((r: any) => r.id === Number(requestIdParam));
          if (matchingRequest) {
            setSelectedRequestId(matchingRequest.id);
            if (matchingRequest.documents && matchingRequest.documents.length > 0) {
              setSelectedDocumentId(matchingRequest.documents[0].id);
              setSelectedFileUrl(matchingRequest.documents[0].fileUrl);
            }
          }
        } else if (allRequests.length > 0) {
          setSelectedRequestId(allRequests[0].id);
          if (allRequests[0].documents && allRequests[0].documents.length > 0) {
            setSelectedDocumentId(allRequests[0].documents[0].id);
            setSelectedFileUrl(allRequests[0].documents[0].fileUrl);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const handleVerifyDocument = async (verificationStatus: 'VERIFIED' | 'REJECTED') => {
    if (!selectedRequest || !selectedDocument) {
      return;
    }

    setVerifying(true);
    setMessage('');

    try {
      const response = await fetch(`/api/promotion-requests/${selectedRequest.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          verificationStatus,
          comment: verificationComment,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Verification failed');
      }

      setMessage(`Document ${verificationStatus.toLowerCase()} successfully`);
      setVerificationComment('');

      // Reload requests
      const reloadResponse = await fetch('/api/promotion-requests?scope=hr');
      const reloadPayload = await reloadResponse.json();
      if (reloadPayload.success) {
        setRequests(reloadPayload.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
        Loading Verification Workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-slate-950 via-blue-900 to-blue-800 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-yellow-100">
              Document Verification
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Verification Workspace</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/90">
              Review promotion documents, verify eligibility, and provide feedback to lecturers.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/hr/requests"
              className="rounded-xl border border-blue-400 bg-transparent px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              ← Back
            </a>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-950">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-950">
          {error}
        </div>
      )}

      {/* Main Layout: Requests List + Verification Panel */}
      <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Left: Requests List */}
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Pending Requests</h2>
          <p className="mt-1 text-sm text-slate-600">Select a request to begin verification</p>

          <div className="mt-4 space-y-2">
            {requests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
                No requests to verify
              </div>
            ) : (
              requests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => {
                    setSelectedRequestId(request.id);
                    if (request.documents && request.documents.length > 0) {
                      setSelectedDocumentId(request.documents[0].id);
                      setSelectedFileUrl(request.documents[0].fileUrl);
                    }
                  }}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    selectedRequestId === request.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900">{request.lecturerName}</div>
                  <div className="text-xs text-slate-500">{request.department}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">
                      {request.currentRank} → {request.targetRank}
                    </span>
                    <span className="text-xs font-semibold text-blue-700">
                      {request.documents.length} docs
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Verification Panel */}
        <div className="space-y-4">
          {selectedRequest ? (
            <>
              {/* Request Info */}
              <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedRequest.lecturerName}</h2>
                    <p className="text-sm text-slate-600">{selectedRequest.lecturerEmail}</p>
                    <p className="mt-1 text-xs text-slate-500">{selectedRequest.department}</p>
                  </div>
                  <StatusBadge status={selectedRequest.status} />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <InfoTile label="Current Rank" value={selectedRequest.currentRank} />
                  <InfoTile label="Target Rank" value={selectedRequest.targetRank} />
                  <InfoTile label="Status" value={selectedRequest.eligibilityStatus} />
                  <InfoTile label="Score" value={selectedRequest.totalScore ? `${selectedRequest.totalScore}%` : 'N/A'} />
                </div>
              </div>

              {/* Documents List */}
              <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Documents</h3>
                <div className="mt-4 space-y-2">
                  {selectedRequest.documents.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => {
                        setSelectedDocumentId(doc.id);
                        setSelectedFileUrl(doc.fileUrl);
                        setVerificationComment('');
                      }}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${
                        selectedDocumentId === doc.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{doc.title}</div>
                          <div className="text-xs text-slate-500">{doc.category}</div>
                        </div>
                        <VerificationStatusBadge status={doc.verificationStatus} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Verification Form */}
              {selectedDocument && (
                <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-yellow-950">Verification Form</h3>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-slate-700">
                      Verification Comment
                    </label>
                    <textarea
                      value={verificationComment}
                      onChange={(e) => setVerificationComment(e.target.value)}
                      placeholder="Add any comments or feedback for the lecturer..."
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      rows={4}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleVerifyDocument('VERIFIED')}
                      disabled={verifying}
                      className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                      {verifying ? 'Processing...' : '✅ Verify Document'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyDocument('REJECTED')}
                      disabled={verifying}
                      className="rounded-xl bg-yellow-500 px-6 py-3 font-semibold text-blue-950 hover:bg-yellow-400 disabled:opacity-50"
                    >
                      {verifying ? 'Processing...' : '❌ Reject Document'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
              <div className="text-slate-600">
                <p className="text-lg font-semibold">No Request Selected</p>
                <p className="mt-1 text-sm">Select a request from the left panel to begin verification</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PDF Preview Section */}
      {selectedFileUrl && (
        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">📄 Document Preview</h2>
          <iframe
            title="Document preview"
            src={selectedFileUrl}
            className="h-[600px] w-full rounded-xl border border-slate-200"
          />
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT: { bg: 'bg-blue-100', text: 'text-blue-900', label: 'Draft' },
    SUBMITTED: { bg: 'bg-yellow-100', text: 'text-yellow-900', label: 'Submitted' },
    UNDER_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-900', label: 'Under Review' },
    APPROVED: { bg: 'bg-blue-950', text: 'text-white', label: 'Approved' },
    REJECTED: { bg: 'bg-yellow-100', text: 'text-yellow-900', label: 'Rejected' },
  };

  const config = statusConfig[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: status };

  return (
    <span className={`rounded-full ${config.bg} ${config.text} px-3 py-1 text-xs font-semibold`}>
      {config.label}
    </span>
  );
}

function VerificationStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: string }> = {
    PENDING: { bg: 'bg-blue-100', text: 'text-blue-900', icon: '⏳' },
    VERIFIED: { bg: 'bg-yellow-100', text: 'text-yellow-900', icon: '✅' },
    REJECTED: { bg: 'bg-blue-950', text: 'text-white', icon: '❌' },
  };

  const c = config[status] || config.PENDING;

  return (
    <span className={`rounded-full ${c.bg} ${c.text} px-3 py-1 text-xs font-semibold`}>
      {c.icon} {status}
    </span>
  );
}

function InfoTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-900">{value}</div>
    </div>
  );
}
