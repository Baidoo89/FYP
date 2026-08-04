'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Bell, BriefcaseBusiness, CheckCircle2, ChevronRight, Clock3, FileText, MessageSquareText, RotateCcw, UploadCloud } from 'lucide-react';
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
const PROMOTION_CYCLE = '2026 Academic Promotion';

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

function stageLabelFor(request: DashboardData['activeRequest']) {
  if (!request) return 'Not Started';

  const stageByStatus: Record<string, string> = {
    DRAFT: 'Evidence Upload',
    SUBMITTED: 'Department Review',
    UNDER_DEPARTMENT_REVIEW: 'Department Review',
    RETURNED_FOR_CORRECTION: 'Correction Required',
    UNDER_HR_VERIFICATION: 'HR Verification',
    UNDER_REVIEW: 'HR Verification',
    UNDER_COMMITTEE_REVIEW: 'Committee Review',
    ELIGIBLE: 'Committee Review',
    NOT_ELIGIBLE: 'Committee Review',
    REQUIRES_FURTHER_REVIEW: 'Further Review',
    RECOMMENDED: 'Recommendation',
    NOT_RECOMMENDED: 'Recommendation',
    APPROVED_BY_AUTHORITY: 'Final Approval',
    APPROVED: 'Final Approval',
    REJECTED: 'Closed',
    COMPLETED: 'Completed',
  };

  return stageByStatus[request.status] || formatEnum(request.status);
}

function applicationStatusFor(request: DashboardData['activeRequest']) {
  if (!request) return 'Not Started';
  if (request.status === 'DRAFT') return 'In Progress';
  if (request.status === 'RETURNED_FOR_CORRECTION') return 'Requires Correction';
  if (request.status === 'REJECTED' || request.status === 'NOT_RECOMMENDED') return 'Not Approved';
  if (request.status === 'COMPLETED' || request.status === 'APPROVED') return 'Completed';
  if (request.eligibilityStatus && request.eligibilityStatus !== 'NOT_CALCULATED') return formatEnum(request.eligibilityStatus);
  return 'Under Review';
}

function initialsFor(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function nextActionFor(data: DashboardData) {
  const request = data.activeRequest;

  if (!request) {
    return {
      title: 'Start Promotion Application',
      detail: 'Select the rank you are applying for, then begin uploading required evidence.',
      href: '/lecturer-portal/application',
      label: 'Start Application',
      tone: 'blue' as const,
      icon: BriefcaseBusiness,
    };
  }

  if (request.status === 'RETURNED_FOR_CORRECTION' || data.documentStats.returnedCount > 0) {
    return {
      title: 'Correct Returned Evidence',
      detail: 'Review HR comments, replace returned files, then resubmit your application.',
      href: '/lecturer-portal/evidence',
      label: 'Fix Evidence',
      tone: 'amber' as const,
      icon: RotateCcw,
    };
  }

  if (request.status === 'DRAFT') {
    return {
      title: 'Complete Your Draft',
      detail: 'Upload the required evidence and submit the request for department review.',
      href: '/lecturer-portal/evidence',
      label: 'Upload Evidence',
      tone: 'blue' as const,
      icon: UploadCloud,
    };
  }

  if (request.status === 'SUBMITTED' || request.status === 'UNDER_DEPARTMENT_REVIEW') {
    return {
      title: 'Department Review In Progress',
      detail: 'Your application is with the department office. Track the workflow for updates.',
      href: '/lecturer-portal/application',
      label: 'Track Application',
      tone: 'blue' as const,
      icon: Clock3,
    };
  }

  if (request.status === 'UNDER_HR_VERIFICATION' || request.status === 'UNDER_REVIEW') {
    return {
      title: 'HR Verification In Progress',
      detail: 'HR is checking your submitted evidence. You will be notified if corrections are required.',
      href: '/lecturer-portal/evidence',
      label: 'View Evidence',
      tone: 'blue' as const,
      icon: Clock3,
    };
  }

  if (request.status === 'UNDER_COMMITTEE_REVIEW' || request.status === 'ELIGIBLE' || request.status === 'REQUIRES_FURTHER_REVIEW') {
    return {
      title: 'Await Committee Decision',
      detail: 'Your verified application is being considered for recommendation.',
      href: '/lecturer-portal/application',
      label: 'View Details',
      tone: 'blue' as const,
      icon: CheckCircle2,
    };
  }

  return {
    title: 'Review Final Outcome',
    detail: 'Open your application summary for the latest administrative outcome and records.',
    href: '/lecturer-portal/application',
    label: 'Open Summary',
    tone: request.status === 'REJECTED' || request.status === 'NOT_RECOMMENDED' ? 'rose' as const : 'blue' as const,
    icon: BriefcaseBusiness,
  };
}

function actionNeedsAttention(action: ReturnType<typeof nextActionFor>) {
  return ['Start Promotion Application', 'Correct Returned Evidence', 'Complete Your Draft'].includes(action.title);
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
  const showActionBanner = Boolean(nextAction && actionNeedsAttention(nextAction));

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
  const currentStageLabel = stageLabelFor(request);
  const applicationStatusLabel = applicationStatusFor(request);
  const initials = initialsFor(data.user.name) || 'GU';

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <section className="relative overflow-hidden rounded-xl border border-brand-primary/20 bg-[linear-gradient(135deg,#183A72_0%,#102A54_62%,#0B1F3E_100%)] p-4 text-white shadow-[0_14px_36px_rgba(24,58,114,0.18)] sm:p-5">
        <div className="relative z-10 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,21rem)] lg:items-center">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 text-base font-black text-white shadow-sm sm:h-16 sm:w-16 sm:text-lg">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-50/75">Welcome back</p>
              <h1 className="mt-1 break-words text-xl font-semibold tracking-tight sm:text-2xl">{data.user.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-50/85">
                <span>{data.user.department || 'Department not assigned'}</span>
                <span className="h-1 w-1 rounded-full bg-blue-100/70" />
                <span>{formatEnum(data.user.currentRank)}</span>
                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white">Lecturer</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/15 bg-white/10 p-3 shadow-inner backdrop-blur sm:p-4">
            <div className="grid grid-cols-2 gap-3">
              <ApplicationFact label="Promotion Cycle" value={PROMOTION_CYCLE} />
              <ApplicationFact label="Current Stage" value={currentStageLabel} />
              <ApplicationFact label="Current Rank" value={formatEnum(request?.currentRank || data.user.currentRank)} />
              <ApplicationFact label="Applying For" value={request ? formatEnum(request.targetRank) : 'Select when starting application'} />
              <ApplicationFact label="Application Status" value={applicationStatusLabel} />
              <ApplicationFact label="Last Updated" value={formatDate(request?.updatedAt)} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Documents" value={data.documentStats.totalDocuments} detail="Total uploaded" icon={FileText} />
        <MetricCard label="Verified" value={data.documentStats.verifiedCount} detail="Approved by HR" icon={CheckCircle2} tone="green" />
        <MetricCard label="Not verified" value={data.documentStats.pendingCount} detail="Document status" icon={Clock3} tone="amber" />
        <MetricCard label="Returned" value={data.documentStats.returnedCount} detail="Needs correction" icon={RotateCcw} tone="rose" />
      </section>

      {nextAction && showActionBanner && <ActionNotificationBanner action={nextAction} />}

      <section className={showActionBanner ? 'min-w-0 max-w-full' : 'grid min-w-0 max-w-full gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] 2xl:items-stretch'}>
        <div className="min-w-0">
          {request ? (
            <ProgressStepper currentStep={currentStep} steps={WORKFLOW_STEPS} status={request.status} />
          ) : (
            <NoRequestPanel />
          )}
        </div>
        {nextAction && !showActionBanner && <NextActionPanel action={nextAction} />}
      </section>

      <div className="grid min-w-0 max-w-full gap-5 2xl:grid-cols-[minmax(0,1fr)_23rem]">
        <CurrentApplicationCard request={request} rankPath={rankPath} />
        <QuickActionPanel unreadNotifications={data.documentStats.unreadNotifications} />
      </div>
    </div>
  );
}

function ApplicationFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-50/60">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-5 text-white">{value}</p>
    </div>
  );
}

function LoadingDashboard() {
  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <div className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
      <div className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
    </div>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone = 'slate' }: { label: string; value: number; detail: string; icon: LucideIcon; tone?: 'slate' | 'green' | 'amber' | 'rose' }) {
  const toneClass = {
    slate: 'border-brand-primary/20 bg-brand-primarySoft text-brand-primary',
    green: 'border-green-200 bg-green-50 text-green-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
  }[tone];

  return (
    <article className="pro-tile min-w-0 p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{value}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{detail}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${toneClass}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function NoRequestPanel() {
  return (
    <section className="pro-card min-w-0 p-5">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Promotion Workflow</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">No active promotion application yet</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Select a target rank to create your draft.</p>
        <Link href="/lecturer-portal/application" className="mt-4 inline-flex rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-primaryDark">
          Start Application
        </Link>
      </div>
    </section>
  );
}

function CurrentApplicationCard({ request, rankPath }: { request: DashboardData['activeRequest']; rankPath: string }) {
  return (
    <section className="pro-card min-w-0 max-w-full p-5 sm:p-6">
      <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Application Summary</p>
          <h2 className="mt-2 break-words text-lg font-semibold text-slate-950">{request ? rankPath : 'Promotion request not started'}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {request ? `Application PR-${String(request.id).padStart(5, '0')} last updated ${formatDate(request.updatedAt)}.` : 'Your application details will appear here once a request is created.'}
          </p>
        </div>
        {request && <StatusBadge status={request.status} />}
      </div>

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">
        <SummaryFact label="Submitted" value={formatDate(request?.submittedAt)} />
        <SummaryFact label="Criteria Score" value={request?.totalScore == null ? 'Pending' : `${Math.round(request.totalScore)}/100`} />
        <SummaryFact label="Latest Evidence" value={request?.latestDocument?.title || 'No upload yet'} />
      </div>

      <div className="mt-5 grid min-w-0 gap-2 sm:flex sm:flex-wrap sm:gap-3 [&>button]:w-full sm:[&>button]:w-auto">
        <Link href="/lecturer-portal/application" className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primaryDark sm:w-auto">
          Track Application
        </Link>
        <Link href="/lecturer-portal/evidence" className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-brand-primary/25 hover:bg-brand-primarySoft hover:text-brand-primary sm:w-auto">
          Evidence Portfolio
        </Link>
        <PrintSummaryButton />
      </div>
    </section>
  );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function NextActionPanel({ action }: { action: ReturnType<typeof nextActionFor> }) {
  const Icon = action.icon;
  const toneClass = {
    blue: 'border-brand-primary/25 bg-brand-primarySoft text-brand-primary',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
  }[action.tone];

  return (
    <section className={`flex h-full min-w-0 max-w-full flex-col rounded-xl border p-4 shadow-sm sm:p-5 ${toneClass}`}>
      <div className="flex min-w-0 max-w-full items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/70">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-75">Next Required Action</p>
          <h2 className="mt-1 break-words text-lg font-semibold">{action.title}</h2>
          <p className="mt-1 break-words text-sm leading-6 opacity-80">{action.detail}</p>
        </div>
      </div>
      <Link href={action.href} className="mt-4 inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 2xl:mt-auto">
        {action.label}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

function ActionNotificationBanner({ action }: { action: ReturnType<typeof nextActionFor> }) {
  const Icon = action.icon;
  const toneClass = {
    blue: 'border-brand-primary/20 bg-brand-primarySoft text-brand-primary',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
  }[action.tone];

  return (
    <section role="status" aria-live="polite" className={`flex min-w-0 max-w-full flex-col gap-3 rounded-xl border px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between ${toneClass}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/70">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold">Action required: {action.title}</p>
          <p className="mt-1 break-words text-xs leading-5 opacity-80">{action.detail}</p>
        </div>
      </div>
      <Link href={action.href} className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 sm:w-auto">
        {action.label}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

function QuickActionPanel({ unreadNotifications }: { unreadNotifications: number }) {
  const links = [
    { href: '/lecturer-portal/evidence', label: 'Upload Evidence', icon: UploadCloud },
    { href: '/lecturer-portal/application', label: 'Track Application', icon: BriefcaseBusiness },
    { href: '/lecturer-portal/queries', label: 'View Feedback', icon: MessageSquareText },
    { href: '/lecturer-portal/notifications', label: 'Notifications (' + unreadNotifications + ')', icon: Bell },
  ];

  return (
    <section className="pro-card min-w-0 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Quick Actions</p>
      <div className="mt-4 grid gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-primary/25 hover:bg-brand-primarySoft hover:text-brand-primary">
              <span className="flex min-w-0 max-w-full items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-primary/20 bg-white text-brand-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 break-words">{link.label}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
