'use client';

import { useEffect, useState } from 'react';

type Faculty = {
  id: number;
  name: string;
  description: string | null;
  _count: {
    departments: number;
    users: number;
  };
};

type Department = {
  id: number;
  name: string;
  description: string | null;
  facultyId: number | null;
  faculty: Faculty | null;
  _count: {
    users: number;
  };
};

export default function InstitutionStructurePage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    type: 'FACULTY',
    name: '',
    description: '',
    facultyId: '',
  });

  async function loadStructure() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/system/structure');
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load institution structure');
      }
      setFaculties(payload.data.faculties || []);
      setDepartments(payload.data.departments || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load institution structure');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStructure();
  }, []);

  function editFaculty(faculty: Faculty) {
    setForm({
      type: 'FACULTY',
      name: faculty.name,
      description: faculty.description || '',
      facultyId: '',
    });
  }

  function editDepartment(department: Department) {
    setForm({
      type: 'DEPARTMENT',
      name: department.name,
      description: department.description || '',
      facultyId: department.facultyId ? String(department.facultyId) : '',
    });
  }

  async function saveStructure(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/system/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to save institution structure');
      }
      setMessage('Institution structure saved successfully.');
      setForm({ type: form.type, name: '', description: '', facultyId: '' });
      await loadStructure();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save institution structure');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="brand-hero px-6 py-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-100">System Administration</p>
        <h1 className="mt-3 text-3xl font-bold">Faculties and Departments</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">
          Maintain the institutional structure used for staff profiles, HOD/Dean scoping, reporting, and promotion workflow routing.
        </p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {message && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={saveStructure} className="brand-surface-soft p-5">
          <h2 className="text-lg font-bold text-slate-950">Structure Form</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-slate-800">
              Record type
              <select
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value, facultyId: '' })}
                className="brand-input mt-1"
              >
                <option value="FACULTY">Faculty</option>
                <option value="DEPARTMENT">Department</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-800">
              Name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="brand-input mt-1"
                placeholder={form.type === 'FACULTY' ? 'Faculty of Computing and Information Systems' : 'Computer Science'}
                required
              />
            </label>

            {form.type === 'DEPARTMENT' && (
              <label className="block text-sm font-semibold text-slate-800">
                Faculty
                <select
                  value={form.facultyId}
                  onChange={(event) => setForm({ ...form, facultyId: event.target.value })}
                  className="brand-input mt-1"
                >
                  <option value="">No faculty assigned</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="block text-sm font-semibold text-slate-800">
              Description
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="brand-input mt-1 min-h-24"
                placeholder="Optional description"
              />
            </label>
          </div>

          <button type="submit" disabled={saving} className="mt-5 rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-slate-400">
            {saving ? 'Saving...' : 'Save structure'}
          </button>
        </form>

        <div className="space-y-6">
          <div className="brand-surface-soft overflow-hidden">
            <div className="border-b border-blue-100 p-5">
              <h2 className="text-lg font-bold text-slate-950">Faculties</h2>
              <p className="mt-1 text-sm text-slate-600">Click a faculty to edit it.</p>
            </div>
            {loading ? (
              <div className="p-5 text-sm text-slate-600">Loading faculties...</div>
            ) : faculties.length === 0 ? (
              <div className="p-5 text-sm text-slate-600">No faculties configured.</div>
            ) : (
              <div className="divide-y divide-blue-100">
                {faculties.map((faculty) => (
                  <button key={faculty.id} type="button" onClick={() => editFaculty(faculty)} className="block w-full p-5 text-left hover:bg-blue-50/70">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <p className="font-semibold text-slate-950">{faculty.name}</p>
                        <p className="mt-1 text-sm text-slate-600">{faculty.description || 'No description provided.'}</p>
                      </div>
                      <div className="flex gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-800">{faculty._count.departments} departments</span>
                        <span className="rounded-full bg-green-100 px-2 py-1 text-green-800">{faculty._count.users} users</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="brand-surface-soft overflow-hidden">
            <div className="border-b border-blue-100 p-5">
              <h2 className="text-lg font-bold text-slate-950">Departments</h2>
              <p className="mt-1 text-sm text-slate-600">Click a department to edit its faculty assignment.</p>
            </div>
            {loading ? (
              <div className="p-5 text-sm text-slate-600">Loading departments...</div>
            ) : departments.length === 0 ? (
              <div className="p-5 text-sm text-slate-600">No departments configured.</div>
            ) : (
              <div className="divide-y divide-blue-100">
                {departments.map((department) => (
                  <button key={department.id} type="button" onClick={() => editDepartment(department)} className="block w-full p-5 text-left hover:bg-blue-50/70">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <p className="font-semibold text-slate-950">{department.name}</p>
                        <p className="mt-1 text-sm text-slate-600">{department.faculty?.name || 'No faculty assigned'}</p>
                      </div>
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">{department._count.users} users</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
