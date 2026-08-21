'use client';

import { AlertTriangle, CheckCircle2, LockKeyhole, Save, Send, ShieldCheck } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import DynamicOfficialForm, { type OfficialFormSchema } from '../../../components/promotion/DynamicOfficialForm';

type PortalPayload = {
  assessor: {
    id: number;
    name: string;
    institution?: string | null;
    specialization?: string | null;
    status: string;
    invitationExpiresAt: string;
  };
  promotion: {
    currentRank: string;
    targetRank: string;
    applicantName: string;
    routeName?: string | null;
  };
  template?: {
    id: number;
    name: string;
    version: number;
    sourceReference: string;
    schema: OfficialFormSchema;
  } | null;
  submission?: {
    id: number;
    status: string;
    responses: Record<string, unknown>;
    completionPercent: number;
    validationErrors?: string[] | null;
    signedName?: string | null;
  } | null;
  assignedOutputs: Array<Record<string, unknown>>;
};

function outputTitle(output: Record<string, unknown>, index: number) {
  return String(output.title || output.citation || output.outputReference || `Assigned output ${index + 1}`);
}

export default function ExternalAssessmentPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [data, setData] = useState<PortalPayload | null>(null);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [conflictStatus, setConflictStatus] = useState('');
  const [conflictDetails, setConflictDetails] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declared, setDeclared] = useState(false);
  const [signedName, setSignedName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`/api/external-assessment/${token}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to open the assessment workspace.');
      setData(payload.data);
      setResponses(payload.data.submission?.responses || {});
      setSignedName(payload.data.submission?.signedName || '');
      setErrors(Array.isArray(payload.data.submission?.validationErrors) ? payload.data.submission.validationErrors : []);
    } catch (error) {
      setData(null);
      setMessage(error instanceof Error ? error.message : 'Unable to open the assessment workspace.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function action(body: Record<string, unknown>) {
    setSaving(true);
    setMessage('');
    setErrors([]);
    try {
      const response = await fetch(`/api/external-assessment/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        if (Array.isArray(payload.data?.errors)) setErrors(payload.data.errors);
        throw new Error(payload.error || 'Unable to update the assessment.');
      }
      if (payload.data?.assessor) {
        setData(payload.data);
        setResponses(payload.data.submission?.responses || {});
      } else {
        await load();
      }
      setMessage(body.action === 'SUBMIT' ? 'Confidential assessment submitted.' : 'Assessment record updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update the assessment.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center"><ShieldCheck className="mx-auto h-9 w-9 animate-pulse text-brand-primary" aria-hidden="true" /><p className="mt-3 text-sm font-semibold text-gray-700">Opening secure assessment...</p></div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg rounded-md border border-rose-200 bg-white p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-9 w-9 text-rose-700" aria-hidden="true" />
          <h1 className="mt-3 text-xl font-bold text-gray-950">Assessment link unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">{message}</p>
        </div>
      </main>
    );
  }

  const isClosed = ['DECLINED', 'CONFLICTED', 'WITHDRAWN', 'REPLACED'].includes(data.assessor.status);
  const isSubmitted = data.assessor.status === 'REPORT_RECEIVED' || data.submission?.status === 'FROZEN';
  const canAssess = data.assessor.status === 'REPORT_REQUESTED' && data.template && data.submission;

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <header className="border-b border-[#17345f] bg-[#0f2d55] text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-4 px-4 py-5 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md border border-white/20 bg-white/10"><ShieldCheck className="h-6 w-6" aria-hidden="true" /></span>
            <div><p className="text-xs font-bold uppercase text-[#f1ce67]">Ghana Communication Technology University</p><h1 className="mt-1 text-lg font-bold">Confidential External Assessment</h1></div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-xs font-bold"><LockKeyhole className="h-4 w-4" aria-hidden="true" /> Secure assessor workspace</span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6">
        <section className="rounded-md border border-gray-200 bg-white shadow-sm">
          <div className="grid gap-0 md:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)]">
            <div className="border-b border-gray-200 p-5 md:border-b-0 md:border-r">
              <p className="text-xs font-bold uppercase text-brand-primary">Promotion case</p>
              <h2 className="mt-2 text-xl font-bold text-gray-950">{data.promotion.applicantName}</h2>
              <p className="mt-1 text-sm text-gray-600">{data.promotion.routeName || `${data.promotion.currentRank} to ${data.promotion.targetRank}`}</p>
            </div>
            <div className="bg-gray-50 p-5">
              <p className="text-xs font-bold uppercase text-gray-500">Assigned assessor</p>
              <p className="mt-2 text-sm font-bold text-gray-950">{data.assessor.name}</p>
              <p className="mt-1 text-sm text-gray-600">{data.assessor.institution}</p>
              <p className="mt-1 text-xs font-semibold text-brand-primary">{data.assessor.status.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </section>

        {message ? <div className={`mt-5 rounded-md border px-4 py-3 text-sm font-semibold ${message.toLowerCase().includes('unable') || message.toLowerCase().includes('complete') ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{message}</div> : null}

        {data.assessor.status === 'INVITED' ? (
          <section className="mt-6 rounded-md border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-950">Confidentiality and conflict declaration</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ['NO_CONFLICT', 'No conflict', 'I can provide an independent assessment.'],
                ['CONFLICT_EXISTS', 'Conflict exists', 'A relationship or interest may affect independence.'],
              ].map(([value, title, detail]) => (
                <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 ${conflictStatus === value ? 'border-brand-primary bg-brand-primarySoft' : 'border-gray-200 bg-white'}`}>
                  <input type="radio" name="conflict" value={value} checked={conflictStatus === value} onChange={(event) => setConflictStatus(event.target.value)} className="mt-1 h-4 w-4 text-brand-primary focus:ring-brand-primary" />
                  <span><span className="block text-sm font-bold text-gray-900">{title}</span><span className="mt-1 block text-xs leading-5 text-gray-600">{detail}</span></span>
                </label>
              ))}
            </div>
            {conflictStatus === 'CONFLICT_EXISTS' ? (
              <label className="mt-4 block"><span className="text-sm font-semibold text-gray-800">Conflict details</span><textarea value={conflictDetails} onChange={(event) => setConflictDetails(event.target.value)} className="brand-input mt-1 min-h-28 w-full" /></label>
            ) : null}
            <label className="mt-5 flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 rounded text-brand-primary focus:ring-brand-primary" />
              <span>I will keep the dossier and assessment confidential, use the secure workspace personally, and not forward this invitation.</span>
            </label>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => void action({ action: 'DECLINE', reason: declineReason || 'Unable to undertake the assessment' })} disabled={saving} className="inline-flex min-h-10 items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Decline</button>
              <button type="button" onClick={() => void action({ action: 'ACCEPT', conflictStatus, conflictDetails, termsAccepted })} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark disabled:opacity-50"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Submit declaration</button>
            </div>
          </section>
        ) : null}

        {isClosed ? (
          <section className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-700" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold text-amber-950">Assessment invitation closed</h2>
          </section>
        ) : null}

        {canAssess ? (
          <>
            <section className="mt-6 rounded-md border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold text-gray-950">Assigned outputs</h2><span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-700">{data.assignedOutputs.length} item(s)</span></div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {data.assignedOutputs.map((output, index) => (
                  <article key={index} className="rounded-md border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-bold text-brand-primary">OUTPUT {index + 1}</p>
                    <h3 className="mt-2 text-sm font-bold leading-5 text-gray-950">{outputTitle(output, index)}</h3>
                    {output.citation ? <p className="mt-2 text-xs leading-5 text-gray-600">{String(output.citation)}</p> : null}
                    {output.abstract ? <p className="mt-2 line-clamp-4 text-xs leading-5 text-gray-600">{String(output.abstract)}</p> : null}
                  </article>
                ))}
                {data.assignedOutputs.length === 0 ? <p className="text-sm text-gray-600">No output snapshot is currently assigned. Contact HRODD before submitting an assessment.</p> : null}
              </div>
            </section>

            <section className="mt-6 rounded-md border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="border-b border-gray-200 pb-5">
                <p className="text-xs font-bold uppercase text-brand-primary">Template v{data.template!.version}</p>
                <h2 className="mt-1 text-xl font-bold text-gray-950">{data.template!.schema.title}</h2>
                <p className="mt-1 text-xs text-gray-500">{data.template!.sourceReference}</p>
              </div>
              <div className="mt-6">
                <DynamicOfficialForm schema={data.template!.schema} responses={responses} onChange={setResponses} errors={errors} />
              </div>
              <div className="mt-6 border-t border-gray-200 pt-5">
                <label className="flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <input type="checkbox" checked={declared} onChange={(event) => setDeclared(event.target.checked)} className="mt-0.5 h-4 w-4 rounded text-brand-primary focus:ring-brand-primary" />
                  <span>{data.template!.schema.declarationText}</span>
                </label>
                <label className="mt-4 block max-w-xl"><span className="text-sm font-semibold text-gray-800">Full name for digital signature</span><input value={signedName} onChange={(event) => setSignedName(event.target.value)} className="brand-input mt-1 w-full" /></label>
                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <button type="button" onClick={() => void action({ action: 'SAVE', responses })} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"><Save className="h-4 w-4" aria-hidden="true" /> Save draft</button>
                  <button type="button" onClick={() => window.confirm('Submit and freeze this confidential assessment?') && void action({ action: 'SUBMIT', responses, declared, signedName })} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark disabled:opacity-50"><Send className="h-4 w-4" aria-hidden="true" /> Submit assessment</button>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {isSubmitted ? (
          <section className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-700" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-bold text-emerald-950">Assessment received</h2>
            <p className="mt-2 text-sm text-emerald-800">The confidential report is signed, frozen and available to the authorised GCTU promotion authorities.</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
