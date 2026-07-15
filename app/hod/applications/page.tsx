'use client';

import { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../../../components/promotion/StatusBadge';
import PromotionApplicationDetail, { type PromotionApplicationDetailRecord } from '../../../components/promotion/PromotionApplicationDetail';

type PromotionRequest = PromotionApplicationDetailRecord;

function label(value: string) {
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function HodApplicationsPage() {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const reviewRequests = useMemo(
    () => requests.filter((request) => ['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW', 'RETURNED_FOR_CORRECTION', 'REQUIRES_FURTHER_REVIEW'].includes(request.status)),
    [requests]
  );
  const selectedRequest = reviewRequests.find((request) => request.id === selectedId) || null;

  async function loadRequests() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/promotion-requests?scope=hr');
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load department applications');
      }
      const allRequests = payload.data || [];
      setRequests(allRequests);
      const first = allRequests.find((request: PromotionRequest) => request.status === 'UNDER_DEPARTMENT_REVIEW') || allRequests[0];
      setSelectedId(first?.id || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load department applications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function updateStatus(status: string) {
    if (!selectedRequest) return;
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const decision = status === 'UNDER_HR_VERIFICATION' ? 'FORWARD_TO_HR' : 'RETURN_FOR_CORRECTION';
      const response = await fetch(`/api/promotion-requests/${selectedRequest.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          comment: comment || (status === 'UNDER_HR_VERIFICATION' ? 'Department review completed and forwarded to HR.' : 'Returned by department reviewer for correction.'),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to update application status');
      }
      setMessage('Department review action saved.');
      setComment('');
      await loadRequests();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update application status');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="pro-card p-6 text-sm text-slate-600">Loading department applications...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="pro-hero px-6 py-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-100">HOD / Dean Review</p>
        <h1 className="mt-3 text-3xl font-bold">Department Applications</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Review academic applications, record department comments, return incomplete submissions, and forward complete files to HR verification.
        </p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {message && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.7fr]">
        <div className="pro-card overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-950">Department Queue</h2>
            <p className="mt-1 text-sm text-slate-600">{reviewRequests.length} application(s) need department attention.</p>
          </div>
          {reviewRequests.length === 0 ? (
            <div className="p-5 text-sm text-slate-600">No department-stage applications are available.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reviewRequests.map((request) => (
                <button key={request.id} type="button" onClick={() => setSelectedId(request.id)} className={`block w-full p-5 text-left hover:bg-slate-50 ${selectedId === request.id ? 'bg-slate-50' : ''}`}>
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

        {!selectedRequest ? (
          <div className="pro-card p-6 text-sm text-slate-600">Select an application for department review.</div>
        ) : (
          <PromotionApplicationDetail application={selectedRequest} role="HOD_DEAN">
            <h3 className="text-lg font-bold text-slate-950">Department Review Action</h3>
            <label className="mt-4 block text-sm font-semibold text-slate-800">
              Department review comment
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} className="brand-input mt-1 min-h-28" placeholder="Record department recommendation or correction request..." />
            </label>

            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" disabled={saving || !['UNDER_DEPARTMENT_REVIEW', 'SUBMITTED'].includes(selectedRequest.status)} onClick={() => updateStatus('UNDER_HR_VERIFICATION')} className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-slate-400">
                {saving ? 'Saving...' : 'Forward to HR'}
              </button>
              <button type="button" disabled={saving || !['UNDER_DEPARTMENT_REVIEW', 'SUBMITTED'].includes(selectedRequest.status)} onClick={() => updateStatus('RETURNED_FOR_CORRECTION')} className="rounded border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-950 hover:bg-orange-100 disabled:text-slate-400">
                Return for correction
              </button>
            </div>
          </PromotionApplicationDetail>
        )}
      </div>
    </section>
  );
}
