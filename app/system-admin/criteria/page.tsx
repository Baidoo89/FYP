'use client';

import { useEffect, useMemo, useState } from 'react';

const ranks = [
  'ASSISTANT_LECTURER',
  'LECTURER',
  'SENIOR_LECTURER',
  'ASSOCIATE_PROFESSOR',
  'PROFESSOR',
];

const categories = [
  'TEACHING',
  'RESEARCH',
  'SERVICE',
  'QUALIFICATIONS',
  'PUBLICATIONS',
  'PROFESSIONAL_DEVELOPMENT',
  'OTHER_SUPPORTING_EVIDENCE',
];

const performanceCategories = ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'SATISFACTORY', 'UNSATISFACTORY'];

type Criteria = {
  id: number;
  currentRank: string;
  targetRank: string;
  minimumYearsInCurrentRank: number;
  requiredDocumentCategories: string[];
  minimumPerformanceCategory: string;
  minimumTotalScore: number | null;
  isActive: boolean;
  publicationRequirement?: string | null;
  professionalDevelopmentRequirement?: string | null;
  optionalReviewerNotes?: string | null;
};

function label(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function CriteriaManagementPage() {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
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

  const activeCount = useMemo(() => criteria.filter((item) => item.isActive).length, [criteria]);

  async function loadCriteria() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/system/criteria');
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
    setForm((current) => ({
      ...current,
      currentRank: item.currentRank,
      targetRank: item.targetRank,
      minimumYearsInCurrentRank: String(item.minimumYearsInCurrentRank),
      requiredDocumentCategories: item.requiredDocumentCategories,
      minimumPerformanceCategory: item.minimumPerformanceCategory,
      minimumTotalScore: item.minimumTotalScore === null ? '' : String(item.minimumTotalScore),
      publicationRequirement: item.publicationRequirement || '',
      professionalDevelopmentRequirement: item.professionalDevelopmentRequirement || '',
      optionalReviewerNotes: item.optionalReviewerNotes || '',
      isActive: item.isActive,
    }));
  }

  async function saveCriteria(event: React.FormEvent<HTMLFormElement>) {
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
      setMessage('Promotion criteria saved successfully.');
      await loadCriteria();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save promotion criteria');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">System Administration</p>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Promotion Criteria Management</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Configure the rules used by the eligibility engine. These settings guide recommendations only; final decisions remain with university authorities.
            </p>
          </div>
          <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-900">
            Active criteria: {activeCount}
          </div>
        </div>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {message && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <form onSubmit={saveCriteria} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Criteria Form</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
            <Field label="Minimum years">
              <input value={form.minimumYearsInCurrentRank} onChange={(event) => setForm({ ...form, minimumYearsInCurrentRank: event.target.value })} className="brand-input" type="number" min="0" />
            </Field>
            <Field label="Minimum score">
              <input value={form.minimumTotalScore} onChange={(event) => setForm({ ...form, minimumTotalScore: event.target.value })} className="brand-input" type="number" min="0" max="100" />
            </Field>
            <Field label="Performance category">
              <select value={form.minimumPerformanceCategory} onChange={(event) => setForm({ ...form, minimumPerformanceCategory: event.target.value })} className="brand-input">
                {performanceCategories.map((category) => <option key={category} value={category}>{label(category)}</option>)}
              </select>
            </Field>
            <Field label="Active">
              <label className="flex h-10 items-center gap-2 rounded border border-slate-300 px-3 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
                Use this criteria
              </label>
            </Field>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-800">Required evidence categories</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <label key={category} className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input type="checkbox" checked={form.requiredDocumentCategories.includes(category)} onChange={() => toggleCategory(category)} />
                  {label(category)}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <textarea value={form.publicationRequirement} onChange={(event) => setForm({ ...form, publicationRequirement: event.target.value })} className="brand-input min-h-20" placeholder="Publication requirement" />
            <textarea value={form.professionalDevelopmentRequirement} onChange={(event) => setForm({ ...form, professionalDevelopmentRequirement: event.target.value })} className="brand-input min-h-20" placeholder="Professional development requirement" />
            <textarea value={form.optionalReviewerNotes} onChange={(event) => setForm({ ...form, optionalReviewerNotes: event.target.value })} className="brand-input min-h-20" placeholder="Reviewer notes" />
          </div>

          <button type="submit" disabled={saving} className="mt-5 rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-slate-400">
            {saving ? 'Saving...' : 'Save criteria'}
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-950">Configured Criteria</h2>
            <p className="mt-1 text-sm text-slate-600">Select a row to edit the criteria.</p>
          </div>
          {loading ? (
            <div className="p-5 text-sm text-slate-600">Loading criteria...</div>
          ) : criteria.length === 0 ? (
            <div className="p-5 text-sm text-slate-600">No promotion criteria configured yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {criteria.map((item) => (
                <button key={item.id} type="button" onClick={() => loadIntoForm(item)} className="block w-full p-5 text-left hover:bg-blue-50/60">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-semibold text-slate-950">{label(item.currentRank)} to {label(item.targetRank)}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.minimumYearsInCurrentRank} year(s), minimum {label(item.minimumPerformanceCategory)}, score {item.minimumTotalScore ?? 'not required'}</p>
                      <p className="mt-2 text-xs text-slate-500">{item.requiredDocumentCategories.map(label).join(', ')}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-800">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
