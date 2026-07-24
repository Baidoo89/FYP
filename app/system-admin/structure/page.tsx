'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../../components/enterprise-ui';
import { useToast } from '../../../components/Toast';

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

type StructureType = 'FACULTY' | 'DEPARTMENT';
type StructureSegment = 'all' | 'faculties' | 'departments' | 'unassigned';

function plural(value: number, word: string) {
  return `${value} ${word}${value === 1 ? '' : 's'}`;
}

export default function InstitutionStructurePage() {
  const toast = useToast();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<StructureSegment>('all');
  const [form, setForm] = useState({
    type: 'FACULTY' as StructureType,
    name: '',
    description: '',
    facultyId: '',
  });

  const filteredFaculties = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (segment === 'departments' || segment === 'unassigned') return [];
    return faculties.filter((faculty) => !query || [faculty.name, faculty.description || ''].some((value) => value.toLowerCase().includes(query)));
  }, [faculties, search, segment]);

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (segment === 'faculties') return [];
    return departments.filter((department) => {
      const segmentMatch = segment !== 'unassigned' || !department.facultyId;
      const searchMatch = !query || [department.name, department.description || '', department.faculty?.name || ''].some((value) => value.toLowerCase().includes(query));
      return segmentMatch && searchMatch;
    });
  }, [departments, search, segment]);

  async function loadStructure() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/system/structure', { cache: 'no-store' });
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
    setMessage('');
    setForm({
      type: 'FACULTY',
      name: faculty.name,
      description: faculty.description || '',
      facultyId: '',
    });
  }

  function editDepartment(department: Department) {
    setMessage('');
    setForm({
      type: 'DEPARTMENT',
      name: department.name,
      description: department.description || '',
      facultyId: department.facultyId ? String(department.facultyId) : '',
    });
  }

  function resetForm(type: StructureType = form.type) {
    setForm({ type, name: '', description: '', facultyId: '' });
  }

  async function saveStructure(event: FormEvent<HTMLFormElement>) {
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
      const message = `${form.type === 'FACULTY' ? 'Faculty' : 'Department'} saved successfully.`;
      setMessage(message);
      toast.success('Institution structure saved', message);
      resetForm(form.type);
      await loadStructure();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save institution structure';
      setError(message);
      toast.error('Structure save failed', message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteStructure(type: StructureType, id: number, name: string) {
    const recordLabel = type === 'FACULTY' ? 'faculty' : 'department';
    const confirmed = window.confirm(
      `Delete ${recordLabel} "${name}"? This is allowed only when it is not linked to users or other structure records.`
    );
    if (!confirmed) return;

    const key = `${type}-${id}`;
    setDeletingKey(key);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/system/structure', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || `Unable to delete ${recordLabel}`);
      }
      const message = `${type === 'FACULTY' ? 'Faculty' : 'Department'} deleted successfully.`;
      setMessage(message);
      toast.success('Institution structure deleted', message);
      if (form.type === type && form.name === name) resetForm(type);
      await loadStructure();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : `Unable to delete ${recordLabel}`;
      setError(message);
      toast.error('Structure delete failed', message);
    } finally {
      setDeletingKey(null);
    }
  }
  if (loading && faculties.length === 0 && departments.length === 0) return <LoadingState label="Loading institution structure..." />;
  if (error && faculties.length === 0 && departments.length === 0) return <ErrorState message={error} />;

  const unassignedDepartments = departments.filter((department) => !department.facultyId).length;
  const mappedUsers = faculties.reduce((sum, faculty) => sum + faculty._count.users, 0) + departments.reduce((sum, department) => sum + department._count.users, 0);

  return (
    <section className="space-y-6">
      <div className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">System Administration</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">Faculties and Departments</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Maintain the institutional structure used for staff profiles, HOD/Dean scoping, promotion reporting, and workflow governance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/system-admin/users" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50">Users</a>
            <a href="/analytics" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800">Reports</a>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard code="FAC" label="Faculties" value={faculties.length} tone="teal" />
        <MetricCard code="DEP" label="Departments" value={departments.length} tone="blue" />
        <MetricCard code="UN" label="Unassigned departments" value={unassignedDepartments} tone="amber" />
        <MetricCard code="MAP" label="Mapped user links" value={mappedUsers} tone="green" />
      </section>

      {message && <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">{message}</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={saveStructure} className="pro-card p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-950">Structure Form</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">Create or update faculties and departments by name.</p>
            </div>
            <button type="button" onClick={() => resetForm()} className="w-fit rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">New record</button>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Record type">
              <select value={form.type} onChange={(event) => resetForm(event.target.value as StructureType)} className="brand-input">
                <option value="FACULTY">Faculty</option>
                <option value="DEPARTMENT">Department</option>
              </select>
            </Field>

            <Field label="Name">
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="brand-input"
                placeholder={form.type === 'FACULTY' ? 'Faculty of Computing and Information Systems' : 'Computer Science'}
                required
              />
            </Field>

            {form.type === 'DEPARTMENT' && (
              <Field label="Faculty assignment">
                <select value={form.facultyId} onChange={(event) => setForm({ ...form, facultyId: event.target.value })} className="brand-input">
                  <option value="">No faculty assigned</option>
                  {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
                </select>
              </Field>
            )}

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="brand-input min-h-28"
                placeholder="Optional description for institutional reporting and admin clarity"
              />
            </Field>
          </div>

          <button type="submit" disabled={saving} className="mt-5 w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300">
            {saving ? 'Saving structure...' : 'Save structure'}
          </button>

          <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
            <p className="font-semibold text-gray-950">Governance note</p>
            <p className="mt-1">Departments support HOD/Dean scoping, user assignment, reports, and analytics. Keep names official and consistent.</p>
          </div>
        </form>

        <div className="space-y-6">
          <div className="pro-card p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_14rem_auto] lg:items-end">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Search</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="brand-input" placeholder="Faculty, department, description" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Segment</span>
                <select value={segment} onChange={(event) => setSegment(event.target.value as StructureSegment)} className="brand-input">
                  <option value="all">All records</option>
                  <option value="faculties">Faculties only</option>
                  <option value="departments">Departments only</option>
                  <option value="unassigned">Unassigned departments</option>
                </select>
              </label>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                Showing {filteredFaculties.length + filteredDepartments.length} records
              </div>
            </div>
          </div>

          {filteredFaculties.length === 0 && filteredDepartments.length === 0 ? (
            <div className="pro-card p-5"><EmptyState title="No structure records found" description="Adjust the search or segment filter, or add a new faculty or department." /></div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredFaculties.length > 0 && (
                <RecordPanel title="Faculties" description="Academic parent units used for reporting and structure governance.">
                  {filteredFaculties.map((faculty) => {
                    const isProtected = faculty._count.departments > 0 || faculty._count.users > 0;
                    const deleteKey = `FACULTY-${faculty.id}`;
                    return (
                      <div key={faculty.id} className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-teal-200 hover:bg-teal-50/40">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-950">{faculty.name}</p>
                            <p className="mt-1 text-sm leading-6 text-gray-600">{faculty.description || 'No description provided.'}</p>
                          </div>
                          <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800">Faculty</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-gray-600">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1">{plural(faculty._count.departments, 'department')}</span>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{plural(faculty._count.users, 'user')}</span>
                        </div>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <button type="button" onClick={() => editFaculty(faculty)} className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Edit Faculty</button>
                          <button
                            type="button"
                            onClick={() => deleteStructure('FACULTY', faculty.id, faculty.name)}
                            disabled={isProtected || deletingKey === deleteKey}
                            title={isProtected ? 'Reassign linked departments and users before deleting this faculty.' : 'Delete faculty'}
                            className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            {deletingKey === deleteKey ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </RecordPanel>
              )}

              {filteredDepartments.length > 0 && (
                <RecordPanel title="Departments" description="Operational units used for HOD review scope and staff assignment.">
                  {filteredDepartments.map((department) => {
                    const isProtected = department._count.users > 0;
                    const deleteKey = `DEPARTMENT-${department.id}`;
                    return (
                      <div key={department.id} className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-teal-200 hover:bg-teal-50/40">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-950">{department.name}</p>
                            <p className="mt-1 text-sm leading-6 text-gray-600">{department.faculty?.name || 'No faculty assigned'}</p>
                            {department.description && <p className="mt-1 text-xs leading-5 text-gray-500">{department.description}</p>}
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${department.facultyId ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                            {department.facultyId ? 'Mapped' : 'Unassigned'}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-gray-600">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{plural(department._count.users, 'user')}</span>
                        </div>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <button type="button" onClick={() => editDepartment(department)} className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Edit Department</button>
                          <button
                            type="button"
                            onClick={() => deleteStructure('DEPARTMENT', department.id, department.name)}
                            disabled={isProtected || deletingKey === deleteKey}
                            title={isProtected ? 'Reassign linked users before deleting this department.' : 'Delete department'}
                            className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            {deletingKey === deleteKey ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </RecordPanel>
              )}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function MetricCard({ code, label, value, tone }: { code: string; label: string; value: number; tone: 'teal' | 'blue' | 'amber' | 'green' }) {
  const toneClass = tone === 'blue'
    ? 'border-sky-200 bg-sky-50 text-sky-900'
    : tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : tone === 'green'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
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

function RecordPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="pro-card p-5">
      <h2 className="text-lg font-semibold text-gray-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  );
}
