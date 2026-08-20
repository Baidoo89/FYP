'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, ClipboardCheck, RefreshCw, Save } from 'lucide-react';

type Role = 'HR_ADMIN' | 'COMMITTEE_REVIEWER' | 'SYSTEM_ADMIN';
type Stage = { id: number; stage: string; sequence: number; status: string };
type Meeting = {
  id: number;
  stageRecordId?: number | null;
  authority: string;
  meetingDate: string;
  quorumRequired?: number | null;
  quorumPresent?: number | null;
  quorumMet?: boolean | null;
  agendaReference?: string | null;
  resolution?: string | null;
  recommendation?: string | null;
};

type Props = { requestId: number; role: Role };

const authorityOptions = [
  'FAPC',
  'RAPC',
  'UAPC',
  'ACADEMIC_BOARD',
  'COUNCIL',
  'SENIOR_STAFF_APPOINTMENTS_AND_PROMOTIONS_COMMITTEE',
  'JUNIOR_STAFF_APPOINTMENTS_AND_PROMOTIONS_COMMITTEE',
];
const recommendationOptions = ['RECOMMENDED', 'NOT_RECOMMENDED', 'REQUIRES_FURTHER_REVIEW'];
const committeeStageNames = new Set(['FACULTY', 'RAPC', 'UAPC', 'ACADEMIC_BOARD', 'COUNCIL']);

function label(value?: string | null) {
  if (!value) return 'Not recorded';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function dateLabel(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export default function CommitteeMeetingPanel({ requestId }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    stageRecordId: '',
    authority: 'UAPC',
    meetingDate: todayValue(),
    quorumRequired: '5',
    quorumPresent: '5',
    agendaReference: '',
    recommendation: 'RECOMMENDED',
    resolution: '',
  });

  const committeeStages = useMemo(() => stages.filter((stage) => committeeStageNames.has(stage.stage)), [stages]);

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [meetingsResponse, governanceResponse] = await Promise.all([
        fetch('/api/promotion-requests/' + requestId + '/committee-meetings', { cache: 'no-store' }),
        fetch('/api/promotion-requests/' + requestId + '/governance', { cache: 'no-store' }),
      ]);
      const meetingsPayload = await meetingsResponse.json();
      const governancePayload = await governanceResponse.json();
      if (!meetingsResponse.ok || !meetingsPayload.success) throw new Error(meetingsPayload.error || 'Unable to load committee meetings');
      if (!governanceResponse.ok || !governancePayload.success) throw new Error(governancePayload.error || 'Unable to load workflow stages');
      setMeetings(meetingsPayload.data || []);
      const nextStages = governancePayload.data?.workflowStages || [];
      setStages(nextStages);
      const activeCommitteeStage = nextStages.find((stage: Stage) => committeeStageNames.has(stage.stage) && stage.status === 'IN_PROGRESS') || nextStages.find((stage: Stage) => committeeStageNames.has(stage.stage));
      if (activeCommitteeStage) {
        setForm((current) => ({ ...current, stageRecordId: String(activeCommitteeStage.id), authority: authorityForStage(activeCommitteeStage.stage) || current.authority }));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load committee meeting records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [requestId]);

  function authorityForStage(stage: string) {
    if (stage === 'FACULTY') return 'FAPC';
    if (stage === 'RAPC') return 'RAPC';
    if (stage === 'UAPC') return 'UAPC';
    if (stage === 'ACADEMIC_BOARD') return 'ACADEMIC_BOARD';
    if (stage === 'COUNCIL') return 'COUNCIL';
    return '';
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/promotion-requests/' + requestId + '/committee-meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          stageRecordId: form.stageRecordId ? Number(form.stageRecordId) : undefined,
          quorumRequired: Number(form.quorumRequired),
          quorumPresent: Number(form.quorumPresent),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to record committee meeting');
      setForm((current) => ({ ...current, agendaReference: '', resolution: '' }));
      setMessage('Committee meeting and resolution recorded.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to record committee meeting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6 border-t border-gray-200 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-brand-primary" aria-hidden="true" /><h3 className="text-lg font-bold text-gray-950">Committee Meeting Record</h3></div>
          <p className="mt-1 text-sm leading-6 text-gray-600">Record formal authority, quorum, agenda reference, recommendation, and resolution for the promotion file.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" title="Refresh committee meetings"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh</button>
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-3 lg:grid-cols-2">
        <label className="text-sm font-semibold text-gray-800">Workflow stage<select value={form.stageRecordId} onChange={(event) => { const stage = committeeStages.find((item) => String(item.id) === event.target.value); setForm((current) => ({ ...current, stageRecordId: event.target.value, authority: stage ? authorityForStage(stage.stage) || current.authority : current.authority })); }} className="brand-input mt-1"><option value="">No stage selected</option>{committeeStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.sequence}. {label(stage.stage)} - {label(stage.status)}</option>)}</select></label>
        <label className="text-sm font-semibold text-gray-800">Authority<select value={form.authority} onChange={(event) => setForm((current) => ({ ...current, authority: event.target.value }))} className="brand-input mt-1">{authorityOptions.map((authority) => <option key={authority} value={authority}>{label(authority)}</option>)}</select></label>
        <label className="text-sm font-semibold text-gray-800">Meeting date<input required type="date" value={form.meetingDate} onChange={(event) => setForm((current) => ({ ...current, meetingDate: event.target.value }))} className="brand-input mt-1" /></label>
        <label className="text-sm font-semibold text-gray-800">Recommendation<select value={form.recommendation} onChange={(event) => setForm((current) => ({ ...current, recommendation: event.target.value }))} className="brand-input mt-1">{recommendationOptions.map((recommendation) => <option key={recommendation} value={recommendation}>{label(recommendation)}</option>)}</select></label>
        <label className="text-sm font-semibold text-gray-800">Quorum required<input required type="number" min="1" max="200" value={form.quorumRequired} onChange={(event) => setForm((current) => ({ ...current, quorumRequired: event.target.value }))} className="brand-input mt-1" /></label>
        <label className="text-sm font-semibold text-gray-800">Quorum present<input required type="number" min="0" max="200" value={form.quorumPresent} onChange={(event) => setForm((current) => ({ ...current, quorumPresent: event.target.value }))} className="brand-input mt-1" /></label>
        <label className="text-sm font-semibold text-gray-800 lg:col-span-2">Agenda or minutes reference<input required value={form.agendaReference} onChange={(event) => setForm((current) => ({ ...current, agendaReference: event.target.value }))} className="brand-input mt-1" placeholder="Agenda item, minute number, or meeting reference" /></label>
        <label className="text-sm font-semibold text-gray-800 lg:col-span-2">Formal resolution<textarea required value={form.resolution} onChange={(event) => setForm((current) => ({ ...current, resolution: event.target.value }))} className="brand-input mt-1 min-h-28" placeholder="Record the committee resolution and basis for the recommendation..." /></label>
        <div className="lg:col-span-2"><button type="submit" disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:bg-gray-300"><Save className="h-4 w-4" aria-hidden="true" /> {saving ? 'Recording...' : 'Record meeting'}</button></div>
      </form>

      <div className="mt-5 space-y-3">
        {loading ? <p className="text-sm text-gray-600">Loading committee meetings...</p> : meetings.length === 0 ? <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">No committee meeting records have been entered for this file.</p> : meetings.map((meeting) => (
          <article key={meeting.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-gray-950">{label(meeting.authority)}</p><p className="mt-1 flex items-center gap-1 text-sm text-gray-600"><CalendarDays className="h-4 w-4" aria-hidden="true" /> {dateLabel(meeting.meetingDate)}</p></div><span className={"rounded-full border px-2.5 py-1 text-xs font-semibold " + (meeting.quorumMet ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800')}>{meeting.quorumMet ? 'Quorum met' : 'Quorum not met'}</span></div>
            <div className="mt-3 grid gap-2 text-sm text-gray-700 md:grid-cols-3"><p><span className="font-semibold text-gray-950">Reference:</span> {meeting.agendaReference || 'Not recorded'}</p><p><span className="font-semibold text-gray-950">Quorum:</span> {meeting.quorumPresent ?? 0}/{meeting.quorumRequired ?? 0}</p><p><span className="font-semibold text-gray-950">Recommendation:</span> {label(meeting.recommendation)}</p></div>
            <p className="mt-3 border-l-2 border-brand-primary/30 pl-3 text-sm leading-6 text-gray-700">{meeting.resolution || 'Resolution not recorded.'}</p>
          </article>
        ))}
      </div>
      {message && <p className="mt-4 text-sm font-medium text-gray-700">{message}</p>}
    </section>
  );
}