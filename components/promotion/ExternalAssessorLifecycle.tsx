'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, LockKeyhole, Mail, Plus, RefreshCw, Send, UsersRound } from 'lucide-react';

type Role = 'HOD_DEAN' | 'HR_ADMIN' | 'SYSTEM_ADMIN' | 'COMMITTEE_REVIEWER';
type Assessor = {
  id: number;
  name: string;
  institution?: string | null;
  country?: string | null;
  specialization?: string | null;
  officialEmail?: string | null;
  status: string;
  conflictReason?: string | null;
  reportSummary?: string | null;
  invitationExpiresAt?: string | null;
  portalLastAccessAt?: string | null;
  conflictDeclaredAt?: string | null;
};
type Props = { requestId: number; role: Role };

const nextStatuses: Record<string, string[]> = {
  NOMINATED: ['CONFLICTED', 'WITHDRAWN'],
  CONFLICTED: ['NOMINATED', 'WITHDRAWN'],
  INVITED: ['WITHDRAWN'],
  ACCEPTED: ['REPORT_REQUESTED', 'WITHDRAWN'],
  DECLINED: ['REPLACED'],
  REPORT_REQUESTED: ['REPORT_RECEIVED', 'WITHDRAWN'],
};
const statusLabels: Record<string, string> = {
  NOMINATED: 'Nominated',
  CONFLICTED: 'Conflict declared',
  INVITED: 'Invitation issued',
  ACCEPTED: 'Appointment accepted',
  DECLINED: 'Invitation declined',
  REPORT_REQUESTED: 'Report requested',
  REPORT_RECEIVED: 'Report received',
  REPLACED: 'Replaced',
  WITHDRAWN: 'Withdrawn',
};

function label(status: string) { return statusLabels[status] || status.toLowerCase().replace(/_/g, ' '); }
function statusTone(status: string) {
  if (status === 'REPORT_RECEIVED' || status === 'ACCEPTED') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'CONFLICTED' || status === 'DECLINED' || status === 'WITHDRAWN') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-blue-200 bg-blue-50 text-blue-800';
}

export default function ExternalAssessorLifecycle({ requestId, role }: Props) {
  const [assessors, setAssessors] = useState<Assessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [candidate, setCandidate] = useState({ name: '', institution: '', country: '', specialization: '', officialEmail: '' });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [selectedStatus, setSelectedStatus] = useState<Record<number, string>>({});
  const [previewUrl, setPreviewUrl] = useState('');

  const canNominate = ['HOD_DEAN', 'HR_ADMIN', 'SYSTEM_ADMIN'].includes(role);
  const canManage = ['HR_ADMIN', 'SYSTEM_ADMIN'].includes(role);
  const activeNominees = assessors.filter((assessor) => !['REPLACED', 'WITHDRAWN'].includes(assessor.status)).length;

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/promotion-requests/' + requestId + '/external-assessors', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load external assessors');
      setAssessors(payload.data || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load external assessors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [requestId]);

  const nominate = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/promotion-requests/' + requestId + '/external-assessors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to nominate external assessor');
      setCandidate({ name: '', institution: '', country: '', specialization: '', officialEmail: '' });
      setMessage('External assessor candidate nominated. ' + payload.data.nomineeCount + ' active candidate(s) recorded.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to nominate external assessor');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (assessor: Assessor) => {
    const status = selectedStatus[assessor.id];
    if (!status) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/promotion-requests/' + requestId + '/external-assessors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessorId: assessor.id,
          status,
          conflictReason: status === 'CONFLICTED' ? notes[assessor.id] || '' : undefined,
          reportSummary: status === 'REPORT_RECEIVED' ? notes[assessor.id] || '' : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to update assessor lifecycle');
      setMessage(assessor.name + ': ' + label(status) + ' recorded.');
      setSelectedStatus((current) => ({ ...current, [assessor.id]: '' }));
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update assessor lifecycle');
    } finally {
      setSaving(false);
    }
  };

  const sendInvitation = async (assessor: Assessor) => {
    setSaving(true);
    setMessage('');
    setPreviewUrl('');
    try {
      const response = await fetch('/api/promotion-requests/' + requestId + '/external-assessors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessorId: assessor.id, action: 'send_invitation' }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to send secure invitation');
      setPreviewUrl(payload.data.previewUrl || '');
      setMessage(payload.data.delivered
        ? assessor.name + ': secure invitation delivered.'
        : assessor.name + ': invitation generated in development email mode.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send secure invitation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6 border-t border-gray-200 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><UsersRound className="h-5 w-5 text-brand-primary" aria-hidden="true" /><h3 className="text-lg font-bold text-gray-950">External Assessors</h3></div>
          <p className="mt-1 text-sm leading-6 text-gray-600">Track candidates, conflicts, appointments, and confidential report receipt.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" title="Refresh external assessors"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh</button>
      </div>

      <div className={'mt-4 rounded-lg border p-3 text-sm ' + (activeNominees >= 3 ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900')}>
        <span className="font-semibold">{activeNominees} active candidate(s) recorded.</span> The GCTU academic route normally requires the HOD to propose at least three assessor candidates.
      </div>

      {canNominate && (
        <form onSubmit={nominate} className="mt-5 border-t border-gray-200 pt-5">
          <h4 className="text-sm font-bold text-gray-950">Nominate assessor candidate</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold text-gray-800">Full name<input required value={candidate.name} onChange={(event) => setCandidate((current) => ({ ...current, name: event.target.value }))} className="brand-input mt-1" /></label>
            <label className="text-sm font-semibold text-gray-800">Institution<input required value={candidate.institution} onChange={(event) => setCandidate((current) => ({ ...current, institution: event.target.value }))} className="brand-input mt-1" /></label>
            <label className="text-sm font-semibold text-gray-800">Country<input required value={candidate.country} onChange={(event) => setCandidate((current) => ({ ...current, country: event.target.value }))} className="brand-input mt-1" /></label>
            <label className="text-sm font-semibold text-gray-800">Specialization<input required value={candidate.specialization} onChange={(event) => setCandidate((current) => ({ ...current, specialization: event.target.value }))} className="brand-input mt-1" /></label>
            <label className="text-sm font-semibold text-gray-800 md:col-span-2">Official email<input required type="email" value={candidate.officialEmail} onChange={(event) => setCandidate((current) => ({ ...current, officialEmail: event.target.value }))} className="brand-input mt-1" /></label>
          </div>
          <button type="submit" disabled={saving} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:bg-gray-300"><Plus className="h-4 w-4" aria-hidden="true" /> {saving ? 'Saving...' : 'Add candidate'}</button>
        </form>
      )}

      <div className="mt-5 space-y-3">
        {loading ? <p className="text-sm text-gray-600">Loading assessor register...</p> : assessors.length === 0 ? <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">No external assessor candidates have been recorded yet.</p> : assessors.map((assessor) => (
          <article key={assessor.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><p className="font-semibold text-gray-950">{assessor.name}</p><p className="mt-1 text-sm text-gray-600">{assessor.institution || 'Institution not recorded'} | {assessor.country || 'Country not recorded'}</p><p className="mt-1 text-xs text-gray-500">{assessor.specialization || 'Specialization not recorded'}</p><p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500"><Mail className="h-3.5 w-3.5" aria-hidden="true" /> {assessor.officialEmail || 'No official email'}</p></div>
              <span className={'rounded-full border px-2.5 py-1 text-xs font-semibold ' + statusTone(assessor.status)}>{label(assessor.status)}</span>
            </div>
            {assessor.conflictReason && <p className="mt-3 border-l-2 border-amber-300 pl-3 text-sm text-gray-700">Conflict: {assessor.conflictReason}</p>}
            {assessor.reportSummary && <p className="mt-3 border-l-2 border-emerald-300 pl-3 text-sm text-gray-700">Confidential report summary recorded.</p>}
            {assessor.invitationExpiresAt && <p className="mt-2 text-xs font-medium text-gray-500">Invitation expires {new Date(assessor.invitationExpiresAt).toLocaleString()}{assessor.portalLastAccessAt ? ` � Last opened ${new Date(assessor.portalLastAccessAt).toLocaleString()}` : ''}</p>}
            {canManage && ['NOMINATED', 'INVITED'].includes(assessor.status) && (
              <button type="button" onClick={() => void sendInvitation(assessor)} disabled={saving} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark disabled:opacity-50">
                <Mail className="h-4 w-4" aria-hidden="true" /> {assessor.status === 'INVITED' ? 'Reissue secure invitation' : 'Send secure invitation'}
              </button>
            )}
            {canManage && (nextStatuses[assessor.status] || []).length > 0 && (
              <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] md:items-end">
                <label className="text-sm font-semibold text-gray-800">Next lifecycle event<select value={selectedStatus[assessor.id] || ''} onChange={(event) => setSelectedStatus((current) => ({ ...current, [assessor.id]: event.target.value }))} className="brand-input mt-1"><option value="">Select event</option>{(nextStatuses[assessor.status] || []).map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label>
                <label className="text-sm font-semibold text-gray-800">Conflict reason or confidential report summary<textarea value={notes[assessor.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [assessor.id]: event.target.value }))} className="brand-input mt-1 min-h-20" placeholder="Required for conflict declaration or report receipt..." /></label>
                <button type="button" onClick={() => void updateStatus(assessor)} disabled={saving || !selectedStatus[assessor.id]} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primarySoft disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"><Send className="h-4 w-4" aria-hidden="true" /> Record</button>
              </div>
            )}
          </article>
        ))}
      </div>
      {message && <p className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700"><CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> {message}</p>}
      {previewUrl && <a href={previewUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primarySoft"><LockKeyhole className="h-4 w-4" aria-hidden="true" /> Open development invitation</a>}
    </section>
  );
}
