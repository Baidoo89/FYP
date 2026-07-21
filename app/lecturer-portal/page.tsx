'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PrintSummaryButton } from '../../components/enterprise-ui';
import { RecentActivity } from '../../components/lecturer-dashboard/DashboardComponents';
import ProgressStepper from '../../components/promotion/ProgressStepper';
import StatusBadge from '../../components/promotion/StatusBadge';

interface DashboardData {
  user: {
    name: string;
    email: string;
    staffId: string | null;
    currentRank: string | null;
    department: string | null;
  };
  activeRequest: {
    id: number;
    currentRank: string;
    targetRank: string;
    status: string;
    eligibilityStatus: string;
    eligibilityReason: string | null;
    totalScore: number | null;
    progressPercentage: number;
    submittedAt: string | null;
    createdAt: string;
    updatedAt: string;
    latestDocument: {
      title: string;
      verificationStatus: string;
    } | null;
  } | null;
  documentStats: {
    totalDocuments: number;
    verifiedCount: number;
    pendingCount: number;
    returnedCount: number;
    unreadNotifications: number;
  };
  recentDocuments: Array<{
    id: number;
    title: string;
    category: string;
    verificationStatus: string;
    uploadedAt: string;
  }>;
  recentFeedback: Array<{
    id: number;
    title: string;
    category: string;
    verificationStatus: string;
    comment: string | null;
    updatedAt: string;
    verifiedAt: string | null;
  }>;
  accountCreated: string;
}

const WORKFLOW_STEPS = ['Draft', 'Submitted', 'Department Review', 'HR Verification', 'Committee Review', 'Recommendation', 'Completed'];

const workflowStepByStatus: Record<string, number> = {
  DRAFT: 1,
  SUBMITTED: 2,
  UNDER_DEPARTMENT_REVIEW: 3,
  RETURNED_FOR_CORRECTION: 3,
  UNDER_HR_VERIFICATION: 4,
  UNDER_REVIEW: 4,
  UNDER_COMMITTEE_REVIEW: 5,
  ELIGIBLE: 5,
  NOT_ELIGIBLE: 5,
  REQUIRES_FURTHER_REVIEW: 5,
  RECOMMENDED: 6,
  NOT_RECOMMENDED: 6,
  APPROVED_BY_AUTHORITY: 6,
  APPROVED: 7,
  REJECTED: 7,
  COMPLETED: 7,
};

function formatEnum(value?: string | null) {
  if (!value) return 'Not set';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}


function nextActionFor(data: DashboardData) {
  const request = data.activeRequest;

  if (!request) {
    return {
      title: 'Start Promotion Request',
      detail: 'Create your promotion application and begin uploading required evidence.',
      href: '/lecturer-portal/application',
      label: 'Create Request',
      tone: 'green' as const,
    };
  }

  if (request.status === 'RETURNED_FOR_CORRECTION' || data.documentStats.returnedCount > 0) {
    return {
      title: 'Correct Returned Evidence',
      detail: 'Review HR comments, replace returned files, then resubmit your application.',
      href: '/lecturer-portal/evidence',
      label: 'Fix Evidence',
      tone: 'amber' as const,
    };
  }

  if (request.status === 'DRAFT') {
    return {
      title: 'Complete Your Draft',
      detail: 'Upload the required evidence and submit the request for department review.',
      href: '/lecturer-portal/evidence',
      label: 'Upload Evidence',
      tone: 'green' as const,
    };
  }

  if (request.status === 'SUBMITTED' || request.status === 'UNDER_DEPARTMENT_REVIEW') {
    return {
      title: 'Department Review In Progress',
      detail: 'Your application is with the department office. Track the workflow for updates.',
      href: '/lecturer-portal/application',
      label: 'Track Application',
      tone: 'blue' as const,
    };
  }

  if (request.status === 'UNDER_HR_VERIFICATION' || request.status === 'UNDER_REVIEW') {
    return {
      title: 'HR Verification In Progress',
      detail: 'HR is checking your submitted evidence. You will be notified if corrections are required.',
      href: '/lecturer-portal/evidence',
      label: 'View Evidence',
      tone: 'blue' as const,
    };
  }

  if (request.status === 'UNDER_COMMITTEE_REVIEW' || request.status === 'ELIGIBLE' || request.status === 'REQUIRES_FURTHER_REVIEW') {
    return {
      title: 'Committee Review Stage',
      detail: 'Your verified application is being considered for recommendation.',
      href: '/lecturer-portal/application',
      label: 'View Details',
      tone: 'blue' as const,
    };
  }

  return {
    title: 'Review Final Outcome',
    detail: 'Open your application summary for the latest administrative outcome and records.',
    href: '/lecturer-portal/application',
    label: 'Open Summary',
    tone: request.status === 'REJECTED' || request.status === 'NOT_RECOMMENDED' ? 'rose' as const : 'green' as const,
  };
}

export default function LecturerDashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch('/api/lecturer/dashboard', { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load dashboard');
        }

        setData(payload.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const nextAction = useMemo(() => (data ? nextActionFor(data) : null), [data]);

  if (loading) return <LoadingDashboard />;

  if (error || !data) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm font-semibold text-amber-900 shadow-sm">
        {error || 'Failed to load lecturer dashboard.'}
      </div>
    );
  }

  const request = data.activeRequest;
  const currentStep = request ? workflowStepByStatus[request.status] || 1 : 1;
  const rankPath = request ? `${formatEnum(request.currentRank)} to ${formatEnum(request.targetRank)}` : `${formatEnum(data.user.currentRank)} promotion pathway`;
  const eligibilityStatus = request?.eligibilityStatus || 'NOT_CALCULATED';

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-brand-primary/20 bg-[linear-gradient(135deg,#183A72_0%,#102A54_60%,#0B1F3E_100%)] p-5 text-white shadow-[0_18px_48px_rgba(24,58,114,0.22)] sm:p-6">
        <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-center">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/95 p-1 shadow-lg">
              <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-50/80">Digital Staff Promotion Support System</p>
              <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back, {data.user.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-50/85">
                <span>{formatEnum(data.user.currentRank)}</span>
                <span className="h-1 w-1 rounded-full bg-blue-100/70" />
                <span>{data.user.department || 'Department not assigned'}</span>
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white">Lecturer</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/10 p-4 shadow-inner backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-50/75">Current Application</p>
                <p className="mt-2 text-xl font-semibold">{request ? rankPath : 'No active request'}</p>
                <p className="mt-1 text-xs text-blue-50/75">{request ? `Updated ${formatDate(request.updatedAt)}` : 'Create a request when you are ready to apply.'}</p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white text-sm font-black text-brand-primary">
                {request?.progressPercentage ?? 0}%
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {request ? <StatusBadge status={request.status} /> : <StatusBadge status="DRAFT" label="Not Started" />}
              <StatusBadge status={eligibilityStatus} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Uploaded Documents" value={data.documentStats.totalDocuments} detail="Evidence in portfolio" code="DOC" />
        <MetricCard label="Verified Documents" value={data.documentStats.verifiedCount} detail="Approved by HR" code="OK" tone="green" />
        <MetricCard label="Pending Verification" value={data.documentStats.pendingCount} detail="Awaiting HR review" code="PN" tone="amber" />
        <MetricCard label="Returned Documents" value={data.documentStats.returnedCount} detail="Needs correction" code="RT" tone="rose" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-6">
          {request ? (
            <ProgressStepper currentStep={currentStep} steps={WORKFLOW_STEPS} status={request.status} />
          ) : (
            <NoRequestPanel />
          )}

          <CurrentApplicationCard request={request} rankPath={rankPath} />
          <RecentActivity documents={data.recentDocuments} />
        </div>

        <aside className="space-y-6">
          {nextAction && <NextActionPanel action={nextAction} />}
          <EligibilityPanel request={request} />
          <FeedbackPanel feedback={data.recentFeedback} />
          <QuickActionPanel unreadNotifications={data.documentStats.unreadNotifications} />
        </aside>
      </div>
    </div>
  );
}

function LoadingDashboard() {
  return (
    <div className="space-y-5">
      <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
    </div>
  );
}

function MetricCard({ label, value, detail, code, tone = 'slate' }: { label: string; value: number; detail: string; code: string; tone?: 'slate' | 'green' | 'amber' | 'rose' }) {
  const toneClass = {
    slate: 'border-slate-200 bg-slate-100 text-slate-700',
    green: 'border-brand-primary/25 bg-brand-primarySoft text-brand-primary',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
  }[tone];

  return (
    <article className="pro-tile p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-black ${toneClass}`}>{code}</span>
      </div>
    </article>
  );
}

function NoRequestPanel() {
  return (
    <section className="pro-card p-6">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Promotion Workflow</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">No active promotion request yet</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Create a request when your promotion cycle is ready. The workflow tracker will appear here after the request is created.</p>
        <Link href="/lecturer-portal/application" className="mt-4 inline-flex rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-primaryDark">
          Start Request
        </Link>
      </div>
    </section>
  );
}

function CurrentApplicationCard({ request, rankPath }: { request: DashboardData['activeRequest']; rankPath: string }) {
  return (
    <section className="pro-card p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Application Summary</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">{request ? rankPath : 'Promotion request not started'}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {request ? `Application PR-${String(request.id).padStart(5, '0')} last updated ${formatDate(request.updatedAt)}.` : 'Your application details will appear here once a request is created.'}
          </p>
        </div>
        {request && <StatusBadge status={request.status} />}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <SummaryFact label="Submitted" value={formatDate(request?.submittedAt)} />
        <SummaryFact label="Total Score" value={request?.totalScore == null ? 'Pending' : `${Math.round(request.totalScore)}%`} />
        <SummaryFact label="Latest Evidence" value={request?.latestDocument?.title || 'No upload yet'} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/lecturer-portal/application" className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primaryDark">
          Track Application
        </Link>
        <Link href="/lecturer-portal/evidence" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-brand-primary/25 hover:bg-brand-primarySoft hover:text-brand-primary">
          Evidence Portfolio
        </Link>
        <PrintSummaryButton />
      </div>
    </section>
  );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function NextActionPanel({ action }: { action: ReturnType<typeof nextActionFor> }) {
  const toneClass = {
    green: 'border-brand-primary/25 bg-brand-primarySoft text-brand-primary',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    blue: 'border-sky-200 bg-sky-50 text-sky-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
  }[action.tone];

  return (
    <section className={`rounded-xl border p-5 shadow-sm ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-75">Next Required Action</p>
      <h2 className="mt-2 text-lg font-semibold">{action.title}</h2>
      <p className="mt-2 text-sm leading-6 opacity-80">{action.detail}</p>
      <Link href={action.href} className="mt-4 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5">
        {action.label}
      </Link>
    </section>
  );
}

function EligibilityPanel({ request }: { request: DashboardData['activeRequest'] }) {
  return (
    <section className="pro-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Eligibility Status</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">{formatEnum(request?.eligibilityStatus || 'NOT_CALCULATED')}</h2>
        </div>
        <StatusBadge status={request?.eligibilityStatus || 'NOT_CALCULATED'} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {request?.eligibilityReason || 'Eligibility will be calculated after the required evidence has been verified by HR.'}
      </p>
      <Link href="/lecturer-portal/eligibility" className="mt-4 inline-flex text-sm font-semibold text-brand-primary hover:text-brand-primary">
        View eligibility details
      </Link>
    </section>
  );
}

function FeedbackPanel({ feedback }: { feedback: DashboardData['recentFeedback'] }) {
  return (
    <section className="pro-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Recent Feedback</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">HR remarks and corrections</h2>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">{feedback.length}</span>
      </div>

      <div className="mt-4 space-y-3">
        {feedback.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">No correction feedback at the moment.</div>
        ) : (
          feedback.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={item.verificationStatus} />
                <span className="text-xs font-medium text-slate-500">{formatDate(item.updatedAt)}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{item.comment || 'HR reviewed this document and left a verification update.'}</p>
            </div>
          ))
        )}
      </div>

      <Link href="/lecturer-portal/queries" className="mt-4 inline-flex text-sm font-semibold text-brand-primary hover:text-brand-primary">
        Open feedback inbox
      </Link>
    </section>
  );
}

function QuickActionPanel({ unreadNotifications }: { unreadNotifications: number }) {
  const links = [
    { href: '/lecturer-portal/evidence', label: 'Upload Evidence', detail: 'Add or replace promotion documents' },
    { href: '/lecturer-portal/application', label: 'Track Application', detail: 'View workflow and status history' },
    { href: '/lecturer-portal/queries', label: 'View Feedback', detail: 'Read HR comments and corrections' },
    { href: '/lecturer-portal/notifications', label: 'Notifications', detail: `${unreadNotifications} unread update(s)` },
  ];

  return (
    <section className="pro-card p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Quick Actions</p>
      <div className="mt-4 grid gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-primary/25 hover:bg-brand-primarySoft hover:text-brand-primary">
            <span>
              <span className="block">{link.label}</span>
              <span className="mt-0.5 block text-xs font-normal text-slate-500">{link.detail}</span>
            </span>
            <span className="text-lg leading-none">{'>'}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
