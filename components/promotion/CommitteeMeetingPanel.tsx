'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, ClipboardCheck, Plus, RefreshCw, Save, ShieldCheck, Trash2 } from 'lucide-react';

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
  participants: Participant[];
};
type Participant = { id?: number; memberName: string; memberRole?: string | null; rankCodeSnapshot?: string | null; rankCode?: string; attended: boolean; conflictDeclared: boolean; conflictDetails?: string | null; recused: boolean; eligibleForCase: boolean; ineligibilityReason?: string | null; isChair: boolean; isSecretary: boolean };

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
const academicRankOptions = ['ASSISTANT_LECTURER', 'LECTURER', 'SENIOR_LECTURER', 'ASSOCIATE_PROFESSOR', 'PROFESSOR', 'ASSISTANT_RESEARCH_FELLOW', 'RESEARCH_FELLOW', 'SENIOR_RESEARCH_FELLOW'];
const blankParticipant = (): Participant => ({ memberName: '', memberRole: '', rankCode: '', attended: true, conflictDeclared: false, conflictDetails: '', recused: false, eligibleForCase: true, isChair: false, isSecretary: false });

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
    agendaReference: '',
    recommendation: 'RECOMMENDED',
    resolution: '',
    participants: [
      { ...blankParticipant(), memberRole: 'Committee Chair', isChair: true },
      blankParticipant(),
      { ...blankParticipant(), memberRole: 'Committee Secretary', isSecretary: true },
    ],
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

  const updateParticipant = (index: number, patch: Partial<Participant>) => setForm((current) => ({ ...current, participants: current.participants.map((participant, participantIndex) => participantIndex === index ? { ...participant, ...patch } : participant) }));
  const removeParticipant = (index: number) => setForm((current) => ({ ...current, participants: current.participants.filter((_, participantIndex) => participantIndex !== index) }));

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
        <label className="text-sm font-semibold text-gray-800">Baseline quorum required<input required type="number" min="1" max="200" value={form.quorumRequired} onChange={(event) => setForm((current) => ({ ...current, quorumRequired: event.target.value }))} className="brand-input mt-1" /><span className="mt-1 block text-xs font-normal leading-5 text-gray-500">The server applies any stricter FAPC or UAPC rule and calculates eligible attendance.</span></label>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700"><p className="font-semibold text-gray-900">Eligible attendance is calculated</p><p className="mt-1 text-xs leading-5 text-gray-500">Absent, conflicted, recused, applicant, and below-target-rank members are excluded automatically.</p></div>
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-gray-950">Membership, attendance, and declarations</p><p className="mt-1 text-xs text-gray-500">List the full case-specific committee membership, including absent and recused members.</p></div><button type="button" onClick={() => setForm((current) => ({ ...current, participants: [...current.participants, blankParticipant()] }))} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Plus className="h-4 w-4" aria-hidden="true" /> Add member</button></div>
          <div className="mt-3 space-y-3">{form.participants.map((participant, index) => <div key={index} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"><label className="text-xs font-semibold text-gray-700">Member name<input required value={participant.memberName} onChange={(event) => updateParticipant(index, { memberName: event.target.value })} className="brand-input mt-1 text-sm" /></label><label className="text-xs font-semibold text-gray-700">Committee role<input value={participant.memberRole || ''} onChange={(event) => updateParticipant(index, { memberRole: event.target.value })} className="brand-input mt-1 text-sm" placeholder="Dean, VC, member..." /></label><label className="text-xs font-semibold text-gray-700">Rank snapshot<select value={participant.rankCode || ''} onChange={(event) => updateParticipant(index, { rankCode: event.target.value })} className="brand-input mt-1 text-sm"><option value="">Not rank-assessed</option>{academicRankOptions.map((rank) => <option key={rank} value={rank}>{label(rank)}</option>)}</select></label><label className="text-xs font-semibold text-gray-700">Conflict details<input value={participant.conflictDetails || ''} onChange={(event) => updateParticipant(index, { conflictDetails: event.target.value })} className="brand-input mt-1 text-sm" disabled={!participant.conflictDeclared} /></label></div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-gray-700">{[['Attended', 'attended'], ['Eligible by Secretariat', 'eligibleForCase'], ['Conflict declared', 'conflictDeclared'], ['Recused', 'recused'], ['Chair', 'isChair'], ['Secretary', 'isSecretary']].map(([name, key]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(participant[key as keyof Participant])} onChange={(event) => updateParticipant(index, { [key]: event.target.checked, ...(key === 'conflictDeclared' && event.target.checked ? { recused: true } : {}) })} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />{name}</label>)}<button type="button" onClick={() => removeParticipant(index)} disabled={form.participants.length <= 1} className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-30" title="Remove member"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div>
          </div>)}</div>
        </div>
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
            <div className="mt-4 border-t border-gray-100 pt-3"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-700" aria-hidden="true" /><p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Case participation</p></div><div className="mt-2 grid gap-2 sm:grid-cols-2">{meeting.participants.map((participant) => <div key={participant.id || participant.memberName} className="rounded-md bg-gray-50 p-2 text-xs text-gray-700"><p className="font-semibold text-gray-900">{participant.memberName}{participant.isChair ? ' | Chair' : ''}</p><p className="mt-1">{participant.memberRole || 'Member'} | {participant.rankCodeSnapshot ? label(participant.rankCodeSnapshot) : 'No rank snapshot'}</p><p className={participant.attended && participant.eligibleForCase && !participant.recused ? 'mt-1 font-semibold text-emerald-700' : 'mt-1 font-semibold text-amber-800'}>{participant.attended ? 'Attended' : 'Absent'} | {participant.eligibleForCase ? 'Eligible' : 'Excluded'}{participant.recused ? ' | Recused' : ''}</p>{participant.ineligibilityReason && <p className="mt-1 text-amber-800">{participant.ineligibilityReason}</p>}</div>)}</div></div>
          </article>
        ))}
      </div>
      {message && <p className="mt-4 text-sm font-medium text-gray-700">{message}</p>}
    </section>
  );
}
