'use client';

import { useEffect, useState } from 'react';
import type { PerformanceMetrics } from '../../types';

type DepartmentAnalytics = {
  department: string;
  lecturers: number;
  appraisals: number;
  avg_total_score: number;
  promotion_candidates: number;
};

type AnalyticsSummary = {
  kpis: PerformanceMetrics;
  departments: DepartmentAnalytics[];
  trends: {
    appraisal_date: string;
    appraisals: number;
    avg_total_score: number;
    promotion_candidates: number;
  }[];
};

type AnalyticsResponse = {
  success: boolean;
  data?: AnalyticsSummary;
  error?: string;
};

export default function AnalyticsPage() {
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (departmentFilter) params.set('department', departmentFilter);
        if (startDateFilter) params.set('startDate', startDateFilter);
        if (endDateFilter) params.set('endDate', endDateFilter);

        const response = await fetch(`/api/analytics/summary?${params.toString()}`);
        const payload = (await response.json()) as AnalyticsResponse;

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || 'Failed to load analytics summary');
        }

        setSummary(payload.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load analytics summary');
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [departmentFilter, startDateFilter, endDateFilter]);

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">Loading analytics...</div>;
  }

  if (error || !summary) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700 shadow-sm">{error || 'Failed to load analytics summary'}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="brand-hero px-6 py-7 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics & Insights</h1>
            <p className="mt-2 max-w-3xl text-sm text-blue-100/95">Department-level performance analysis for strategic decision support.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <a
              href={`/api/reports/export?type=analytics&format=csv&department=${encodeURIComponent(departmentFilter)}&startDate=${encodeURIComponent(startDateFilter)}&endDate=${encodeURIComponent(endDateFilter)}`}
              className="inline-flex w-full items-center justify-center rounded-xl border border-amber-200/40 bg-amber-300/20 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-300/30 sm:w-auto"
            >
              Export CSV
            </a>
            <a
              href={`/api/reports/export?type=analytics&format=pdf&department=${encodeURIComponent(departmentFilter)}&startDate=${encodeURIComponent(startDateFilter)}&endDate=${encodeURIComponent(endDateFilter)}`}
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 sm:w-auto"
            >
              Export PDF
            </a>
          </div>
        </div>
      </div>

      <div className="brand-surface-soft grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Department</label>
          <input
            type="text"
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            placeholder="e.g. Computer Science"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Start Date</label>
          <input
            type="date"
            value={startDateFilter}
            onChange={(event) => setStartDateFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">End Date</label>
          <input
            type="date"
            value={endDateFilter}
            onChange={(event) => setEndDateFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setDepartmentFilter('');
              setStartDateFilter('');
              setEndDateFilter('');
            }}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Average Score" value={summary.kpis.average_performance_score} suffix="%" />
        <KpiCard label="Excellent" value={summary.kpis.excellent_count} />
        <KpiCard label="Good" value={summary.kpis.good_count} />
        <KpiCard label="Promotion Candidates" value={summary.kpis.promotion_candidates} />
      </div>

      <div className="brand-surface-soft overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900">Department Comparison</h2>
        </div>

        {summary.departments.length === 0 ? (
          <div className="p-6 text-slate-600">No department analytics available yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="brand-table-head">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Lecturers</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Appraisals</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Avg Total Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Promotion Candidates</th>
                </tr>
              </thead>
              <tbody>
                {summary.departments.map((department) => (
                  <tr key={department.department} className="border-b border-slate-100 hover:bg-blue-50/25">
                    <td className="px-4 py-3 font-semibold text-slate-900">{department.department}</td>
                    <td className="px-4 py-3 text-slate-700">{department.lecturers}</td>
                    <td className="px-4 py-3 text-slate-700">{department.appraisals}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{department.avg_total_score}</td>
                    <td className="px-4 py-3 text-slate-700">{department.promotion_candidates}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="brand-surface-soft overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900">Performance Trend by Appraisal Date</h2>
          <p className="mt-1 text-sm text-slate-600">Average total scores over time</p>
        </div>

        {summary.trends.length === 0 ? (
          <div className="p-6 text-slate-600">No trend data available yet.</div>
        ) : (
          <div className="p-6 space-y-4">
            {summary.trends.map((trend) => (
              <div key={trend.appraisal_date} className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_1fr_auto] sm:items-center">
                <div className="text-sm font-medium text-slate-700">{trend.appraisal_date}</div>
                <div className="h-6 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="flex h-full items-center justify-center bg-gradient-to-r from-blue-700 to-amber-500 text-xs font-semibold text-white"
                    style={{ width: `${Math.max((trend.avg_total_score / 100) * 100, 4)}%` }}
                  >
                    {trend.avg_total_score}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-600">
                  {trend.appraisals} appraisals
                </div>
              </div>
            ))}

            <div className="overflow-x-auto pt-2">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="brand-table-head">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Appraisals</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Avg Score</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Promotion Candidates</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.trends.map((trend) => (
                    <tr key={`trend-row-${trend.appraisal_date}`} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-700">{trend.appraisal_date}</td>
                      <td className="px-3 py-2 text-slate-700">{trend.appraisals}</td>
                      <td className="px-3 py-2 font-semibold text-slate-900">{trend.avg_total_score}</td>
                      <td className="px-3 py-2 text-slate-700">{trend.promotion_candidates}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type KpiCardProps = {
  label: string;
  value: number;
  suffix?: string;
};

function KpiCard({ label, value, suffix = '' }: KpiCardProps) {
  return (
    <div className="brand-surface-medium p-5">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
        {suffix}
      </p>
    </div>
  );
}
