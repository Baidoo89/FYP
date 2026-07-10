'use client';

import { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../../../components/promotion/StatusBadge';

type DocumentItem = {
  id: number;
  title: string;
  category: string;
  fileUrl: string;
  verificationStatus: string;
  verificationComment: string | null;
};

type PromotionRequest = {
  id: number;
  lecturerName: string;
  lecturerEmail: string;
  department: string;
  currentRank: string;
  targetRank: string;
  yearsInCurrentRank: number;
  status: string;
  totalScore: number | null;
  eligibilityStatus: string;
  eligibilityReason: string | null;
  adminComment: string | null;
  documents: DocumentItem[];
};

const recommendationOptions = [
  { value: 'RECOMMENDED', label: 'Recommended' },
  { value: 'NOT_RECOMMENDED', label: 'Not Recommended' },
  { value: 'REQUIRES_FURTHER_REVIEW', label: 'Requires Further Review' },
];

function label(value: string) {
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function CommitteeReviewPage() {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState('RECOMMENDED');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const selectedRequest = requests.find((request) => request.id === selectedId) || null;
  const visibleRequests = useMemo(
    () => requests.filter((request) => ['UNDER_COMMITTEE_REVIEW', 'RECOMMENDED', 'NOT_RECOMMENDED', 'REQUIRES_FURTHER_REVIEW'].includes(request.status)),
    [requests]
  );

  async function loadRequests() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/promotion-requests?scope=hr');
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load committee applications');
      }
      const allRequests = payload.data || [];
      setRequests(allRequests);
      const firstReview = allRequests.find((request: PromotionRequest) => request.status === 'UNDER_COMMITTEE_REVIEW') || allRequests[0];
      setSelectedId(firstReview?.id || null);
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
        throw new Error(payload.error || 'Unable to save review');
      }
      setMessage('Committee review saved successfully.');
      setComment('');
      await loadRequests();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to save review');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="pro-card p-6 text-sm text-slate-600">Loading committee review workspace...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="pro-hero px-6 py-7">
        <div className="pro-eyebrow">Committee Review</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Application Review Board</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Review verified promotion applications, consider eligibility recommendations, and record committee recommendations without changing applicant evidence.
        </p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {message && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div>}

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.45fr]">
        <div className="pro-card overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-950">Review Queue</h2>
            <p className="mt-1 text-sm text-slate-600">{visibleRequests.length} application(s) available.</p>
          </div>
          {visibleRequests.length === 0 ? (
            <div className="p-5 text-sm text-slate-600">No applications are currently under committee review.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleRequests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setSelectedId(request.id)}
                  className={`block w-full p-5 text-left hover:bg-slate-50 ${selectedId === request.id ? 'bg-teal-50' : ''}`}
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-semibold text-slate-950">{request.lecturerName}</p>
                      <p className="mt-1 text-sm text-slate-600">{request.department}</p>
                      <p className="mt-1 text-xs text-slate-500">{request.currentRank} to {request.targetRank}</p>
                    </div>
                    <StatusBadge status={request.status} label={label(request.status)} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {!selectedRequest ? (
            <div className="pro-card p-6 text-sm text-slate-600">Select an application to review.</div>
          ) : (
            <>
              <div className="pro-card p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">{selectedRequest.lecturerName}</h2>
                    <p className="mt-1 text-sm text-slate-600">{selectedRequest.lecturerEmail}</p>
                    <p className="mt-1 text-sm text-slate-600">{selectedRequest.department}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={selectedRequest.status} label={label(selectedRequest.status)} />
                    <StatusBadge status={selectedRequest.eligibilityStatus} label={label(selectedRequest.eligibilityStatus)} />
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Metric label="Promotion path" value={`${selectedRequest.currentRank} to ${selectedRequest.targetRank}`} />
                  <Metric label="Years in rank" value={selectedRequest.yearsInCurrentRank} />
                  <Metric label="Total score" value={selectedRequest.totalScore ?? 'Not scored'} />
                </div>
                <div className="mt-5 rounded border border-slate-200 bg-blue-50 p-4 text-sm text-blue-950">
                  <p className="font-semibold">Eligibility recommendation</p>
                  <p className="mt-1 leading-6">{selectedRequest.eligibilityReason || 'Eligibility recommendation has not been calculated yet.'}</p>
                </div>
              </div>

              <div className="pro-card p-5">
                <h3 className="text-lg font-bold text-slate-950">Verified Evidence</h3>
                <div className="mt-4 grid gap-3">
                  {selectedRequest.documents.length === 0 ? (
                    <p className="text-sm text-slate-600">No evidence documents attached.</p>
                  ) : (
                    selectedRequest.documents.map((document) => (
                      <div key={document.id} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                          <div>
                            <p className="font-semibold text-slate-950">{document.title}</p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label(document.category)}</p>
                            {document.verificationComment && <p className="mt-2 text-sm text-slate-600">{document.verificationComment}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={document.verificationStatus} label={label(document.verificationStatus)} />
                            <a href={document.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50">
                              Open
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <form onSubmit={submitReview} className="pro-card p-5">
                <h3 className="text-lg font-bold text-slate-950">Committee Recommendation</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-[0.75fr_1.25fr]">
                  <label className="block text-sm font-semibold text-slate-800">
                    Recommendation
                    <select value={recommendation} onChange={(event) => setRecommendation(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                      {recommendationOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-slate-800">
                    Review comment
                    <textarea value={comment} onChange={(event) => setComment(event.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" placeholder="Record committee observations and rationale..." required />
                  </label>
                </div>
                <button type="submit" disabled={saving || selectedRequest.status !== 'UNDER_COMMITTEE_REVIEW'} className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-slate-400">
                  {saving ? 'Saving review...' : 'Save committee review'}
                </button>
                {selectedRequest.status !== 'UNDER_COMMITTEE_REVIEW' && (
                  <p className="mt-2 text-xs text-slate-500">This application is not currently open for committee recommendation changes.</p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="pro-tile p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}
