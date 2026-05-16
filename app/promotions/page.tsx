'use client';

import { useEffect, useState } from 'react';

type PromotionCandidate = {
  lecturer_id: number;
  lecturer_name: string;
  department: string;
  rank: string;
  total_score: number;
  previous_score: number | null;
  trend_delta: number;
  category: 'Excellent' | 'Good' | 'Average' | 'Poor';
  appraisal_date: string;
  confidence_score: number;
  risk_flags: string[];
  decision_status: 'Draft' | 'Reviewed' | 'Approved';
  decision_reason: string;
  recommendation: 'Recommended for Promotion' | 'Not Recommended';
};

type PromotionResponse = {
  success: boolean;
  data?: PromotionCandidate[];
  error?: string;
};

export default function PromotionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState<PromotionCandidate[]>([]);

  useEffect(() => {
    async function fetchCandidates() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/promotions/candidates');
        const payload = (await response.json()) as PromotionResponse;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load promotion candidates');
        }

        setCandidates(payload.data || []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load promotion candidates');
      } finally {
        setLoading(false);
      }
    }

    fetchCandidates();
  }, []);

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">Loading promotion candidates...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-900 shadow-sm">{error}</div>;
  }

  const summary = {
    approved: candidates.filter((candidate) => candidate.decision_status === 'Approved').length,
    reviewed: candidates.filter((candidate) => candidate.decision_status === 'Reviewed').length,
    draft: candidates.filter((candidate) => candidate.decision_status === 'Draft').length,
    highRisk: candidates.filter((candidate) => candidate.risk_flags.length >= 2).length,
  };

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="brand-hero px-6 py-7 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
          <div className="min-w-0 lg:flex-1">
            <h1 className="text-3xl font-bold">Promotion Decisions</h1>
            <p className="mt-2 max-w-3xl text-sm text-blue-100/95">Decision support using score trends, confidence, and risk indicators.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:shrink-0 lg:justify-end">
            <a
              href="/api/reports/export?type=promotions&format=csv"
              className="inline-flex w-full items-center justify-center rounded-xl border border-yellow-200/40 bg-yellow-300/20 px-4 py-2 text-sm font-semibold text-yellow-100 hover:bg-yellow-300/30 sm:w-auto"
            >
              Export CSV
            </a>
            <a
              href="/api/reports/export?type=promotions&format=pdf"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 sm:w-auto"
            >
              Export PDF
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Approved" value={summary.approved} className="border-blue-200 bg-blue-50 text-blue-900" />
        <SummaryCard title="Reviewed" value={summary.reviewed} className="border-blue-200 bg-blue-50 text-blue-900" />
        <SummaryCard title="Draft" value={summary.draft} className="border-slate-200 bg-slate-50 text-slate-900" />
        <SummaryCard title="High Risk" value={summary.highRisk} className="border-yellow-200 bg-yellow-50 text-yellow-900" />
      </div>

      <div className="brand-surface-soft overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900">Promotion Recommendation Board</h2>
          <p className="mt-1 text-sm text-slate-600">Total lecturers reviewed: {candidates.length}</p>
        </div>

        {candidates.length === 0 ? (
          <div className="p-6 text-slate-600">No appraisal records available for decision support yet.</div>
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {candidates.map((candidate) => (
                <article key={candidate.lecturer_id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{candidate.lecturer_name}</h3>
                      <p className="text-xs text-slate-500">{candidate.department} • {candidate.rank}</p>
                    </div>
                    <StatusBadge status={candidate.decision_status} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div><span className="font-semibold text-slate-800">Current:</span> {candidate.total_score}</div>
                    <div><span className="font-semibold text-slate-800">Previous:</span> {candidate.previous_score ?? 'N/A'}</div>
                    <div className="flex items-center gap-1"><span className="font-semibold text-slate-800">Trend:</span> <TrendBadge delta={candidate.trend_delta} hasPrevious={candidate.previous_score !== null} /></div>
                    <div><span className="font-semibold text-slate-800">Confidence:</span> {candidate.confidence_score}%</div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    <CategoryBadge category={candidate.category} />
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        candidate.recommendation === 'Recommended for Promotion'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-900'
                      }`}
                    >
                      {candidate.recommendation}
                    </span>
                  </div>

                  <div className="mt-2">
                    {candidate.risk_flags.length === 0 ? (
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">Low Risk</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {candidate.risk_flags.slice(0, 2).map((flag) => (
                          <span key={flag} className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-900">
                            {flag}
                          </span>
                        ))}
                        {candidate.risk_flags.length > 2 && (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">+{candidate.risk_flags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-slate-500">{candidate.decision_reason}</p>
                  <p className="mt-2 text-xs font-medium text-slate-600">Appraisal Date: {candidate.appraisal_date}</p>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1120px] text-sm">
                <thead className="brand-table-head">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Lecturer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Scores</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Trend</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Confidence</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Risk Flags</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Decision</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Appraisal Date</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.lecturer_id} className="border-b border-slate-100 hover:bg-blue-50/30">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{candidate.lecturer_name}</div>
                        <div className="text-xs text-slate-500">{candidate.rank}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{candidate.department}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">Current: {candidate.total_score}</div>
                        <div className="text-xs text-slate-500">Prev: {candidate.previous_score ?? 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <TrendBadge delta={candidate.trend_delta} hasPrevious={candidate.previous_score !== null} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                          {candidate.confidence_score}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {candidate.risk_flags.length === 0 ? (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">Low Risk</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {candidate.risk_flags.slice(0, 2).map((flag) => (
                              <span key={flag} className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-900">
                                {flag}
                              </span>
                            ))}
                            {candidate.risk_flags.length > 2 && (
                              <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">+{candidate.risk_flags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={candidate.decision_status} />
                      </td>
                      <td className="px-4 py-3">
                        <CategoryBadge category={candidate.category} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            candidate.recommendation === 'Recommended for Promotion'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-900'
                          }`}
                        >
                          {candidate.recommendation}
                        </span>
                        <p className="mt-1 max-w-xs text-xs text-slate-500">{candidate.decision_reason}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{candidate.appraisal_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type SummaryCardProps = {
  title: string;
  value: number;
  className: string;
};

function SummaryCard({ title, value, className }: SummaryCardProps) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-b from-white to-blue-50/35 px-4 py-4 shadow-sm ${className}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em]">{title}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

type TrendBadgeProps = {
  delta: number;
  hasPrevious: boolean;
};

function TrendBadge({ delta, hasPrevious }: TrendBadgeProps) {
  if (!hasPrevious) {
    return <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">Baseline</span>;
  }

  if (delta >= 0) {
    return <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">+{delta}</span>;
  }

  return <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-900">{delta}</span>;
}

type StatusBadgeProps = {
  status: 'Draft' | 'Reviewed' | 'Approved';
};

function StatusBadge({ status }: StatusBadgeProps) {
  const className =
    status === 'Approved'
      ? 'bg-blue-100 text-blue-800'
      : status === 'Reviewed'
      ? 'bg-yellow-100 text-yellow-900'
      : 'bg-blue-50 text-blue-900';

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}

type CategoryBadgeProps = {
  category: PromotionCandidate['category'];
};

function CategoryBadge({ category }: CategoryBadgeProps) {
  const className =
    category === 'Excellent'
      ? 'bg-blue-100 text-blue-800'
      : category === 'Good'
      ? 'bg-yellow-100 text-yellow-900'
      : category === 'Average'
      ? 'bg-blue-50 text-blue-900'
      : 'bg-yellow-50 text-yellow-900';

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{category}</span>;
}
