'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../../components/enterprise-ui';
import { useToast } from '../../../components/Toast';

const ranks = ['ASSISTANT_LECTURER', 'LECTURER', 'SENIOR_LECTURER', 'ASSOCIATE_PROFESSOR', 'PROFESSOR'];
const categories = ['TEACHING', 'RESEARCH', 'SERVICE', 'QUALIFICATIONS', 'PUBLICATIONS', 'PROFESSIONAL_DEVELOPMENT', 'OTHER_SUPPORTING_EVIDENCE'];
const performanceCategories = ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'SATISFACTORY', 'UNSATISFACTORY'];

type Criteria = {
  id: number;
  currentRank: string;
  targetRank: string;
  minimumYearsInCurrentRank: number;
  requiredDocumentCategories: string[];
  requiredTeachingEvidence?: number;
  requiredResearchPublicationEvidence?: number;
  requiredServiceEvidence?: number;
  minimumPerformanceCategory: string;
  scoringEnabled?: boolean;
  minimumTotalScore: number | null;
  isActive: boolean;
  publicationRequirement?: string | null;
  professionalDevelopmentRequirement?: string | null;
  optionalReviewerNotes?: string | null;
};

type CriteriaSegment = 'all' | 'active' | 'inactive' | 'complete' | 'scoreless';

function label(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function criteriaCode(item: Criteria) {
  return `${item.currentRank.slice(0, 3)}-${item.targetRank.slice(0, 3)}`;
}

function segmentMatches(item: Criteria, segment: CriteriaSegment) {
  if (segment === 'active') return item.isActive;
  if (segment === 'inactive') return !item.isActive;
  if (segment === 'complete') return item.requiredDocumentCategories.length >= 3 && item.minimumTotalScore !== null;
  if (segment === 'scoreless') return item.minimumTotalScore === null || item.scoringEnabled === false;
  return true;
}

export default function CriteriaManagementPage() {
  const toast = useToast();
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<CriteriaSegment>('all');
  const [form, setForm] = useState({
    currentRank: 'LECTURER',
    targetRank: 'SENIOR_LECTURER',
    minimumYearsInCurrentRank: '4',
    requiredDocumentCategories: ['TEACHING', 'RESEARCH', 'SERVICE', 'QUALIFICATIONS', 'PUBLICATIONS', 'PROFESSIONAL_DEVELOPMENT'],
    requiredTeachingEvidence: '1',
    requiredResearchPublicationEvidence: '1',
    requiredServiceEvidence: '1',
    minimumPerformanceCategory: 'GOOD',
    scoringEnabled: true,
    minimumTotalScore: '55',
    publicationRequirement: '',
    professionalDevelopmentRequirement: '',
    optionalReviewerNotes: '',
    isActive: true,
  });

  const filteredCriteria = useMemo(() => {
    const query = search.trim().toLowerCase();
    return criteria.filter((item) => {
      const segmentMatch = segmentMatches(item, segment);
      const searchMatch = !query || [item.currentRank, item.targetRank, item.minimumPerformanceCategory, item.requiredDocumentCategories.join(' ')]
        .some((value) => value.toLowerCase().includes(query));
      return segmentMatch && searchMatch;
    });
  }, [criteria, search, segment]);

  const activeCount = useMemo(() => criteria.filter((item) => item.isActive).length, [criteria]);
  const scoreEnabledCount = useMemo(() => criteria.filter((item) => item.scoringEnabled !== false && item.minimumTotalScore !== null).length, [criteria]);
  const completeCount = useMemo(() => criteria.filter((item) => item.requiredDocumentCategories.length >= 3 && item.minimumTotalScore !== null).length, [criteria]);

  async function loadCriteria() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/system/criteria', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load promotion criteria');
      }
      setCriteria(payload.data || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load promotion criteria');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCriteria();
  }, []);

  function toggleCategory(category: string) {
    setForm((current) => ({
      ...current,
      requiredDocumentCategories: current.requiredDocumentCategories.includes(category)
        ? current.requiredDocumentCategories.filter((item) => item !== category)
        : [...current.requiredDocumentCategories, category],
    }));
  }

  function loadIntoForm(item: Criteria) {
    setMessage('');
    setForm((current) => ({
      ...current,
      currentRank: item.currentRank,
      targetRank: item.targetRank,
      minimumYearsInCurrentRank: String(item.minimumYearsInCurrentRank),
      requiredDocumentCategories: item.requiredDocumentCategories,
      requiredTeachingEvidence: String(item.requiredTeachingEvidence ?? 1),
      requiredResearchPublicationEvidence: String(item.requiredResearchPublicationEvidence ?? 1),
      requiredServiceEvidence: String(item.requiredServiceEvidence ?? 1),
      minimumPerformanceCategory: item.minimumPerformanceCategory,
      scoringEnabled: item.scoringEnabled !== false,
      minimumTotalScore: item.minimumTotalScore === null ? '' : String(item.minimumTotalScore),
      publicationRequirement: item.publicationRequirement || '',
      professionalDevelopmentRequirement: item.professionalDevelopmentRequirement || '',
      optionalReviewerNotes: item.optionalReviewerNotes || '',
      isActive: item.isActive,
    }));
  }

  function resetForm() {
    setForm({
      currentRank: 'LECTURER',
      targetRank: 'SENIOR_LECTURER',
      minimumYearsInCurrentRank: '4',
      requiredDocumentCategories: ['TEACHING', 'RESEARCH', 'SERVICE', 'QUALIFICATIONS', 'PUBLICATIONS', 'PROFESSIONAL_DEVELOPMENT'],
      requiredTeachingEvidence: '1',
      requiredResearchPublicationEvidence: '1',
      requiredServiceEvidence: '1',
      minimumPerformanceCategory: 'GOOD',
      scoringEnabled: true,
      minimumTotalScore: '55',
      publicationRequirement: '',
      professionalDevelopmentRequirement: '',
      optionalReviewerNotes: '',
      isActive: true,
    });
  }

  async function saveCriteria(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/system/criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to save promotion criteria');
      }
      const message = `Criteria saved for ${label(form.currentRank)} to ${label(form.targetRank)}.`;
      setMessage(message);
      toast.success('Promotion criteria saved', message);
      await loadCriteria();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save promotion criteria';
      setError(message);
      toast.error('Criteria save failed', message);
    } finally {
      setSaving(false);
    }
  }

  if (loading && criteria.length === 0) return <LoadingState label="Loading promotion criteria..." />;
  if (error && criteria.length === 0) return <ErrorState message={error} />;

  return (
    <section className="space-y-6">
      <div className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">System Administration</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">Promotion Criteria Management</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Configure the eligibility rules used by the server-side promotion engine. Criteria guide recommendations while final decisions remain with university authorities.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/system-admin/dashboard" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50">Dashboard</a>
            <a href="/analytics" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800">Reports</a>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard code="CR" label="Criteria records" value={criteria.length} tone="teal" />
        <MetricCard code="ACT" label="Active criteria" value={activeCount} tone="green" />
        <MetricCard code="SC" label="Scored rules" value={scoreEnabledCount} tone="blue" />
        <MetricCard code="OK" label="Complete rules" value={completeCount} tone="amber" />
      </section>

      {message && <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">{message}</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <form onSubmit={saveCriteria} className="pro-card p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-950">Criteria Form</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">Create or update a criteria record by rank progression.</p>
            </div>
            <button type="button" onClick={resetForm} className="w-fit rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Reset</button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Current rank">
              <select value={form.currentRank} onChange={(event) => setForm({ ...form, currentRank: event.target.value })} className="brand-input">
                {ranks.map((rank) => <option key={rank} value={rank}>{label(rank)}</option>)}
              </select>
            </Field>
            <Field label="Target rank">
              <select value={form.targetRank} onChange={(event) => setForm({ ...form, targetRank: event.target.value })} className="brand-input">
                {ranks.map((rank) => <option key={rank} value={rank}>{label(rank)}</option>)}
              </select>
            </Field>
            <Field label="Minimum years in rank">
              <input value={form.minimumYearsInCurrentRank} onChange={(event) => setForm({ ...form, minimumYearsInCurrentRank: event.target.value })} className="brand-input" type="number" min="0" />
            </Field>
            <Field label="Minimum total score">
              <input value={form.minimumTotalScore} onChange={(event) => setForm({ ...form, minimumTotalScore: event.target.value })} className="brand-input" type="number" min="0" max="100" placeholder="Optional" />
            </Field>
            <Field label="Performance category">
              <select value={form.minimumPerformanceCategory} onChange={(event) => setForm({ ...form, minimumPerformanceCategory: event.target.value })} className="brand-input">
                {performanceCategories.map((category) => <option key={category} value={category}>{label(category)}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <label className="flex h-11 items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-800">
                <span>Active criteria</span>
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
              </label>
            </Field>
          </div>

          <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-gray-950">Evidence Categories</p>
                <p className="mt-1 text-sm text-gray-600">Select the required evidence areas for this rank progression.</p>
              </div>
              <span className="w-fit rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">{form.requiredDocumentCategories.length} selected</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <label key={category} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${form.requiredDocumentCategories.includes(category) ? 'border-teal-200 bg-teal-50 text-teal-900' : 'border-gray-200 bg-white text-gray-700'}`}>
                  <input type="checkbox" checked={form.requiredDocumentCategories.includes(category)} onChange={() => toggleCategory(category)} />
                  {label(category)}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Field label="Teaching evidence">
              <input value={form.requiredTeachingEvidence} onChange={(event) => setForm({ ...form, requiredTeachingEvidence: event.target.value })} className="brand-input" type="number" min="0" />
            </Field>
            <Field label="Publication evidence">
              <input value={form.requiredResearchPublicationEvidence} onChange={(event) => setForm({ ...form, requiredResearchPublicationEvidence: event.target.value })} className="brand-input" type="number" min="0" />
            </Field>
            <Field label="Service evidence">
              <input value={form.requiredServiceEvidence} onChange={(event) => setForm({ ...form, requiredServiceEvidence: event.target.value })} className="brand-input" type="number" min="0" />
            </Field>
          </div>

          <div className="mt-5 space-y-3">
            <textarea value={form.publicationRequirement} onChange={(event) => setForm({ ...form, publicationRequirement: event.target.value })} className="brand-input min-h-20" placeholder="Publication requirement" />
            <textarea value={form.professionalDevelopmentRequirement} onChange={(event) => setForm({ ...form, professionalDevelopmentRequirement: event.target.value })} className="brand-input min-h-20" placeholder="Professional development requirement" />
            <textarea value={form.optionalReviewerNotes} onChange={(event) => setForm({ ...form, optionalReviewerNotes: event.target.value })} className="brand-input min-h-20" placeholder="Reviewer notes" />
          </div>

          <button type="submit" disabled={saving || form.requiredDocumentCategories.length === 0} className="mt-5 w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300">
            {saving ? 'Saving criteria...' : 'Save criteria'}
          </button>
        </form>

        <div className="space-y-6">
          <div className="pro-card p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_14rem_auto] lg:items-end">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Search</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="brand-input" placeholder="Rank, category, performance level" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Segment</span>
                <select value={segment} onChange={(event) => setSegment(event.target.value as CriteriaSegment)} className="brand-input">
                  <option value="all">All criteria</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="complete">Complete</option>
                  <option value="scoreless">No score threshold</option>
                </select>
              </label>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                Showing {filteredCriteria.length} of {criteria.length}
              </div>
            </div>
          </div>

          <div className="pro-card overflow-hidden">
            <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-semibold text-gray-950">Configured Criteria</h2>
                <p className="mt-1 text-sm text-gray-600">Select a rank pathway to edit its eligibility rule.</p>
              </div>
              <span className="w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">Server-side engine</span>
            </div>

            {filteredCriteria.length === 0 ? (
              <div className="p-5"><EmptyState title="No criteria found" description="Adjust filters or save a new criteria record." /></div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredCriteria.map((item) => (
                  <button key={item.id} type="button" onClick={() => loadIntoForm(item)} className="block w-full p-5 text-left transition hover:bg-gray-50">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{criteriaCode(item)}</p>
                        <p className="mt-2 font-semibold text-gray-950">{label(item.currentRank)} to {label(item.targetRank)}</p>
                        <p className="mt-1 text-sm text-gray-600">{item.minimumYearsInCurrentRank} year(s), minimum {label(item.minimumPerformanceCategory)}, score {item.minimumTotalScore ?? 'not required'}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${item.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.requiredDocumentCategories.map((category) => (
                        <span key={category} className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">{label(category)}</span>
                      ))}
                    </div>
                    {(item.publicationRequirement || item.professionalDevelopmentRequirement || item.optionalReviewerNotes) && (
                      <p className="mt-3 text-xs leading-5 text-gray-500">{item.optionalReviewerNotes || item.publicationRequirement || item.professionalDevelopmentRequirement}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}

function MetricCard({ code, label, value, tone }: { code: string; label: string; value: number; tone: 'teal' | 'green' | 'blue' | 'amber' }) {
  const toneClass = tone === 'green'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : tone === 'blue'
      ? 'border-sky-200 bg-sky-50 text-sky-900'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-teal-200 bg-teal-50 text-teal-900';

  return (
    <div className="pro-tile p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-950">{value}</p>
        </div>
        <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${toneClass}`}>{code}</span>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-gray-800">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
