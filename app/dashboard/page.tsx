'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { PerformanceMetrics } from '../../types';

type DashboardResponse = {
  success: boolean;
  data?: PerformanceMetrics;
  error?: string;
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/dashboard/metrics');
        const payload = (await response.json()) as DashboardResponse;

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || 'Failed to load dashboard metrics');
        }

        setMetrics(payload.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white/80 px-6 py-12 text-center text-slate-600 shadow-sm">
        Loading dashboard...
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center font-medium text-rose-700 shadow-sm">
        {error || 'Failed to load metrics'}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-blue-100/80 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] p-3 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-5 lg:p-6">
      <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-8 h-48 w-48 rounded-full bg-amber-200/25 blur-3xl" />

      <div className="relative space-y-8 lg:space-y-10">
        <section className="overflow-hidden rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.2)] sm:px-8 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-amber-300/25 bg-amber-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">
              Overview
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/90 sm:text-base">
              Track lecturer performance, promotion readiness, and system activity from a single management view.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[28rem] lg:grid-cols-2">
            <a
              href="/api/reports/export?type=dashboard&format=csv"
              className="inline-flex items-center justify-center rounded-xl border border-amber-300/40 bg-amber-400 px-4 py-3 text-sm font-bold text-amber-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300"
            >
              Export CSV
            </a>
            <a
              href="/api/reports/export?type=dashboard&format=pdf"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
            >
              Export PDF
            </a>
          </div>
        </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard
            title="Total Lecturers"
            value={metrics.total_lecturers}
            icon="👥"
            tone="blue"
          />
          <KPICard
            title="Average Score"
            value={`${metrics.average_performance_score}%`}
            icon="📊"
            tone="gold"
          />
          <KPICard
            title="Excellent"
            value={metrics.excellent_count}
            icon="⭐"
            tone="amber"
          />
          <KPICard
            title="Promotion Candidates"
            value={metrics.promotion_candidates}
            icon="🏆"
            tone="slate"
          />
        </div>

        <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/90 to-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Performance Distribution</h2>
              <p className="mt-1 text-sm text-slate-600">How current lecturer outcomes are distributed across categories.</p>
            </div>
            <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
              Updated live from the database
            </span>
          </div>
          <div className="space-y-4">
            <PerformanceBar
              label="Excellent (80-100)"
              count={metrics.excellent_count}
              color="bg-gradient-to-r from-emerald-500 to-emerald-400"
            />
            <PerformanceBar
              label="Good (70-79)"
              count={metrics.good_count}
              color="bg-gradient-to-r from-blue-600 to-blue-500"
            />
            <PerformanceBar
              label="Average (50-69)"
              count={metrics.average_count}
              color="bg-gradient-to-r from-amber-400 to-amber-300"
            />
            <PerformanceBar
              label="Poor (<50)"
              count={metrics.poor_count}
              color="bg-gradient-to-r from-rose-500 to-rose-400"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/85 to-white p-6 shadow-sm sm:p-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-600">Jump straight to the parts of the system you use most.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/lecturers"
              className="group rounded-2xl border border-blue-300 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">Manage</div>
              <div className="mt-2 text-lg font-bold text-white">Lecturers</div>
              <div className="mt-2 text-sm leading-6 text-blue-50/95">Add, edit, or view lecturer profiles.</div>
            </Link>
            <Link
              href="/appraisals"
              className="group rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-300 p-5 text-amber-950 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-900/85">Record</div>
              <div className="mt-2 text-lg font-bold text-amber-950">Appraisals</div>
              <div className="mt-2 text-sm leading-6 text-amber-950/85">Add performance scores and evaluations.</div>
            </Link>
            <Link
              href="/analytics"
              className="group rounded-2xl border border-cyan-300 bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-600 p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">Explore</div>
              <div className="mt-2 text-lg font-bold text-white">Analytics</div>
              <div className="mt-2 text-sm leading-6 text-cyan-50/95">View performance trends and insights.</div>
            </Link>
            <Link
              href="/promotions"
              className="group rounded-2xl border border-indigo-300 bg-gradient-to-br from-indigo-700 via-blue-700 to-amber-500 p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-100">Decide</div>
              <div className="mt-2 text-lg font-bold text-white">Promotions</div>
              <div className="mt-2 text-sm leading-6 text-blue-50/95">Review promotion candidates.</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
  tone: 'blue' | 'gold' | 'amber' | 'slate';
}

function KPICard({ title, value, icon, tone }: KPICardProps) {
  const cardStyles = {
    blue: 'border-blue-200 bg-gradient-to-br from-blue-100 to-blue-50/40',
    gold: 'border-amber-300 bg-gradient-to-br from-amber-100 to-amber-50/40',
    amber: 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/40',
    slate: 'border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50',
  };

  return (
    <div className={`${cardStyles[tone]} rounded-2xl border p-6 shadow-sm`}>
      <div className="text-3xl">{icon}</div>
      <div className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

interface PerformanceBarProps {
  label: string;
  count: number;
  color: string;
}

function PerformanceBar({ label, count, color }: PerformanceBarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div className="text-sm font-medium text-slate-700 sm:w-32 sm:shrink-0">{label}</div>
      <div className="h-6 w-full flex-1 overflow-hidden rounded-full bg-blue-100/60">
        <div
          className={`${color} flex h-full items-center justify-center transition-all`}
          style={{ width: `${Math.max(count * 20, 5)}%` }}
        >
          {count > 0 && <span className="text-white text-xs font-semibold">{count}</span>}
        </div>
      </div>
      <div className="text-left font-semibold text-slate-800 sm:w-12 sm:text-right">{count}</div>
    </div>
  );
}
