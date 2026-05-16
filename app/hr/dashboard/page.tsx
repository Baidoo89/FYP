'use client';

import { useEffect, useState } from 'react';

type DashboardStats = {
  totalRequests: number;
  pendingReview: number;
  verified: number;
  approved: number;
  rejected: number;
};

export default function HrCommandCenterPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/promotion-requests?scope=hr');
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load dashboard');
        }

        const allRequests = payload.data || [];
        
        // Calculate stats
        const statsData: DashboardStats = {
          totalRequests: allRequests.length,
          pendingReview: allRequests.filter((r: any) => r.status === 'UNDER_REVIEW').length,
          verified: allRequests.filter((r: any) => r.verifiedAt !== null).length,
          approved: allRequests.filter((r: any) => r.status === 'APPROVED').length,
          rejected: allRequests.filter((r: any) => r.status === 'REJECTED').length,
        };

        setStats(statsData);
        setRecentRequests(allRequests.slice(0, 5));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
        Loading Command Center...
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
              HR / Admin Dashboard
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Command Center</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/90">
              Monitor promotion requests in real-time, track verification progress, and manage the eligibility workflow.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/hr/requests"
              className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-blue-950 hover:bg-yellow-300"
            >
              View Queue
            </a>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Requests"
          value={stats?.totalRequests || 0}
          icon="📊"
          color="bg-blue-50 text-blue-900"
          borderColor="border-blue-100"
        />
        <StatCard
          label="Pending Review"
          value={stats?.pendingReview || 0}
          icon="⏳"
          color="bg-amber-50 text-amber-900"
          borderColor="border-amber-100"
        />
        <StatCard
          label="Verified"
          value={stats?.verified || 0}
          icon="✅"
          color="bg-blue-50 text-blue-900"
          borderColor="border-blue-100"
        />
        <StatCard
          label="Approved"
          value={stats?.approved || 0}
          icon="🎉"
          color="bg-yellow-50 text-yellow-900"
          borderColor="border-yellow-100"
        />
        <StatCard
          label="Rejected"
          value={stats?.rejected || 0}
          icon="❌"
          color="bg-blue-50 text-blue-900"
          borderColor="border-blue-100"
        />
      </section>

      {/* Recent Activity */}
      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent Submissions</h2>
            <p className="mt-1 text-sm text-slate-600">Latest promotion requests awaiting verification</p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
            {recentRequests.length} request(s)
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-600">
              <tr>
                <th className="px-4 py-3">Lecturer Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Promotion</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Documents</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-600">
                    No requests available
                  </td>
                </tr>
              ) : (
                recentRequests.map((request: any) => (
                  <tr key={request.id} className="border-t border-slate-100 hover:bg-blue-50/50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{request.lecturerName}</div>
                      <div className="text-xs text-slate-500">{request.lecturerEmail}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{request.department}</td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-700">
                      {request.currentRank} → {request.targetRank}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-4 text-slate-700">{request.documentCount} docs</td>
                    <td className="px-4 py-4">
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

        <div className="mt-4 flex justify-center">
          <a
            href="/hr/requests"
            className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100"
          >
            View All Requests
          </a>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Verification Progress</h3>
          <div className="mt-4 flex items-end gap-4">
            <div className="flex-1">
              <div className="mb-2 text-sm font-semibold text-slate-600">Overall Completion</div>
              <div className="h-3 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all"
                  style={{
                    width: stats && stats.totalRequests > 0
                      ? `${Math.round((stats.verified / stats.totalRequests) * 100)}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {stats && stats.totalRequests > 0
                  ? Math.round((stats.verified / stats.totalRequests) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Quick Navigation</h3>
          <div className="mt-4 space-y-2">
            <a
              href="/hr/requests"
              className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              📋 Master Queue - View all requests
            </a>
            <a
              href="/hr/verify"
              className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              🕵️ Verification Workspace - Review documents
            </a>
            <a
              href="/hr/logs"
              className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              🧾 Audit Logs - Track activity
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  borderColor,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  borderColor: string;
}) {
  return (
    <div className={`rounded-2xl border ${borderColor} ${color} p-4 shadow-sm`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.1em] opacity-75">{label}</div>
          <div className="mt-2 text-3xl font-bold">{value}</div>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
    SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Submitted' },
    UNDER_REVIEW: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Under Review' },
    APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved' },
    REJECTED: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Rejected' },
  };

  const config = statusConfig[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: status };

  return (
    <span className={`rounded-full ${config.bg} ${config.text} px-3 py-1 text-xs font-semibold`}>
      {config.label}
    </span>
  );
}
