'use client';

import { CheckCircle2, FilePenLine, LockKeyhole, RefreshCw, Save, Send } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DynamicOfficialForm, { type OfficialFormSchema } from './DynamicOfficialForm';

type Submission = {
  id: number;
  status: string;
  version: number;
  responses: Record<string, unknown>;
  completionPercent: number;
  validationErrors?: string[] | null;
  declared: boolean;
  signedName?: string | null;
  signedAt?: string | null;
  updatedAt: string;
};

type FormItem = {
  template: {
    id: number;
    code: string;
    version: number;
    name: string;
    audience: string;
    sourceReference: string;
    schema: OfficialFormSchema;
  };
  submission: Submission | null;
  stage?: {
    id: number;
    stage: string;
    sequence: number;
    status: string;
  } | null;
};

type WorkspaceData = {
  request: {
    id: number;
    currentRank: string;
    targetRank: string;
    status: string;
    receiptNumber?: string | null;
    route: {
      code: string;
      name: string;
    };
  };
  forms: FormItem[];
};

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusTone(status?: string) {
  if (status === 'FROZEN' || status === 'SUBMITTED') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'READY') return 'border-blue-200 bg-blue-50 text-blue-800';
  if (status === 'RETURNED') return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

export default function OfficialFormsWorkspace({
  requestId,
  heading = 'Official Promotion Forms',
  embedded = false,
}: {
  requestId: number;
  heading?: string;
  embedded?: boolean;
}) {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [declared, setDeclared] = useState(false);
  const [signedName, setSignedName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (preferredTemplateId?: number) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`/api/promotion-requests/${requestId}/forms`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load official forms.');
      const nextData = payload.data as WorkspaceData;
      setData(nextData);
      const nextSelectedId = preferredTemplateId && nextData.forms.some((item) => item.template.id === preferredTemplateId)
        ? preferredTemplateId
        : selectedTemplateId && nextData.forms.some((item) => item.template.id === selectedTemplateId)
          ? selectedTemplateId
          : nextData.forms[0]?.template.id || null;
      setSelectedTemplateId(nextSelectedId);
    } catch (error) {
      setData(null);
      setMessage(error instanceof Error ? error.message : 'Unable to load official forms.');
    } finally {
      setLoading(false);
    }
  }, [requestId, selectedTemplateId]);

  useEffect(() => {
    void load();
  }, [requestId]);

  const selected = useMemo(
    () => data?.forms.find((item) => item.template.id === selectedTemplateId) || null,
    [data, selectedTemplateId],
  );

  useEffect(() => {
    if (!selected) {
      setResponses({});
      setDeclared(false);
      setSignedName('');
      setErrors([]);
      return;
    }
    setResponses(selected.submission?.responses || {});
    setDeclared(Boolean(selected.submission?.declared));
    setSignedName(selected.submission?.signedName || '');
    setErrors(Array.isArray(selected.submission?.validationErrors) ? selected.submission.validationErrors : []);
  }, [selected?.template.id, selected?.submission?.id, selected?.submission?.updatedAt]);

  async function startForm() {
    if (!selected) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(`/api/promotion-requests/${requestId}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selected.template.id,
          stageRecordId: selected.stage?.id,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to start the official form.');
      await load(selected.template.id);
      setMessage('Official form started.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start the official form.');
    } finally {
      setSaving(false);
    }
  }

  async function persist(action: 'SAVE' | 'SUBMIT') {
    if (!selected?.submission) return;
    if (action === 'SUBMIT' && !window.confirm('Submit and freeze this signed official form?')) return;
    setSaving(true);
    setMessage('');
    setErrors([]);
    try {
      const response = await fetch(`/api/promotion-requests/${requestId}/forms`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selected.submission.id,
          action,
          responses,
          declared,
          signedName,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        if (Array.isArray(payload.data?.errors)) setErrors(payload.data.errors);
        throw new Error(payload.error || 'Unable to save the official form.');
      }
      await load(selected.template.id);
      setMessage(action === 'SUBMIT' ? 'Official form submitted and frozen.' : 'Draft saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save the official form.');
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) {
    return <div className="rounded-md border border-gray-200 bg-white p-5 text-sm text-gray-600">Loading official forms...</div>;
  }

  if (!data) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 p-5">
        <p className="text-sm font-semibold text-rose-900">{message || 'Official forms are unavailable.'}</p>
        <button type="button" onClick={() => void load()} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-md border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-800">
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
        </button>
      </div>
    );
  }

  if (data.forms.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-5">
        <h2 className="text-base font-bold text-gray-950">{heading}</h2>
        <p className="mt-2 text-sm text-gray-600">No official form is assigned to your role at this stage.</p>
      </div>
    );
  }

  const frozen = ['FROZEN', 'SUBMITTED', 'SUPERSEDED'].includes(selected?.submission?.status || '');
  const completion = selected?.submission?.completionPercent || 0;

  return (
    <div className={embedded ? 'min-w-0' : 'min-w-0 rounded-md border border-gray-200 bg-white shadow-sm'}>
      <div className={embedded ? 'border-b border-gray-200 pb-5' : 'border-b border-gray-200 px-4 py-5 sm:px-6'}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-brand-primary">{data.request.route.code}</p>
            <h2 className="mt-1 text-xl font-bold text-gray-950">{heading}</h2>
            <p className="mt-1 text-sm text-gray-600">{data.request.currentRank} to {data.request.targetRank}</p>
          </div>
          <button
            type="button"
            onClick={() => void load(selected?.template.id)}
            disabled={loading}
            title="Refresh official forms"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            aria-label="Refresh official forms"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {data.forms.map((item) => {
            const active = item.template.id === selectedTemplateId;
            return (
              <button
                key={item.template.id}
                type="button"
                onClick={() => setSelectedTemplateId(item.template.id)}
                className={`min-h-10 shrink-0 rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${active ? 'border-brand-primary bg-brand-primary text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-brand-primary/30 hover:bg-brand-primarySoft'}`}
              >
                {item.template.name}
              </button>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div className={embedded ? 'pt-5' : 'px-4 py-5 sm:px-6'}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-gray-950">{selected.template.schema.title}</h3>
                <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusTone(selected.submission?.status)}`}>
                  {label(selected.submission?.status || 'NOT STARTED')}
                </span>
                {selected.template.schema.confidential ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-700">
                    <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> Confidential
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-gray-500">Template v{selected.template.version} � {selected.template.sourceReference}</p>
              {selected.stage ? <p className="mt-1 text-xs font-semibold text-gray-600">{label(selected.stage.stage)} stage � {label(selected.stage.status)}</p> : null}
            </div>
            {selected.submission ? (
              <div className="w-full max-w-52">
                <div className="flex justify-between text-xs font-semibold text-gray-600"><span>Completion</span><span>{completion}%</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-sm bg-gray-200"><div className="h-full bg-brand-primary" style={{ width: `${completion}%` }} /></div>
              </div>
            ) : null}
          </div>

          {message ? (
            <div className={`mt-4 rounded-md border px-4 py-3 text-sm font-semibold ${message.includes('Unable') || message.includes('Complete') || message.includes('assigned') ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
              {message}
            </div>
          ) : null}

          {!selected.submission ? (
            <div className="mt-6 rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <FilePenLine className="mx-auto h-7 w-7 text-brand-primary" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-gray-800">This official form has not been started.</p>
              <button type="button" onClick={startForm} disabled={saving} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark disabled:opacity-50">
                <FilePenLine className="h-4 w-4" aria-hidden="true" /> Start form
              </button>
            </div>
          ) : (
            <>
              {selected.template.schema.instructions ? <p className="mt-5 border-l-2 border-brand-primary pl-3 text-sm leading-6 text-gray-600">{selected.template.schema.instructions}</p> : null}
              <div className="mt-6">
                <DynamicOfficialForm
                  schema={selected.template.schema}
                  responses={responses}
                  onChange={setResponses}
                  readOnly={frozen}
                  errors={errors}
                />
              </div>

              <div className="mt-6 border-t border-gray-200 pt-5">
                {frozen ? (
                  <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                    <div><p className="font-bold">Signed and frozen</p><p className="mt-1">Signed by {selected.submission.signedName || 'authorised user'}.</p></div>
                  </div>
                ) : (
                  <>
                    <label className="flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                      <input type="checkbox" checked={declared} onChange={(event) => setDeclared(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                      <span>{selected.template.schema.declarationText || 'I certify that this official form is complete and accurate.'}</span>
                    </label>
                    <label className="mt-4 block max-w-xl">
                      <span className="text-sm font-semibold text-gray-800">Full name for digital signature</span>
                      <input value={signedName} onChange={(event) => setSignedName(event.target.value)} className="brand-input mt-1 w-full" autoComplete="name" />
                    </label>
                    <div className="mt-5 flex flex-wrap justify-end gap-3">
                      <button type="button" onClick={() => void persist('SAVE')} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50">
                        <Save className="h-4 w-4" aria-hidden="true" /> Save draft
                      </button>
                      <button type="button" onClick={() => void persist('SUBMIT')} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark disabled:opacity-50">
                        <Send className="h-4 w-4" aria-hidden="true" /> Submit form
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
