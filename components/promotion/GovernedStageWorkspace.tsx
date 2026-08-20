'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Clock3, LockKeyhole, RefreshCw, Send, ShieldCheck } from 'lucide-react';

type Role = 'HOD_DEAN' | 'HR_ADMIN' | 'COMMITTEE_REVIEWER' | 'SYSTEM_ADMIN' | 'STAFF' | 'LECTURER';
type Stage = { id: number; stage: string; sequence: number; status: string; startedAt?: string | null; dueAt?: string | null; decision?: string | null; decisionReason?: string | null };
type GovernanceData = { promotionRoute?: { name?: string | null; promotionTrack?: { type?: string | null } | null } | null; workflowStages: Stage[] };
type Props = { requestId: number; role: Role; applicantName?: string };

const labels: Record<string, string> = { DEPARTMENT: 'Department review', FACULTY: 'Faculty / FAPC review', RAPC: 'RAPC review', EXTERNAL_ASSESSMENT: 'External assessment', UAPC: 'UAPC decision', COUNCIL: 'Council ratification', ACADEMIC_BOARD: 'Academic Board', FINAL_NOTIFICATION: 'Final notification', APPEAL: 'Appeal review' };
const notes: Record<string, string> = { DEPARTMENT: 'The head of unit records the departmental assessment.', FACULTY: 'The Dean and Faculty Appointments and Promotions Sub-Committee record the faculty assessment.', RAPC: 'The relevant administrative or professional promotions committee records its assessment.', EXTERNAL_ASSESSMENT: 'External assessor reports are tracked separately from internal decisions.', UAPC: 'The University Appointments and Promotions Committee records the institutional decision.', COUNCIL: 'Professorial cases proceed to Council for ratification.' };

function pretty(value?: string | null) { return (value || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function date(value?: string | null) { return value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value)) : 'Not scheduled'; }
function tone(status: string) { return status === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : status === 'IN_PROGRESS' ? 'border-blue-200 bg-blue-50 text-blue-800' : status === 'RETURNED' || status === 'BLOCKED' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-gray-200 bg-gray-50 text-gray-600'; }

export default function GovernedStageWorkspace({ requestId, role, applicantName }: Props) {
  const [data, setData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [decision, setDecision] = useState('COMPLETED');
  const [reason, setReason] = useState('');
  const [narrative, setNarrative] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [confidential, setConfidential] = useState(false);
  const [categories, setCategories] = useState({ first: '', second: '', third: '' });

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/promotion-requests/' + requestId + '/governance', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load governed workflow');
      setData(payload.data);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load governed workflow'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [requestId]);

  const active = useMemo(() => data?.workflowStages.find((item) => item.status === 'IN_PROGRESS'), [data]);
  const canAct = Boolean(active) && !['STAFF', 'LECTURER'].includes(role);
  const isAdmin = data?.promotionRoute?.promotionTrack?.type === 'ADMINISTRATIVE';
  const categoryLabels = isAdmin ? ['Ability / knowledge', 'Application of knowledge', 'Human relations'] : ['Teaching', 'Promotion of knowledge', 'Service'];

  const submit = async () => {
    if (!active || reason.trim().length < 10) { setMessage('A decision reason of at least 10 characters is required.'); return; }
    setSaving(true); setMessage('');
    const assessment = isAdmin
      ? { workKnowledgeCategory: categories.first || undefined, workApplicationCategory: categories.second || undefined, humanRelationsCategory: categories.third || undefined, narrative: narrative.trim() || undefined, recommendation: recommendation || undefined, isConfidential: confidential }
      : { teachingCategory: categories.first || undefined, knowledgeCategory: categories.second || undefined, serviceCategory: categories.third || undefined, narrative: narrative.trim() || undefined, recommendation: recommendation || undefined, isConfidential: confidential };
    try {
      const response = await fetch('/api/promotion-requests/' + requestId + '/governance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stageRecordId: active.id, decision, reason: reason.trim(), assessment }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to record stage decision');
      setMessage('Stage decision recorded and audit trail updated.'); setReason(''); setNarrative(''); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to record stage decision'); }
    finally { setSaving(false); }
  };

  if (loading) return <section className="pro-card mt-6 p-5 text-sm text-gray-600">Loading governed workflow...</section>;
  if (!data) return <section className="pro-card mt-6 p-5 text-sm text-red-700">{message || 'Governed workflow is unavailable.'}</section>;

  return (
    <section className="pro-card mt-6 min-w-0 overflow-hidden">
      <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Governed promotion route</p><h3 className="mt-1 text-xl font-bold text-gray-950">{data.promotionRoute?.name || 'Promotion workflow'}</h3><p className="mt-1 text-sm text-gray-600">{applicantName ? applicantName + ' | ' : ''}Formal stages, decisions, and assessment records.</p></div>
          <button type="button" onClick={() => void load()} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" title="Refresh workflow"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh</button>
        </div>
      </div>
      <div className="grid min-w-0 gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <ol className="relative border-l border-gray-200 pl-6">
          {data.workflowStages.map((stage) => {
            const completed = stage.status === 'COMPLETED'; const activeStage = stage.status === 'IN_PROGRESS';
            return <li key={stage.id} className="relative pb-6 last:pb-0">
              <span className={'absolute -left-[2.05rem] flex h-7 w-7 items-center justify-center rounded-full border-2 bg-white ' + (completed ? 'border-emerald-500 text-emerald-600' : activeStage ? 'border-blue-500 text-blue-600' : 'border-gray-300 text-gray-400')}>{completed ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : activeStage ? <Clock3 className="h-4 w-4" aria-hidden="true" /> : <Circle className="h-3 w-3" aria-hidden="true" />}</span>
              <div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="font-semibold text-gray-950">{stage.sequence}. {labels[stage.stage] || pretty(stage.stage)}</h4><p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">{notes[stage.stage] || 'This stage is governed by the approved promotion route.'}</p></div><span className={'rounded-full border px-2.5 py-1 text-xs font-semibold ' + tone(stage.status)}>{pretty(stage.status)}</span></div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500"><span>Started: {date(stage.startedAt)}</span><span>Due: {date(stage.dueAt)}</span>{stage.decision && <span>Decision: {pretty(stage.decision)}</span>}</div>
              {stage.decisionReason && <p className="mt-2 border-l-2 border-gray-200 pl-3 text-sm italic leading-6 text-gray-600">{stage.decisionReason}</p>}
            </li>;
          })}
        </ol>
        <div className="min-w-0 border-t border-gray-200 pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          {canAct && active ? <>
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-blue-700" aria-hidden="true" /><h4 className="font-bold text-gray-950">Record {labels[active.stage] || pretty(active.stage)}</h4></div>
            <p className="mt-2 text-sm leading-6 text-gray-600">This action is recorded against the current stage and audit trail.</p>
            <label className="mt-4 block text-sm font-semibold text-gray-800">Stage decision<select value={decision} onChange={(event) => setDecision(event.target.value)} className="brand-input mt-1"><option value="COMPLETED">Complete stage</option><option value="RETURNED">Return for correction</option><option value="BLOCKED">Block pending clarification</option></select></label>
            <label className="mt-3 block text-sm font-semibold text-gray-800">Decision reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className="brand-input mt-1 min-h-24" placeholder="State the evidence-based reason..." /></label>
            <div className="mt-4 border-t border-gray-200 pt-4"><p className="text-sm font-bold text-gray-950">Assessment categories</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{categoryLabels.map((label, index) => <label key={label} className="text-xs font-semibold text-gray-700">{label}<select value={[categories.first, categories.second, categories.third][index]} onChange={(event) => setCategories((current) => index === 0 ? { ...current, first: event.target.value } : index === 1 ? { ...current, second: event.target.value } : { ...current, third: event.target.value })} className="brand-input mt-1 text-sm"><option value="">Not recorded</option>{['EXCELLENT', 'VERY_GOOD', 'GOOD', 'SATISFACTORY', 'UNSATISFACTORY'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></label>)}</div></div>
            <label className="mt-3 block text-sm font-semibold text-gray-800">Assessment narrative<textarea value={narrative} onChange={(event) => setNarrative(event.target.value)} className="brand-input mt-1 min-h-24" placeholder="Record reasoning, evidence considered, and conditions..." /></label>
            <label className="mt-3 flex items-start gap-2 text-xs font-medium text-gray-600"><input type="checkbox" checked={confidential} onChange={(event) => setConfidential(event.target.checked)} className="mt-0.5" /> Treat this assessment as confidential</label>
            <button type="button" onClick={() => void submit()} disabled={saving} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:bg-gray-300"><Send className="h-4 w-4" aria-hidden="true" /> {saving ? 'Recording...' : 'Record stage decision'}</button>
            {message && <p className="mt-3 text-sm font-medium text-gray-700">{message}</p>}
          </> : <div className="rounded-lg border border-gray-200 bg-gray-50 p-4"><div className="flex items-center gap-2 text-gray-800"><LockKeyhole className="h-4 w-4" aria-hidden="true" /><p className="font-semibold">{role === 'STAFF' || role === 'LECTURER' ? 'Applicant view' : 'Waiting for assigned stage'}</p></div><p className="mt-2 text-sm leading-6 text-gray-600">{role === 'STAFF' || role === 'LECTURER' ? 'You can monitor progress and decisions, but cannot change the governed workflow.' : 'The current stage is not assigned to this reviewer role or is already complete.'}</p></div>}
        </div>
      </div>
    </section>
  );
}