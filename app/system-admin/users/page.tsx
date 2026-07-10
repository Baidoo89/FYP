'use client';

import { useEffect, useMemo, useState } from 'react';

type Department = { id: number; name: string };
type Faculty = { id: number; name: string };

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: string;
  staffId: string | null;
  department: string | null;
  departmentId: number | null;
  facultyId: number | null;
  currentRank: string | null;
  phone: string | null;
  emailVerified: boolean;
  onboarded: boolean;
  isActive: boolean;
  createdAt: string;
  departmentRef: Department | null;
  faculty: Faculty | null;
  _count: {
    lecturerRequests: number;
    notifications: number;
  };
};

function label(value: string) {
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [ranks, setRanks] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    role: '',
    isActive: true,
    departmentId: '',
    facultyId: '',
    currentRank: '',
    phone: '',
  });

  const selectedUser = users.find((user) => user.id === selectedId) || null;

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchMatch = !search || [user.name, user.email, user.staffId || ''].some((value) => value.toLowerCase().includes(search.toLowerCase()));
      const roleMatch = !roleFilter || user.role === roleFilter;
      const activeMatch = !activeFilter || String(user.isActive) === activeFilter;
      return searchMatch && roleMatch && activeMatch;
    });
  }, [users, search, roleFilter, activeFilter]);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/system/users');
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load users');
      }
      setUsers(payload.data.users || []);
      setDepartments(payload.data.departments || []);
      setFaculties(payload.data.faculties || []);
      setRoles(payload.data.roles || []);
      setRanks(payload.data.ranks || []);
      const first = payload.data.users?.[0];
      if (!selectedId && first) {
        selectUser(first);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users');
    } finally {
      setLoading(false);
    }
  }

  function selectUser(user: UserRecord) {
    setSelectedId(user.id);
    setForm({
      role: user.role,
      isActive: user.isActive,
      departmentId: user.departmentId ? String(user.departmentId) : '',
      facultyId: user.facultyId ? String(user.facultyId) : '',
      currentRank: user.currentRank || '',
      phone: user.phone || '',
    });
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/system/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...form,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to update user');
      }
      setMessage('User account updated successfully.');
      await loadUsers();
      setSelectedId(selectedUser.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update user');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="pro-hero px-6 py-7">
        <div className="pro-eyebrow">System Administration</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">User and Role Management</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Manage staff access, role assignments, activation state, academic rank, and institution structure mapping.
        </p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {message && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="pro-card overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-950">Accounts</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" placeholder="Search name, email, staff ID" />
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                <option value="">All roles</option>
                {roles.map((role) => <option key={role} value={role}>{label(role)}</option>)}
              </select>
              <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                <option value="">All states</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-5 text-sm text-slate-600">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-5 text-sm text-slate-600">No users match the selected filters.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <button key={user.id} type="button" onClick={() => selectUser(user)} className={`block w-full p-5 text-left hover:bg-slate-50 ${selectedId === user.id ? 'bg-teal-50' : ''}`}>
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div>
                      <p className="font-semibold text-slate-950">{user.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                      <p className="mt-1 text-xs text-slate-500">{user.staffId || 'No staff ID'} - {user.departmentRef?.name || user.department || 'No department'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-800">{label(user.role)}</span>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-900'}`}>
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={saveUser} className="pro-card p-5">
          <h2 className="text-lg font-bold text-slate-950">Selected Account</h2>
          {!selectedUser ? (
            <p className="mt-4 text-sm text-slate-600">Select a user to edit role and access settings.</p>
          ) : (
            <>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{selectedUser.name}</p>
                <p className="mt-1 text-sm text-slate-600">{selectedUser.email}</p>
                <p className="mt-1 text-xs text-slate-500">Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="mt-4 space-y-4">
                <label className="block text-sm font-semibold text-slate-800">
                  Role
                  <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                    {roles.map((role) => <option key={role} value={role}>{label(role)}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-800">
                  Faculty
                  <select value={form.facultyId} onChange={(event) => setForm({ ...form, facultyId: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                    <option value="">No faculty</option>
                    {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-800">
                  Department
                  <select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                    <option value="">No department</option>
                    {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-800">
                  Current rank
                  <select value={form.currentRank} onChange={(event) => setForm({ ...form, currentRank: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                    <option value="">No rank</option>
                    {ranks.map((rank) => <option key={rank} value={rank}>{label(rank)}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-800">
                  Phone
                  <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" placeholder="+233 ..." />
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
                  <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
                  Account active
                </label>
              </div>

              <button type="submit" disabled={saving} className="mt-5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-slate-400">
                {saving ? 'Saving...' : 'Save account changes'}
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
