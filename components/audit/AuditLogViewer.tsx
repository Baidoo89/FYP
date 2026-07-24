'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../enterprise-ui';

type AuditLogEntry = {
  timestamp: string;
  action: string;
  actor: string;
  ip: string;
  userAgent: string;
  details?: {
    entityType?: string | null;
    entityId?: string | null;
    description?: string | null;
    metadata?: unknown;
    [key: string]: unknown;
  };
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

type AuditLogViewerProps = {
  title?: string;
  eyebrow?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

type Tone = 'teal' | 'amber' | 'blue' | 'green' | 'rose' | 'slate';

const LIMIT = 25;

function labelFromAction(action: string) {
  return action
    .replace(/_/g, ' ')
    .replace(/\./g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function actionTone(action: string): Tone {
  const normalized = action.toLowerCase();
  if (normalized.includes('verify') || normalized.includes('approved') || normalized.includes('recommended')) return 'green';
  if (normalized.includes('return') || normalized.includes('correction') || normalized.includes('warning')) return 'amber';
  if (normalized.includes('reject') || normalized.includes('not_recommended') || normalized.includes('failed')) return 'rose';
  if (normalized.includes('export') || normalized.includes('report')) return 'blue';
  if (normalized.includes('create') || normalized.includes('submit')) return 'teal';
  return 'slate';
}

function toneClass(tone: Tone) {
  if (tone === 'amber') return 'border-amber-200 bg-amber-50 text-amber-900';
  if (tone === 'blue') return 'border-sky-200 bg-sky-50 text-sky-900';
  if (tone === 'green') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (tone === 'rose') return 'border-rose-200 bg-rose-50 text-rose-900';
  if (tone === 'slate') return 'border-gray-200 bg-gray-50 text-gray-700';
  return 'border-teal-200 bg-teal-50 text-teal-900';
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDetails(details?: AuditLogEntry['details']) {
  if (!details) return 'No extra details recorded.';

  const description = typeof details.description === 'string' && details.description.trim()
    ? details.description
    : '';
  const metadata = details.metadata;

  if (!metadata || (typeof metadata === 'object' && Object.keys(metadata as Record<string, unknown>).length === 0)) {
    return description || 'No extra details recorded.';
  }

  try {
    return `${description ? `${description} ` : ''}${JSON.stringify(metadata)}`.trim();
  } catch {
    return description || 'Metadata unavailable.';
  }
}

export default function AuditLogViewer({
  title = 'Audit Trail',
  eyebrow = 'System Audit Trail',
  description = 'Monitor sensitive workflow actions, report exports, verification decisions, and administrative activity across the promotion system.',
  backHref,
  backLabel = 'Back',
}: AuditLogViewerProps) {
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

  const visibleMetrics = useMemo(() => {
    const verification = logs.filter((log) => /verify|verification|document/i.test(log.action)).length;
    const workflow = logs.filter((log) => /status|workflow|review|recommend/i.test(log.action)).length;
    const exports = logs.filter((log) => /export|report/i.test(log.action)).length;
    const sensitive = logs.filter((log) => /reject|return|correction|not_recommended|failed/i.test(log.action)).length;

    return { verification, workflow, exports, sensitive };
  }, [logs]);

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

  const clearFilters = () => {
    setActionFilter('');
    setActorFilter('');
    setTextFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setPage(1);
  };

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <section className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="pro-eyebrow">{eyebrow}</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">{description}</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
            {backHref && (
              <a href={backHref} className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 sm:w-auto">
                {backLabel}
              </a>
            )}
            <a href={`/api/reports/export?${exportQueryString}&format=csv`} className="inline-flex w-full items-center justify-center rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 sm:w-auto">
              Export CSV
            </a>
            <a href={`/api/reports/export?${exportQueryString}&format=pdf`} className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 sm:w-auto">
              Export PDF
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard code="ALL" label="Matching events" value={total} tone="teal" />
        <MetricCard code="VER" label="Verification" value={visibleMetrics.verification} tone="green" />
        <MetricCard code="WF" label="Workflow" value={visibleMetrics.workflow} tone="blue" />
        <MetricCard code="EXP" label="Exports" value={visibleMetrics.exports} tone="slate" />
        <MetricCard code="ATT" label="Attention" value={visibleMetrics.sensitive} tone="amber" />
      </section>

      <section className="pro-card p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr_11rem_11rem_auto] xl:items-end">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Action</span>
            <input value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} placeholder="promotion_request" className="brand-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Actor</span>
            <input value={actorFilter} onChange={(event) => setActorFilter(event.target.value)} placeholder="Name or email" className="brand-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Text Search</span>
            <input value={textFilter} onChange={(event) => setTextFilter(event.target.value)} placeholder="description, IP, entity" className="brand-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Start</span>
            <input type="date" value={startDateFilter} onChange={(event) => setStartDateFilter(event.target.value)} className="brand-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">End</span>
            <input type="date" value={endDateFilter} onChange={(event) => setEndDateFilter(event.target.value)} className="brand-input" />
          </label>
          <button type="button" onClick={clearFilters} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
            Clear
          </button>
        </div>
      </section>

      <section className="pro-card overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold text-gray-950">Activity Timeline</h2>
            <p className="mt-1 text-sm text-gray-600">Showing {logs.length} of {total} matching records. Page {page} of {totalPages}.</p>
          </div>
          <span className="w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">Immutable log</span>
        </div>

        {loading ? (
          <div className="p-5"><LoadingState label="Loading audit activity..." /></div>
        ) : error ? (
          <div className="p-5"><ErrorState message={error} /></div>
        ) : logs.length === 0 ? (
          <div className="p-5"><EmptyState title="No audit events found" description="Adjust filters or perform workflow actions to populate this audit trail." /></div>
        ) : (
          <div className="pro-scroll-x">
            <table className="w-full min-w-[1040px] text-sm">
              <thead className="brand-table-head text-left text-xs uppercase tracking-[0.14em] text-gray-500">
                <tr>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((entry, index) => {
                  const tone = actionTone(entry.action);
                  return (
                    <tr key={`${entry.timestamp}-${entry.action}-${index}`} className="align-top border-t border-gray-100 hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-4 text-gray-700">{formatDateTime(entry.timestamp)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneClass(tone)}`}>{labelFromAction(entry.action)}</span>
                        <p className="mt-1 text-xs text-gray-500">{entry.action}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-700">{entry.actor || 'System'}</td>
                      <td className="px-5 py-4 text-gray-700">
                        <p className="font-semibold text-gray-950">{entry.details?.entityType || 'System'}</p>
                        <p className="mt-1 text-xs text-gray-500">{entry.details?.entityId || 'No entity ID'}</p>
                      </td>
                      <td className="max-w-xl px-5 py-4 text-gray-600">{formatDetails(entry.details)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">{entry.ip || 'Not captured'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && total > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">Rows per page: {LIMIT}</p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                Previous
              </button>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <PolicyCard title="Compliance" detail="Workflow, review, verification, export, and administrative actions are captured for accountability." code="01" />
        <PolicyCard title="Traceability" detail="Each entry links actor, entity, timestamp, description, and metadata where available." code="02" />
        <PolicyCard title="Exports" detail="CSV and PDF exports are available for official reporting and supervisor review." code="03" />
      </section>
    </div>
  );
}

function MetricCard({ code, label, value, tone }: { code: string; label: string; value: number; tone: Tone }) {
  return (
    <div className="pro-tile p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-950">{value}</p>
        </div>
        <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${toneClass(tone)}`}>{code}</span>
      </div>
    </div>
  );
}

function PolicyCard({ code, title, detail }: { code: string; title: string; detail: string }) {
  return (
    <div className="pro-card p-5">
      <span className="pro-code-badge">{code}</span>
      <h3 className="mt-4 font-semibold text-gray-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">{detail}</p>
    </div>
  );
}
