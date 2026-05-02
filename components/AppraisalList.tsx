'use client';

import { useEffect, useState } from 'react';

type AppraisalItem = {
  id: number;
  lecturer_name: string;
  department: string;
  rank: string;
  teaching_score: number;
  research_score: number;
  service_score: number;
  total_score: number;
  category: 'Excellent' | 'Good' | 'Average' | 'Poor';
  is_promotion_recommended: boolean;
  appraisal_date: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type AppraisalListProps = {
  refreshToken: number;
};

export default function AppraisalList({ refreshToken }: AppraisalListProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appraisals, setAppraisals] = useState<AppraisalItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AppraisalItem['category']>('all');
  const [promotionFilter, setPromotionFilter] = useState<'all' | 'yes' | 'no'>('all');

  useEffect(() => {
    async function loadAppraisals() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/appraisals');
        const payload = (await response.json()) as ApiResponse<AppraisalItem[]>;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load appraisals');
        }

        setAppraisals(payload.data || []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load appraisals');
      } finally {
        setLoading(false);
      }
    }

    loadAppraisals();
  }, [refreshToken]);

  if (loading) {
    return <div className="brand-surface-soft p-6 text-slate-600">Loading appraisals...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">{error}</div>;
  }

  if (appraisals.length === 0) {
    return <div className="brand-surface-soft p-6 text-slate-600">No appraisals found yet.</div>;
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredAppraisals = appraisals.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      return false;
    }

    if (promotionFilter === 'yes' && !item.is_promotion_recommended) {
      return false;
    }

    if (promotionFilter === 'no' && item.is_promotion_recommended) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const haystack = [item.lecturer_name, item.department, item.rank, item.appraisal_date]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  const decisionSummary = {
    advance: filteredAppraisals.filter((item) => item.total_score >= 80).length,
    observe: filteredAppraisals.filter((item) => item.total_score >= 70 && item.total_score < 80).length,
    develop: filteredAppraisals.filter((item) => item.total_score >= 50 && item.total_score < 70).length,
    intervene: filteredAppraisals.filter((item) => item.total_score < 50).length,
  };

  return (
    <div className="brand-surface-soft overflow-hidden">
      <div className="border-b border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-900">Decision Records</h2>
        <p className="mt-1 text-sm text-slate-600">Total appraisal entries: {appraisals.length}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <DecisionStat label="Advance" value={decisionSummary.advance} className="border-emerald-200 bg-emerald-50 text-emerald-800" />
          <DecisionStat label="Observe" value={decisionSummary.observe} className="border-blue-200 bg-blue-50 text-blue-800" />
          <DecisionStat label="Develop" value={decisionSummary.develop} className="border-amber-200 bg-amber-50 text-amber-800" />
          <DecisionStat label="Intervene" value={decisionSummary.intervene} className="border-rose-200 bg-rose-50 text-rose-800" />
        </div>

        <div className="brand-muted-panel mt-5 p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Search</label>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Lecturer, department, rank, date"
                className="brand-input py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Category</label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as 'all' | AppraisalItem['category'])}
                className="brand-input py-2"
              >
                <option value="all">All categories</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Promotion</label>
              <select
                value={promotionFilter}
                onChange={(event) => setPromotionFilter(event.target.value as 'all' | 'yes' | 'no')}
                className="brand-input py-2"
              >
                <option value="all">All recommendations</option>
                <option value="yes">Recommended</option>
                <option value="no">Not recommended</option>
              </select>
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500">Showing {filteredAppraisals.length} result(s)</p>
      </div>

      {filteredAppraisals.length === 0 ? (
        <div className="p-6 text-sm text-slate-600">No appraisal records match the selected filters.</div>
      ) : (
        <>
          <div className="space-y-3 p-4 md:hidden">
            {filteredAppraisals.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.lecturer_name}</h3>
                    <p className="text-xs text-slate-500">{item.department} • {item.rank}</p>
                  </div>
                  <CategoryBadge category={item.category} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div><span className="font-semibold text-slate-800">Total:</span> {item.total_score}</div>
                  <div><span className="font-semibold text-slate-800">Date:</span> {item.appraisal_date}</div>
                  <div><span className="font-semibold text-slate-800">Scores:</span> {item.teaching_score}/{item.research_score}/{item.service_score}</div>
                  <div className="flex items-center gap-1"><DecisionBandBadge totalScore={item.total_score} /></div>
                </div>
                <div className="mt-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      item.is_promotion_recommended
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.is_promotion_recommended ? 'Recommended' : 'Not Recommended'}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[26%]" />
                <col className="w-[18%]" />
                <col className="w-[9%]" />
                <col className="w-[11%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="brand-table-head">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Lecturer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Scores (T/R/S)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Decision Band</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Promotion</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppraisals.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-blue-50/40">
                    <td className="px-4 py-3">
                      <div className="truncate font-semibold text-slate-900" title={item.lecturer_name}>{item.lecturer_name}</div>
                      <div className="truncate text-xs text-slate-500" title={`${item.department} • ${item.rank}`}>{item.department} • {item.rank}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {item.teaching_score} / {item.research_score} / {item.service_score}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{item.total_score}</td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="px-4 py-3">
                      <DecisionBandBadge totalScore={item.total_score} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          item.is_promotion_recommended
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.is_promotion_recommended ? 'Recommended' : 'Not Recommended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.appraisal_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

type CategoryBadgeProps = {
  category: AppraisalItem['category'];
};

function CategoryBadge({ category }: CategoryBadgeProps) {
  const className =
    category === 'Excellent'
      ? 'bg-green-100 text-green-800'
      : category === 'Good'
      ? 'bg-blue-100 text-blue-800'
      : category === 'Average'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800';

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{category}</span>;
}

type DecisionStatProps = {
  label: string;
  value: number;
  className: string;
};

function DecisionStat({ label, value, className }: DecisionStatProps) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${className}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em]">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

type DecisionBandBadgeProps = {
  totalScore: number;
};

function DecisionBandBadge({ totalScore }: DecisionBandBadgeProps) {
  const band =
    totalScore >= 80
      ? { label: 'Advance', className: 'bg-emerald-100 text-emerald-800' }
      : totalScore >= 70
      ? { label: 'Observe', className: 'bg-blue-100 text-blue-800' }
      : totalScore >= 50
      ? { label: 'Develop', className: 'bg-amber-100 text-amber-800' }
      : { label: 'Intervene', className: 'bg-rose-100 text-rose-800' };

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${band.className}`}>{band.label}</span>;
}
