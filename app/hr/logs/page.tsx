'use client';

import { useEffect, useState } from 'react';

type AuditLog = {
  id: number;
  requestId: number;
  actorId: number;
  action: string;
  metadata: Record<string, any>;
  createdAt: string;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/audit/logs');
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load audit logs');
        }

        setLogs(payload.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (actionFilter) {
      filtered = filtered.filter((log) => log.action.includes(actionFilter));
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.requestId.toString().includes(searchTerm) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, actionFilter, searchTerm]);

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  const getActionIcon = (action: string) => {
    if (action.includes('verified')) return '✅';
    if (action.includes('rejected')) return '❌';
    if (action.includes('created')) return '📝';
    if (action.includes('updated')) return '📝';
    if (action.includes('submitted')) return '📤';
    return '📋';
  };

  const getActionLabel = (action: string) => {
    return action
      .split('.')
      .pop()
      ?.replace(/_/g, ' ')
      .toLowerCase() || action;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
        Loading Audit Logs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-950 shadow-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-slate-950 via-blue-900 to-blue-800 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-yellow-100">
              Activity Tracking
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Audit Logs</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/90">
              Complete activity trail for all promotion system actions. Monitor verification activities, document changes, and administrative actions.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/hr/dashboard"
              className="rounded-xl border border-blue-400 bg-transparent px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              ← Back
            </a>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Events" value={logs.length} icon="📊" />
        <StatCard
          label="Verifications"
          value={logs.filter((l) => l.action.includes('verified')).length}
          icon="✅"
        />
        <StatCard
          label="Rejections"
          value={logs.filter((l) => l.action.includes('rejected')).length}
          icon="❌"
        />
        <StatCard label="Unique Actions" value={uniqueActions.length} icon="📝" />
      </section>

      {/* Filters */}
      <section className="grid gap-4 lg:grid-cols-2">
        <input
          type="text"
          placeholder="Search by request ID or action..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm"
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm"
        >
          <option value="">All Actions</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </section>

      {/* Activity Timeline */}
      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Activity Timeline</h2>
            <p className="mt-1 text-sm text-slate-600">Complete audit trail of all system actions</p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
            {filteredLogs.length} events
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">No audit logs found matching your criteria.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/50">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{getActionIcon(log.action)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-900">
                          Request #{log.requestId}
                        </div>
                        <div className="mt-1 text-sm text-slate-600 capitalize">
                          {getActionLabel(log.action)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-600">
                          Actor ID: {log.actorId}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {formatDate(log.createdAt)}
                        </div>
                      </div>
                    </div>

                    {Object.keys(log.metadata).length > 0 && (
                      <div className="mt-3 rounded-lg bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-600 mb-2">Details:</div>
                        <div className="space-y-1 text-xs text-slate-600 font-mono">
                          {Object.entries(log.metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between gap-2">
                              <span className="font-semibold">{key}:</span>
                              <span>{JSON.stringify(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Info Card */}
      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
          <h3 className="font-semibold text-blue-950">📋 About Audit Logs</h3>
        <ul className="mt-3 space-y-2 text-sm text-blue-800">
          <li>• All system actions are logged automatically for compliance and transparency</li>
          <li>• Logs include document verification, rejections, and status changes</li>
          <li>• Each entry shows the timestamp, actor ID, and detailed metadata</li>
          <li>• Use filters and search to find specific activities</li>
          <li>• Logs are immutable and cannot be edited or deleted</li>
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-600">{label}</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}
