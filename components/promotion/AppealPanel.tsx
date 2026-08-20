'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { FileWarning, RefreshCw, Send } from 'lucide-react';

type Role = 'LECTURER' | 'STAFF' | 'HR_ADMIN' | 'SYSTEM_ADMIN' | 'COMMITTEE_REVIEWER';
type Appeal = {
  id: number;
  status: string;
  grounds: string;
  filedAt: string;
  dueAt?: string | null;
  decidedAt?: string | null;
  decision?: string | null;
  filedBy?: { name?: string | null; email?: string | null } | null;
};

type Props = { requestId: number; role: Role; requestStatus?: string };

const appealableStatuses = new Set(['NOT_RECOMMENDED', 'REJECTED', 'COMPLETED', 'APPROVED_BY_AUTHORITY']);
const nextStatuses: Record<string, string[]> = {
  FILED: ['UNDER_REVIEW', 'WITHDRAWN', 'CLOSED'],
  UNDER_REVIEW: ['HEARING_SCHEDULED', 'DECIDED', 'CLOSED'],
  HEARING_SCHEDULED: ['DECIDED', 'CLOSED'],
  DECIDED: ['CLOSED'],
  WITHDRAWN: ['CLOSED'],
};

function label(value?: string | null) {
  if (!value) return 'Not recorded';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function dateLabel(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function statusTone(status: string) {
  if (status === 'DECIDED' || status === 'CLOSED') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'WITHDRAWN') return 'border-gray-200 bg-gray-50 text-gray-700';
  return 'border-amber-200 bg-amber-50 text-amber-900';
}

export default function AppealPanel({ requestId, role, requestStatus }: Props) {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [grounds, setGrounds] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Record<number, string>>({});
  const [decision, setDecision] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const isApplicant = role === 'LECTURER' || role === 'STAFF';
  const canDecide = role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN';
  const canFile = isApplicant && appealableStatuses.has(requestStatus || '') && !appeals.some((appeal) => ['FILED', 'UNDER_REVIEW', 'HEARING_SCHEDULED'].includes(appeal.status));

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/promotion-requests/' + requestId + '/appeals', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load appeal records');
      setAppeals(payload.data || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load appeal records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [requestId]);

  const fileAppeal = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/promotion-requests/' + requestId + '/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grounds }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to file appeal');
      setGrounds('');
      setMessage('Appeal filed and added to the official record.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to file appeal');
    } finally {
      setSaving(false);
    }
  };

  const updateAppeal = async (appeal: Appeal) => {
    const status = selectedStatus[appeal.id];
    if (!status) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/promotion-requests/' + requestId + '/appeals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appealId: appeal.id, status, decision: decision[appeal.id] || '' }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to update appeal');
      setMessage('Appeal updated to ' + label(status) + '.');
      setSelectedStatus((current) => ({ ...current, [appeal.id]: '' }));
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update appeal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6 border-t border-gray-200 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><FileWarning className="h-5 w-5 text-brand-primary" aria-hidden="true" /><h3 className="text-lg font-bold text-gray-950">Appeal Record</h3></div>
          <p className="mt-1 text-sm leading-6 text-gray-600">Track formal appeals, review status, due dates, and decisions for the promotion file.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" title="Refresh appeals"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh</button>
      </div>

      {canFile && (
        <form onSubmit={fileAppeal} className="mt-5 border-t border-gray-200 pt-5">
          <label className="block text-sm font-semibold text-gray-800">Appeal grounds<textarea required minLength={30} value={grounds} onChange={(event) => setGrounds(event.target.value)} className="brand-input mt-1 min-h-28" placeholder="State the procedural, evidence, or decision basis for the appeal..." /></label>
          <button type="submit" disabled={saving || grounds.trim().length < 30} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:bg-gray-300"><Send className="h-4 w-4" aria-hidden="true" /> {saving ? 'Filing...' : 'File appeal'}</button>
        </form>
      )}

      <div className="mt-5 space-y-3">
        {loading ? <p className="text-sm text-gray-600">Loading appeal records...</p> : appeals.length === 0 ? <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">No appeal record exists for this file.</p> : appeals.map((appeal) => (
          <article key={appeal.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-gray-950">Appeal #{appeal.id}</p><p className="mt-1 text-sm text-gray-600">Filed {dateLabel(appeal.filedAt)} | Due {dateLabel(appeal.dueAt)}</p></div><span className={'rounded-full border px-2.5 py-1 text-xs font-semibold ' + statusTone(appeal.status)}>{label(appeal.status)}</span></div>
            <p className="mt-3 border-l-2 border-amber-300 pl-3 text-sm leading-6 text-gray-700">{appeal.grounds}</p>
            {appeal.decision && <p className="mt-3 border-l-2 border-emerald-300 pl-3 text-sm leading-6 text-gray-700">Decision: {appeal.decision}</p>}
            {canDecide && (nextStatuses[appeal.status] || []).length > 0 && (
              <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_auto] md:items-end">
                <label className="text-sm font-semibold text-gray-800">Next status<select value={selectedStatus[appeal.id] || ''} onChange={(event) => setSelectedStatus((current) => ({ ...current, [appeal.id]: event.target.value }))} className="brand-input mt-1"><option value="">Select status</option>{(nextStatuses[appeal.status] || []).map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label>
                <label className="text-sm font-semibold text-gray-800">Decision or close-out note<textarea value={decision[appeal.id] || ''} onChange={(event) => setDecision((current) => ({ ...current, [appeal.id]: event.target.value }))} className="brand-input mt-1 min-h-20" placeholder="Required when deciding or closing the appeal..." /></label>
                <button type="button" onClick={() => void updateAppeal(appeal)} disabled={saving || !selectedStatus[appeal.id]} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primarySoft disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400">Update</button>
              </div>
            )}
          </article>
        ))}
      </div>
      {message && <p className="mt-4 text-sm font-medium text-gray-700">{message}</p>}
    </section>
  );
}