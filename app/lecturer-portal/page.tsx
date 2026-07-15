'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProgressStepper from '../../components/promotion/ProgressStepper';
import { PromotionReadinessGauge, RecentActivity } from '../../components/lecturer-dashboard/DashboardComponents';

interface DashboardData {
  user: {
    name: string;
    email: string;
    staffId: string;
    currentRank: string;
    department: string;
  };
  activeRequest: {
    id: number;
    targetRank: string;
    status: string;
    progressPercentage: number;
    submittedAt: string | null;
    latestDocument: {
      title: string;
      verificationStatus: string;
    } | null;
  } | null;
  documentStats: {
    totalDocuments: number;
    verifiedCount: number;
    pendingCount: number;
  };
  recentDocuments: Array<{
    id: number;
    title: string;
    category: string;
    verificationStatus: string;
    uploadedAt: string;
  }>;
  accountCreated: string;
}

export default function LecturerDashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch('/api/lecturer/dashboard');
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center font-medium text-slate-900 shadow-sm">
          {error || 'Failed to load dashboard'}
        </div>
      </div>
    );
  }

  const workflowStepByStatus: Record<string, number> = {
    DRAFT: 1,
    SUBMITTED: 2,
    UNDER_DEPARTMENT_REVIEW: 3,
    RETURNED_FOR_CORRECTION: 3,
    UNDER_HR_VERIFICATION: 4,
    UNDER_REVIEW: 4,
    UNDER_COMMITTEE_REVIEW: 5,
    REQUIRES_FURTHER_REVIEW: 5,
    RECOMMENDED: 6,
    NOT_RECOMMENDED: 6,
    APPROVED: 7,
    APPROVED_BY_AUTHORITY: 7,
    COMPLETED: 7,
    REJECTED: 6,
  };
  const currentStep = data.activeRequest ? workflowStepByStatus[data.activeRequest.status] || 1 : 1;
  const initials = data.user.name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const eligibilityLabel = data.activeRequest?.status === 'REJECTED'
    ? 'Requires Review'
    : data.activeRequest?.status === 'APPROVED'
      ? 'Approved'
      : data.activeRequest
        ? 'In Progress'
        : 'Not Started';
  const eligibilityTone = data.activeRequest?.status === 'REJECTED'
    ? 'border-amber-300/30 bg-amber-400/12 text-amber-50'
    : 'border-teal-200/25 bg-white/[0.08] text-teal-50';

  return (
    <div className="space-y-6">
      <section id="home" className="overflow-hidden rounded-xl border border-emerald-900/15 bg-[linear-gradient(135deg,#06483f_0%,#03362f_54%,#012923_100%)] px-5 py-6 text-white shadow-[0_18px_45px_rgba(6,72,63,0.18)] sm:px-6 sm:py-7">
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.8fr] lg:items-center">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white/80 bg-teal-50 text-xl font-black text-teal-900 shadow-xl">
              {initials || 'GP'}
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-emerald-900 bg-teal-100 text-[10px] font-black text-teal-800">
                OK
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-teal-50/80">Welcome back,</p>
              <h1 className="mt-1 break-words text-3xl font-semibold tracking-tight sm:text-4xl">{data.user.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-teal-50/80">
                <span>{data.user.currentRank || 'Lecturer'}</span>
                <span className="h-1 w-1 rounded-full bg-teal-200/70" />
                <span>{data.user.department || 'Not Assigned'}</span>
                <span className="rounded-full border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-teal-50">Lecturer</span>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border p-4 shadow-inner ${eligibilityTone}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-50/70">Eligibility Status</p>
                <p className="mt-2 text-2xl font-semibold">{eligibilityLabel}</p>
                <p className="mt-1 text-xs text-teal-50/65">
                  {data.activeRequest?.submittedAt ? `Submitted ${new Date(data.activeRequest.submittedAt).toLocaleDateString()}` : 'Create an application to begin tracking.'}
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/[0.10] text-lg font-black text-teal-50 ring-1 ring-white/15">
                {data.activeRequest?.progressPercentage ?? 0}%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promotion Readiness Gauge */}
      {data.activeRequest && (
        <PromotionReadinessGauge
          percentage={data.activeRequest.progressPercentage}
          targetRank={data.activeRequest.targetRank}
          status={data.activeRequest.status}
        />
      )}

      {/* Career Stepper */}
      {data.activeRequest && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Your Promotion Journey</h3>
          <p className="mt-1 text-sm text-slate-600">Current stage: {data.activeRequest.status}</p>
          <div className="mt-6">
            <ProgressStepper
              currentStep={currentStep}
              steps={['Draft', 'Submitted', 'Department Review', 'HR Verification', 'Committee Review', 'Recommendation', 'Completed']}
              status={data.activeRequest.status}
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile code="DOC" label="Total Documents" value={data.documentStats.totalDocuments} />
        <StatTile code="OK" label="Verified" value={data.documentStats.verifiedCount} />
        <StatTile code="PN" label="Pending Review" value={data.documentStats.pendingCount} tone="amber" />
      </div>

      {/* Recent Activity */}
      <RecentActivity documents={data.recentDocuments} />

      {/* Quick Action Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/lecturer-portal/evidence" className="pro-action block p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Upload</div>
          <div className="mt-2 text-lg font-semibold text-slate-950">Evidence</div>
          <div className="mt-2 text-sm leading-6 text-slate-700">Submit research, teaching, and service documents.</div>
        </Link>

        <Link href="/lecturer-portal/application" className="pro-action block p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">View</div>
          <div className="mt-2 text-lg font-semibold text-slate-950">Application</div>
          <div className="mt-2 text-sm leading-6 text-slate-700/85">Check your promotion status and scores.</div>
        </Link>

        <Link href="/lecturer-portal/queries" className="pro-action block p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Inbox</div>
          <div className="mt-2 text-lg font-semibold text-slate-950">HR Feedback</div>
          <div className="mt-2 text-sm leading-6 text-slate-700">Review flagged documents and HR comments.</div>
        </Link>

        <Link href="/lecturer-portal/profile" className="pro-action block p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Profile</div>
          <div className="mt-2 text-lg font-semibold text-slate-950">Account Settings</div>
          <div className="mt-2 text-sm leading-6 text-slate-700">View your official academic profile.</div>
        </Link>
      </div>
    </div>
  );
}

function StatTile({ code, label, value, tone = 'teal' }: { code: string; label: string; value: number; tone?: 'teal' | 'amber' }) {
  const toneClass = tone === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-teal-50 text-teal-800 border-teal-200';
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
