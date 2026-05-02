'use client';

import { useEffect, useMemo, useState } from 'react';

type AuditLogEntry = {
  timestamp: string;
  action: string;
  actor: string;
  ip: string;
  userAgent: string;
  details?: Record<string, unknown>;
};

type AuditResponse = {
  success: boolean;
  data?: AuditLogEntry[];
  meta?: {
    total: number;
    returned: number;
    limit: number;
    page: number;
    totalPages: number;
  };
  error?: string;
};

const LIMIT = 25;

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [textFilter, setTextFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', String(LIMIT));
    params.set('page', String(page));

    if (actionFilter) params.set('action', actionFilter);
    if (actorFilter) params.set('actor', actorFilter);
    if (textFilter) params.set('text', textFilter);
    if (startDateFilter) params.set('startDate', startDateFilter);
    if (endDateFilter) params.set('endDate', endDateFilter);

    return params.toString();
  }, [actionFilter, actorFilter, textFilter, startDateFilter, endDateFilter, page]);

  const exportQueryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('type', 'audit');

    if (actionFilter) params.set('action', actionFilter);
    if (actorFilter) params.set('actor', actorFilter);
    if (textFilter) params.set('text', textFilter);
    if (startDateFilter) params.set('startDate', startDateFilter);
    if (endDateFilter) params.set('endDate', endDateFilter);

    return params.toString();
  }, [actionFilter, actorFilter, textFilter, startDateFilter, endDateFilter]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, actorFilter, textFilter, startDateFilter, endDateFilter]);

  useEffect(() => {
    async function fetchAuditLogs() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/audit/logs?${queryString}`, { cache: 'no-store' });
        const payload = (await response.json()) as AuditResponse;

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || 'Failed to load audit logs');
        }

        setLogs(payload.data);
        setTotal(payload.meta?.total ?? payload.data.length);
        setTotalPages(payload.meta?.totalPages ?? 1);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    }

    fetchAuditLogs();
  }, [queryString]);

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="brand-hero px-6 py-7 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
          <div className="min-w-0 lg:flex-1">
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="mt-2 max-w-3xl text-sm text-blue-100/95">
              Track key system actions including authentication, appraisal submissions, and report exports.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:shrink-0 lg:justify-end">
            <a
              href={`/api/reports/export?${exportQueryString}&format=csv`}
              className="inline-flex w-full items-center justify-center rounded-xl border border-amber-200/40 bg-amber-300/20 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-300/30 sm:w-auto"
            >
              Export Audit CSV
            </a>
            <a
              href={`/api/reports/export?${exportQueryString}&format=pdf`}
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 sm:w-auto"
            >
              Export Audit PDF
            </a>
          </div>
        </div>
      </div>

      <div className="brand-surface-soft grid grid-cols-1 gap-3 p-4 md:grid-cols-3 xl:grid-cols-6">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Action</label>
          <input
            type="text"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            placeholder="e.g. auth.login"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Actor</label>
          <input
            type="text"
            value={actorFilter}
            onChange={(event) => setActorFilter(event.target.value)}
            placeholder="e.g. admin"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Text Search</label>
          <input
            type="text"
            value={textFilter}
            onChange={(event) => setTextFilter(event.target.value)}
            placeholder="ip, action, details"
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
              setActionFilter('');
              setActorFilter('');
              setTextFilter('');
              setStartDateFilter('');
              setEndDateFilter('');
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="brand-surface-soft overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Entries</h2>
          <p className="text-sm text-slate-600">
            Showing {logs.length} of {total} matching records (Page {page} of {totalPages})
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-slate-600">Loading audit logs...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-slate-600">No audit events found for the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="brand-table-head">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Actor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">User Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((entry, index) => (
                  <tr key={`${entry.timestamp}-${entry.action}-${index}`} className="align-top border-b border-slate-100 hover:bg-blue-50/25">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDateTime(entry.timestamp)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{entry.actor || 'unknown'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{entry.ip || 'unknown'}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={entry.userAgent}>
                      {entry.userAgent || 'unknown'}
                    </td>
                    <td className="max-w-md break-words px-4 py-3 text-slate-600">{formatDetails(entry.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && total > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Rows per page: {LIMIT}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatDetails(details?: Record<string, unknown>) {
  if (!details || Object.keys(details).length === 0) {
    return '-';
  }

  try {
    return JSON.stringify(details);
  } catch {
    return '-';
  }
}
