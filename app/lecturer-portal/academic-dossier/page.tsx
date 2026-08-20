'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BookOpenCheck,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useToast } from '../../../components/Toast';

type Requirements = {
  submittedMinimum: number | null;
  submittedMaximum: number | null;
  minimumRefereed: number | null;
  bestOutputsRequired: number | null;
};

type ScholarlyOutput = {
  id: number;
  type: string;
  title: string;
  citation: string;
  abstract?: string | null;
  publicationDate?: string | null;
  doi?: string | null;
  url?: string | null;
  issn?: string | null;
  isbn?: string | null;
  journalOrPublisher?: string | null;
  volumeIssuePages?: string | null;
  indexingSource?: string | null;
  authors: string[];
  applicantAuthorPosition?: number | null;
  contributionStatement: string;
  isRefereed: boolean;
  isIndexed: boolean;
  claimedForCurrentRoute: boolean;
  equivalenceUnits: number;
  departmentVerificationStatus: string;
  libraryVerificationStatus: string;
};

type ReadinessItem = { code: string; message: string };

type DossierData = {
  request: { id: number; status: string; currentRank: string; targetRank: string; editable: boolean };
  route: { id: number; code: string; name: string; targetRank: string; sourceClause?: string | null };
  policy: { sourceCode: string; sourceTitle: string; version: string };
  requirements: Requirements;
  equivalenceUnits: Record<string, number>;
  dossier?: {
    id: number;
    status: string;
    version: number;
    orcid?: string | null;
    googleScholarUrl?: string | null;
    teachingStatement?: string | null;
    researchStatement?: string | null;
    serviceStatement?: string | null;
    applicantDeclaration: boolean;
  } | null;
  outputs: ScholarlyOutput[];
  selectedOutputIds: number[];
  readiness: {
    readyForSubmission: boolean;
    blockers: ReadinessItem[];
    warnings: ReadinessItem[];
    metrics: {
      catalogCount: number;
      claimedOutputCount: number;
      claimedRefereedCount: number;
      selectedOutputCount: number;
      selectedEquivalentUnits: number;
      pendingVerificationCount: number;
    };
  };
};

type OutputForm = {
  type: string;
  title: string;
  citation: string;
  abstract: string;
  publicationDate: string;
  doi: string;
  url: string;
  issn: string;
  isbn: string;
  journalOrPublisher: string;
  volumeIssuePages: string;
  indexingSource: string;
  authors: string;
  applicantAuthorPosition: string;
  contributionStatement: string;
  isRefereed: boolean;
  isIndexed: boolean;
  claimedForCurrentRoute: boolean;
};

const OUTPUT_TYPES = [
  'REFEREED_JOURNAL_ARTICLE',
  'PEER_REVIEWED_HIGHER_EDUCATION_BOOK',
  'PEER_REVIEWED_EXHIBITION',
  'INDEXED_CONFERENCE_PROCEEDING',
  'NON_INDEXED_CONFERENCE_PROCEEDING',
  'DEPLOYED_TECHNOLOGY_PRODUCT_DESIGN',
  'PATENTED_INVENTION',
  'PEER_REVIEWED_BOOK_CHAPTER',
  'NON_PEER_REVIEWED_BOOK_CHAPTER',
];

const EMPTY_OUTPUT: OutputForm = {
  type: 'REFEREED_JOURNAL_ARTICLE',
  title: '',
  citation: '',
  abstract: '',
  publicationDate: '',
  doi: '',
  url: '',
  issn: '',
  isbn: '',
  journalOrPublisher: '',
  volumeIssuePages: '',
  indexingSource: '',
  authors: '',
  applicantAuthorPosition: '',
  contributionStatement: '',
  isRefereed: true,
  isIndexed: false,
  claimedForCurrentRoute: true,
};

function label(value?: string | null) {
  if (!value) return 'Not recorded';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortDate(value?: string | null) {
  if (!value) return 'Date not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date not recorded'
    : new Intl.DateTimeFormat('en-GH', { year: 'numeric', month: 'short', day: '2-digit' }).format(date);
}

function fieldError(payload: any, fallback: string) {
  const detail = payload?.details ? Object.values(payload.details).flat().find(Boolean) : null;
  return String(detail || payload?.error || fallback);
}

function verificationTone(status: string) {
  if (status === 'VERIFIED') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (status === 'REJECTED') return 'bg-rose-50 text-rose-800 border-rose-200';
  if (status === 'REQUIRES_CORRECTION') return 'bg-orange-50 text-orange-900 border-orange-200';
  return 'bg-amber-50 text-amber-900 border-amber-200';
}

export default function AcademicDossierPage() {
  const toast = useToast();
  const [data, setData] = useState<DossierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [packetSaving, setPacketSaving] = useState(false);
  const [outputSaving, setOutputSaving] = useState(false);
  const [showOutputForm, setShowOutputForm] = useState(false);
  const [editingOutputId, setEditingOutputId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [profile, setProfile] = useState({
    orcid: '',
    googleScholarUrl: '',
    teachingStatement: '',
    researchStatement: '',
    serviceStatement: '',
    applicantDeclaration: false,
  });
  const [outputForm, setOutputForm] = useState<OutputForm>(EMPTY_OUTPUT);

  async function loadDossier(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      const response = await fetch('/api/lecturer/academic-dossier', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load the academic dossier.');
      const next = payload.data as DossierData;
      setData(next);
      setSelectedIds(next.selectedOutputIds || []);
      setProfile({
        orcid: next.dossier?.orcid || '',
        googleScholarUrl: next.dossier?.googleScholarUrl || '',
        teachingStatement: next.dossier?.teachingStatement || '',
        researchStatement: next.dossier?.researchStatement || '',
        serviceStatement: next.dossier?.serviceStatement || '',
        applicantDeclaration: Boolean(next.dossier?.applicantDeclaration),
      });
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the academic dossier.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    loadDossier();
  }, []);

  const selectedOutputs = useMemo(
    () => selectedIds.map((id) => data?.outputs.find((output) => output.id === id)).filter(Boolean) as ScholarlyOutput[],
    [data?.outputs, selectedIds],
  );

  const selectedUnits = selectedOutputs.reduce((sum, output) => sum + output.equivalenceUnits, 0);

  async function saveProfile() {
    setProfileSaving(true);
    try {
      const response = await fetch('/api/lecturer/academic-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(fieldError(payload, 'Unable to save the dossier profile.'));
      toast.success('Dossier saved', 'Academic references, statements, and declaration were saved.');
      await loadDossier(false);
    } catch (saveError) {
      toast.error('Save failed', saveError instanceof Error ? saveError.message : 'Unable to save the dossier profile.');
    } finally {
      setProfileSaving(false);
    }
  }

  function beginAddOutput() {
    setEditingOutputId(null);
    setOutputForm(EMPTY_OUTPUT);
    setShowOutputForm(true);
  }

  function beginEditOutput(output: ScholarlyOutput) {
    setEditingOutputId(output.id);
    setOutputForm({
      type: output.type,
      title: output.title,
      citation: output.citation,
      abstract: output.abstract || '',
      publicationDate: output.publicationDate ? output.publicationDate.slice(0, 10) : '',
      doi: output.doi || '',
      url: output.url || '',
      issn: output.issn || '',
      isbn: output.isbn || '',
      journalOrPublisher: output.journalOrPublisher || '',
      volumeIssuePages: output.volumeIssuePages || '',
      indexingSource: output.indexingSource || '',
      authors: Array.isArray(output.authors) ? output.authors.join('; ') : '',
      applicantAuthorPosition: output.applicantAuthorPosition ? String(output.applicantAuthorPosition) : '',
      contributionStatement: output.contributionStatement,
      isRefereed: output.isRefereed,
      isIndexed: output.isIndexed,
      claimedForCurrentRoute: output.claimedForCurrentRoute,
    });
    setShowOutputForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveOutput(event: React.FormEvent) {
    event.preventDefault();
    setOutputSaving(true);
    try {
      const endpoint = editingOutputId
        ? `/api/lecturer/academic-dossier/outputs/${editingOutputId}`
        : '/api/lecturer/academic-dossier/outputs';
      const response = await fetch(endpoint, {
        method: editingOutputId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...outputForm,
          authors: outputForm.authors.split(/[;\n]/).map((author) => author.trim()).filter(Boolean),
          applicantAuthorPosition: outputForm.applicantAuthorPosition ? Number(outputForm.applicantAuthorPosition) : null,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(fieldError(payload, 'Unable to save the scholarly output.'));
      toast.success(editingOutputId ? 'Output updated' : 'Output added', payload.message);
      setShowOutputForm(false);
      setEditingOutputId(null);
      setOutputForm(EMPTY_OUTPUT);
      await loadDossier(false);
    } catch (saveError) {
      toast.error('Output not saved', saveError instanceof Error ? saveError.message : 'Unable to save the scholarly output.');
    } finally {
      setOutputSaving(false);
    }
  }

  async function deleteOutput(output: ScholarlyOutput) {
    if (!window.confirm(`Remove "${output.title}" from this dossier?`)) return;
    try {
      const response = await fetch(`/api/lecturer/academic-dossier/outputs/${output.id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to remove the scholarly output.');
      toast.success('Output removed', payload.message);
      await loadDossier(false);
    } catch (deleteError) {
      toast.error('Removal failed', deleteError instanceof Error ? deleteError.message : 'Unable to remove the scholarly output.');
    }
  }

  function toggleSelection(output: ScholarlyOutput) {
    if (!output.claimedForCurrentRoute) return;
    setSelectedIds((current) => {
      if (current.includes(output.id)) return current.filter((id) => id !== output.id);
      const limit = data?.requirements.bestOutputsRequired;
      if (limit !== null && limit !== undefined && current.length >= limit) {
        toast.warning('Packet limit reached', `This route requires exactly ${limit} selected outputs.`);
        return current;
      }
      return [...current, output.id];
    });
  }

  function moveSelection(index: number, direction: -1 | 1) {
    setSelectedIds((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function savePacket() {
    setPacketSaving(true);
    try {
      const response = await fetch('/api/lecturer/academic-dossier/packet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputIds: selectedIds }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to save the assessment packet.');
      toast.success('Best-N packet saved', `${selectedIds.length} output(s), ${selectedUnits} equivalent unit(s).`);
      await loadDossier(false);
    } catch (packetError) {
      toast.error('Packet not saved', packetError instanceof Error ? packetError.message : 'Unable to save the assessment packet.');
    } finally {
      setPacketSaving(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-72 items-center justify-center text-sm font-semibold text-slate-700"><RefreshCw className="mr-3 h-5 w-5 animate-spin" />Loading academic dossier...</div>;
  }

  if (error || !data) {
    return (
      <section className="pro-card p-6">
        <div className="flex items-start gap-3 text-amber-900"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><p className="text-sm font-semibold leading-6">{error}</p></div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => loadDossier()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold"><RefreshCw className="h-4 w-4" />Retry</button>
          <Link href="/lecturer-portal/start-application" className="inline-flex min-h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white">Start application</Link>
        </div>
      </section>
    );
  }

  const editable = data.request.editable;
  const bestRequired = data.requirements.bestOutputsRequired;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-primary"><BookOpenCheck className="h-4 w-4" />Schedule J dossier</div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">Academic Promotion Dossier</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">{data.route.name} · {data.policy.version}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-bold ${data.readiness.readyForSubmission ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
            {data.readiness.readyForSubmission ? 'Dossier ready' : `${data.readiness.blockers.length} requirement(s) open`}
          </span>
          <Link href="/lecturer-portal/evidence" className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800"><FileText className="h-4 w-4" />Evidence files</Link>
        </div>
      </header>

      <section className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Claimed outputs" value={data.readiness.metrics.claimedOutputCount} detail={`${data.requirements.submittedMinimum ?? 0}-${data.requirements.submittedMaximum ?? 'route specific'}`} />
        <Metric label="Refereed" value={data.readiness.metrics.claimedRefereedCount} detail={`Minimum ${data.requirements.minimumRefereed ?? 'route specific'}`} />
        <Metric label="Best-N selected" value={selectedIds.length} detail={bestRequired === null ? 'Not required' : `Exactly ${bestRequired}`} />
        <Metric label="Equivalent units" value={selectedUnits} detail="Selected packet" />
        <Metric label="Verification pending" value={data.readiness.metrics.pendingVerificationCount} detail="Department and Library" />
      </section>

      <section className="pro-card overflow-hidden">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-950">Academic record and declaration</h2>
        </div>
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
          <Field label="ORCID" value={profile.orcid} onChange={(value) => setProfile((current) => ({ ...current, orcid: value }))} placeholder="0000-0000-0000-0000" disabled={!editable} />
          <Field label="Google Scholar profile" value={profile.googleScholarUrl} onChange={(value) => setProfile((current) => ({ ...current, googleScholarUrl: value }))} placeholder="https://scholar.google.com/..." disabled={!editable} />
          <TextArea label="Teaching statement" value={profile.teachingStatement} onChange={(value) => setProfile((current) => ({ ...current, teachingStatement: value }))} disabled={!editable} />
          <TextArea label="Research statement" value={profile.researchStatement} onChange={(value) => setProfile((current) => ({ ...current, researchStatement: value }))} disabled={!editable} />
          <div className="lg:col-span-2"><TextArea label="Service statement" value={profile.serviceStatement} onChange={(value) => setProfile((current) => ({ ...current, serviceStatement: value }))} disabled={!editable} /></div>
          <label className="flex items-start gap-3 border-t border-slate-200 pt-5 lg:col-span-2">
            <input type="checkbox" checked={profile.applicantDeclaration} onChange={(event) => setProfile((current) => ({ ...current, applicantDeclaration: event.target.checked }))} disabled={!editable} className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-primary" />
            <span className="text-sm leading-6 text-slate-700">I confirm that the dossier information is accurate, the authorship and contribution statements are truthful, and the selected outputs are my work as represented.</span>
          </label>
        </div>
        <div className="flex justify-end border-t border-slate-200 px-5 py-4 sm:px-6">
          <button type="button" onClick={saveProfile} disabled={!editable || profileSaving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white disabled:bg-slate-300"><Save className="h-4 w-4" />{profileSaving ? 'Saving...' : 'Save dossier'}</button>
        </div>
      </section>

      {showOutputForm && (
        <section className="pro-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-950">{editingOutputId ? 'Edit scholarly output' : 'Add scholarly output'}</h2>
            <button type="button" onClick={() => setShowOutputForm(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200" title="Close"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={saveOutput} className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Output type</span><select className="brand-input" value={outputForm.type} onChange={(event) => setOutputForm((current) => ({ ...current, type: event.target.value }))}>{OUTPUT_TYPES.map((type) => <option key={type} value={type}>{label(type)} · {data.equivalenceUnits[type]} unit(s)</option>)}</select></label>
            <Field label="Publication date" type="date" value={outputForm.publicationDate} onChange={(value) => setOutputForm((current) => ({ ...current, publicationDate: value }))} />
            <div className="lg:col-span-2"><Field label="Title" value={outputForm.title} onChange={(value) => setOutputForm((current) => ({ ...current, title: value }))} required /></div>
            <div className="lg:col-span-2"><TextArea label="Full citation" value={outputForm.citation} onChange={(value) => setOutputForm((current) => ({ ...current, citation: value }))} required /></div>
            <Field label="Journal or publisher" value={outputForm.journalOrPublisher} onChange={(value) => setOutputForm((current) => ({ ...current, journalOrPublisher: value }))} />
            <Field label="Volume, issue and pages" value={outputForm.volumeIssuePages} onChange={(value) => setOutputForm((current) => ({ ...current, volumeIssuePages: value }))} />
            <Field label="DOI" value={outputForm.doi} onChange={(value) => setOutputForm((current) => ({ ...current, doi: value }))} placeholder="10.xxxx/..." />
            <Field label="Public URL or repository" value={outputForm.url} onChange={(value) => setOutputForm((current) => ({ ...current, url: value }))} placeholder="https://..." />
            <Field label="ISSN" value={outputForm.issn} onChange={(value) => setOutputForm((current) => ({ ...current, issn: value }))} />
            <Field label="ISBN" value={outputForm.isbn} onChange={(value) => setOutputForm((current) => ({ ...current, isbn: value }))} />
            <div className="lg:col-span-2"><Field label="Authors" value={outputForm.authors} onChange={(value) => setOutputForm((current) => ({ ...current, authors: value }))} placeholder="Separate authors with semicolons" required /></div>
            <Field label="Applicant author position" type="number" value={outputForm.applicantAuthorPosition} onChange={(value) => setOutputForm((current) => ({ ...current, applicantAuthorPosition: value }))} />
            <Field label="Indexing source" value={outputForm.indexingSource} onChange={(value) => setOutputForm((current) => ({ ...current, indexingSource: value }))} placeholder="Scopus, Web of Science, DOAJ..." />
            <div className="lg:col-span-2"><TextArea label="Applicant contribution" value={outputForm.contributionStatement} onChange={(value) => setOutputForm((current) => ({ ...current, contributionStatement: value }))} required /></div>
            <div className="flex flex-wrap gap-5 lg:col-span-2">
              <CheckField label="Refereed" checked={outputForm.isRefereed} onChange={(checked) => setOutputForm((current) => ({ ...current, isRefereed: checked }))} />
              <CheckField label="Indexed" checked={outputForm.isIndexed} onChange={(checked) => setOutputForm((current) => ({ ...current, isIndexed: checked }))} />
              <CheckField label="Claim for this route" checked={outputForm.claimedForCurrentRoute} onChange={(checked) => setOutputForm((current) => ({ ...current, claimedForCurrentRoute: checked }))} />
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 lg:col-span-2">
              <button type="button" onClick={() => setShowOutputForm(false)} className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold">Cancel</button>
              <button type="submit" disabled={outputSaving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white disabled:bg-slate-300"><Save className="h-4 w-4" />{outputSaving ? 'Saving...' : 'Save output'}</button>
            </div>
          </form>
        </section>
      )}

      <section className="pro-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div><h2 className="text-lg font-semibold text-slate-950">Scholarly output catalogue</h2><p className="mt-1 text-sm text-slate-600">{data.outputs.length} record(s) · {data.readiness.metrics.claimedOutputCount} claimed for this route</p></div>
          <button type="button" onClick={beginAddOutput} disabled={!editable} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white disabled:bg-slate-300"><Plus className="h-4 w-4" />Add output</button>
        </div>
        {data.outputs.length === 0 ? (
          <div className="p-8 text-center"><BookOpenCheck className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 font-semibold text-slate-900">No scholarly outputs recorded</p></div>
        ) : (
          <div className="divide-y divide-slate-200">
            {data.outputs.map((output) => {
              const selectedIndex = selectedIds.indexOf(output.id);
              return (
                <article key={output.id} className="grid gap-4 p-5 sm:p-6 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-start">
                  <button type="button" onClick={() => toggleSelection(output)} disabled={!editable || !output.claimedForCurrentRoute || bestRequired === null} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${selectedIndex >= 0 ? 'border-brand-primary bg-brand-primary text-white' : 'border-slate-300 bg-white text-slate-500'} disabled:opacity-40`} title={selectedIndex >= 0 ? 'Remove from best-N packet' : 'Add to best-N packet'}>{selectedIndex >= 0 ? <span className="text-xs font-bold">{selectedIndex + 1}</span> : <Check className="h-4 w-4" />}</button>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{label(output.type)}</span><span className="rounded-md bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-800">{output.equivalenceUnits} unit(s)</span>{output.isRefereed && <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">Refereed</span>}{!output.claimedForCurrentRoute && <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">Catalog only</span>}</div>
                    <h3 className="mt-3 break-words text-base font-semibold text-slate-950">{output.title}</h3>
                    <p className="mt-2 break-words text-sm leading-6 text-slate-600">{output.citation}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500"><span>{shortDate(output.publicationDate)}</span>{output.doi && <span>DOI {output.doi}</span>}{output.journalOrPublisher && <span>{output.journalOrPublisher}</span>}</div>
                    <div className="mt-3 flex flex-wrap gap-2"><span className={`rounded-md border px-2 py-1 text-xs font-bold ${verificationTone(output.departmentVerificationStatus)}`}>Department: {label(output.departmentVerificationStatus)}</span><span className={`rounded-md border px-2 py-1 text-xs font-bold ${verificationTone(output.libraryVerificationStatus)}`}>Library: {label(output.libraryVerificationStatus)}</span></div>
                  </div>
                  <div className="flex gap-2 xl:justify-end">
                    <button type="button" onClick={() => beginEditOutput(output)} disabled={!editable} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40" title="Edit output"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => deleteOutput(output)} disabled={!editable} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-700 disabled:opacity-40" title="Remove output"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {bestRequired !== null && (
        <section className="pro-card overflow-hidden">
          <div className="border-b border-slate-200 p-5 sm:p-6"><h2 className="text-lg font-semibold text-slate-950">Best-{bestRequired} assessment packet</h2></div>
          {selectedOutputs.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-600">Select outputs from the catalogue to build the assessment packet.</div>
          ) : (
            <ol className="divide-y divide-slate-200">
              {selectedOutputs.map((output, index) => (
                <li key={output.id} className="flex items-center gap-4 p-4 sm:px-6">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-xs font-bold text-white">{index + 1}</span>
                  <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold text-slate-950">{output.title}</p><p className="mt-1 text-xs font-semibold text-slate-500">{output.equivalenceUnits} equivalent unit(s)</p></div>
                  <div className="flex gap-1"><button type="button" onClick={() => moveSelection(index, -1)} disabled={index === 0 || !editable} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 disabled:opacity-30" title="Move up"><ChevronUp className="h-4 w-4" /></button><button type="button" onClick={() => moveSelection(index, 1)} disabled={index === selectedOutputs.length - 1 || !editable} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 disabled:opacity-30" title="Move down"><ChevronDown className="h-4 w-4" /></button></div>
                </li>
              ))}
            </ol>
          )}
          <div className="flex flex-col gap-4 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm font-semibold text-slate-700">{selectedIds.length}/{bestRequired} selected · {selectedUnits} equivalent unit(s)</p>
            <button type="button" onClick={savePacket} disabled={!editable || packetSaving} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white disabled:bg-slate-300"><Save className="h-4 w-4" />{packetSaving ? 'Saving...' : 'Save packet'}</button>
          </div>
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="border-l-4 border-amber-400 bg-amber-50 p-5"><h2 className="font-semibold text-amber-950">Submission requirements</h2><div className="mt-3 space-y-2">{data.readiness.blockers.length === 0 ? <StatusLine passed text="All dossier and best-N controls are complete." /> : data.readiness.blockers.map((item) => <StatusLine key={item.code} text={item.message} />)}</div></div>
        <div className="border-l-4 border-cyan-500 bg-cyan-50 p-5"><h2 className="font-semibold text-cyan-950">Verification status</h2><div className="mt-3 space-y-2">{data.readiness.warnings.length === 0 ? <StatusLine passed text="No selected output verification is outstanding." /> : data.readiness.warnings.map((item) => <StatusLine key={item.code} text={item.message} warning />)}</div></div>
      </section>
    </div>
  );
}

function Metric({ label: metricLabel, value, detail }: { label: string; value: string | number; detail: string }) {
  return <div className="min-w-0 bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{metricLabel}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p><p className="mt-1 break-words text-xs font-semibold text-slate-500">{detail}</p></div>;
}

function Field({ label: fieldLabel, value, onChange, placeholder, type = 'text', required = false, disabled = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean; disabled?: boolean }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-600">{fieldLabel}</span><input className="brand-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} disabled={disabled} min={type === 'number' ? 1 : undefined} /></label>;
}

function TextArea({ label: fieldLabel, value, onChange, required = false, disabled = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; disabled?: boolean }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-600">{fieldLabel}</span><textarea className="brand-input min-h-28 resize-y" value={value} onChange={(event) => onChange(event.target.value)} required={required} disabled={disabled} /></label>;
}

function CheckField({ label: fieldLabel, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-primary" />{fieldLabel}</label>;
}

function StatusLine({ text, passed = false, warning = false }: { text: string; passed?: boolean; warning?: boolean }) {
  return <div className={`flex items-start gap-2 text-sm leading-6 ${warning ? 'text-cyan-950' : passed ? 'text-emerald-900' : 'text-amber-950'}`}>{passed ? <Check className="mt-1 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />}<span>{text}</span></div>;
}
