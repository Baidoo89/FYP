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
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center font-medium text-blue-900 shadow-sm">
          {error || 'Failed to load dashboard'}
        </div>
      </div>
    );
  }

  const currentStep = data.activeRequest
    ? data.activeRequest.status === 'APPROVED'
      ? 5
      : data.activeRequest.status === 'REJECTED'
        ? 0
        : data.activeRequest.status === 'UNDER_REVIEW'
          ? 3
          : 2
    : 0;

  return (
    <div className="space-y-6">
      <section id="home" className="pro-hero px-6 py-8">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr] xl:items-end">
          <div>
            <div className="pro-eyebrow">
              Overview Dashboard
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Welcome back,
              <span className="mt-1 block break-words text-teal-700"> {data.user.name}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Track your promotion readiness, manage evidence submissions, and stay updated with all HR decisions in one secure workspace.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 backdrop-blur-sm sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Full Name</p>
                <p className="mt-2 break-words text-sm font-bold leading-snug text-slate-950 sm:text-base">{data.user.name}</p>
              </div>
              <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Current Rank</p>
                <p className="mt-2 break-words text-sm font-bold leading-snug text-slate-950 sm:text-base">{data.user.currentRank || 'Lecturer'}</p>
              </div>
              <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2 lg:col-span-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Department</p>
                <p className="mt-2 break-words text-sm font-bold leading-snug text-slate-950 sm:text-base">{data.user.department || 'Not Assigned'}</p>
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
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Your Promotion Journey</h3>
          <p className="mt-1 text-sm text-slate-600">Current stage: {data.activeRequest.status}</p>
          <div className="mt-6">
            <ProgressStepper
              currentStep={currentStep}
              steps={['Application Created', 'Documents Uploaded', 'HR Review', 'Eligibility Assessment', 'Final Decision']}
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
