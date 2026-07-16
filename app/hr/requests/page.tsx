'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '../../../components/promotion/StatusBadge';

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
  eligibilityReason?: string | null;
  documentCount: number;
};

const statuses = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_DEPARTMENT_REVIEW',
  'RETURNED_FOR_CORRECTION',
  'UNDER_HR_VERIFICATION',
  'UNDER_COMMITTEE_REVIEW',
  'REQUIRES_FURTHER_REVIEW',
  'RECOMMENDED',
  'NOT_RECOMMENDED',
  'APPROVED_BY_AUTHORITY',
  'COMPLETED',
];

export default function MasterQueuePage() {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PromotionRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/promotion-requests?scope=hr');
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load requests');
      }

      setRequests(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    let filtered = requests;

    if (statusFilter) {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.lecturerName.toLowerCase().includes(query) ||
          request.lecturerEmail.toLowerCase().includes(query) ||
          request.department.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  }, [requests, statusFilter, searchTerm]);

  async function updateStatus(requestId: number, status: string, comment: string) {
    setUpdatingId(requestId);
    setError('');

    try {
      const response = await fetch(`/api/promotion-requests/${requestId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comment }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to update status');
      }
      await loadRequests();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <div className="pro-card p-6 text-sm text-slate-600">Loading master queue...</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">{error}</div>;
  }

  const pendingCount = requests.filter((request) => ['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW', 'UNDER_HR_VERIFICATION'].includes(request.status)).length;
  const committeeCount = requests.filter((request) => request.status === 'UNDER_COMMITTEE_REVIEW').length;
  const completedCount = requests.filter((request) => ['APPROVED_BY_AUTHORITY', 'COMPLETED'].includes(request.status)).length;

  return (
    <div className="space-y-6">
      <section className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">Queue Management</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Master Queue</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Search, filter, verify, and advance promotion applications through each review stage from one reliable HR workspace.
            </p>
          </div>
          <a href="/hr/dashboard" className="inline-flex w-fit rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-teal-50">
            Back to dashboard
          </a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QueueMetric code="ALL" label="All requests" value={requests.length} />
        <QueueMetric code="ACT" label="Active HR work" value={pendingCount} tone="amber" />
        <QueueMetric code="COM" label="Committee review" value={committeeCount} />
        <QueueMetric code="FIN" label="Finalized" value={completedCount} tone="slate" />
      </section>

      <section className="pro-card p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_18rem_auto] lg:items-center">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Search</span>
            <input
              type="text"
              placeholder="Name, email, or department"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            Showing {filteredRequests.length} of {requests.length}
          </div>
        </div>
      </section>

      <section className="pro-card overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Promotion Requests</h2>
            <p className="mt-1 text-sm text-slate-600">Use the workflow actions only after evidence and eligibility checks are complete.</p>
          </div>
          <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {filteredRequests.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-5 py-3">Lecturer</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Promotion</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Eligibility</th>
                <th className="px-5 py-3">Docs</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-600">
                    No requests found for the current filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-950">{request.lecturerName}</div>
                      <div className="text-xs text-slate-500">{request.lecturerEmail}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{request.department}</td>
                    <td className="px-5 py-4 font-medium text-slate-700">{request.currentRank} to {request.targetRank}</td>
                    <td className="px-5 py-4"><StatusBadge status={request.status} /></td>
                    <td className="px-5 py-4">
                      <StatusBadge status={request.eligibilityStatus} />
                      {request.eligibilityReason && <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">{request.eligibilityReason}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="pro-code-badge">{request.documentCount}</span>
                    </td>
                    <td className="px-5 py-4">
                      <a href={`/hr/verify?requestId=${request.id}`} className="font-semibold text-teal-700 hover:text-teal-900">Review</a>
                      <WorkflowActions request={request} updating={updatingId === request.id} onUpdate={updateStatus} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <GuidanceCard code="QA" title="Queue Discipline" items={["Find lecturers quickly with search", "Filter by status before bulk review sessions", "Open Review before advancing a workflow stage"]} />
        <GuidanceCard code="HR" title="Verification Standards" items={["Verify documents on a regular schedule", "Record comments for rejected evidence", "Use audit logs for compliance follow-up"]} />
      </section>
    </div>
  );
}

function QueueMetric({ code, label, value, tone = 'teal' }: { code: string; label: string; value: number; tone?: 'teal' | 'amber' | 'slate' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : tone === 'slate'
      ? 'border-slate-200 bg-slate-100 text-slate-700'
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

function GuidanceCard({ code, title, items }: { code: string; title: string; items: string[] }) {
  return (
    <div className="pro-card p-5">
      <div className="flex items-center gap-3">
        <span className="pro-code-badge">{code}</span>
        <h3 className="font-semibold text-slate-950">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function WorkflowActions({
  request,
  updating,
  onUpdate,
}: {
  request: PromotionRequest;
  updating: boolean;
  onUpdate: (requestId: number, status: string, comment: string) => void;
}) {
  const actions: Array<{ status: string; label: string; comment: string }> = [];

  if (request.status === 'SUBMITTED') {
    actions.push({ status: 'UNDER_DEPARTMENT_REVIEW', label: 'Dept review', comment: 'Application moved to department review.' });
  }

  if (request.status === 'UNDER_DEPARTMENT_REVIEW') {
    actions.push({ status: 'UNDER_HR_VERIFICATION', label: 'To HR', comment: 'Application forwarded for HR verification.' });
  }

  if (request.status === 'UNDER_HR_VERIFICATION' && request.eligibilityStatus !== 'INCOMPLETE_APPLICATION') {
    actions.push({ status: 'UNDER_COMMITTEE_REVIEW', label: 'To committee', comment: 'Application forwarded to committee review after HR verification.' });
  }

  if (request.status === 'RECOMMENDED') {
    actions.push({ status: 'APPROVED_BY_AUTHORITY', label: 'Authority approved', comment: 'Final administrative authority approved the recommendation.' });
  }

  if (request.status === 'APPROVED_BY_AUTHORITY' || request.status === 'NOT_RECOMMENDED') {
    actions.push({ status: 'COMPLETED', label: 'Complete', comment: 'Application workflow completed.' });
  }

  if (actions.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.status}
          type="button"
          disabled={updating}
          onClick={() => onUpdate(request.id, action.status, action.comment)}
          className="rounded-lg border border-teal-200 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50 disabled:border-slate-200 disabled:text-slate-400"
        >
          {updating ? 'Updating...' : action.label}
        </button>
      ))}
    </div>
  );
}

function formatLabel(value: string) {
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}