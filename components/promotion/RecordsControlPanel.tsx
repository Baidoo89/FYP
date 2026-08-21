'use client';

import { useEffect, useState } from 'react';
import { Archive, CalendarDays, History, LockKeyhole, MailCheck, RefreshCw, Send, ShieldAlert, UnlockKeyhole } from 'lucide-react';

type Control = {
  accessClassification: string;
  retentionClass: string;
  retentionTriggerDate?: string | null;
  retainUntil?: string | null;
  lifecycleStatus: string;
  legalHold: boolean;
  holdReason?: string | null;
  archiveReference?: string | null;
  destructionCertificateReference?: string | null;
};
type Delivery = { id: number; purpose: string; recipientAddress: string; subject: string; provider: string; status: string; errorMessage?: string | null; attemptedAt: string };
type Payload = {
  control: Control | null;
  communications: Delivery[];
  promotionRequest?: {
    effectiveDate?: string | null;
    nextApplicantUpdateDueAt?: string | null;
    promotionRoute?: { promotionTrack?: { type?: string | null } | null } | null;
  } | null;
};

const emptyControl: Control = { accessClassification: 'CONFIDENTIAL_SENSITIVE', retentionClass: 'EMPLOYMENT_END_PLUS_6_YEARS', lifecycleStatus: 'ACTIVE', legalHold: false };
function label(value: string) { return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function date(value?: string | null) { return value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value)) : 'Not set'; }
function deliveryTone(status: string) { return status === 'SENT' ? 'text-emerald-700' : status === 'FAILED' ? 'text-red-700' : 'text-amber-700'; }

export default function RecordsControlPanel({ requestId, requestStatus }: { requestId: number; requestStatus: string }) {
  const [data, setData] = useState<Payload>({ control: null, communications: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [triggerDate, setTriggerDate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/promotion-requests/${requestId}/records`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load records controls.');
      setData(payload.data);
      if (payload.data.promotionRequest?.effectiveDate) setEffectiveDate(payload.data.promotionRequest.effectiveDate.slice(0, 10));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load records controls.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [requestId]);

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    if (action === 'MARK_DISPOSED' && !window.confirm('Record authorized disposition? This does not delete the digital audit record.')) return;
    setSaving(true); setMessage('');
    try {
      const response = await fetch(`/api/promotion-requests/${requestId}/records`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, reason, reference, ...extra }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to update records controls.');
      setData(payload.data); setReason(''); setReference(''); setMessage(payload.message || 'Records control updated and audited.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update records controls.'); }
    finally { setSaving(false); }
  };

  const control = data.control || emptyControl;
  const request = data.promotionRequest;
  const scheduleJ = request?.promotionRoute?.promotionTrack?.type === 'SCHEDULE_J';
  const authorityApproved = ['APPROVED_BY_AUTHORITY', 'APPROVED', 'COMPLETED'].includes(requestStatus);
  return <section className="my-6 border-y border-gray-200 py-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Records and communications</p><h3 className="mt-1 text-xl font-bold text-gray-950">Controlled promotion record</h3><p className="mt-1 text-sm text-gray-600">Retention, holds, archival transfer, disposition authority, and delivery evidence.</p></div><button type="button" onClick={() => void load()} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" title="Refresh records"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh</button></div>
    {loading ? <p className="mt-5 text-sm text-gray-600">Loading controlled record...</p> : <div className="mt-5 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.85fr)]">
      <div className="min-w-0">
        <div className="mb-5 grid gap-3 border-b border-gray-200 pb-5 sm:grid-cols-2">
          {scheduleJ && <div className="rounded-lg border border-teal-200 bg-teal-50 p-4"><div className="flex items-center gap-2 text-teal-900"><MailCheck className="h-5 w-5" aria-hidden="true" /><p className="font-bold">Quarterly applicant update</p></div><p className="mt-2 text-sm text-teal-900">Next due: {date(request?.nextApplicantUpdateDueAt)}</p><button type="button" disabled={saving} onClick={() => void act('SEND_STATUS_UPDATE')} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-50"><Send className="h-4 w-4" aria-hidden="true" /> Send status update</button></div>}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4"><div className="flex items-center gap-2 text-blue-900"><CalendarDays className="h-5 w-5" aria-hidden="true" /><p className="font-bold">Promotion effective date</p></div><p className="mt-2 text-sm text-blue-900">Recorded: {date(request?.effectiveDate)}</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} disabled={!authorityApproved || saving} className="brand-input min-w-0" aria-label="Promotion effective date" /><button type="button" disabled={!authorityApproved || saving || !effectiveDate || reason.trim().length < 10} onClick={() => void act('SET_EFFECTIVE_DATE', { effectiveDate })} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-800 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-40"><CalendarDays className="h-4 w-4" aria-hidden="true" /> Record date</button></div></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs font-semibold text-gray-500">Classification<select value={control.accessClassification} disabled={saving} onChange={(event) => void act('SET_CLASSIFICATION', { classification: event.target.value })} className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-bold text-gray-900 focus:ring-0"><option value="OPEN">Open</option><option value="CONFIDENTIAL">Confidential</option><option value="CONFIDENTIAL_SENSITIVE">Confidential and sensitive</option><option value="SECRET">Secret</option></select></label>
          {[["Lifecycle", label(control.lifecycleStatus)], ["Retention class", label(control.retentionClass)], ["Retain until", date(control.retainUntil)]].map(([name, value]) => <div key={name} className="rounded-lg border border-gray-200 bg-gray-50 p-3"><p className="text-xs font-semibold text-gray-500">{name}</p><p className="mt-1 break-words text-sm font-bold text-gray-900">{value}</p></div>)}
        </div>
        {control.legalHold && <div className="mt-4 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><div><p className="font-bold">Disposition hold active</p><p className="mt-1 text-sm leading-6">{control.holdReason}</p></div></div>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-gray-800">Action reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className="brand-input mt-1 min-h-20" placeholder="Authority and reason..." /></label><div className="grid gap-3"><label className="text-sm font-semibold text-gray-800">Archive or certificate reference<input value={reference} onChange={(event) => setReference(event.target.value)} className="brand-input mt-1" /></label><label className="text-sm font-semibold text-gray-800">Employment-end trigger<input type="date" value={triggerDate} onChange={(event) => setTriggerDate(event.target.value)} className="brand-input mt-1" /></label></div></div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={saving || !triggerDate} onClick={() => void act('SET_RETENTION_TRIGGER', { triggerDate })} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"><History className="h-4 w-4" aria-hidden="true" /> Set retention</button>
          <button type="button" disabled={saving} onClick={() => void act(control.legalHold ? 'RELEASE_HOLD' : 'PLACE_HOLD')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50">{control.legalHold ? <UnlockKeyhole className="h-4 w-4" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}{control.legalHold ? 'Release hold' : 'Place hold'}</button>
          {requestStatus === 'COMPLETED' && <button type="button" disabled={saving} onClick={() => void act('CLOSE_RECORD')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"><Archive className="h-4 w-4" aria-hidden="true" /> Close record</button>}
          <button type="button" disabled={saving} onClick={() => void act('MARK_ARCHIVED')} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark disabled:opacity-50"><Archive className="h-4 w-4" aria-hidden="true" /> Record archive transfer</button>
          <button type="button" disabled={saving || control.legalHold || !control.retainUntil || new Date(control.retainUntil) > new Date()} onClick={() => void act('AUTHORIZE_DISPOSITION')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-40"><ShieldAlert className="h-4 w-4" aria-hidden="true" /> Authorize disposition</button>
          {control.lifecycleStatus === 'DISPOSITION_AUTHORIZED' && <button type="button" disabled={saving} onClick={() => void act('MARK_DISPOSED')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50"><Archive className="h-4 w-4" aria-hidden="true" /> Record disposition</button>}
        </div>
        {message && <p className="mt-3 text-sm font-medium text-gray-700">{message}</p>}
      </div>
      <div className="min-w-0 border-t border-gray-200 pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0"><div className="flex items-center gap-2"><MailCheck className="h-5 w-5 text-teal-700" aria-hidden="true" /><h4 className="font-bold text-gray-950">Email delivery history</h4></div>{data.communications.length === 0 ? <p className="mt-3 text-sm text-gray-600">No promotion email has been attempted yet.</p> : <ol className="mt-3 space-y-3">{data.communications.map((item) => <li key={item.id} className="border-b border-gray-100 pb-3 last:border-0"><div className="flex flex-wrap items-start justify-between gap-2"><p className="min-w-0 break-words text-sm font-semibold text-gray-900">{item.subject}</p><span className={`text-xs font-bold ${deliveryTone(item.status)}`}>{label(item.status)}</span></div><p className="mt-1 break-all text-xs text-gray-500">{item.recipientAddress} | {item.provider} | {date(item.attemptedAt)}</p>{item.errorMessage && <p className="mt-1 text-xs text-red-700">{item.errorMessage}</p>}</li>)}</ol>}</div>
    </div>}
  </section>;
}
