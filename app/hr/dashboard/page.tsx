'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '../../../components/promotion/StatusBadge';

type DashboardStats = {
  totalRequests: number;
  pendingReview: number;
  verified: number;
  approved: number;
  rejected: number;
  totalDocuments: number;
  returned: number;
  committeeReview: number;
  eligible: number;
  notEligible: number;
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
        const allDocuments = allRequests.flatMap((request: any) => request.documents || []);
        const pendingDocuments = allDocuments.filter((document: any) => !document.verificationStatus || document.verificationStatus === 'PENDING').length;
        const verifiedDocuments = allDocuments.filter((document: any) => document.verificationStatus === 'VERIFIED').length;
        const returnedRequests = allRequests.filter((request: any) =>
          request.status === 'RETURNED_FOR_CORRECTION' ||
          (request.documents || []).some((document: any) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus))
        ).length;
        const actionableRequests = allRequests.filter((request: any) =>
          ['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW', 'UNDER_HR_VERIFICATION', 'REQUIRES_FURTHER_REVIEW', 'RECOMMENDED', 'APPROVED_BY_AUTHORITY'].includes(request.status) ||
          (request.documents || []).some((document: any) => document.verificationStatus === 'PENDING')
        );

        setStats({
          totalRequests: allRequests.length,
          pendingReview: pendingDocuments,
          verified: verifiedDocuments,
          approved: allRequests.filter((request: any) => ['APPROVED', 'APPROVED_BY_AUTHORITY', 'COMPLETED'].includes(request.status)).length,
          rejected: allRequests.filter((request: any) => ['REJECTED', 'NOT_RECOMMENDED'].includes(request.status)).length,
          totalDocuments: allDocuments.length,
          returned: returnedRequests,
          committeeReview: allRequests.filter((request: any) => request.status === 'UNDER_COMMITTEE_REVIEW').length,
          eligible: allRequests.filter((request: any) => request.eligibilityStatus === 'ELIGIBLE').length,
          notEligible: allRequests.filter((request: any) => ['NOT_ELIGIBLE', 'INCOMPLETE_APPLICATION'].includes(request.eligibilityStatus)).length,
        });
        setRecentRequests((actionableRequests.length ? actionableRequests : allRequests).slice(0, 5));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="pro-card p-6 text-sm text-slate-600">Loading HR dashboard...</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">{error}</div>;
  }

  const completion = stats && stats.totalDocuments > 0 ? Math.round((stats.verified / stats.totalDocuments) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">HR Administration</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Verification Command Center</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Monitor promotion applications, verify evidence, and move qualified submissions through the institutional review workflow.
            </p>
          </div>
          <a href="/hr/requests" className="inline-flex w-fit rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-teal-50">
            Open master queue
          </a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile code="ALL" label="Total applications" value={stats?.totalRequests || 0} />
        <StatTile code="PEN" label="Pending verification" value={stats?.pendingReview || 0} tone="amber" />
        <StatTile code="COR" label="Returned correction" value={stats?.returned || 0} tone="rose" />
        <StatTile code="COM" label="Committee review" value={stats?.committeeReview || 0} />
        <StatTile code="ELG" label="Eligible applicants" value={stats?.eligible || 0} />
        <StatTile code="NEL" label="Not eligible" value={stats?.notEligible || 0} tone="rose" />
        <StatTile code="VER" label="Verified documents" value={stats?.verified || 0} />
        <StatTile code="APR" label="Finalized" value={stats?.approved || 0} />
      </section>

      <section className="pro-card p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 pb-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Recent Submissions</h2>
            <p className="mt-1 text-sm text-slate-600">Latest promotion requests awaiting HR action.</p>
          </div>
          <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {recentRequests.length} visible
          </span>
        </div>

        <div className="pro-scroll-x rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Lecturer</th>
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
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-600">No requests available</td>
                </tr>
              ) : (
                recentRequests.map((request: any) => (
                  <tr key={request.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-950">{request.lecturerName}</div>
                      <div className="text-xs text-slate-500">{request.lecturerEmail}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{request.department}</td>
                    <td className="px-4 py-4 text-slate-700">{request.currentRank} to {request.targetRank}</td>
                    <td className="px-4 py-4"><StatusBadge status={request.status} /></td>
                    <td className="px-4 py-4 text-slate-700">{request.documentCount} docs</td>
                    <td className="px-4 py-4">
                      <a href={`/hr/requests?request=${request.id}`} className="font-semibold text-teal-700 hover:text-teal-900">Open</a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr_0.9fr]">
        <div className="pro-card p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-950">Verification Progress</h3>
          <p className="mt-1 text-sm text-slate-600">Verified evidence across all visible promotion requests.</p>
          <div className="mt-5 flex items-center gap-4">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-teal-700 transition-all" style={{ width: `${completion}%` }} />
            </div>
            <div className="w-16 text-right text-2xl font-semibold text-slate-950">{completion}%</div>
          </div>
        </div>

        <div className="pro-card p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-950">Reports and Analytics</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Eligible" value={stats?.eligible || 0} tone="teal" />
            <MiniMetric label="Not eligible" value={stats?.notEligible || 0} tone="rose" />
            <MiniMetric label="Committee" value={stats?.committeeReview || 0} tone="amber" />
          </div>
        </div>

        <div className="pro-card p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-950">Quick Navigation</h3>
          <div className="mt-4 grid gap-2">
            <QuickLink href="/hr/requests" code="RQ" title="Master Queue" description="View and manage all requests" />
            <QuickLink href="/hr/verify" code="VR" title="Verification Workspace" description="Review submitted evidence" />
            <QuickLink href="/hr/logs" code="AU" title="Audit Logs" description="Track sensitive actions" />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatTile({ code, label, value, tone = 'teal' }: { code: string; label: string; value: number; tone?: 'teal' | 'amber' | 'rose' }) {
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


function MiniMetric({ label, value, tone }: { label: string; value: number; tone: 'teal' | 'amber' | 'rose' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-teal-200 bg-teal-50 text-teal-800';

  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-75">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
function QuickLink({ href, code, title, description }: { href: string; code: string; title: string; description: string }) {
  return (
    <a href={href} className="pro-action flex items-center gap-3 p-3">
      <span className="pro-code-badge">{code}</span>
      <span>
        <span className="block text-sm font-semibold text-slate-950">{title}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
    </a>
  );
}
