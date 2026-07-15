'use client';

import { useEffect, useState } from 'react';

type Setting = {
  id: number;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
};

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    key: '',
    value: '',
    description: '',
  });

  async function loadSettings() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/system/settings');
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
    setForm({
      key: setting.key,
      value: setting.value,
      description: setting.description || '',
    });
  }

  async function saveSetting(event: React.FormEvent<HTMLFormElement>) {
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

      setMessage('System setting saved successfully.');
      setForm({ key: '', value: '', description: '' });
      await loadSettings();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save system setting');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="pro-hero px-6 py-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-100">System Administration</p>
        <h1 className="mt-3 text-3xl font-bold">System Settings</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Maintain configuration values used by the promotion support platform. Every change is recorded in the audit log.
        </p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {message && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={saveSetting} className="pro-card p-5">
          <h2 className="text-lg font-bold text-slate-950">Setting Form</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-slate-800">
              Key
              <input
                value={form.key}
                onChange={(event) => setForm({ ...form, key: event.target.value })}
                className="brand-input mt-1"
                placeholder="system.title"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Value
              <textarea
                value={form.value}
                onChange={(event) => setForm({ ...form, value: event.target.value })}
                className="brand-input mt-1 min-h-24"
                placeholder="Setting value"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Description
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="brand-input mt-1 min-h-20"
                placeholder="Optional description"
              />
            </label>
          </div>
          <button type="submit" disabled={saving} className="mt-5 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-slate-400">
            {saving ? 'Saving...' : 'Save setting'}
          </button>
        </form>

        <div className="pro-card overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-950">Configured Settings</h2>
            <p className="mt-1 text-sm text-slate-600">Click a setting to edit it.</p>
          </div>
          {loading ? (
            <div className="p-5 text-sm text-slate-600">Loading settings...</div>
          ) : settings.length === 0 ? (
            <div className="p-5 text-sm text-slate-600">No settings configured.</div>
          ) : (
            <div className="divide-y divide-blue-100">
              {settings.map((setting) => (
                <button key={setting.id} type="button" onClick={() => editSetting(setting)} className="block w-full p-5 text-left hover:bg-slate-50">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <p className="font-semibold text-slate-950">{setting.key}</p>
                      <p className="mt-1 break-words text-sm text-slate-700">{setting.value}</p>
                      {setting.description && <p className="mt-2 text-xs text-slate-500">{setting.description}</p>}
                    </div>
                    <p className="text-xs text-slate-500">{new Date(setting.updatedAt).toLocaleString()}</p>
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
