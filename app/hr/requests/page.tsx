'use client';

import { useEffect, useState } from 'react';

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
  documentCount: number;
};

export default function MasterQueuePage() {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PromotionRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

    loadRequests();
  }, []);

  useEffect(() => {
    let filtered = requests;

    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.lecturerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.lecturerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [requests, statusFilter, searchTerm]);

  const statuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
        Loading Master Queue...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-950 shadow-sm">
        {error}
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
              Queue Management
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Master Queue</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/90">
              View and manage all promotion requests with advanced filtering and search capabilities.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/hr/dashboard"
              className="rounded-xl border border-blue-400 bg-transparent px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              ← Back
            </a>
          </div>
        </div>
      </section>

      {/* Statistics Badges */}
      <section className="flex flex-wrap gap-2">
        <div className="rounded-xl bg-blue-50 px-4 py-2">
          <span className="text-sm font-semibold text-blue-900">Total: {requests.length}</span>
        </div>
        {statuses.map((status) => {
          const count = requests.filter((r) => r.status === status).length;
          return (
            <div key={status} className="rounded-xl bg-yellow-50 px-4 py-2">
              <span className="text-sm font-semibold text-yellow-900">
                {status}: {count}
              </span>
            </div>
          );
        })}
      </section>

      {/* Filters and Search */}
      <section className="grid gap-4 lg:grid-cols-3">
        <input
          type="text"
          placeholder="Search by name, email, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder-slate-500 shadow-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm"
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <div className="text-right">
          <span className="text-sm font-semibold text-slate-600">
            Showing {filteredRequests.length} of {requests.length}
          </span>
        </div>
      </section>

      {/* Requests Table */}
      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-600">
              <tr>
                <th className="px-6 py-4">Lecturer</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Promotion</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Eligibility</th>
                <th className="px-6 py-4">Docs</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-600">
                    No requests found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="border-t border-slate-100 hover:bg-blue-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{request.lecturerName}</div>
                      <div className="text-xs text-slate-500">{request.lecturerEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{request.department}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {request.currentRank} → {request.targetRank}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={request.eligibilityStatus} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {request.documentCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`/hr/verify?requestId=${request.id}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Review
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredRequests.length > 0 && (
          <div className="mt-4 text-right text-xs text-slate-500">
            Total records: {filteredRequests.length}
          </div>
        )}
      </section>

      {/* Info Cards */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900">📋 Quick Tips</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>• Use search to quickly find lecturers</li>
            <li>• Filter by status to focus on specific requests</li>
            <li>• Click Review to access the verification workspace</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-6 shadow-sm">
          <h3 className="font-semibold text-yellow-950">✅ Best Practices</h3>
          <ul className="mt-3 space-y-2 text-sm text-yellow-900">
            <li>• Verify documents regularly to stay on schedule</li>
            <li>• Add comments for rejected documents</li>
            <li>• Review audit logs for compliance tracking</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT: { bg: 'bg-blue-100', text: 'text-blue-900', label: 'Draft' },
    SUBMITTED: { bg: 'bg-yellow-100', text: 'text-yellow-900', label: 'Submitted' },
    UNDER_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-900', label: 'Under Review' },
    APPROVED: { bg: 'bg-blue-950', text: 'text-white', label: 'Approved' },
    REJECTED: { bg: 'bg-blue-900', text: 'text-white', label: 'Rejected' },
    ELIGIBLE: { bg: 'bg-yellow-100', text: 'text-yellow-900', label: 'Eligible' },
    NOT_ELIGIBLE: { bg: 'bg-blue-100', text: 'text-blue-900', label: 'Not Eligible' },
    PENDING_REVIEW: { bg: 'bg-yellow-100', text: 'text-yellow-900', label: 'Pending' },
  };

  const config = statusConfig[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: status };

  return (
    <span className={`rounded-full ${config.bg} ${config.text} px-3 py-1 text-xs font-semibold`}>
      {config.label}
    </span>
  );
}
