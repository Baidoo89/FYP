'use client';

import { useState, useEffect } from 'react';
import type { Lecturer, ApiResponse } from '../types';

interface LecturerListProps {
  refreshTrigger?: number;
}

export default function LecturerList({ refreshTrigger = 0 }: LecturerListProps) {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    fetchLecturers();
  }, [refreshTrigger]);

  const fetchLecturers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/lecturers');
      const data = (await response.json()) as ApiResponse<Lecturer[]>;

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch lecturers');
      }

      setLecturers(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLecturers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="brand-surface-soft p-6">
        <div className="text-center text-slate-600">Loading lecturers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="brand-surface-soft p-6">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchLecturers}
          className="rounded-xl bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (lecturers.length === 0) {
    return (
      <div className="brand-surface-soft p-6">
        <div className="text-center text-slate-600">No lecturers found. Add one to get started!</div>
      </div>
    );
  }

  const departments = Array.from(
    new Set(lecturers.map((lecturer) => lecturer.department).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right));

  const normalizedSearch = search.trim().toLowerCase();
  const filteredLecturers = lecturers.filter((lecturer) => {
    const matchesDepartment =
      departmentFilter === 'all' ? true : lecturer.department === departmentFilter;

    if (!matchesDepartment) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const haystack = [lecturer.name, lecturer.email, lecturer.department, lecturer.rank]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  return (
    <div className="brand-surface-soft overflow-hidden">
      <div className="border-b border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-900">Lecturers Directory</h2>
        <p className="mt-1 text-sm text-slate-600">Total records: {lecturers.length}</p>

        <div className="brand-muted-panel mt-5 p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Search</label>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, department, or rank"
                className="brand-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Department</label>
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="brand-input"
              >
                <option value="all">All departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500">Showing {filteredLecturers.length} result(s)</p>
      </div>

      {filteredLecturers.length === 0 ? (
        <div className="p-6 text-sm text-slate-600">No lecturers match your current search and filter.</div>
      ) : (
        <>
          <div className="space-y-3 p-4 md:hidden">
            {filteredLecturers.map((lecturer) => (
              <article key={lecturer.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{lecturer.name}</h3>
                    <p className="text-xs text-slate-500">#{lecturer.id} • {lecturer.rank}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      lecturer.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {lecturer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-800">Email:</span> {lecturer.email}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Department:</span> {lecturer.department}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px]">
              <thead className="brand-table-head">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLecturers.map((lecturer, index) => (
                  <tr
                    key={lecturer.id}
                    className={`border-b border-slate-100 transition hover:bg-blue-50/30 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{lecturer.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-800">{lecturer.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{lecturer.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-800">{lecturer.department}</td>
                    <td className="px-6 py-4 text-sm text-slate-800">{lecturer.rank}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          lecturer.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {lecturer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
