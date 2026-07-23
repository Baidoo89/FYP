'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileCheck2, FileText, RotateCcw, ShieldCheck, UsersRound } from 'lucide-react';
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

type RequestSummary = {
  id: number;
  lecturerName: string;
  lecturerEmail: string;
  department: string;
  currentRank: string;
  targetRank: string;
  status: string;
  eligibilityStatus?: string | null;
  documentCount?: number;
  verifiedDocumentCount?: number;
  documents?: Array<{ verificationStatus?: string | null }>;
  updatedAt?: string | null;
};

function label(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function applicationCode(id: number) {
  return `PR-${String(id).padStart(5, '0')}`;
}

function documentCounts(request: RequestSummary) {
  const documents = request.documents || [];
  return {
    total: request.documentCount ?? documents.length,
    verified: request.verifiedDocumentCount ?? documents.filter((document) => document.verificationStatus === 'VERIFIED').length,
    pending: documents.filter((document) => !document.verificationStatus || document.verificationStatus === 'PENDING').length,
    returned: documents.filter((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus || '')).length,
  };
}

function actionHref(request: RequestSummary) {
  const counts = documentCounts(request);
  if (request.status === 'UNDER_HR_VERIFICATION' || counts.pending > 0) return `/hr/verify?requestId=${request.id}&segment=pending`;
  return `/hr/requests?request=${request.id}`;
}

function signalFor(request: RequestSummary) {
  const counts = documentCounts(request);

  if (request.status === 'RETURNED_FOR_CORRECTION' || counts.returned > 0) {
    return { label: 'Returned', className: 'border-rose-200 bg-rose-50 text-rose-800' };
  }

  if (request.status === 'UNDER_HR_VERIFICATION' || counts.pending > 0) {
    return { label: 'Verify Now', className: 'border-amber-200 bg-amber-50 text-amber-900' };
  }

  if (request.status === 'UNDER_COMMITTEE_REVIEW') {
    return { label: 'Committee', className: 'border-sky-200 bg-sky-50 text-sky-800' };
  }

  if (['RECOMMENDED', 'APPROVED_BY_AUTHORITY'].includes(request.status)) {
    return { label: 'Final Action', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
  }

  if (['APPROVED', 'COMPLETED'].includes(request.status)) {
    return { label: 'Completed', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
  }

  return { label: 'Monitoring', className: 'border-slate-200 bg-slate-50 text-slate-700' };
}

export default function HrCommandCenterPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<RequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/promotion-requests?scope=hr', { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load dashboard');
        }

        const allRequests = (payload.data || []) as RequestSummary[];
        const allDocuments = allRequests.flatMap((request) => request.documents || []);
        const pendingDocuments = allDocuments.filter((document) => !document.verificationStatus || document.verificationStatus === 'PENDING').length;
        const verifiedDocuments = allDocuments.filter((document) => document.verificationStatus === 'VERIFIED').length;
        const returnedRequests = allRequests.filter((request) =>
          request.status === 'RETURNED_FOR_CORRECTION' ||
          (request.documents || []).some((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus || ''))
        ).length;
        const actionableRequests = allRequests.filter((request) => {
          const counts = documentCounts(request);
          return ['UNDER_HR_VERIFICATION', 'REQUIRES_FURTHER_REVIEW', 'RECOMMENDED', 'APPROVED_BY_AUTHORITY'].includes(request.status) || counts.pending > 0 || counts.returned > 0;
        });

        setStats({
          totalRequests: allRequests.length,
          pendingReview: pendingDocuments,
          verified: verifiedDocuments,
          approved: allRequests.filter((request) => ['APPROVED', 'APPROVED_BY_AUTHORITY', 'COMPLETED'].includes(request.status)).length,
          rejected: allRequests.filter((request) => ['REJECTED', 'NOT_RECOMMENDED'].includes(request.status)).length,
          totalDocuments: allDocuments.length,
          returned: returnedRequests,
          committeeReview: allRequests.filter((request) => request.status === 'UNDER_COMMITTEE_REVIEW').length,
          eligible: allRequests.filter((request) => request.eligibilityStatus === 'ELIGIBLE').length,
          notEligible: allRequests.filter((request) => ['NOT_ELIGIBLE', 'INCOMPLETE_APPLICATION'].includes(request.eligibilityStatus || '')).length,
        });
        setRecentRequests((actionableRequests.length ? actionableRequests : allRequests).slice(0, 6));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const completion = useMemo(() => (stats && stats.totalDocuments > 0 ? Math.round((stats.verified / stats.totalDocuments) * 100) : 0), [stats]);
  const actionBanner = stats && stats.pendingReview > 0
    ? {
        title: `${stats.pendingReview} document${stats.pendingReview === 1 ? '' : 's'} awaiting HR verification`,
        detail: 'Open the verification workspace, review evidence, and record decisions so eligibility can be calculated automatically.',
        href: '/hr/verify?segment=pending',
        tone: 'amber' as const,
      }
    : {
        title: 'No pending document verification',
        detail: 'Verification workload is clear. Continue monitoring committee routing, returned files, and final administrative close-out.',
        href: '/hr/requests',
        tone: 'green' as const,
      };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">{error}</div>;
  }

  return (
    <main className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <section className="relative overflow-hidden rounded-xl border border-brand-primary/15 bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-primary" aria-hidden="true" />
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] xl:items-center">
          <div className="min-w-0">
            <div className="pro-eyebrow">HR Administration</div>
            <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">Verification Command Center</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Monitor promotion applications, verify evidence, and move qualified submissions through the institutional review workflow.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/hr/verify?segment=pending" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-primaryDark">
                Open Verification Workspace
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <aside className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-white text-brand-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">HR Workload</p>
                <h2 className="mt-1 break-words text-base font-semibold text-gray-950">Evidence verification and workflow governance</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">Document decisions, eligibility routing, returned evidence, and final records are tracked here.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <ScopeLine label="Documents" value={`${stats?.totalDocuments || 0}`} />
              <ScopeLine label="Verified" value={`${stats?.verified || 0}`} />
              <ScopeLine label="Completion" value={`${completion}%`} />
            </div>
          </aside>
        </div>
      </section>

      <ActionBanner {...actionBanner} />

      <section className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon={UsersRound} label="Total Applications" value={stats?.totalRequests || 0} tone="blue" />
        <StatTile icon={Clock3} label="Pending Verification" value={stats?.pendingReview || 0} tone="amber" />
        <StatTile icon={RotateCcw} label="Returned Correction" value={stats?.returned || 0} tone="rose" />
        <StatTile icon={FileCheck2} label="Committee Review" value={stats?.committeeReview || 0} tone="blue" />
        <StatTile icon={CheckCircle2} label="Eligible Applicants" value={stats?.eligible || 0} tone="green" />
        <StatTile icon={AlertTriangle} label="Not Eligible" value={stats?.notEligible || 0} tone="rose" />
        <StatTile icon={FileText} label="Verified Documents" value={stats?.verified || 0} tone="green" />
        <StatTile icon={ShieldCheck} label="Finalized" value={stats?.approved || 0} tone="slate" />
      </section>

      <section className="grid min-w-0 max-w-full gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <div className="pro-card min-w-0 overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h2 className="break-words text-lg font-bold text-gray-950">Recent HR Workload</h2>
              <p className="mt-1 text-sm text-gray-600">Latest promotion requests requiring HR attention or monitoring.</p>
            </div>
            <Link href="/hr/requests" className="inline-flex min-h-9 w-fit items-center rounded-lg border border-brand-primary/20 px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primarySoft">
              View All
            </Link>
          </div>

          <div className="pro-scroll-x">
            <table className="min-w-[920px] divide-y divide-gray-100 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th className="px-5 py-3">Application</th>
                  <th className="px-5 py-3">Applicant</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Documents</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {recentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-600">No HR workload available.</td>
                  </tr>
                ) : (
                  recentRequests.map((request) => {
                    const counts = documentCounts(request);
                    const signal = signalFor(request);
                    return (
                      <tr key={request.id} className="align-top transition hover:bg-gray-50/80">
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-950">{applicationCode(request.id)}</p>
                          <p className="mt-1 text-xs text-gray-500">{label(request.currentRank)} to {label(request.targetRank)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{request.lecturerName}</p>
                          <p className="mt-1 text-xs text-gray-500">{request.department || request.lecturerEmail}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-2">
                            <StatusBadge status={request.status} />
                            <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${signal.className}`}>{signal.label}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{counts.verified}/{counts.total} verified</p>
                          <p className={`mt-1 text-xs ${counts.pending ? 'text-amber-700' : counts.returned ? 'text-rose-700' : 'text-gray-500'}`}>{counts.pending ? `${counts.pending} pending` : counts.returned ? `${counts.returned} returned` : 'No pending evidence'}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link href={actionHref(request)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-brand-primary/20 hover:bg-brand-primarySoft hover:text-brand-primary" aria-label={`Open ${applicationCode(request.id)}`}>
                            Open
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <section className="pro-card min-w-0 p-5">
            <h2 className="text-lg font-bold text-gray-950">Verification Progress</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">Verified evidence across all visible promotion requests.</p>
            <div className="mt-5 flex items-center gap-4">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${completion}%` }} />
              </div>
              <div className="w-16 text-right text-2xl font-semibold text-gray-950">{completion}%</div>
            </div>
          </section>

          <section className="pro-card min-w-0 p-5">
            <h2 className="text-lg font-bold text-gray-950">Reports and Analytics</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">Current eligibility and committee outcomes.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 2xl:grid-cols-1">
              <MiniMetric label="Eligible" value={stats?.eligible || 0} tone="green" />
              <MiniMetric label="Not Eligible" value={stats?.notEligible || 0} tone="rose" />
              <MiniMetric label="Committee" value={stats?.committeeReview || 0} tone="amber" />
            </div>
          </section>

          <section className="pro-card min-w-0 p-5">
            <h2 className="text-lg font-bold text-gray-950">Quick Navigation</h2>
            <div className="mt-4 grid gap-2">
              <QuickLink href="/hr/verify?segment=pending" title="Verification Workspace" description="Review submitted evidence" icon={FileCheck2} />
              <QuickLink href="/hr/requests" title="Master Queue" description="Manage all promotion requests" icon={FileText} />
              <QuickLink href="/hr/logs" title="Audit Logs" description="Track sensitive actions" icon={ShieldCheck} />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <div className="h-44 animate-pulse rounded-xl border border-gray-200 bg-white shadow-sm" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl border border-gray-200 bg-white shadow-sm" />)}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-gray-200 bg-white shadow-sm" />
    </div>
  );
}

function ScopeLine({ label: title, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">{title}</span>
      <span className="min-w-0 truncate text-right text-xs font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function ActionBanner({ title, detail, href, tone }: { title: string; detail: string; href: string; tone: 'amber' | 'green' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-950'
    : 'border-emerald-200 bg-emerald-50 text-emerald-950';
  const Icon = tone === 'amber' ? AlertTriangle : CheckCircle2;

  return (
    <section role="status" aria-live="polite" className={`flex min-w-0 max-w-full flex-col gap-3 rounded-xl border px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between ${toneClass}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/70">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold">{title}</p>
          <p className="mt-1 break-words text-xs leading-5 opacity-80">{detail}</p>
        </div>
      </div>
      <Link href={href} className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 sm:w-auto">
        Open
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

function StatTile({ icon: Icon, label: title, value, tone = 'blue' }: { icon: LucideIcon; label: string; value: number; tone?: 'blue' | 'amber' | 'rose' | 'green' | 'slate' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-900'
    : tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : tone === 'green'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : tone === 'slate'
          ? 'border-slate-200 bg-white text-slate-950'
          : 'border-brand-primary/20 bg-brand-primarySoft text-brand-text';

  return (
    <article className={`min-w-0 rounded-xl border p-4 shadow-sm sm:p-5 ${toneClass}`}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-[0.14em] opacity-70">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/15 bg-white/70">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'rose' | 'green' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800';

  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-75">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function QuickLink({ href, title, description, icon: Icon }: { href: string; title: string; description: string; icon: LucideIcon }) {
  return (
    <Link href={href} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-700 transition hover:border-brand-primary/25 hover:bg-brand-primarySoft hover:text-brand-primary">
      <span className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-white text-brand-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block break-words">{title}</span>
          <span className="mt-0.5 block break-words text-xs font-normal text-gray-500">{description}</span>
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </Link>
  );
}