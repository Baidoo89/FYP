'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Save, Search, ShieldCheck, UserCheck, UserPlus } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../../../components/enterprise-ui';
import { useToast } from '../../../components/Toast';

type RankOption = {
  id: number;
  code: string;
  name: string;
  category: string;
  family: string | null;
  level: number;
};

type UnitOption = {
  id: number;
  code: string;
  name: string;
  type: string;
  parent?: { code: string; name: string } | null;
};

type StaffRecord = {
  id: number;
  name: string;
  email: string;
  emailVerified: boolean;
  staffId: string | null;
  department: string | null;
  faculty: string | null;
  legacyCurrentRank: string | null;
  onboarded: boolean;
  isActive: boolean;
  createdAt: string;
  verificationState: string;
  staffMember: {
    id: number;
    staffNumber: string;
    officialEmail: string;
    category: string;
    employmentStatus: string;
    employmentStartedAt: string | null;
    retirementDate: string | null;
    sourceRecordId: string | null;
    recordVerifiedAt: string | null;
    currentRank: {
      id: number;
      startedAt: string;
      appointmentRef: string | null;
      notes: string | null;
      rank: RankOption;
    } | null;
    primaryAssignment: {
      id: number;
      startedAt: string;
      positionTitle: string | null;
      organizationUnit: UnitOption;
    } | null;
  } | null;
};

type StaffRecordsData = {
  records: StaffRecord[];
  options: {
    ranks: RankOption[];
    organizationUnits: UnitOption[];
    categories: string[];
  };
  metrics: {
    total: number;
    unverified: number;
    pending: number;
    verified: number;
    disputed: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type VerificationForm = {
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

const EMPTY_FORM: VerificationForm = {
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

const VERIFICATION_STATES = ['ALL', 'UNVERIFIED', 'PENDING', 'VERIFIED', 'DISPUTED'];

function label(value?: string | null) {
  if (!value) return 'Not recorded';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function inputDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function formForRecord(record: StaffRecord, units: UnitOption[]): VerificationForm {
  const staff = record.staffMember;
  const legacyUnit = units.find((unit) => unit.name === record.department);
  return {
    ...EMPTY_FORM,
    staffNumber: staff?.staffNumber || record.staffId || '',
    category: staff?.category || '',
    employmentStatus: staff?.employmentStatus || 'ACTIVE',
    employmentStartedAt: inputDate(staff?.employmentStartedAt),
    retirementDate: inputDate(staff?.retirementDate),
    rankCode: staff?.currentRank?.rank.code || record.legacyCurrentRank || '',
    rankStartedAt: inputDate(staff?.currentRank?.startedAt),
    organizationUnitCode: staff?.primaryAssignment?.organizationUnit.code || legacyUnit?.code || '',
    assignmentStartedAt: inputDate(staff?.primaryAssignment?.startedAt),
    positionTitle: staff?.primaryAssignment?.positionTitle || '',
    sourceRecordId: staff?.sourceRecordId || '',
    appointmentRef: staff?.currentRank?.appointmentRef || '',
    notes: staff?.currentRank?.notes || '',
  };
}

export default function HroddStaffRecordsPage() {
  const toast = useToast();
  const [data, setData] = useState<StaffRecordsData | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<VerificationForm>(EMPTY_FORM);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const selectedRecord = data?.records.find((record) => record.id === selectedId) || null;
  const availableRanks = useMemo(
    () => data?.options.ranks.filter((rank) => !form.category || rank.category === form.category) || [],
    [data, form.category],
  );

  async function loadRecords(preferredId?: number | null) {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (search) params.set('search', search);
      if (stateFilter !== 'ALL') params.set('state', stateFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);

      const response = await fetch(`/api/hr/staff-records?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load staff records.');

      const nextData = payload.data as StaffRecordsData;
      setData(nextData);
      const nextRecord = nextData.records.find((record) => record.id === (preferredId ?? selectedId)) || nextData.records[0] || null;
      setSelectedId(nextRecord?.id || null);
      setForm(nextRecord ? formForRecord(nextRecord, nextData.options.organizationUnits) : EMPTY_FORM);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load staff records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [search, stateFilter, categoryFilter, page]);

  function selectRecord(record: StaffRecord) {
    setSelectedId(record.id);
    setForm(formForRecord(record, data?.options.organizationUnits || []));
    setMessage('');
    setError('');
  }

  function updateField(name: keyof VerificationForm, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'category' && !availableRanks.some((rank) => rank.code === current.rankCode && rank.category === value)
        ? { rankCode: '' }
        : {}),
    }));
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function saveVerification(event: FormEvent) {
    event.preventDefault();
    if (!selectedRecord) return;
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/hr/staff-records', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedRecord.id, ...form }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to verify staff record.');

      const success = `${selectedRecord.name}'s authoritative staff record is verified.`;
      setMessage(success);
      toast.success('Staff record verified', success);
      await loadRecords(selectedRecord.id);
    } catch (saveError) {
      const failure = saveError instanceof Error ? saveError.message : 'Unable to verify staff record.';
      setError(failure);
      toast.error('Verification failed', failure);
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) return <LoadingState label="Loading HRODD staff register..." />;
  if (error && !data) return <ErrorState message={error} />;

  return (
    <div className="min-w-0 space-y-5">
      <header className="border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="pro-eyebrow">HRODD Authoritative Register</div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">Staff Verification</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => loadRecords(selectedId)} disabled={loading} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
            <Link href="/hr/staff-records/new" className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Issue Staff Access
            </Link>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Metric label="Applicants" value={data?.metrics.total || 0} />
        <Metric label="Unverified" value={data?.metrics.unverified || 0} tone="amber" />
        <Metric label="Pending" value={data?.metrics.pending || 0} tone="blue" />
        <Metric label="Verified" value={data?.metrics.verified || 0} tone="green" />
        <Metric label="Disputed" value={data?.metrics.disputed || 0} tone="rose" />
      </section>

      {message && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</div>}
      {error && data && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</div>}

      <section className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.5fr)]">
        <aside className="pro-card min-w-0 overflow-hidden">
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <form onSubmit={submitSearch} className="flex gap-2">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="brand-input pl-9" placeholder="Name, email, or staff number" />
              </label>
              <button type="submit" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-white hover:bg-brand-primaryDark" title="Search staff records">
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <select value={stateFilter} onChange={(event) => { setStateFilter(event.target.value); setPage(1); }} className="brand-input">
                {VERIFICATION_STATES.map((state) => <option key={state} value={state}>{label(state)}</option>)}
              </select>
              <select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1); }} className="brand-input">
                <option value="ALL">All categories</option>
                {(data?.options.categories || []).map((category) => <option key={category} value={category}>{label(category)}</option>)}
              </select>
            </div>
          </div>

          <div className="max-h-[72rem] divide-y divide-slate-100 overflow-y-auto">
            {data?.records.length ? data.records.map((record) => (
              <button key={record.id} type="button" onClick={() => selectRecord(record)} className={`block w-full p-4 text-left transition hover:bg-slate-50 sm:p-5 ${selectedId === record.id ? 'bg-brand-primarySoft' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-950">{record.name}</p>
                    <p className="mt-1 break-words text-xs text-slate-500">{record.email}</p>
                  </div>
                  <VerificationBadge state={record.verificationState} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <span>{record.staffMember?.staffNumber || record.staffId || 'No staff number'}</span>
                  <span className="text-right">{record.staffMember?.currentRank?.rank.name || label(record.legacyCurrentRank)}</span>
                </div>
              </button>
            )) : (
              <div className="p-5"><EmptyState title="No matching staff records" description="Change the register filters to view another verification group." /></div>
            )}
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm">
              <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="font-semibold text-brand-primary disabled:text-slate-300">Previous</button>
              <span className="text-slate-500">Page {data.pagination.page} of {data.pagination.totalPages}</span>
              <button type="button" disabled={page >= data.pagination.totalPages} onClick={() => setPage((value) => value + 1)} className="font-semibold text-brand-primary disabled:text-slate-300">Next</button>
            </div>
          )}
        </aside>

        <main className="pro-card min-w-0 overflow-hidden">
          {!selectedRecord ? (
            <div className="p-6"><EmptyState title="No staff record selected" description="Select an applicant from the HRODD register." /></div>
          ) : (
            <form onSubmit={saveVerification}>
              <div className="border-b border-slate-200 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{selectedRecord.email}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">{selectedRecord.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">{selectedRecord.faculty || 'No faculty'} · {selectedRecord.department || 'No department'}</p>
                  </div>
                  <VerificationBadge state={selectedRecord.verificationState} />
                </div>
                {!selectedRecord.emailVerified && (
                  <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    This legacy account has not verified its email. Use HRODD provisioning for new staff access.
                  </div>
                )}
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                <fieldset>
                  <legend className="flex items-center gap-2 text-sm font-bold text-slate-950"><UserCheck className="h-4 w-4 text-brand-primary" aria-hidden="true" />Employment Record</legend>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <Field label="Staff number"><input required value={form.staffNumber} onChange={(event) => updateField('staffNumber', event.target.value)} className="brand-input" /></Field>
                    <Field label="Staff category"><select required value={form.category} onChange={(event) => updateField('category', event.target.value)} className="brand-input"><option value="">Select category</option>{(data?.options.categories || []).map((category) => <option key={category} value={category}>{label(category)}</option>)}</select></Field>
                    <Field label="Employment status"><select required value={form.employmentStatus} onChange={(event) => updateField('employmentStatus', event.target.value)} className="brand-input">{['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RETIRED', 'RESIGNED', 'TERMINATED', 'DECEASED'].map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></Field>
                    <Field label="Employment started"><input required type="date" value={form.employmentStartedAt} onChange={(event) => updateField('employmentStartedAt', event.target.value)} className="brand-input" /></Field>
                    <Field label="Retirement date"><input required type="date" value={form.retirementDate} onChange={(event) => updateField('retirementDate', event.target.value)} className="brand-input" /></Field>
                    <Field label="HRODD source reference"><input value={form.sourceRecordId} onChange={(event) => updateField('sourceRecordId', event.target.value)} className="brand-input" placeholder="Personnel file reference" /></Field>
                  </div>
                </fieldset>

                <fieldset className="border-t border-slate-200 pt-6">
                  <legend className="flex items-center gap-2 text-sm font-bold text-slate-950"><ShieldCheck className="h-4 w-4 text-brand-primary" aria-hidden="true" />Current Rank</legend>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Verified rank"><select required value={form.rankCode} onChange={(event) => updateField('rankCode', event.target.value)} className="brand-input" disabled={!form.category}><option value="">{form.category ? 'Select rank' : 'Select category first'}</option>{availableRanks.map((rank) => <option key={rank.code} value={rank.code}>{rank.name}{rank.family ? ` · ${label(rank.family)}` : ''}</option>)}</select></Field>
                    <Field label="Rank started"><input required type="date" value={form.rankStartedAt} onChange={(event) => updateField('rankStartedAt', event.target.value)} className="brand-input" /></Field>
                    <Field label="Appointment reference"><input value={form.appointmentRef} onChange={(event) => updateField('appointmentRef', event.target.value)} className="brand-input" placeholder="Appointment or promotion letter" /></Field>
                    <Field label="Verification note"><input value={form.notes} onChange={(event) => updateField('notes', event.target.value)} className="brand-input" /></Field>
                  </div>
                </fieldset>

                <fieldset className="border-t border-slate-200 pt-6">
                  <legend className="flex items-center gap-2 text-sm font-bold text-slate-950"><CheckCircle2 className="h-4 w-4 text-brand-primary" aria-hidden="true" />Primary Assignment</legend>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Organization unit"><select required value={form.organizationUnitCode} onChange={(event) => updateField('organizationUnitCode', event.target.value)} className="brand-input"><option value="">Select unit</option>{(data?.options.organizationUnits || []).map((unit) => <option key={unit.code} value={unit.code}>{unit.parent ? `${unit.parent.name} · ` : ''}{unit.name} ({label(unit.type)})</option>)}</select></Field>
                    <Field label="Assignment started"><input required type="date" value={form.assignmentStartedAt} onChange={(event) => updateField('assignmentStartedAt', event.target.value)} className="brand-input" /></Field>
                    <Field label="Position title"><input value={form.positionTitle} onChange={(event) => updateField('positionTitle', event.target.value)} className="brand-input" placeholder="Official position title" /></Field>
                  </div>
                </fieldset>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <p className="text-xs font-medium text-slate-500">Last verified: {formatDate(selectedRecord.staffMember?.recordVerifiedAt)}</p>
                <button type="submit" disabled={saving || !selectedRecord.emailVerified} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:bg-slate-300">
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {saving ? 'Saving...' : 'Save & Verify Record'}
                </button>
              </div>
            </form>
          )}
        </main>
      </section>
    </div>
  );
}

function Field({ label: fieldLabel, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-slate-600">{fieldLabel}</span>{children}</label>;
}

function Metric({ label: metricLabel, value, tone = 'slate' }: { label: string; value: number; tone?: 'slate' | 'amber' | 'blue' | 'green' | 'rose' }) {
  const tones = { slate: 'text-slate-800', amber: 'text-amber-800', blue: 'text-blue-800', green: 'text-emerald-800', rose: 'text-rose-800' };
  return <div className="pro-tile p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{metricLabel}</p><p className={`mt-2 text-2xl font-semibold ${tones[tone]}`}>{value}</p></div>;
}

function VerificationBadge({ state }: { state: string }) {
  const tone = state === 'VERIFIED' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : state === 'DISPUTED' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-900';
  return <span className={`inline-flex w-fit shrink-0 rounded-md border px-2.5 py-1 text-xs font-bold ${tone}`}>{label(state)}</span>;
}
