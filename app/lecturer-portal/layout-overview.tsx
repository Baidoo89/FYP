'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProgressStepper from '../../components/promotion/ProgressStepper';
import { AcademicHeader, PromotionReadinessGauge, RecentActivity } from '../../components/lecturer-dashboard/DashboardComponents';

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
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-8 text-center font-medium text-yellow-900 shadow-sm">
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
      <section id="home" className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-yellow-100">
              Lecturer Dashboard
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {data.user.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/90">
              Here's your promotion readiness snapshot. Track your application progress, upload evidence, and stay updated on all HR decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Academic Identity Header */}
      <AcademicHeader
        name={data.user.name}
        staffId={data.user.staffId || 'N/A'}
        currentRank={data.user.currentRank || 'Lecturer'}
        department={data.user.department || 'Not Assigned'}
      />

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

      {/* Quick Action Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/lecturer-portal/evidence" className="group rounded-2xl border border-blue-300 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">Upload</div>
          <div className="mt-2 text-lg font-bold text-white">Evidence</div>
          <div className="mt-2 text-sm leading-6 text-blue-50/95">Submit research, teaching, and service documents.</div>
        </Link>

        <Link href="/lecturer-portal/application" className="group rounded-2xl border border-yellow-300 bg-gradient-to-br from-yellow-500 via-yellow-400 to-yellow-300 p-5 text-yellow-950 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-900/85">View</div>
          <div className="mt-2 text-lg font-bold text-yellow-950">Application</div>
          <div className="mt-2 text-sm leading-6 text-yellow-950/85">Check your promotion status and scores.</div>
        </Link>

        <Link href="/lecturer-portal/queries" className="group rounded-2xl border border-yellow-300 bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-400 p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-100">Inbox</div>
          <div className="mt-2 text-lg font-bold text-white">HR Feedback</div>
          <div className="mt-2 text-sm leading-6 text-yellow-50/95">Review flagged documents and HR comments.</div>
        </Link>

        <Link href="/lecturer-portal/profile" className="group rounded-2xl border border-slate-300 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500 p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">Profile</div>
          <div className="mt-2 text-lg font-bold text-white">Account Settings</div>
          <div className="mt-2 text-sm leading-6 text-slate-50/95">View your official academic profile.</div>
        </Link>
      </div>

      {/* Recent Activity */}
      <RecentActivity documents={data.recentDocuments} />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-100 to-blue-50/40 p-6 shadow-sm">
          <div className="text-3xl">📁</div>
          <div className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Total Documents</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{data.recentDocuments.length}</div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-100 to-blue-50/40 p-6 shadow-sm">
          <div className="text-3xl">✓</div>
          <div className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Verified</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {data.recentDocuments.filter(d => d.verificationStatus === 'VERIFIED').length}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-100 to-amber-50/40 p-6 shadow-sm">
          <div className="text-3xl">⏳</div>
          <div className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Pending Review</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {data.recentDocuments.filter(d => d.verificationStatus === 'PENDING').length}
          </div>
        </div>
      </div>
    </div>
  );
}
