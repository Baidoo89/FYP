'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ExternalLink, Send, ShieldCheck, UserPlus } from 'lucide-react';
import { ErrorState, LoadingState } from '../../../../components/enterprise-ui';
import { useToast } from '../../../../components/Toast';

type RankOption = { code: string; name: string; category: string; family: string | null };
type UnitOption = { code: string; name: string; type: string; parent?: { name: string } | null };
type Catalogue = { ranks: RankOption[]; organizationUnits: UnitOption[]; categories: string[] };

type ProvisionForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  officialEmail: string;
  staffNumber: string;
  category: string;
  employmentStatus: string;
  employmentStartedAt: string;
  retirementDate: string;
  rankCode: string;
  rankStartedAt: string;
  organizationUnitCode: string;
  assignmentStartedAt: string;
  positionTitle: string;
  sourceRecordId: string;
  appointmentRef: string;
  notes: string;
};

const EMPTY_FORM: ProvisionForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  officialEmail: '',
  staffNumber: '',
  category: '',
  employmentStatus: 'ACTIVE',
  employmentStartedAt: '',
  retirementDate: '',
  rankCode: '',
  rankStartedAt: '',
  organizationUnitCode: '',
  assignmentStartedAt: '',
  positionTitle: '',
  sourceRecordId: '',
  appointmentRef: '',
  notes: '',
};

function label(value?: string | null) {
  if (!value) return '';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ProvisionStaffPage() {
  const toast = useToast();
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [form, setForm] = useState<ProvisionForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ message: string; name: string; email: string; activationUrl?: string; emailDelivered: boolean } | null>(null);

  const availableRanks = useMemo(
    () => catalogue?.ranks.filter((rank) => rank.category === form.category) || [],
    [catalogue, form.category],
  );

  useEffect(() => {
    async function loadCatalogue() {
      try {
        const response = await fetch('/api/hr/staff-records?state=ALL&page=1&pageSize=10', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load the staff policy catalogue.');
        setCatalogue(payload.data.options as Catalogue);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load the staff policy catalogue.');
      } finally {
        setLoading(false);
      }
    }
    loadCatalogue();
  }, []);

  function update(name: keyof ProvisionForm, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'category' ? { rankCode: '' } : {}),
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/hr/staff-records/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to provision staff access.');

      const nextResult = {
        message: payload.message as string,
        name: payload.data.name as string,
        email: payload.data.email as string,
        activationUrl: payload.data.activationUrl as string | undefined,
        emailDelivered: Boolean(payload.data.emailDelivered),
      };
      setResult(nextResult);
      toast.success('Staff access issued', nextResult.message);
      setForm(EMPTY_FORM);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to provision staff access.';
      setError(message);
      toast.error('Provisioning failed', message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading staff and policy catalogue..." />;
  if (!catalogue) return <ErrorState message={error || 'The staff policy catalogue is unavailable.'} />;

  return (
    <div className="min-w-0 space-y-5">
      <header className="border-b border-slate-200 pb-5">
        <Link href="/hr/staff-records" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Staff register
        </Link>
        <div className="mt-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primarySoft text-brand-primary">
            <UserPlus className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">HRODD Provisioning</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">Issue Verified Staff Access</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Create the authoritative employment record and send a single-use account activation invitation.</p>
          </div>
        </div>
      </header>

      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</div>}
      {result && (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5" aria-live="polite">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="font-semibold text-emerald-950">{result.name}</h2>
              <p className="mt-1 break-words text-sm text-emerald-800">{result.email}</p>
              <p className="mt-2 text-sm leading-6 text-emerald-900">{result.message}</p>
              {result.activationUrl && (
                <a href={result.activationUrl} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900">
                  Open Local Activation <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      <form onSubmit={submit} className="pro-card overflow-hidden">
        <section className="p-5 sm:p-6">
          <SectionTitle icon={<UserPlus className="h-4 w-4" />} title="Staff Identity" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="First name"><input required value={form.firstName} onChange={(event) => update('firstName', event.target.value)} className="brand-input" /></Field>
            <Field label="Middle name"><input value={form.middleName} onChange={(event) => update('middleName', event.target.value)} className="brand-input" /></Field>
            <Field label="Last name"><input required value={form.lastName} onChange={(event) => update('lastName', event.target.value)} className="brand-input" /></Field>
            <Field label="Official email"><input required type="email" value={form.officialEmail} onChange={(event) => update('officialEmail', event.target.value)} className="brand-input" placeholder="name@gctu.edu.gh" /></Field>
            <Field label="Staff number"><input required value={form.staffNumber} onChange={(event) => update('staffNumber', event.target.value)} className="brand-input" /></Field>
            <Field label="Staff category"><select required value={form.category} onChange={(event) => update('category', event.target.value)} className="brand-input"><option value="">Select category</option>{catalogue.categories.map((category) => <option key={category} value={category}>{label(category)}</option>)}</select></Field>
          </div>
        </section>

        <section className="border-t border-slate-200 p-5 sm:p-6">
          <SectionTitle icon={<ShieldCheck className="h-4 w-4" />} title="Authoritative Employment Record" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Employment status"><select required value={form.employmentStatus} onChange={(event) => update('employmentStatus', event.target.value)} className="brand-input">{['ACTIVE', 'ON_LEAVE', 'SUSPENDED'].map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></Field>
            <Field label="Employment started"><input required type="date" value={form.employmentStartedAt} onChange={(event) => update('employmentStartedAt', event.target.value)} className="brand-input" /></Field>
            <Field label="Retirement date"><input required type="date" value={form.retirementDate} onChange={(event) => update('retirementDate', event.target.value)} className="brand-input" /></Field>
            <Field label="Current rank"><select required disabled={!form.category} value={form.rankCode} onChange={(event) => update('rankCode', event.target.value)} className="brand-input"><option value="">{form.category ? 'Select rank' : 'Select category first'}</option>{availableRanks.map((rank) => <option key={rank.code} value={rank.code}>{rank.name}{rank.family ? ` - ${label(rank.family)}` : ''}</option>)}</select></Field>
            <Field label="Rank started"><input required type="date" value={form.rankStartedAt} onChange={(event) => update('rankStartedAt', event.target.value)} className="brand-input" /></Field>
            <Field label="Appointment reference"><input value={form.appointmentRef} onChange={(event) => update('appointmentRef', event.target.value)} className="brand-input" /></Field>
            <Field label="Primary unit"><select required value={form.organizationUnitCode} onChange={(event) => update('organizationUnitCode', event.target.value)} className="brand-input"><option value="">Select unit</option>{catalogue.organizationUnits.map((unit) => <option key={unit.code} value={unit.code}>{unit.parent ? `${unit.parent.name} - ` : ''}{unit.name} ({label(unit.type)})</option>)}</select></Field>
            <Field label="Assignment started"><input required type="date" value={form.assignmentStartedAt} onChange={(event) => update('assignmentStartedAt', event.target.value)} className="brand-input" /></Field>
            <Field label="Position title"><input value={form.positionTitle} onChange={(event) => update('positionTitle', event.target.value)} className="brand-input" /></Field>
            <Field label="Personnel file reference"><input value={form.sourceRecordId} onChange={(event) => update('sourceRecordId', event.target.value)} className="brand-input" /></Field>
            <Field label="Verification note"><textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} className="brand-input min-h-24 py-2 sm:col-span-2" /></Field>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="text-xs leading-5 text-slate-500">No password is generated or visible to HRODD.</p>
          <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:opacity-60">
            <Send className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Issuing Access...' : 'Create Record & Send Activation'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Field({ label: fieldLabel, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-slate-600">{fieldLabel}</span>{children}</label>;
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <h2 className="flex items-center gap-2 text-sm font-bold text-slate-950"><span className="text-brand-primary" aria-hidden="true">{icon}</span>{title}</h2>;
}
