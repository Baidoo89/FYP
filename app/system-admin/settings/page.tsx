'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../../components/enterprise-ui';
import { useToast } from '../../../components/Toast';

type Setting = {
  id: number;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
};

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function settingGroup(key: string) {
  const prefix = key.split('.')[0] || 'general';
  return prefix.toLowerCase();
}

export default function SystemSettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [form, setForm] = useState({ key: '', value: '', description: '' });

  const groups = useMemo(() => Array.from(new Set(settings.map((setting) => settingGroup(setting.key)))).sort(), [settings]);
  const filteredSettings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return settings.filter((setting) => {
      const groupMatch = !groupFilter || settingGroup(setting.key) === groupFilter;
      const searchMatch = !query || [setting.key, setting.value, setting.description || ''].some((value) => value.toLowerCase().includes(query));
      return groupMatch && searchMatch;
    });
  }, [settings, search, groupFilter]);

  async function loadSettings() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/system/settings', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load system settings');
      }

      setSettings(payload.data || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load system settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function editSetting(setting: Setting) {
    setMessage('');
    setForm({ key: setting.key, value: setting.value, description: setting.description || '' });
  }

  function resetForm() {
    setForm({ key: '', value: '', description: '' });
  }

  async function saveSetting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to save system setting');
      }

      const message = `System setting saved: ${form.key}.`;
      setMessage(message);
      toast.success('System setting saved', message);
      resetForm();
      await loadSettings();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save system setting';
      setError(message);
      toast.error('Setting save failed', message);
    } finally {
      setSaving(false);
    }
  }

  if (loading && settings.length === 0) return <LoadingState label="Loading system settings..." />;
  if (error && settings.length === 0) return <ErrorState message={error} />;

  const describedSettings = settings.filter((setting) => setting.description).length;
  const longValues = settings.filter((setting) => setting.value.length > 80).length;

  return (
    <section className="space-y-6">
      <div className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">System Administration</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">System Settings</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Maintain controlled configuration values used by the promotion support platform. Every change is recorded in the audit log.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/system-admin/dashboard" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50">Dashboard</a>
            <a href="/audit" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800">Audit Logs</a>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard code="SET" label="Settings" value={settings.length} tone="teal" />
        <MetricCard code="GRP" label="Groups" value={groups.length} tone="blue" />
        <MetricCard code="DOC" label="Documented" value={describedSettings} tone="green" />
        <MetricCard code="VAL" label="Long values" value={longValues} tone="amber" />
      </section>

      {message && <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">{message}</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={saveSetting} className="pro-card p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-950">Setting Form</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">Create or update a controlled key/value configuration entry.</p>
            </div>
            <button type="button" onClick={resetForm} className="w-fit rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">New setting</button>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Key">
              <input value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} className="brand-input" placeholder="system.title" required />
            </Field>
            <Field label="Value">
              <textarea value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} className="brand-input min-h-28" placeholder="Setting value" required />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="brand-input min-h-24" placeholder="Optional description for administrators" />
            </Field>
          </div>

          <button type="submit" disabled={saving} className="mt-5 w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300">
            {saving ? 'Saving setting...' : 'Save setting'}
          </button>

          <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
            <p className="font-semibold text-gray-950">Key format</p>
            <p className="mt-1">Use letters, numbers, dots, dashes, or underscores. Group related keys with prefixes such as system, workflow, email, or documents.</p>
          </div>
        </form>

        <div className="space-y-6">
          <div className="pro-card p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_14rem_auto] lg:items-end">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Search</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="brand-input" placeholder="Key, value, description" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Group</span>
                <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} className="brand-input">
                  <option value="">All groups</option>
                  {groups.map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </label>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                Showing {filteredSettings.length} of {settings.length}
              </div>
            </div>
          </div>

          <div className="pro-card overflow-hidden">
            <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-semibold text-gray-950">Configured Settings</h2>
                <p className="mt-1 text-sm text-gray-600">Select a setting to edit its value and description.</p>
              </div>
              <span className="w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">Audited changes</span>
            </div>

            {filteredSettings.length === 0 ? (
              <div className="p-5"><EmptyState title="No settings found" description="Adjust filters or create a new setting." /></div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredSettings.map((setting) => (
                  <button key={setting.id} type="button" onClick={() => editSetting(setting)} className="block w-full p-5 text-left transition hover:bg-gray-50">
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-950">{setting.key}</p>
                          <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800">{settingGroup(setting.key)}</span>
                        </div>
                        <p className="mt-2 break-words text-sm leading-6 text-gray-700">{setting.value}</p>
                        {setting.description && <p className="mt-2 text-xs leading-5 text-gray-500">{setting.description}</p>}
                      </div>
                      <p className="whitespace-nowrap text-xs text-gray-500">{formatDate(setting.updatedAt)}</p>
                    </div>
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

function MetricCard({ code, label, value, tone }: { code: string; label: string; value: number; tone: 'teal' | 'blue' | 'green' | 'amber' }) {
  const toneClass = tone === 'blue'
    ? 'border-sky-200 bg-sky-50 text-sky-900'
    : tone === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
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
